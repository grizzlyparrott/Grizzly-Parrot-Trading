import { getBook, getStripePriceId, SHIPPING_OPTIONS } from "./catalog.mjs";
import { validateCheckoutRequest, addressesMatch, normalizeAddress } from "./validation.mjs";
import { verifyAssetRequest, constantTimeEqual } from "./crypto.mjs";
import { LuluApiError, LuluClient, shippingCents } from "./lulu.mjs";
import { StripeApiError, StripeClient, parseVerifiedStripeEvent } from "./stripe.mjs";
import { OrderStore } from "./order-store.mjs";

const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };
const QUOTE_LIFETIME_MS = 30 * 60 * 1000;

function nowIso() { return new Date().toISOString(); }

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), { status, headers: { ...JSON_HEADERS, ...extraHeaders } });
}

function log(event, details = {}) {
  // Intentionally excludes buyer email and street address.
  console.log(JSON.stringify({ component: "paperback-fulfillment", event, ...details }));
}

function publicError(code, message, status = 400) {
  return { response: json({ ok: false, code, message }, status), code, message };
}

function allowedOrigin(request, env) {
  const origin = request.headers.get("Origin");
  return Boolean(origin && origin === env.PAPERBACK_ALLOWED_ORIGIN);
}

function productionSalesEnabled(env) {
  return env.PAPERBACK_ENVIRONMENT === "production" && env.PAPERBACK_SALES_ENABLED === "true";
}

function testAuthorized(request, env) {
  const supplied = request.headers.get("x-paperback-test-token") || "";
  return env.PAPERBACK_ENVIRONMENT === "sandbox"
    && Boolean(env.PAPERBACK_TEST_TOKEN)
    && constantTimeEqual(supplied, env.PAPERBACK_TEST_TOKEN);
}

function checkoutAuthorized(request, env) {
  if (testAuthorized(request, env)) return { mode: "test" };
  const origin = request.headers.get("Origin");
  const workerOrigin = env.PAPERBACK_BASE_URL?.replace(/\/$/, "");
  if (productionSalesEnabled(env) && (allowedOrigin(request, env) || origin === workerOrigin)) {
    return { mode: "production" };
  }
  return null;
}

function cors(request, env) {
  if (!allowedOrigin(request, env)) return {};
  return {
    "Access-Control-Allow-Origin": env.PAPERBACK_ALLOWED_ORIGIN,
    Vary: "Origin",
    "Access-Control-Allow-Headers": "content-type, x-paperback-test-token",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };
}

async function parseJson(request) {
  try { return await request.json(); } catch { return null; }
}

function assertShippingOption(input) {
  const shippingOption = typeof input === "string" ? input : "GROUND";
  if (!Object.hasOwn(SHIPPING_OPTIONS, shippingOption)) {
    throw new Error("Choose a valid shipping option.");
  }
  return shippingOption;
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

async function emailOrderConfirmation(env, order, book) {
  const orderRef = order.stripe_session_id.slice(-8).toUpperCase();
  await sendEmail(env, {
    to: order.buyer_email,
    subject: `Paperback order received — ${book.title}`,
    html: `<p>Thank you for ordering <strong>${escapeHtml(book.title)}</strong>.</p>
      <p>Your order reference is <strong>${orderRef}</strong>. Your paperback order has been sent to our print partner and we will email you when it ships.</p>
      <p>If you need help, reply to this email and include that order reference.</p>`
  });
}

async function emailShipmentNotice(env, order, book, status) {
  const tracking = trackingDetails(status);
  const detail = tracking.length ? `<p>${tracking.map(escapeHtml).join("<br>")}</p>` : "<p>Lulu has marked the order as shipped. Tracking may be supplied by the carrier shortly.</p>";
  await sendEmail(env, {
    to: order.buyer_email,
    subject: `Your paperback has shipped — ${book.title}`,
    html: `<p>Your copy of <strong>${escapeHtml(book.title)}</strong> has shipped.</p>${detail}`
  });
}

async function emailOrderNeedsAttention(env, order, reason) {
  await sendEmail(env, {
    to: order.buyer_email,
    subject: "We need to confirm your paperback shipping details",
    html: `<p>Thank you for your paperback order. We need to confirm a shipping detail before it is sent to print.</p>
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
  const authorization = checkoutAuthorized(request, env);
  if (!authorization) return publicError("paperback_checkout_disabled", "Paperback checkout is not enabled.", 403).response;
  const input = await parseJson(request);
  if (!input) return publicError("invalid_json", "Request body must be JSON.").response;
  const book = getBook(input.bookSlug);
  if (!book) return publicError("unknown_book", "That paperback edition is not available.", 404).response;
  const validated = validateCheckoutRequest(input);
  if (!validated.ok) return json({ ok: false, code: "invalid_address", errors: validated.errors }, 422, cors(request, env));
  let shippingOption;
  try { shippingOption = assertShippingOption(input.shippingOption); }
  catch (error) { return publicError("invalid_shipping_option", error.message).response; }

  try {
    const luluQuote = await new LuluClient(env).quote({ book, quantity: validated.quantity, address: validated.address, shippingOption });
    const suggested = luluQuote?.shipping_address?.suggested_address;
    if (suggested && Object.keys(suggested).length > 0) {
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
      book: { slug: book.slug, title: book.title, paperbackCents: book.priceCents },
      shipping: { cents: quote.shippingCents, currency: quote.currency, option: shippingOption },
      expiresAt: quote.expiresAt
    }, 201, cors(request, env));
  } catch (error) {
    return providerError(error, request, env, "quote");
  }
}

async function createCheckout(request, env) {
  const authorization = checkoutAuthorized(request, env);
  if (!authorization) return publicError("paperback_checkout_disabled", "Paperback checkout is not enabled.", 403).response;
  const input = await parseJson(request);
  if (!input || typeof input.quoteId !== "string") return publicError("quote_required", "A shipping quote is required.").response;
  const store = new OrderStore(env.PAPERBACK_ORDERS);
  const quote = quoteFromRow(await store.quote(input.quoteId));
  if (!quote) return publicError("quote_not_found", "That shipping quote was not found.", 404).response;
  if (Date.parse(quote.expiresAt) < Date.now()) return publicError("quote_expired", "That shipping quote has expired. Please request a new quote.", 409).response;
  if (quote.sessionId) return publicError("checkout_already_created", "Checkout was already created for that quote.", 409).response;
  const book = getBook(quote.bookSlug);
  if (!book) return publicError("unknown_book", "That paperback edition is not available.", 404).response;

  try {
    const priceId = getStripePriceId(book, env);
    const session = await new StripeClient(env).createCheckoutSession({ book, quote, priceId, customerEmail: quote.buyerEmail });
    await store.attachSession(quote.quoteId, session.id);
    log("checkout_created", { mode: authorization.mode, book: book.slug, quoteId: quote.quoteId, sessionId: session.id });
    return json({ ok: true, checkoutUrl: session.url, sessionId: session.id }, 201, cors(request, env));
  } catch (error) {
    return providerError(error, request, env, "checkout");
  }
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
    await store.markSubmitted(sessionId, String(printJobId), job.status || "CREATED", nowIso());
    const submitted = orderFromRow(await store.get(sessionId));
    try {
      await emailOrderConfirmation(env, submitted, book);
      await store.markEmail(sessionId, "confirmation", nowIso());
    } catch (error) {
      log("confirmation_email_failed", { sessionId, message: error.message });
    }
    await notifyAdmin(env, `Paperback order submitted: ${book.title}`, `<p>Stripe session: ${escapeHtml(sessionId)}</p><p>Lulu print job: ${escapeHtml(printJobId)}</p>`);
    log("lulu_submitted", { sessionId, book: book.slug, printJobId: String(printJobId) });
  } catch (error) {
    // A transport/5xx failure after the request starts is ambiguous: retrying it could
    // print the book twice. Those orders require an explicit human decision.
    const retryable = error instanceof LuluApiError && error.code === "lulu_auth_failed";
    const state = retryable ? "retryable_failure" : "manual_review";
    await store.markFailure(sessionId, state, error.code || "lulu_submit_failed", error.message, nowIso());
    await notifyAdmin(env, `Paperback fulfillment needs review`, `<p>Stripe session: ${escapeHtml(sessionId)}</p><p>Reason: ${escapeHtml(error.code || "lulu_submit_failed")}</p>`);
    log("lulu_submission_failed", { sessionId, code: error.code || "lulu_submit_failed", state });
  }
}

async function stripeWebhook(request, env) {
  let event;
  try { event = await parseVerifiedStripeEvent(request, env.STRIPE_WEBHOOK_SECRET); }
  catch (error) { return json({ ok: false, code: error.code || "stripe_webhook_invalid" }, 400); }
  if (event.type !== "checkout.session.completed") return json({ ok: true, ignored: event.type });
  const session = event.data?.object || {};
  if (session.payment_status !== "paid" || session.metadata?.order_type !== "paperback") return json({ ok: true, ignored: "not_a_paid_paperback" });
  const quoteId = session.metadata?.quote_id || session.client_reference_id;
  const book = getBook(session.metadata?.book_slug);
  const store = new OrderStore(env.PAPERBACK_ORDERS);
  const quote = quoteFromRow(await store.quote(quoteId));
  if (!book || !quote || quote.bookSlug !== book.slug || quote.sessionId !== session.id) {
    log("webhook_manual_review", { eventId: event.id, sessionId: session.id, reason: "quote_or_book_mismatch" });
    await notifyAdmin(env, "Paperback payment needs review", `<p>Stripe session: ${escapeHtml(session.id || "unknown")}</p><p>Quote or book mapping did not match.</p>`);
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
    now: nowIso()
  });
  if (!inserted) {
    log("webhook_duplicate", { eventId: event.id, sessionId: session.id });
    return json({ ok: true, duplicate: true });
  }
  if (!addressesMatch(quote.address, sessionAddress(session))) {
    await store.markFailure(session.id, "address_mismatch", "stripe_address_mismatch", "The Stripe Checkout address did not match the address used for the Lulu shipping quote.", nowIso());
    const paidOrder = orderFromRow(await store.get(session.id));
    try { await emailOrderNeedsAttention(env, paidOrder, "The address entered at payment did not match the address used to calculate shipping."); }
    catch (error) { log("address_email_failed", { sessionId: session.id, message: error.message }); }
    await notifyAdmin(env, "Paperback paid order has address mismatch", `<p>Stripe session: ${escapeHtml(session.id)}</p><p>Do not submit until the address is resolved.</p>`);
    log("webhook_address_mismatch", { eventId: event.id, sessionId: session.id });
    return json({ ok: true, state: "address_mismatch" });
  }
  await submitPaidOrder(store, env, session.id);
  return json({ ok: true });
}

async function pollStatuses(env) {
  const store = new OrderStore(env.PAPERBACK_ORDERS);
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
      const nextStatus = status.status || status.print_job_status || "UNKNOWN";
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
        await notifyAdmin(env, "Paperback fulfillment needs review", `<p>Stripe session: ${escapeHtml(order.stripe_session_id)}</p><p>Lulu status: ${escapeHtml(nextStatus)}</p>`);
      }
    } catch (error) {
      log("lulu_status_poll_failed", { sessionId: order.stripe_session_id, code: error.code || "unknown" });
    }
  }
}

function renderCheckoutPage(book, env) {
  const title = escapeHtml(book.title);
  const slug = JSON.stringify(book.slug);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Paperback checkout — ${title}</title><style>
    body{margin:0;background:#07100b;color:#f8faf7;font:16px/1.5 system-ui,sans-serif}.wrap{max-width:680px;margin:40px auto;padding:28px;background:#0d1711;border:1px solid #294235;border-radius:18px}h1{font:600 2rem Georgia,serif}label{display:block;margin:14px 0 5px}input,select{box-sizing:border-box;width:100%;padding:11px;border:1px solid #607366;border-radius:7px;font:inherit}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}button{width:100%;margin-top:22px;padding:14px;background:#38f58a;color:#07100b;border:0;border-radius:999px;font-weight:800;font-size:1rem;cursor:pointer}button:disabled{opacity:.55;cursor:wait}.note,#result{color:#c5d0c8}.error{color:#ffb4a7}@media(max-width:600px){.wrap{margin:0;border-radius:0;min-height:100vh}.grid{grid-template-columns:1fr}}</style></head><body><main class="wrap">
    <p class="note">Grizzly Parrot Trading · paperback edition</p><h1>${title}</h1><p>$39.00 plus calculated shipping. Your address is used only to obtain the print-and-delivery quote.</p>
    <form id="checkout"><label>Email<input required type="email" name="buyerEmail" autocomplete="email"></label><label>Recipient name<input required name="name" autocomplete="name"></label><label>Street address<input required name="street1" autocomplete="address-line1"></label><label>Apartment, suite, etc. (optional)<input name="street2" autocomplete="address-line2"></label><div class="grid"><label>City<input required name="city" autocomplete="address-level2"></label><label>State / province<input required name="stateCode" autocomplete="address-level1" maxlength="2"></label></div><div class="grid"><label>Postal code<input required name="postcode" autocomplete="postal-code"></label><label>Country code<input required name="countryCode" value="US" maxlength="2" autocomplete="country"></label></div><label>Phone number<input required name="phoneNumber" autocomplete="tel"></label><label>Shipping service<select name="shippingOption"><option value="GROUND">Ground</option><option value="MAIL">Mail</option><option value="PRIORITY_MAIL">Priority mail</option><option value="EXPEDITED">Expedited</option><option value="EXPRESS">Express</option></select></label><button id="submit" type="submit">Calculate shipping and continue</button><p id="result" aria-live="polite"></p></form></main><script>
    const bookSlug=${slug}; const form=document.getElementById('checkout'); const result=document.getElementById('result'); const button=document.getElementById('submit');
    form.addEventListener('submit',async(event)=>{event.preventDefault();button.disabled=true;result.className='note';result.textContent='Calculating shipping…';const data=Object.fromEntries(new FormData(form));data.bookSlug=bookSlug;data.quantity=1;data.shippingAddress={name:data.name,street1:data.street1,street2:data.street2,city:data.city,stateCode:data.stateCode.toUpperCase(),postcode:data.postcode,countryCode:data.countryCode.toUpperCase(),phoneNumber:data.phoneNumber};try{const quoteResponse=await fetch('/paperback/quote',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)});const quote=await quoteResponse.json();if(!quoteResponse.ok)throw new Error((quote.errors||[quote.message||'Unable to calculate shipping.']).join(' '));result.textContent='Shipping: '+(quote.shipping.cents/100).toFixed(2)+' '+quote.shipping.currency+'. Opening secure checkout…';const checkoutResponse=await fetch('/paperback/checkout',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({quoteId:quote.quoteId})});const checkout=await checkoutResponse.json();if(!checkoutResponse.ok)throw new Error(checkout.message||'Unable to create checkout.');location.assign(checkout.checkoutUrl);}catch(error){result.className='error';result.textContent=error.message;button.disabled=false;}});
  </script></body></html>`;
}

function providerError(error, request, env, action) {
  const code = error.code || "provider_error";
  const status = code.startsWith("lulu_4") || code.startsWith("stripe_4") ? 422 : 502;
  log(`${action}_failed`, { code });
  return json({ ok: false, code, message: error.message || "The print service could not complete this request." }, status, cors(request, env));
}

async function serveAsset(request, env, pathname) {
  const assetKey = decodeURIComponent(pathname.slice("/lulu-assets/".length));
  if (!assetKey || assetKey.includes("..") || !assetKey.startsWith("paperback/")) return new Response("Not found", { status: 404 });
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
    if (request.method === "GET" && url.pathname === "/health") return json({ ok: true, paperbackSalesEnabled: productionSalesEnabled(env), environment: env.PAPERBACK_ENVIRONMENT });
    if (request.method === "GET" && url.pathname === "/public-config") {
      const book = getBook(url.searchParams.get("bookSlug"));
      return json({ enabled: Boolean(book && productionSalesEnabled(env)), checkoutUrl: book && productionSalesEnabled(env) ? `${env.PAPERBACK_BASE_URL.replace(/\/$/, "")}/paperback/checkout?bookSlug=${encodeURIComponent(book.slug)}` : null }, 200, cors(request, env));
    }
    if (request.method === "GET" && url.pathname === "/paperback/checkout") {
      const book = getBook(url.searchParams.get("bookSlug"));
      if (!book || !productionSalesEnabled(env)) return new Response("Not found", { status: 404 });
      return new Response(renderCheckoutPage(book, env), { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
    }
    if (request.method === "GET" && url.pathname.startsWith("/lulu-assets/")) return serveAsset(request, env, url.pathname);
    if (request.method === "POST" && url.pathname === "/paperback/quote") return createQuote(request, env);
    if (request.method === "POST" && url.pathname === "/paperback/checkout") return createCheckout(request, env);
    if (request.method === "POST" && url.pathname === "/webhooks/stripe") return stripeWebhook(request, env);
    return json({ ok: false, code: "not_found" }, 404);
  },
  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(pollStatuses(env));
  }
};

export { createQuote, createCheckout, stripeWebhook, pollStatuses, quoteFromRow, orderFromRow };
