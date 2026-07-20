import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { getBook, getStripePriceId, POD_PACKAGE_ID } from "../src/catalog.mjs";
import { validateCheckoutRequest, addressesMatch } from "../src/validation.mjs";
import { hmacHex, verifyStripeSignature, signedAssetUrl, verifyAssetRequest } from "../src/crypto.mjs";
import { LuluClient, shippingCents } from "../src/lulu.mjs";
import { StripeClient } from "../src/stripe.mjs";
import { OrderStore } from "../src/order-store.mjs";
import worker from "../src/index.mjs";

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

test("Stripe address comparison prevents fulfillment when Checkout address differs from the quoted address", () => {
  assert.equal(addressesMatch(validAddress, { name: "Test Reader", phone: "+1 919 555 0100", address: { line1: "123 Test Street", line2: "", city: "Raleigh", state: "NC", postal_code: "27601", country: "US" } }), true);
  assert.equal(addressesMatch(validAddress, { name: "Test Reader", address: { line1: "999 Other Street", city: "Raleigh", state: "NC", postal_code: "27601", country: "US" } }), false);
});

test("Stripe webhook HMAC verification accepts a current signed payload and rejects a tampered one", async () => {
  const payload = JSON.stringify({ id: "evt_test", type: "checkout.session.completed" });
  const timestamp = Math.floor(Date.now() / 1000);
  const secret = "whsec_test_secret";
  const signature = await hmacHex(secret, `${timestamp}.${payload}`);
  assert.equal(await verifyStripeSignature(payload, `t=${timestamp},v1=${signature}`, secret), true);
  assert.equal(await verifyStripeSignature(`${payload}x`, `t=${timestamp},v1=${signature}`, secret), false);
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
  const quote = await client.quote({ book, quantity: 1, address: validAddress, shippingOption: "GROUND" });
  assert.equal(shippingCents(quote), 742);
  const job = await client.createPrintJob({ book, quantity: 1, address: validAddress, shippingOption: "GROUND", externalId: "gpt_cs_test" });
  assert.equal(job.id, "sandbox-job-123");
  const jobRequest = requests.find((request) => request.url.endsWith("/print-jobs/"));
  const payload = JSON.parse(jobRequest.init.body);
  assert.equal(payload.external_id, "gpt_cs_test");
  assert.equal(payload.line_items[0].pod_package_id, POD_PACKAGE_ID);
  assert.equal(payload.line_items[0].interior.source_md5sum, book.assets.interiorMd5);
  assert.equal(payload.line_items[0].cover.source_md5sum, book.assets.coverMd5);
  assert.equal(JSON.stringify(payload).includes(book.luluPublishingProjectId), false);
});

test("test checkout creates a Stripe Checkout Session with customer address collection and calculated shipping", async () => {
  let request;
  const fakeFetch = async (_url, init) => {
    request = init;
    return new Response(JSON.stringify({ id: "cs_test_paperback", url: "https://checkout.stripe.test/session" }), { status: 200 });
  };
  const env = { STRIPE_SECRET_KEY: "sk_test_example", PAPERBACK_SUCCESS_URL: "https://example.com/success", PAPERBACK_CANCEL_URL: "https://example.com/cancel" };
  const book = getBook("equity-market-structure");
  const quote = { quoteId: "quote-123", quantity: 1, shippingCents: 742, currency: "USD", shippingOption: "GROUND", address: validAddress };
  const priceId = getStripePriceId(book, { STRIPE_PRICE_EQUITY_PAPERBACK: "price_test_equity" });
  const session = await new StripeClient(env, fakeFetch).createCheckoutSession({ book, quote, priceId, customerEmail: "reader@example.com" });
  assert.equal(session.id, "cs_test_paperback");
  const form = new URLSearchParams(request.body);
  assert.equal(form.get("line_items[0][price]"), "price_test_equity");
  assert.equal(form.get("shipping_address_collection[allowed_countries][0]"), "US");
  assert.equal(form.get("shipping_options[0][shipping_rate_data][fixed_amount][amount]"), "742");
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
  const order = { stripeSessionId: "cs_duplicate", stripeEventId: "evt_duplicate", quoteId: "quote", bookSlug: "currency-market-structure", quantity: 1, buyerEmail: "reader@example.com", address: validAddress, shippingOption: "GROUND", shippingCents: 742, currency: "USD", customerTotalCents: 4642, now: "2026-07-20T12:00:00.000Z" };
  assert.equal(await store.insertPaidOrder(order), true);
  assert.equal(await store.insertPaidOrder(order), false);
});

test("default deployment is unable to sell paperbacks and reports sales disabled", async () => {
  const response = await worker.fetch(new Request("https://paperback-api.example.com/health"), { PAPERBACK_SALES_ENABLED: "false", PAPERBACK_ENVIRONMENT: "sandbox" });
  assert.deepEqual(await response.json(), { ok: true, paperbackSalesEnabled: false, environment: "sandbox" });
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

test("a public paperback checkout exists only after both explicit production gates are set", async () => {
  const env = {
    PAPERBACK_ENVIRONMENT: "production",
    PAPERBACK_SALES_ENABLED: "true",
    PAPERBACK_BASE_URL: "https://paperback-api.grizzlyparrottrading.com"
  };
  const configResponse = await worker.fetch(new Request("https://paperback-api.grizzlyparrottrading.com/public-config?bookSlug=metals-market-structure"), env);
  assert.deepEqual(await configResponse.json(), {
    enabled: true,
    checkoutUrl: "https://paperback-api.grizzlyparrottrading.com/paperback/checkout?bookSlug=metals-market-structure"
  });
  const checkoutResponse = await worker.fetch(new Request("https://paperback-api.grizzlyparrottrading.com/paperback/checkout?bookSlug=metals-market-structure"), env);
  assert.equal(checkoutResponse.status, 200);
  assert.match(await checkoutResponse.text(), /Calculate shipping and continue/);
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
    assert.match(html, /Safe default: the paperback button remains disabled/);
  }
});
