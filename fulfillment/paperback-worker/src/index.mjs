import { getBook, getStripePriceId, catalogReady, PRINT_EDITIONS, ALL_PRINT_EDITIONS, SHIPPING_OPTIONS } from "./catalog.mjs";
import { validateCheckoutRequest, addressesMatch, normalizeAddress, postcodesMatch, streetLinesMatch } from "./validation.mjs";
import { verifyAssetRequest, constantTimeEqual } from "./crypto.mjs";
import { LuluApiError, LuluClient, shippingCents } from "./lulu.mjs";
import { StripeApiError, StripeClient, parseVerifiedStripeEvent } from "./stripe.mjs";
import { OrderStore } from "./order-store.mjs";
import {
  DigitalDeliveryError,
  digitalDeliveryConfigured,
  normalizeDigitalBuyerEmail,
  sendProbabilisticDigitalDelivery
} from "./digital-delivery.mjs";

const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };
const QUOTE_LIFETIME_MS = 30 * 60 * 1000;
const DIGITAL_PRICE_CENTS = 2900;
const DIGITAL_CURRENCY = "usd";
const DIGITAL_EVENT_TYPES = new Set(["checkout.session.completed", "checkout.session.async_payment_succeeded"]);
const DIGITAL_DELIVERY_LEASE_MS = 10 * 60 * 1000;
const DIGITAL_DELIVERY_RETRY_MS = [15 * 60 * 1000, 60 * 60 * 1000];

function nowIso() { return new Date().toISOString(); }

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), { status, headers: { ...JSON_HEADERS, ...extraHeaders } });
}

function log(event, details = {}) {
  // Intentionally excludes buyer email and street address.
  console.log(JSON.stringify({ component: "print-fulfillment", event, ...details }));
}

function publicError(code, message, status = 400) {
  return { response: json({ ok: false, code, message }, status), code, message };
}

function allowedOrigin(request, env) {
  const origin = request.headers.get("Origin");
  return Boolean(origin && origin === env.PAPERBACK_ALLOWED_ORIGIN);
}

export function allowedCountries(env) {
  return [...new Set(String(env.PAPERBACK_ALLOWED_COUNTRIES || "")
    .split(",")
    .map((value) => value.trim().toUpperCase())
    .filter((value) => /^[A-Z]{2}$/.test(value)))];
}

export function productionReadiness(env) {
  const countries = allowedCountries(env);
  const stripeTaxDecision = ["true", "false"].includes(env.PAPERBACK_STRIPE_TAX_ENABLED)
    ? env.PAPERBACK_STRIPE_TAX_ENABLED
    : "pending";
  return {
    paperbackProofsApproved: env.PAPERBACK_PROOFS_APPROVED === "true",
    hardcoverProofsApproved: env.HARDCOVER_PROOFS_APPROVED === "true",
    policiesApproved: env.PAPERBACK_POLICIES_APPROVED === "true",
    shippingCountriesConfigured: countries.length > 0,
    allowedCountries: countries,
    stripeTaxDecision
  };
}

function productionPrerequisitesReady(env, book) {
  if (!catalogReady(book)) return false;
  const readiness = productionReadiness(env);
  const proofsApproved = book?.edition === "hardcover"
    ? readiness.hardcoverProofsApproved
    : readiness.paperbackProofsApproved;
  const releaseFilesValidated = !book.releaseKey
    || env[`${book.releaseKey}_${book.edition.toUpperCase()}_FILES_VALIDATED`] === "true";
  const releaseProofApproved = !book.releaseKey
    || env[`${book.releaseKey}_${book.edition.toUpperCase()}_PROOF_APPROVED`] === "true";
  return proofsApproved
    && releaseFilesValidated
    && releaseProofApproved
    && readiness.policiesApproved
    && readiness.shippingCountriesConfigured
    && readiness.stripeTaxDecision !== "pending";
}

function productionSalesEnabled(env, book) {
  if (!book) return false;
  const salesFlag = book.edition === "hardcover"
    ? env.HARDCOVER_SALES_ENABLED
    : env.PAPERBACK_SALES_ENABLED;
  const releaseSalesEnabled = !book.releaseKey
    || env[`${book.releaseKey}_${book.edition.toUpperCase()}_SALES_ENABLED`] === "true";
  return env.PAPERBACK_ENVIRONMENT === "production"
    && salesFlag === "true"
    && releaseSalesEnabled
    && productionPrerequisitesReady(env, book);
}

function editionSalesEnabled(env, edition) {
  const books = Object.values(PRINT_EDITIONS).filter((book) => book.edition === edition);
  return books.length > 0 && books.every((book) => productionSalesEnabled(env, book));
}

function privateOrderEnabled(env, book) {
  const releasePrivateOrderEnabled = !book?.releaseKey
    || env[`${book.releaseKey}_${book.edition.toUpperCase()}_PRIVATE_ORDER_ENABLED`] === "true";
  return env.PAPERBACK_ENVIRONMENT === "production"
    && !productionSalesEnabled(env, book)
    && env.PAPERBACK_PRIVATE_ORDER_ENABLED === "true"
    && releasePrivateOrderEnabled
    && productionPrerequisitesReady(env, book);
}

function testAuthorized(request, env) {
  const supplied = request.headers.get("x-paperback-test-token") || "";
  return env.PAPERBACK_ENVIRONMENT === "sandbox"
    && Boolean(env.PAPERBACK_TEST_TOKEN)
    && constantTimeEqual(supplied, env.PAPERBACK_TEST_TOKEN);
}

function privateOrderAuthorized(request, env, book) {
  const supplied = request.headers.get("x-paperback-private-token") || "";
  return privateOrderEnabled(env, book)
    && Boolean(env.PAPERBACK_PRIVATE_ORDER_TOKEN)
    && constantTimeEqual(supplied, env.PAPERBACK_PRIVATE_ORDER_TOKEN);
}

function checkoutAuthorized(request, env, book) {
  if (!catalogReady(book)) return null;
  if (testAuthorized(request, env)) return { mode: "test" };
  if (privateOrderAuthorized(request, env, book)) return { mode: "private_live_order" };
  const origin = request.headers.get("Origin");
  const workerOrigin = env.PAPERBACK_BASE_URL?.replace(/\/$/, "");
  if (productionSalesEnabled(env, book) && (allowedOrigin(request, env) || origin === workerOrigin)) {
    return { mode: "production" };
  }
  return null;
}

function cors(request, env) {
  if (!allowedOrigin(request, env)) return {};
  return {
    "Access-Control-Allow-Origin": env.PAPERBACK_ALLOWED_ORIGIN,
    Vary: "Origin",
    "Access-Control-Allow-Headers": "content-type, x-paperback-test-token, x-paperback-private-token",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };
}

function digitalPaymentLinks(env) {
  return new Map([
    [env.STRIPE_PAYMENT_LINK_CURRENCY_DIGITAL, "currency_market_structure"],
    [env.STRIPE_PAYMENT_LINK_METALS_DIGITAL, "metals_market_structure"],
    [env.STRIPE_PAYMENT_LINK_EQUITY_DIGITAL, "equity_market_structure"],
    [env.STRIPE_PAYMENT_LINK_PROBABILISTIC_DIGITAL, "probabilistic_execution"]
  ].filter(([paymentLinkId]) => typeof paymentLinkId === "string" && paymentLinkId.startsWith("plink_")));
}

function digitalCheckoutConfig(slug, env) {
  if (slug !== "probabilistic-execution") return null;
  const paymentLinkId = env.STRIPE_PAYMENT_LINK_PROBABILISTIC_DIGITAL;
  const checkoutUrl = env.STRIPE_CHECKOUT_URL_PROBABILISTIC_DIGITAL;
  const validPaymentLinkId = typeof paymentLinkId === "string"
    && /^plink_[A-Za-z0-9]{8,}$/.test(paymentLinkId)
    && !/(?:test|example|placeholder|dummy)/i.test(paymentLinkId);
  let validCheckoutUrl = false;
  try {
    const parsed = new URL(checkoutUrl);
    validCheckoutUrl = parsed.protocol === "https:"
      && parsed.hostname === "buy.stripe.com"
      && parsed.pathname.length > 6
      && !/(?:test|example|placeholder|dummy)/i.test(parsed.pathname);
  } catch { /* An absent or malformed URL must remain unavailable. */ }
  const enabled = env.PROBABILISTIC_EXECUTION_DIGITAL_SALES_ENABLED === "true"
    && digitalDeliveryConfigured(env)
    && validPaymentLinkId
    && validCheckoutUrl;
  return { enabled, checkoutUrl: enabled ? checkoutUrl : null, priceCents: DIGITAL_PRICE_CENTS };
}

function digitalPurchaseFromSession(session, env) {
  if (!session || session.payment_status !== "paid") return null;
  if (session.mode && session.mode !== "payment") return null;
  if (session.amount_total !== DIGITAL_PRICE_CENTS || String(session.currency || "").toLowerCase() !== DIGITAL_CURRENCY) return null;
  const paymentLinkId = typeof session.payment_link === "string" ? session.payment_link : session.payment_link?.id;
  const eventLabel = digitalPaymentLinks(env).get(paymentLinkId);
  if (!eventLabel || typeof session.id !== "string" || !/^cs_(?:live|test)_/.test(session.id)) return null;
  return { stripeSessionId: session.id, stripePaymentLinkId: paymentLinkId, eventLabel };
}

async function parseJson(request) {
  try { return await request.json(); } catch { return null; }
}

function assertShippingOption(input) {
  const shippingOption = typeof input === "string" ? input : "MAIL";
  if (!Object.hasOwn(SHIPPING_OPTIONS, shippingOption)) {
    throw new Error("Choose a valid shipping option.");
  }
  return shippingOption;
}

function suggestedAddressDiffers(address, suggested) {
  const normalizedSuggestion = normalizeAddress({
    name: address.name,
    street1: suggested.street1,
    street2: suggested.street2,
    city: suggested.city,
    stateCode: suggested.state_code,
    postcode: suggested.postcode,
    countryCode: suggested.country_code,
    phoneNumber: address.phoneNumber,
    isBusiness: address.isBusiness
  });
  return ["street2", "city", "stateCode", "countryCode"]
    .some((field) => normalizedSuggestion[field] !== address[field])
    || !streetLinesMatch(address.street1, normalizedSuggestion.street1)
    || !postcodesMatch(address.postcode, normalizedSuggestion.postcode, address.countryCode);
}

function quoteFromRow(row) {
  if (!row) return null;
  return {
    quoteId: row.quote_id,
    bookSlug: row.book_slug,
    quantity: row.quantity,
    buyerEmail: row.buyer_email,
    address: JSON.parse(row.shipping_address_json),
    shippingOption: row.shipping_option,
    shippingCents: row.shipping_cents,
    currency: row.currency,
    expiresAt: row.expires_at,
    sessionId: row.stripe_session_id
  };
}

function orderFromRow(row) {
  if (!row) return null;
  return { ...row, address: JSON.parse(row.shipping_address_json) };
}

function sessionAddress(session) {
  const shipping = session.shipping_details || session.collected_information?.shipping_details;
  return shipping ? {
    name: shipping.name,
    phone: shipping.phone || session.customer_details?.phone,
    address: shipping.address
  } : null;
}

async function sendEmail(env, message) {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) throw new Error("Email delivery is not configured.");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: env.EMAIL_FROM, ...message })
  });
  if (!response.ok) throw new Error(`Email provider returned ${response.status}.`);
}

async function notifyAdmin(env, subject, html) {
  if (!env.ADMIN_EMAIL) return;
  try { await sendEmail(env, { to: env.ADMIN_EMAIL, subject, html }); }
  catch (error) { log("admin_email_failed", { message: error.message }); }
}

async function attemptProbabilisticDigitalDelivery(store, env, sessionId, {
  send = sendProbabilisticDigitalDelivery
} = {}) {
  const startedAt = nowIso();
  const leaseExpiresAt = new Date(Date.parse(startedAt) + DIGITAL_DELIVERY_LEASE_MS).toISOString();
  const claimed = await store.claimDigitalDelivery(sessionId, startedAt, leaseExpiresAt);
  if (!claimed) {
    const existing = await store.digitalDelivery(sessionId);
    return { state: existing?.status || "not_queued", attempted: false };
  }
  try {
    const sent = await send(env, claimed);
    const completedAt = nowIso();
    await store.markDigitalDeliverySent(sessionId, sent.messageId, completedAt);
    log("digital_delivery_sent", { sessionId, provider: sent.provider, attempts: claimed.attempts });
    return { state: "sent", attempted: true, provider: sent.provider };
  } catch (error) {
    const deliveryError = error instanceof DigitalDeliveryError
      ? error
      : new DigitalDeliveryError("digital_delivery_unknown", String(error?.message || "Unknown digital delivery failure."));
    const attemptCount = Number(claimed.attempts || 1);
    const retryable = deliveryError.retryable && attemptCount < 3;
    const state = retryable ? "retryable_failure" : "manual_review";
    const failedAt = nowIso();
    const retryDelay = DIGITAL_DELIVERY_RETRY_MS[Math.min(attemptCount - 1, DIGITAL_DELIVERY_RETRY_MS.length - 1)];
    const nextAttemptAt = retryable ? new Date(Date.parse(failedAt) + retryDelay).toISOString() : null;
    await store.markDigitalDeliveryFailure(
      sessionId,
      state,
      deliveryError.code,
      deliveryError.message,
      nextAttemptAt,
      failedAt
    );
    log("digital_delivery_failed", { sessionId, code: deliveryError.code, state, attempts: attemptCount });
    if (state === "manual_review") {
      await notifyAdmin(
        env,
        "Probabilistic Execution digital delivery needs review",
        `<p>Stripe session: ${escapeHtml(sessionId)}</p><p>Reason: ${escapeHtml(deliveryError.code)}</p>`
      );
    }
    return { state, attempted: true, code: deliveryError.code, nextAttemptAt };
  }
}

async function retryDigitalDeliveries(store, env) {
  const scanAt = nowIso();
  const expired = await store.digitalDeliveriesExpiredSending(scanAt);
  for (const delivery of expired) {
    const movedToReview = await store.markExpiredDigitalDeliveryForReview(
      delivery.stripe_session_id,
      scanAt
    );
    if (!movedToReview) continue;
    log("digital_delivery_lease_expired", { sessionId: delivery.stripe_session_id });
    await notifyAdmin(
      env,
      "Probabilistic Execution digital delivery needs review",
      `<p>Stripe session: ${escapeHtml(delivery.stripe_session_id)}</p><p>Reason: digital_delivery_lease_expired</p>`
    );
  }

  const due = await store.digitalDeliveriesDue(scanAt);
  for (const delivery of due) {
    try { await attemptProbabilisticDigitalDelivery(store, env, delivery.stripe_session_id); }
    catch (error) {
      log("digital_delivery_retry_crashed", {
        sessionId: delivery.stripe_session_id,
        message: String(error?.message || "unknown")
      });
    }
  }
}

async function emailOrderConfirmation(env, order, book) {
  const orderRef = order.stripe_session_id.slice(-8).toUpperCase();
  await sendEmail(env, {
    to: order.buyer_email,
    subject: `${book.editionLabel} order received — ${book.title}`,
    html: `<p>Thank you for ordering <strong>${escapeHtml(book.title)}</strong>.</p>
      <p>Your order reference is <strong>${orderRef}</strong>. Your ${book.edition} order has been sent to our print partner and we will email you when it ships.</p>
      <p>If you need help, reply to this email and include that order reference.</p>`
  });
}

async function emailShipmentNotice(env, order, book, status) {
  const tracking = trackingDetails(status);
  const detail = tracking.length ? `<p>${tracking.map(escapeHtml).join("<br>")}</p>` : "<p>Lulu has marked the order as shipped. Tracking may be supplied by the carrier shortly.</p>";
  await sendEmail(env, {
    to: order.buyer_email,
    subject: `Your ${book.edition} has shipped — ${book.title}`,
    html: `<p>Your copy of <strong>${escapeHtml(book.title)}</strong> has shipped.</p>${detail}`
  });
}

async function emailOrderNeedsAttention(env, order, book, reason) {
  await sendEmail(env, {
    to: order.buyer_email,
    subject: `We need to confirm your ${book.edition} shipping details`,
    html: `<p>Thank you for your ${book.edition} order. We need to confirm a shipping detail before it is sent to print.</p>
      <p>${escapeHtml(reason)}</p><p>Please reply to this email and include your order reference: <strong>${escapeHtml(order.stripe_session_id.slice(-8).toUpperCase())}</strong>.</p>`
  });
}

function trackingDetails(status) {
  const candidates = status?.tracking_urls || status?.tracking || status?.line_items?.flatMap?.((item) => item.tracking_urls || []);
  if (!Array.isArray(candidates)) return [];
  return candidates.filter((value) => typeof value === "string" && value.length < 500);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

async function createQuote(request, env) {
  const input = await parseJson(request);
  if (!input) return publicError("invalid_json", "Request body must be JSON.").response;
  const book = getBook(input.bookSlug, input.edition);
  if (!book) return publicError("unknown_book", "That print edition is not available.", 404).response;
  const authorization = checkoutAuthorized(request, env, book);
  if (!authorization) return publicError("print_checkout_disabled", "Print checkout is not enabled for that edition.", 403).response;
  const validated = validateCheckoutRequest(input);
  if (!validated.ok) return json({ ok: false, code: "invalid_address", errors: validated.errors }, 422, cors(request, env));
  const countries = allowedCountries(env);
  if (!countries.includes(validated.address.countryCode)) {
    return json({ ok: false, code: "shipping_country_unavailable", message: "That shipping country is not enabled." }, 422, cors(request, env));
  }
  let shippingOption;
  try { shippingOption = assertShippingOption(input.shippingOption); }
  catch (error) { return publicError("invalid_shipping_option", error.message).response; }

  try {
    const luluQuote = await new LuluClient(env).quote({ book, quantity: validated.quantity, address: validated.address, shippingOption });
    const suggested = luluQuote?.shipping_address?.suggested_address;
    if (suggested && Object.keys(suggested).length > 0 && suggestedAddressDiffers(validated.address, suggested)) {
      return json({ ok: false, code: "address_needs_review", message: "Lulu suggested a different shipping address.", suggestedAddress: suggested }, 422, cors(request, env));
    }
    const quote = {
      quoteId: crypto.randomUUID(),
      bookSlug: book.slug,
      quantity: validated.quantity,
      buyerEmail: validated.buyerEmail,
      address: validated.address,
      shippingOption,
      shippingCents: shippingCents(luluQuote),
      currency: String(luluQuote.currency || "USD").toUpperCase(),
      luluQuote,
      createdAt: nowIso(),
      expiresAt: new Date(Date.now() + QUOTE_LIFETIME_MS).toISOString()
    };
    await new OrderStore(env.PAPERBACK_ORDERS).putQuote(quote);
    log("shipping_quoted", { mode: authorization.mode, book: book.slug, quoteId: quote.quoteId, shippingOption });
    return json({
      ok: true,
      quoteId: quote.quoteId,
      book: { slug: book.slug, seriesSlug: book.seriesSlug, edition: book.edition, title: book.title, priceCents: book.priceCents },
      shipping: { cents: quote.shippingCents, currency: quote.currency, option: shippingOption },
      expiresAt: quote.expiresAt
    }, 201, cors(request, env));
  } catch (error) {
    return providerError(error, request, env, "quote");
  }
}

async function createCheckout(request, env) {
  const input = await parseJson(request);
  if (!input || typeof input.quoteId !== "string") return publicError("quote_required", "A shipping quote is required.").response;
  const store = new OrderStore(env.PAPERBACK_ORDERS);
  const quote = quoteFromRow(await store.quote(input.quoteId));
  if (!quote) return publicError("quote_not_found", "That shipping quote was not found.", 404).response;
  if (Date.parse(quote.expiresAt) < Date.now()) return publicError("quote_expired", "That shipping quote has expired. Please request a new quote.", 409).response;
  if (quote.sessionId) return publicError("checkout_already_created", "Checkout was already created for that quote.", 409).response;
  const book = getBook(quote.bookSlug);
  if (!book) return publicError("unknown_book", "That print edition is not available.", 404).response;
  const authorization = checkoutAuthorized(request, env, book);
  if (!authorization) return publicError("print_checkout_disabled", "Print checkout is not enabled for that edition.", 403).response;

  try {
    const priceId = getStripePriceId(book, env);
    const session = await new StripeClient(env).createCheckoutSession({
      book,
      quote,
      priceId,
      customerEmail: quote.buyerEmail,
      checkoutMode: authorization.mode
    });
    await store.attachSession(quote.quoteId, session.id);
    log("checkout_created", { mode: authorization.mode, book: book.slug, quoteId: quote.quoteId, sessionId: session.id });
    return json({ ok: true, checkoutUrl: session.url, sessionId: session.id }, 201, cors(request, env));
  } catch (error) {
    return providerError(error, request, env, "checkout");
  }
}

export function luluStatusFromJob(job) {
  const candidate = job?.status ?? job?.print_job_status;
  if (typeof candidate === "string") return candidate;
  if (typeof candidate?.name === "string") return candidate.name;
  if (typeof candidate?.value === "string") return candidate.value;
  return "CREATED";
}

async function submitPaidOrder(store, env, sessionId) {
  const order = orderFromRow(await store.get(sessionId));
  if (!order || !(await store.claimForSubmission(sessionId, nowIso()))) return;
  const book = getBook(order.book_slug);
  if (!book) {
    await store.markFailure(sessionId, "manual_review", "unknown_book", "Book mapping is missing.", nowIso());
    return;
  }
  try {
    const job = await new LuluClient(env).createPrintJob({
      book,
      quantity: order.quantity,
      address: order.address,
      shippingOption: order.shipping_option,
      externalId: `gpt-${sessionId}`
    });
    const printJobId = job.id || job.print_job_id;
    if (!printJobId) throw new LuluApiError("lulu_response_invalid", "Lulu accepted the request without a print job ID.");
    await store.markSubmitted(sessionId, String(printJobId), luluStatusFromJob(job), nowIso());
    const submitted = orderFromRow(await store.get(sessionId));
    try {
      await emailOrderConfirmation(env, submitted, book);
      await store.markEmail(sessionId, "confirmation", nowIso());
    } catch (error) {
      log("confirmation_email_failed", { sessionId, message: error.message });
    }
    await notifyAdmin(env, `${book.editionLabel} order submitted: ${book.title}`, `<p>Stripe session: ${escapeHtml(sessionId)}</p><p>Lulu print job: ${escapeHtml(printJobId)}</p>`);
    log("lulu_submitted", { sessionId, book: book.slug, printJobId: String(printJobId) });
  } catch (error) {
    // A transport/5xx failure after the request starts is ambiguous: retrying it could
    // print the book twice. Those orders require an explicit human decision.
    const retryable = error instanceof LuluApiError && error.code === "lulu_auth_failed";
    const state = retryable ? "retryable_failure" : "manual_review";
    await store.markFailure(sessionId, state, error.code || "lulu_submit_failed", error.message, nowIso());
    await notifyAdmin(env, `${book.editionLabel} fulfillment needs review`, `<p>Stripe session: ${escapeHtml(sessionId)}</p><p>Reason: ${escapeHtml(error.code || "lulu_submit_failed")}</p>`);
    log("lulu_submission_failed", { sessionId, code: error.code || "lulu_submit_failed", state });
  }
}

async function stripeWebhook(request, env, {
  storeFactory = (db) => new OrderStore(db),
  sendDigital = sendProbabilisticDigitalDelivery
} = {}) {
  let event;
  try { event = await parseVerifiedStripeEvent(request, env.STRIPE_WEBHOOK_SECRET); }
  catch (error) { return json({ ok: false, code: error.code || "stripe_webhook_invalid" }, 400); }
  if (!DIGITAL_EVENT_TYPES.has(event.type)) return json({ ok: true, ignored: event.type });
  const session = event.data?.object || {};
  const digitalPurchase = digitalPurchaseFromSession(session, env);
  if (digitalPurchase) {
    const store = storeFactory(env.PAPERBACK_ORDERS);
    const inserted = await store.insertDigitalPurchase({
      ...digitalPurchase,
      stripeEventId: event.id,
      amountTotal: session.amount_total,
      currency: String(session.currency).toLowerCase(),
      verifiedAt: nowIso()
    });
    log(inserted ? "digital_purchase_verified" : "digital_purchase_duplicate", {
      eventId: event.id,
      sessionId: session.id,
      eventLabel: digitalPurchase.eventLabel
    });
    if (digitalPurchase.eventLabel === "probabilistic_execution") {
      const buyerEmail = normalizeDigitalBuyerEmail(session);
      await store.ensureDigitalDelivery(
        session.id,
        buyerEmail,
        nowIso(),
        buyerEmail ? "queued" : "manual_review"
      );
      if (!buyerEmail) {
        await notifyAdmin(
          env,
          "Probabilistic Execution payment is missing a delivery email",
          `<p>Stripe session: ${escapeHtml(session.id)}</p><p>Delivery requires manual review.</p>`
        );
        return json({ ok: true, digitalPurchase: true, duplicate: !inserted, deliveryState: "manual_review" });
      }
      const delivery = await attemptProbabilisticDigitalDelivery(store, env, session.id, { send: sendDigital });
      return json({
        ok: true,
        digitalPurchase: true,
        duplicate: !inserted,
        deliveryState: delivery.state
      });
    }
    return json({ ok: true, digitalPurchase: true, duplicate: !inserted });
  }
  if (event.type !== "checkout.session.completed") return json({ ok: true, ignored: "not_a_paid_digital_purchase" });
  const orderType = session.metadata?.order_type;
  if (session.payment_status !== "paid" || !["print_book", "paperback"].includes(orderType)) return json({ ok: true, ignored: "not_a_paid_print_order" });
  const quoteId = session.metadata?.quote_id || session.client_reference_id;
  const book = getBook(session.metadata?.book_slug);
  const store = new OrderStore(env.PAPERBACK_ORDERS);
  const quote = quoteFromRow(await store.quote(quoteId));
  if (!book || !quote || quote.bookSlug !== book.slug || quote.sessionId !== session.id) {
    log("webhook_manual_review", { eventId: event.id, sessionId: session.id, reason: "quote_or_book_mismatch" });
    await notifyAdmin(env, "Print-book payment needs review", `<p>Stripe session: ${escapeHtml(session.id || "unknown")}</p><p>Quote or book mapping did not match.</p>`);
    return json({ ok: true, state: "manual_review" });
  }
  const inserted = await store.insertPaidOrder({
    stripeSessionId: session.id,
    stripeEventId: event.id,
    quoteId,
    bookSlug: book.slug,
    quantity: quote.quantity,
    buyerEmail: session.customer_details?.email || quote.buyerEmail,
    address: quote.address,
    shippingOption: quote.shippingOption,
    shippingCents: quote.shippingCents,
    currency: quote.currency,
    customerTotalCents: session.amount_total || null,
    taxCents: session.total_details?.amount_tax ?? null,
    checkoutMode: session.metadata?.checkout_mode || "unknown",
    now: nowIso()
  });
  if (!inserted) {
    log("webhook_duplicate", { eventId: event.id, sessionId: session.id });
    return json({ ok: true, duplicate: true });
  }
  if (!addressesMatch(quote.address, sessionAddress(session))) {
    await store.markFailure(session.id, "address_mismatch", "stripe_address_mismatch", "The Stripe Checkout address did not match the address used for the Lulu shipping quote.", nowIso());
    const paidOrder = orderFromRow(await store.get(session.id));
    try { await emailOrderNeedsAttention(env, paidOrder, book, "The address entered at payment did not match the address used to calculate shipping."); }
    catch (error) { log("address_email_failed", { sessionId: session.id, message: error.message }); }
    await notifyAdmin(env, `${book.editionLabel} paid order has address mismatch`, `<p>Stripe session: ${escapeHtml(session.id)}</p><p>Do not submit until the address is resolved.</p>`);
    log("webhook_address_mismatch", { eventId: event.id, sessionId: session.id });
    return json({ ok: true, state: "address_mismatch" });
  }
  await submitPaidOrder(store, env, session.id);
  return json({ ok: true });
}

async function claimDigitalConversion(request, env) {
  if (!allowedOrigin(request, env)) return json({ ok: false, code: "origin_forbidden" }, 403);
  const input = await parseJson(request);
  const sessionId = typeof input?.sessionId === "string" ? input.sessionId.trim() : "";
  if (!/^cs_(?:live|test)_[A-Za-z0-9]+$/.test(sessionId)) {
    return json({ ok: false, code: "session_invalid" }, 400, cors(request, env));
  }
  const store = new OrderStore(env.PAPERBACK_ORDERS);
  const result = await store.claimDigitalConversion(sessionId, nowIso());
  if (result.status === "not_found") {
    return json({ ok: false, code: "payment_not_verified" }, 404, cors(request, env));
  }
  if (result.status === "duplicate") {
    return json({ ok: true, track: false, duplicate: true }, 200, cors(request, env));
  }
  return json({
    ok: true,
    track: true,
    eventLabel: result.purchase.event_label,
    value: DIGITAL_PRICE_CENTS / 100,
    currency: DIGITAL_CURRENCY.toUpperCase()
  }, 200, cors(request, env));
}

async function pollStatuses(env, {
  storeFactory = (db) => new OrderStore(db)
} = {}) {
  log("lulu_status_poll_started");
  const store = storeFactory(env.PAPERBACK_ORDERS);
  try { await retryDigitalDeliveries(store, env); }
  catch (error) { log("digital_delivery_retry_scan_failed", { message: String(error?.message || "unknown") }); }
  try {
    const deletedQuotes = await store.deleteExpiredQuotes(nowIso());
    if (deletedQuotes > 0) log("expired_quotes_deleted", { count: deletedQuotes });
  } catch (error) {
    // Quote cleanup is important for data minimization, but it must not block
    // confirmation retries or live fulfillment status polling.
    log("expired_quote_cleanup_failed", { message: String(error.message || "unknown") });
  }
  for (const row of await store.ordersNeedingConfirmation()) {
    const order = orderFromRow(row);
    const book = getBook(order.book_slug);
    if (!book) continue;
    try {
      await emailOrderConfirmation(env, order, book);
      await store.markEmail(order.stripe_session_id, "confirmation", nowIso());
    } catch (error) { log("confirmation_email_retry_failed", { sessionId: order.stripe_session_id, message: error.message }); }
  }
  const orders = await store.activeOrders();
  for (const row of orders) {
    const order = orderFromRow(row);
    const book = getBook(order.book_slug);
    if (!book) continue;
    try {
      const status = await new LuluClient(env).status(order.lulu_print_job_id);
      const nextStatus = luluStatusFromJob(status);
      log("lulu_status_polled", { sessionId: order.stripe_session_id, status: nextStatus });
      if (nextStatus !== order.lulu_status) {
        await store.updateLuluStatus(order.stripe_session_id, nextStatus, JSON.stringify(status), nowIso());
        log("lulu_status_changed", { sessionId: order.stripe_session_id, from: order.lulu_status, to: nextStatus });
      }
      if (nextStatus === "SHIPPED" && !order.shipment_emailed_at) {
        try {
          await emailShipmentNotice(env, order, book, status);
          await store.markEmail(order.stripe_session_id, "shipment", nowIso());
        } catch (error) { log("shipment_email_failed", { sessionId: order.stripe_session_id, message: error.message }); }
      }
      if (["ERROR", "CANCELLED"].includes(nextStatus)) {
        await notifyAdmin(env, `${book.editionLabel} fulfillment needs review`, `<p>Stripe session: ${escapeHtml(order.stripe_session_id)}</p><p>Lulu status: ${escapeHtml(nextStatus)}</p>`);
      }
    } catch (error) {
      log("lulu_status_poll_failed", { sessionId: order.stripe_session_id, code: error.code || "unknown", message: String(error.message || "") });
    }
  }
}

function renderCheckoutPage(book, env, { privateOrder = false } = {}) {
  const title = escapeHtml(book.title);
  const seriesSlug = JSON.stringify(book.seriesSlug);
  const edition = JSON.stringify(book.edition);
  const editionLabel = escapeHtml(book.editionLabel);
  const price = (book.priceCents / 100).toFixed(2);
  const defaultCountry = escapeHtml(allowedCountries(env)[0] || "");
  const privateTokenField = privateOrder
    ? '<label>Private order token<input required type="password" name="privateOrderToken" autocomplete="off"></label>'
    : "";
  const privateMode = JSON.stringify(privateOrder);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${editionLabel} checkout — ${title}</title><style>
    body{margin:0;background:#07100b;color:#f8faf7;font:16px/1.5 system-ui,sans-serif}.wrap{max-width:680px;margin:40px auto;padding:28px;background:#0d1711;border:1px solid #294235;border-radius:18px}h1{font:600 2rem Georgia,serif}a{color:#38f58a}label{display:block;margin:14px 0 5px}input,select{box-sizing:border-box;width:100%;padding:11px;border:1px solid #607366;border-radius:7px;font:inherit}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.legal{display:flex;align-items:flex-start;gap:10px;margin-top:20px}.legal input{width:auto;margin-top:5px}button{width:100%;margin-top:22px;padding:14px;background:#38f58a;color:#07100b;border:0;border-radius:999px;font-weight:800;font-size:1rem;cursor:pointer}button:disabled{opacity:.55;cursor:wait}.note,#result{color:#c5d0c8}.error{color:#ffb4a7}@media(max-width:600px){.wrap{margin:0;border-radius:0;min-height:100vh}.grid{grid-template-columns:1fr}}</style></head><body><main class="wrap">
    <p class="note">Grizzly Parrot Trading · ${editionLabel.toLowerCase()} edition</p><h1>${title}</h1><p>$${price} plus calculated shipping.</p>
    <p class="note">U.S. shipping only. Your contact and delivery details are used to calculate shipping, fulfill the order, and provide order updates.</p>
    <form id="checkout">${privateTokenField}<label>Email<input required type="email" name="buyerEmail" autocomplete="email"></label><label>Recipient name<input required name="name" autocomplete="name"></label><label>Street address<input required name="street1" autocomplete="address-line1"></label><label>Apartment, suite, etc. (optional)<input name="street2" autocomplete="address-line2"></label><div class="grid"><label>City<input required name="city" autocomplete="address-level2"></label><label>State<input required name="stateCode" autocomplete="address-level1" maxlength="2"></label></div><div class="grid"><label>Postal code<input required name="postcode" autocomplete="postal-code"></label><label>Country code<input required name="countryCode" value="${defaultCountry}" maxlength="2" autocomplete="country" readonly aria-readonly="true"></label></div><label>Phone number<input required name="phoneNumber" autocomplete="tel"></label><label>Shipping service<select name="shippingOption"><option value="MAIL">Mail</option><option value="PRIORITY_MAIL">Priority mail</option><option value="EXPEDITED">Expedited</option><option value="EXPRESS">Express</option></select></label><label class="legal"><input required type="checkbox" name="policyAccepted" value="yes"><span>I agree to the <a href="https://grizzlyparrottrading.com/store-policy.html" target="_blank" rel="noopener">Store Policy</a> and acknowledge the <a href="https://grizzlyparrottrading.com/privacy.html" target="_blank" rel="noopener">Privacy Policy</a>.</span></label><button id="submit" type="submit">Calculate shipping and continue</button><p id="result" aria-live="polite"></p></form></main><script>
    const bookSlug=${seriesSlug}; const edition=${edition}; const privateOrder=${privateMode}; const form=document.getElementById('checkout'); const result=document.getElementById('result'); const button=document.getElementById('submit');
    form.addEventListener('submit',async(event)=>{event.preventDefault();button.disabled=true;result.className='note';result.textContent='Calculating shipping…';const data=Object.fromEntries(new FormData(form));const privateOrderToken=data.privateOrderToken||'';delete data.privateOrderToken;const headers={'content-type':'application/json'};if(privateOrder)headers['x-paperback-private-token']=privateOrderToken;data.bookSlug=bookSlug;data.edition=edition;data.quantity=1;data.shippingAddress={name:data.name,street1:data.street1,street2:data.street2,city:data.city,stateCode:data.stateCode.toUpperCase(),postcode:data.postcode,countryCode:data.countryCode.toUpperCase(),phoneNumber:data.phoneNumber};try{const quoteResponse=await fetch('/print/quote',{method:'POST',headers,body:JSON.stringify(data)});const quote=await quoteResponse.json();if(!quoteResponse.ok)throw new Error((quote.errors||[quote.message||'Unable to calculate shipping.']).join(' '));result.textContent='Shipping: '+(quote.shipping.cents/100).toFixed(2)+' '+quote.shipping.currency+'. Opening secure checkout…';const checkoutResponse=await fetch('/print/checkout',{method:'POST',headers,body:JSON.stringify({quoteId:quote.quoteId})});const checkout=await checkoutResponse.json();if(!checkoutResponse.ok)throw new Error(checkout.message||'Unable to create checkout.');location.assign(checkout.checkoutUrl);}catch(error){result.className='error';result.textContent=error.message;button.disabled=false;}});
  </script></body></html>`;
}

function providerError(error, request, env, action) {
  const code = error.code || "provider_error";
  const status = code.startsWith("lulu_4") || code.startsWith("stripe_4") ? 422 : 502;
  log(`${action}_failed`, { code });
  const message = action === "quote" && code === "lulu_400"
    ? "That shipping service is unavailable for this delivery address. Choose another service and try again."
    : error.message || "The print service could not complete this request.";
  return json({ ok: false, code, message }, status, cors(request, env));
}

async function serveAsset(request, env, pathname) {
  const assetKey = decodeURIComponent(pathname.slice("/lulu-assets/".length));
  const permittedAssetKeys = new Set(Object.values(ALL_PRINT_EDITIONS).flatMap((book) => [book.assets.interiorKey, book.assets.coverKey]));
  if (!permittedAssetKeys.has(assetKey)) return new Response("Not found", { status: 404 });
  const url = new URL(request.url);
  const authorized = await verifyAssetRequest(assetKey, url.searchParams.get("expires"), url.searchParams.get("sig"), env.PAPERBACK_ASSET_SIGNING_SECRET || "");
  if (!authorized) return new Response("Not found", { status: 404 });
  const object = await env.PRINT_ASSETS.get(assetKey);
  if (!object) return new Response("Not found", { status: 404 });
  return new Response(object.body, { headers: { "Content-Type": "application/pdf", "Cache-Control": "private, no-store", "Content-Disposition": "inline" } });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(request, env) });
    if (request.method === "GET" && url.pathname === "/health") {
      return json({
        ok: true,
        paperbackSalesEnabled: editionSalesEnabled(env, "paperback"),
        hardcoverSalesEnabled: editionSalesEnabled(env, "hardcover"),
        privateOrderEnabled: env.PAPERBACK_PRIVATE_ORDER_ENABLED === "true",
        environment: env.PAPERBACK_ENVIRONMENT,
        readiness: productionReadiness(env),
        probabilisticDigitalDeliveryReady: digitalDeliveryConfigured(env)
      });
    }
    if (request.method === "GET" && url.pathname === "/public-config") {
      const book = getBook(url.searchParams.get("bookSlug"), url.searchParams.get("edition"));
      const enabled = Boolean(book && productionSalesEnabled(env, book));
      const checkoutUrl = enabled
        ? `${env.PAPERBACK_BASE_URL.replace(/\/$/, "")}/print/checkout?bookSlug=${encodeURIComponent(book.seriesSlug)}&edition=${encodeURIComponent(book.edition)}`
        : null;
      const response = { enabled, checkoutUrl, edition: book?.edition || null, priceCents: book?.priceCents || null };
      if (book?.catalogStatus === "staged") response.catalogStatus = "staged";
      return json(response, 200, cors(request, env));
    }
    if (request.method === "GET" && url.pathname === "/digital-config") {
      const config = digitalCheckoutConfig(url.searchParams.get("bookSlug"), env);
      return json(config || { enabled: false, checkoutUrl: null, priceCents: null }, 200, cors(request, env));
    }
    if (request.method === "GET" && ["/print/checkout", "/paperback/checkout"].includes(url.pathname)) {
      const requestedEdition = url.pathname === "/paperback/checkout" ? "paperback" : url.searchParams.get("edition");
      const book = getBook(url.searchParams.get("bookSlug"), requestedEdition);
      if (!book || !productionSalesEnabled(env, book)) return new Response("Not found", { status: 404 });
      return new Response(renderCheckoutPage(book, env), { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
    }
    if (request.method === "GET" && ["/print/private-order", "/paperback/private-order"].includes(url.pathname)) {
      const requestedEdition = url.pathname === "/paperback/private-order" ? "paperback" : url.searchParams.get("edition");
      const book = getBook(url.searchParams.get("bookSlug"), requestedEdition);
      if (!book || !privateOrderEnabled(env, book)) return new Response("Not found", { status: 404 });
      return new Response(renderCheckoutPage(book, env, { privateOrder: true }), { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
    }
    if (request.method === "GET" && url.pathname.startsWith("/lulu-assets/")) return serveAsset(request, env, url.pathname);
    if (request.method === "POST" && ["/print/quote", "/paperback/quote"].includes(url.pathname)) return createQuote(request, env);
    if (request.method === "POST" && ["/print/checkout", "/paperback/checkout"].includes(url.pathname)) return createCheckout(request, env);
    if (request.method === "POST" && url.pathname === "/digital-conversion/claim") return claimDigitalConversion(request, env);
    if (request.method === "POST" && url.pathname === "/webhooks/stripe") return stripeWebhook(request, env);
    return json({ ok: false, code: "not_found" }, 404);
  },
  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(pollStatuses(env));
  }
};

export {
  attemptProbabilisticDigitalDelivery,
  createQuote,
  createCheckout,
  stripeWebhook,
  claimDigitalConversion,
  digitalPurchaseFromSession,
  digitalCheckoutConfig,
  productionSalesEnabled,
  pollStatuses,
  quoteFromRow,
  orderFromRow,
  retryDigitalDeliveries,
  suggestedAddressDiffers
};
