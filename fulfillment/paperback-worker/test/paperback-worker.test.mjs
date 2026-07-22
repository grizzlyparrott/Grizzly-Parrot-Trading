import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { getBook, getStripePriceId, POD_PACKAGE_ID, SHIPPING_OPTIONS } from "../src/catalog.mjs";
import { validateCheckoutRequest, addressesMatch } from "../src/validation.mjs";
import { hmacHex, verifyStripeSignature, signedAssetUrl, verifyAssetRequest } from "../src/crypto.mjs";
import { LuluClient, shippingCents } from "../src/lulu.mjs";
import { StripeClient } from "../src/stripe.mjs";
import { OrderStore } from "../src/order-store.mjs";
import worker, { allowedCountries, digitalPurchaseFromSession, luluStatusFromJob, productionReadiness, stripeWebhook, suggestedAddressDiffers } from "../src/index.mjs";

const validAddress = {
  name: "Test Reader",
  street1: "123 Test Street",
  street2: "",
  city: "Raleigh",
  stateCode: "NC",
  postcode: "27601",
  countryCode: "US",
  phoneNumber: "+1 919 555 0100"
};

test("all three paperback products map to the real Lulu paperback projects and one exact POD package", () => {
  const expected = {
    "currency-market-structure": "84mdgqe",
    "metals-market-structure": "dy4ewg4",
    "equity-market-structure": "zmnedzn"
  };
  for (const [slug, projectId] of Object.entries(expected)) {
    const book = getBook(slug);
    assert.equal(book.luluPublishingProjectId, projectId);
    assert.equal(book.podPackageId, POD_PACKAGE_ID);
    assert.equal(book.priceCents, 3900);
    assert.match(book.assets.interiorMd5, /^[A-F0-9]{32}$/);
    assert.match(book.assets.coverMd5, /^[A-F0-9]{32}$/);
  }
  assert.deepEqual(Object.keys(SHIPPING_OPTIONS), ["MAIL", "PRIORITY_MAIL", "EXPEDITED", "EXPRESS"]);
});

test("checkout address validation rejects missing carrier-required phone numbers and accepts a valid address", () => {
  const invalid = validateCheckoutRequest({ bookSlug: "currency-market-structure", buyerEmail: "reader@example.com", shippingAddress: { ...validAddress, phoneNumber: "" } });
  assert.equal(invalid.ok, false);
  assert.match(invalid.errors.join(" "), /phone number/i);
  const valid = validateCheckoutRequest({ buyerEmail: "Reader@Example.com", quantity: 2, shippingAddress: validAddress });
  assert.equal(valid.ok, true);
  assert.equal(valid.buyerEmail, "reader@example.com");
  assert.equal(valid.quantity, 2);
});

test("production shipping countries require an explicit valid allowlist", () => {
  assert.deepEqual(allowedCountries({ PAPERBACK_ALLOWED_COUNTRIES: "US, ca,US,invalid" }), ["US", "CA"]);
  assert.deepEqual(allowedCountries({ PAPERBACK_ALLOWED_COUNTRIES: "" }), []);
  assert.deepEqual(productionReadiness({ PAPERBACK_STRIPE_TAX_ENABLED: "pending" }), {
    proofsApproved: false,
    policiesApproved: false,
    shippingCountriesConfigured: false,
    allowedCountries: [],
    stripeTaxDecision: "pending"
  });
});

test("Stripe address comparison prevents fulfillment when Checkout address differs from the quoted address", () => {
  assert.equal(addressesMatch(validAddress, { name: "Test Reader", phone: "+1 919 555 0100", address: { line1: "123 Test Street", line2: "", city: "Raleigh", state: "NC", postal_code: "27601", country: "US" } }), true);
  assert.equal(addressesMatch({ ...validAddress, street1: "123 Test St." }, { name: "Test Reader", phone: "+1 919 555 0100", address: { line1: "123 Test Street", line2: "", city: "Raleigh", state: "NC", postal_code: "27601", country: "US" } }), true);
  assert.equal(addressesMatch({ ...validAddress, postcode: "27601-1234" }, { name: "Test Reader", phone: "+1 919 555 0100", address: { line1: "123 Test Street", line2: "", city: "Raleigh", state: "NC", postal_code: "27601", country: "US" } }), true);
  assert.equal(addressesMatch(validAddress, { name: "Test Reader", address: { line1: "999 Other Street", city: "Raleigh", state: "NC", postal_code: "27601", country: "US" } }), false);
  assert.equal(addressesMatch(validAddress, { name: "Test Reader", address: { line1: "123 Test Street", city: "Raleigh", state: "NC", postal_code: "99999", country: "US" } }), false);
});

test("Lulu postal normalization only pauses checkout when it materially changes the address", () => {
  const sameAddress = {
    street1: "123 Test Street",
    street2: "",
    city: "Raleigh",
    state_code: "NC",
    postcode: "27601",
    country_code: "US"
  };
  assert.equal(suggestedAddressDiffers(validAddress, sameAddress), false);
  assert.equal(suggestedAddressDiffers({ ...validAddress, street1: "123 Test St." }, { ...sameAddress, street1: "123 Test Street" }), false);
  assert.equal(suggestedAddressDiffers({ ...validAddress, postcode: "27601-1234" }, sameAddress), false);
  assert.equal(suggestedAddressDiffers(validAddress, { ...sameAddress, street1: "125 Test Street" }), true);
});

test("Lulu object statuses are normalized before they are saved to D1", () => {
  assert.equal(luluStatusFromJob({ status: "CREATED" }), "CREATED");
  assert.equal(luluStatusFromJob({ status: { name: "UNPAID" } }), "UNPAID");
  assert.equal(luluStatusFromJob({ print_job_status: { value: "SHIPPED" } }), "SHIPPED");
  assert.equal(luluStatusFromJob({}), "CREATED");
});

test("Stripe webhook HMAC verification accepts a current signed payload and rejects a tampered one", async () => {
  const payload = JSON.stringify({ id: "evt_test", type: "checkout.session.completed" });
  const timestamp = Math.floor(Date.now() / 1000);
  const secret = "whsec_test_secret";
  const signature = await hmacHex(secret, `${timestamp}.${payload}`);
  assert.equal(await verifyStripeSignature(payload, `t=${timestamp},v1=${signature}`, secret), true);
  assert.equal(await verifyStripeSignature(`${payload}x`, `t=${timestamp},v1=${signature}`, secret), false);
});

test("digital purchases map only paid $29 Checkout Sessions from the three configured Payment Links", () => {
  const env = {
    STRIPE_PAYMENT_LINK_CURRENCY_DIGITAL: "plink_currency",
    STRIPE_PAYMENT_LINK_METALS_DIGITAL: "plink_metals",
    STRIPE_PAYMENT_LINK_EQUITY_DIGITAL: "plink_equity"
  };
  const base = { id: "cs_live_paid", mode: "payment", payment_status: "paid", amount_total: 2900, currency: "usd" };
  assert.equal(digitalPurchaseFromSession({ ...base, payment_link: "plink_currency" }, env).eventLabel, "currency_market_structure");
  assert.equal(digitalPurchaseFromSession({ ...base, payment_link: "plink_metals" }, env).eventLabel, "metals_market_structure");
  assert.equal(digitalPurchaseFromSession({ ...base, payment_link: "plink_equity" }, env).eventLabel, "equity_market_structure");
  assert.equal(digitalPurchaseFromSession({ ...base, payment_status: "unpaid", payment_link: "plink_currency" }, env), null);
  assert.equal(digitalPurchaseFromSession({ ...base, amount_total: 2800, payment_link: "plink_currency" }, env), null);
  assert.equal(digitalPurchaseFromSession({ ...base, payment_link: "plink_other" }, env), null);
});

test("one signed, paid Stripe event is accepted for each digital title without entering paperback fulfillment", async () => {
  const purchases = new Map();
  const db = {
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async run() {
              if (!sql.includes("INSERT OR IGNORE INTO digital_purchase_conversions")) {
                throw new Error(`Digital test unexpectedly entered paperback SQL: ${sql}`);
              }
              if (purchases.has(args[0])) return { meta: { changes: 0 } };
              purchases.set(args[0], {
                stripe_session_id: args[0],
                stripe_event_id: args[1],
                stripe_payment_link_id: args[2],
                event_label: args[3],
                amount_total: args[4],
                currency: args[5]
              });
              return { meta: { changes: 1 } };
            }
          };
        }
      };
    }
  };
  const secret = "whsec_digital_test";
  const env = {
    STRIPE_WEBHOOK_SECRET: secret,
    STRIPE_PAYMENT_LINK_CURRENCY_DIGITAL: "plink_currency",
    STRIPE_PAYMENT_LINK_METALS_DIGITAL: "plink_metals",
    STRIPE_PAYMENT_LINK_EQUITY_DIGITAL: "plink_equity",
    PAPERBACK_ORDERS: db
  };
  const cases = [
    ["currency", "plink_currency", "currency_market_structure"],
    ["metals", "plink_metals", "metals_market_structure"],
    ["equity", "plink_equity", "equity_market_structure"]
  ];

  for (const [slug, paymentLink, eventLabel] of cases) {
    const event = {
      id: `evt_${slug}`,
      type: "checkout.session.completed",
      data: { object: {
        id: `cs_test_${slug}`,
        mode: "payment",
        payment_status: "paid",
        amount_total: 2900,
        currency: "usd",
        payment_link: paymentLink
      } }
    };
    const payload = JSON.stringify(event);
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = await hmacHex(secret, `${timestamp}.${payload}`);
    const response = await stripeWebhook(new Request("https://paperback-api.example.com/webhooks/stripe", {
      method: "POST",
      headers: { "stripe-signature": `t=${timestamp},v1=${signature}` },
      body: payload
    }), env);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true, digitalPurchase: true, duplicate: false });
    assert.equal(purchases.get(`cs_test_${slug}`).event_label, eventLabel);
  }
  assert.equal(purchases.size, 3);
});

test("a verified digital Stripe session can be claimed for Microsoft UET only once", async () => {
  const purchases = new Map();
  const db = {
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async run() {
              if (sql.includes("INSERT OR IGNORE INTO digital_purchase_conversions")) {
                if (purchases.has(args[0])) return { meta: { changes: 0 } };
                purchases.set(args[0], {
                  stripe_session_id: args[0], stripe_event_id: args[1], stripe_payment_link_id: args[2],
                  event_label: args[3], amount_total: args[4], currency: args[5], verified_at: args[6], claimed_at: null
                });
                return { meta: { changes: 1 } };
              }
              if (sql.includes("UPDATE digital_purchase_conversions")) {
                const purchase = purchases.get(args[1]);
                if (!purchase || purchase.claimed_at) return { meta: { changes: 0 } };
                purchase.claimed_at = args[0];
                return { meta: { changes: 1 } };
              }
              throw new Error(`Unexpected SQL: ${sql}`);
            },
            async first() {
              if (!sql.includes("SELECT * FROM digital_purchase_conversions")) throw new Error(`Unexpected SQL: ${sql}`);
              return purchases.get(args[0]) || null;
            }
          };
        }
      };
    }
  };
  const store = new OrderStore(db);
  const purchase = {
    stripeSessionId: "cs_test_currency", stripeEventId: "evt_currency", stripePaymentLinkId: "plink_currency",
    eventLabel: "currency_market_structure", amountTotal: 2900, currency: "usd", verifiedAt: "2026-07-21T12:00:00.000Z"
  };
  assert.equal(await store.insertDigitalPurchase(purchase), true);
  assert.equal(await store.insertDigitalPurchase(purchase), false);
  assert.equal((await store.claimDigitalConversion(purchase.stripeSessionId, "2026-07-21T12:01:00.000Z")).status, "claimed");
  assert.equal((await store.claimDigitalConversion(purchase.stripeSessionId, "2026-07-21T12:02:00.000Z")).status, "duplicate");
});

test("ordinary page visits cannot claim or emit a digital purchase conversion", async () => {
  const env = { PAPERBACK_ALLOWED_ORIGIN: "https://grizzlyparrottrading.com" };
  const getResponse = await worker.fetch(new Request("https://paperback-api.example.com/digital-conversion/claim?sessionId=cs_test_visit"), env);
  assert.equal(getResponse.status, 404);
  const confirmation = await readFile(new URL("../../../books/digital-purchase-confirmation.html", import.meta.url), "utf8");
  assert.match(confirmation, /if \(!sessionId\)/);
  assert.match(confirmation, /data\.track === true/);
  assert.doesNotMatch(confirmation, /addEventListener\(['"]load['"].*purchase/s);
});

test("print asset source URLs are time-limited and cannot be used after expiry", async () => {
  const now = Date.UTC(2026, 6, 20, 12, 0, 0);
  const url = new URL(await signedAssetUrl("https://paperback-api.example.com", "paperback/currency-market-structure/interior.pdf", "asset-secret", now));
  assert.equal(await verifyAssetRequest("paperback/currency-market-structure/interior.pdf", url.searchParams.get("expires"), url.searchParams.get("sig"), "asset-secret", now), true);
  assert.equal(await verifyAssetRequest("paperback/currency-market-structure/interior.pdf", url.searchParams.get("expires"), url.searchParams.get("sig"), "asset-secret", now + 25 * 60 * 60 * 1000), false);
});

test("Lulu quote and print-job payload use its API package and hosted PDFs, not a publishing-project ID", async () => {
  const requests = [];
  const fakeFetch = async (url, init) => {
    requests.push({ url, init });
    if (url.includes("openid-connect/token")) return new Response(JSON.stringify({ access_token: "sandbox-token" }), { status: 200 });
    if (url.endsWith("/print-job-cost-calculations/")) return new Response(JSON.stringify({ currency: "USD", shipping_cost: { total_cost_incl_tax: "7.42" } }), { status: 201 });
    if (url.endsWith("/print-jobs/")) return new Response(JSON.stringify({ id: "sandbox-job-123", status: "CREATED" }), { status: 201 });
    if (url.endsWith("/print-jobs/sandbox-job-123/status/")) return new Response(JSON.stringify({ name: "CREATED" }), { status: 200 });
    throw new Error(`Unexpected URL ${url}`);
  };
  const env = {
    PAPERBACK_ENVIRONMENT: "sandbox",
    LULU_CLIENT_KEY: "sandbox-key",
    LULU_CLIENT_SECRET: "sandbox-secret",
    PAPERBACK_BASE_URL: "https://paperback-api.example.com",
    PAPERBACK_ASSET_SIGNING_SECRET: "asset-secret",
    SHOP_CONTACT_EMAIL: "orders@example.com"
  };
  const client = new LuluClient(env, fakeFetch);
  const book = getBook("currency-market-structure");
  const quote = await client.quote({ book, quantity: 1, address: validAddress, shippingOption: "MAIL" });
  assert.equal(shippingCents(quote), 742);
  const job = await client.createPrintJob({ book, quantity: 1, address: validAddress, shippingOption: "MAIL", externalId: "gpt_cs_test" });
  assert.equal(job.id, "sandbox-job-123");
  const status = await client.status(job.id);
  assert.equal(status.name, "CREATED");
  const jobRequest = requests.find((request) => request.url.endsWith("/print-jobs/"));
  const payload = JSON.parse(jobRequest.init.body);
  assert.equal(payload.external_id, "gpt_cs_test");
  assert.equal(payload.line_items[0].title, book.title);
  assert.equal(payload.line_items[0].pod_package_id, POD_PACKAGE_ID);
  const quoteRequest = requests.find((request) => request.url.endsWith("/print-job-cost-calculations/"));
  const quotePayload = JSON.parse(quoteRequest.init.body);
  assert.equal(quotePayload.line_items[0].page_count, book.interiorPages);
  assert.equal(payload.line_items[0].interior.source_md5sum, book.assets.interiorMd5);
  assert.equal(payload.line_items[0].cover.source_md5sum, book.assets.coverMd5);
  assert.equal(JSON.stringify(payload).includes(book.luluPublishingProjectId), false);
  assert.ok(requests.some((request) => request.url.endsWith("/print-jobs/sandbox-job-123/status/")));
});

test("test checkout creates a Stripe Checkout Session with customer address collection and calculated shipping", async () => {
  let request;
  const fakeFetch = async (_url, init) => {
    request = init;
    return new Response(JSON.stringify({ id: "cs_test_paperback", url: "https://checkout.stripe.test/session" }), { status: 200 });
  };
  const env = {
    STRIPE_SECRET_KEY: "sk_test_example",
    PAPERBACK_SUCCESS_URL: "https://example.com/success",
    PAPERBACK_CANCEL_URL: "https://example.com/cancel",
    PAPERBACK_STRIPE_TAX_ENABLED: "true"
  };
  const book = getBook("equity-market-structure");
  const quote = { quoteId: "quote-123", quantity: 1, shippingCents: 742, currency: "USD", shippingOption: "MAIL", address: validAddress };
  const priceId = getStripePriceId(book, { STRIPE_PRICE_EQUITY_PAPERBACK: "price_test_equity" });
  const session = await new StripeClient(env, fakeFetch).createCheckoutSession({ book, quote, priceId, customerEmail: "reader@example.com" });
  assert.equal(session.id, "cs_test_paperback");
  const form = new URLSearchParams(request.body);
  assert.equal(form.get("line_items[0][price]"), "price_test_equity");
  assert.equal(form.get("shipping_address_collection[allowed_countries][0]"), "US");
  assert.equal(form.get("shipping_options[0][shipping_rate_data][fixed_amount][amount]"), "742");
  assert.equal(form.get("automatic_tax[enabled]"), "true");
  assert.equal(form.get("shipping_options[0][shipping_rate_data][tax_behavior]"), "exclusive");
  assert.equal(form.get("shipping_options[0][shipping_rate_data][tax_code]"), "txcd_92010001");
  assert.equal(form.get("metadata[checkout_mode]"), "unknown");
  assert.equal(request.headers["Idempotency-Key"], "paperback-checkout-quote-123");
});

test("order store reports duplicate Stripe session insertion instead of submitting a second print order", async () => {
  const sessions = new Set();
  const db = {
    prepare() {
      return {
        bind(...args) {
          return {
            async run() {
              const sessionId = args[0];
              if (sessions.has(sessionId)) return { meta: { changes: 0 } };
              sessions.add(sessionId);
              return { meta: { changes: 1 } };
            }
          };
        }
      };
    }
  };
  const store = new OrderStore(db);
  const order = { stripeSessionId: "cs_duplicate", stripeEventId: "evt_duplicate", quoteId: "quote", bookSlug: "currency-market-structure", quantity: 1, buyerEmail: "reader@example.com", address: validAddress, shippingOption: "MAIL", shippingCents: 742, currency: "USD", customerTotalCents: 4642, now: "2026-07-20T12:00:00.000Z" };
  assert.equal(await store.insertPaidOrder(order), true);
  assert.equal(await store.insertPaidOrder(order), false);
});

test("default deployment is unable to sell paperbacks and reports sales disabled", async () => {
  const response = await worker.fetch(new Request("https://paperback-api.example.com/health"), { PAPERBACK_SALES_ENABLED: "false", PAPERBACK_ENVIRONMENT: "sandbox" });
  assert.deepEqual(await response.json(), {
    ok: true,
    paperbackSalesEnabled: false,
    privateOrderEnabled: false,
    environment: "sandbox",
    readiness: {
      proofsApproved: false,
      policiesApproved: false,
      shippingCountriesConfigured: false,
      allowedCountries: [],
      stripeTaxDecision: "pending"
    }
  });
  const configResponse = await worker.fetch(new Request("https://paperback-api.example.com/public-config?bookSlug=currency-market-structure"), {
    PAPERBACK_SALES_ENABLED: "false",
    PAPERBACK_ENVIRONMENT: "sandbox"
  });
  assert.deepEqual(await configResponse.json(), { enabled: false, checkoutUrl: null });
  const checkoutResponse = await worker.fetch(new Request("https://paperback-api.example.com/paperback/checkout?bookSlug=currency-market-structure"), {
    PAPERBACK_SALES_ENABLED: "false",
    PAPERBACK_ENVIRONMENT: "sandbox"
  });
  assert.equal(checkoutResponse.status, 404);
});

test("a public paperback checkout exists only after every explicit production prerequisite is set", async () => {
  const env = {
    PAPERBACK_ENVIRONMENT: "production",
    PAPERBACK_SALES_ENABLED: "true",
    PAPERBACK_PROOFS_APPROVED: "true",
    PAPERBACK_POLICIES_APPROVED: "true",
    PAPERBACK_ALLOWED_COUNTRIES: "US",
    PAPERBACK_STRIPE_TAX_ENABLED: "false",
    PAPERBACK_BASE_URL: "https://grizzly-parrot-paperback.example.workers.dev"
  };
  const configResponse = await worker.fetch(new Request("https://grizzly-parrot-paperback.example.workers.dev/public-config?bookSlug=metals-market-structure"), env);
  assert.deepEqual(await configResponse.json(), {
    enabled: true,
    checkoutUrl: "https://grizzly-parrot-paperback.example.workers.dev/paperback/checkout?bookSlug=metals-market-structure"
  });
  const checkoutResponse = await worker.fetch(new Request("https://grizzly-parrot-paperback.example.workers.dev/paperback/checkout?bookSlug=metals-market-structure"), env);
  assert.equal(checkoutResponse.status, 200);
  assert.match(await checkoutResponse.text(), /Calculate shipping and continue/);
});

test("the private live-order page can open while every public paperback stays disabled", async () => {
  const env = {
    PAPERBACK_ENVIRONMENT: "production",
    PAPERBACK_SALES_ENABLED: "false",
    PAPERBACK_PRIVATE_ORDER_ENABLED: "true",
    PAPERBACK_PRIVATE_ORDER_TOKEN: "private-launch-token",
    PAPERBACK_PROOFS_APPROVED: "true",
    PAPERBACK_POLICIES_APPROVED: "true",
    PAPERBACK_ALLOWED_COUNTRIES: "US",
    PAPERBACK_STRIPE_TAX_ENABLED: "false",
    PAPERBACK_BASE_URL: "https://grizzly-parrot-paperback.example.workers.dev"
  };
  const publicConfig = await worker.fetch(new Request("https://grizzly-parrot-paperback.example.workers.dev/public-config?bookSlug=currency-market-structure"), env);
  assert.deepEqual(await publicConfig.json(), { enabled: false, checkoutUrl: null });
  const privatePage = await worker.fetch(new Request("https://grizzly-parrot-paperback.example.workers.dev/paperback/private-order?bookSlug=currency-market-structure"), env);
  assert.equal(privatePage.status, 200);
  const html = await privatePage.text();
  assert.match(html, /Private order token/);
  assert.match(html, /x-paperback-private-token/);
  const unauthorizedQuote = await worker.fetch(new Request("https://grizzly-parrot-paperback.example.workers.dev/paperback/quote", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}"
  }), env);
  assert.equal(unauthorizedQuote.status, 403);
});

test("a pending tax decision keeps public checkout disabled even if the sales switch is true", async () => {
  const env = {
    PAPERBACK_ENVIRONMENT: "production",
    PAPERBACK_SALES_ENABLED: "true",
    PAPERBACK_PROOFS_APPROVED: "true",
    PAPERBACK_POLICIES_APPROVED: "true",
    PAPERBACK_ALLOWED_COUNTRIES: "US",
    PAPERBACK_STRIPE_TAX_ENABLED: "pending",
    PAPERBACK_BASE_URL: "https://grizzly-parrot-paperback.example.workers.dev"
  };
  const response = await worker.fetch(new Request("https://grizzly-parrot-paperback.example.workers.dev/public-config?bookSlug=equity-market-structure"), env);
  assert.deepEqual(await response.json(), { enabled: false, checkoutUrl: null });
});

test("all three public paperback buttons remain disconnected", async () => {
  const pages = [
    "currency-market-structure/index.html",
    "metals-market-structure/index.html",
    "equity-market-structure/index.html"
  ];
  for (const page of pages) {
    const html = await readFile(new URL(`../../../books/${page}`, import.meta.url), "utf8");
    assert.match(html, /var paperbackCheckoutUrl = "";/);
    assert.match(html, /button-disabled js-paperback-buy/);
    assert.match(html, /event\.preventDefault\(\);/);
    assert.match(html, /public-config\?bookSlug=/);
    assert.match(html, /grizzly-parrot-paperback\.grizzlyparrott04\.workers\.dev/);
    assert.match(html, /Safe default: the paperback button remains disabled/);
  }
});
