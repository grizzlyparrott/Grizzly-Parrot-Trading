import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { getBook, getStripePriceId, catalogReady, POD_PACKAGE_ID, HARDCOVER_POD_PACKAGE_ID, PRINT_EDITIONS, PROBABILISTIC_EXECUTION_PRINT_EDITIONS, ALL_PRINT_EDITIONS, SHIPPING_OPTIONS } from "../src/catalog.mjs";
import { validateCheckoutRequest, addressesMatch } from "../src/validation.mjs";
import { hmacHex, verifyStripeSignature, signedAssetUrl, verifyAssetRequest } from "../src/crypto.mjs";
import { LuluClient, shippingCents } from "../src/lulu.mjs";
import { StripeClient } from "../src/stripe.mjs";
import { DEFAULT_INTERNATIONAL_COUNTRIES, countryMatchesFlatRegion, flatShippingConfig, flatShippingSelection } from "../src/flat-shipping.mjs";
import { OrderStore } from "../src/order-store.mjs";
import worker, { allowedCountries, digitalCheckoutConfig, digitalPurchaseFromSession, flatOrderFromSession, luluStatusFromJob, productionReadiness, productionSalesEnabled, sendEmail, stripeWebhook, suggestedAddressDiffers } from "../src/index.mjs";

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

test("transactional email replies route to the monitored shop mailbox", async () => {
  let requestBody;
  const fakeFetch = async (_url, init) => {
    requestBody = JSON.parse(init.body);
    return new Response(null, { status: 200 });
  };
  await sendEmail({
    RESEND_API_KEY: "re_test",
    EMAIL_FROM: "Grizzly Parrot Trading <orders@example.com>",
    SHOP_CONTACT_EMAIL: "working@example.net"
  }, {
    to: "reader@example.org",
    subject: "Order received",
    html: "<p>Thanks.</p>"
  }, fakeFetch);
  assert.equal(requestBody.from, "Grizzly Parrot Trading <orders@example.com>");
  assert.equal(requestBody.reply_to, "working@example.net");
});

test("all established print editions map to their approved Lulu projects, packages, prices, and source files", () => {
  const expected = {
    "currency-market-structure": ["84mdgqe", POD_PACKAGE_ID, 3900],
    "metals-market-structure": ["dy4ewg4", POD_PACKAGE_ID, 3900],
    "equity-market-structure": ["zmnedzn", POD_PACKAGE_ID, 3900],
    "currency-market-structure-hardcover": ["w4g2den", HARDCOVER_POD_PACKAGE_ID, 4900],
    "metals-market-structure-hardcover": ["dy4ewd4", HARDCOVER_POD_PACKAGE_ID, 4900],
    "equity-market-structure-hardcover": ["w4g2dgr", HARDCOVER_POD_PACKAGE_ID, 4900]
  };
  for (const [slug, [projectId, podPackageId, priceCents]] of Object.entries(expected)) {
    const book = getBook(slug);
    assert.equal(book.luluPublishingProjectId, projectId);
    assert.equal(book.podPackageId, podPackageId);
    assert.equal(book.priceCents, priceCents);
    assert.match(book.assets.interiorMd5, /^[A-F0-9]{32}$/);
    assert.match(book.assets.coverMd5, /^[A-F0-9]{32}$/);
  }
  assert.equal(Object.keys(PRINT_EDITIONS).length, 8);
  assert.equal(getBook("currency-market-structure", "hardcover").slug, "currency-market-structure-hardcover");
  assert.deepEqual(Object.keys(SHIPPING_OPTIONS), ["MAIL", "PRIORITY_MAIL", "EXPEDITED", "EXPRESS"]);
});

test("Probabilistic Execution print checkout requires its independent direct-site approval and every production gate", async () => {
  assert.equal(Object.keys(PROBABILISTIC_EXECUTION_PRINT_EDITIONS).length, 2);
  assert.equal(Object.keys(ALL_PRINT_EDITIONS).length, 8);
  const stagedProjectIds = {
    paperback: "yvep5mw",
    hardcover: "7kz7vk8"
  };
  const stagedIsbns = {
    paperback: "978-0-557-95654-8",
    hardcover: "978-0-557-95653-1"
  };
  const stagedPrices = {
    paperback: 3900,
    hardcover: 4900
  };
  for (const edition of ["paperback", "hardcover"]) {
    const book = getBook("probabilistic-execution", edition);
    assert.equal(book.catalogStatus, "release-controlled");
    assert.equal(book.interiorPages, 148);
    assert.equal(book.luluPublishingProjectId, stagedProjectIds[edition]);
    assert.equal(book.isbn, stagedIsbns[edition]);
    assert.equal(book.priceCents, stagedPrices[edition]);
    assert.equal(catalogReady(book), true);
    const configured = {
      PAPERBACK_ENVIRONMENT: "production",
      PAPERBACK_SALES_ENABLED: "true",
      HARDCOVER_SALES_ENABLED: "true",
      PAPERBACK_PROOFS_APPROVED: "true",
      HARDCOVER_PROOFS_APPROVED: "true",
      PAPERBACK_POLICIES_APPROVED: "true",
      PAPERBACK_ALLOWED_COUNTRIES: "US",
      PAPERBACK_STRIPE_TAX_ENABLED: "true",
      PROBABILISTIC_EXECUTION_PAPERBACK_FILES_VALIDATED: "true",
      PROBABILISTIC_EXECUTION_HARDCOVER_FILES_VALIDATED: "true",
      PROBABILISTIC_EXECUTION_PAPERBACK_PROOF_APPROVED: "false",
      PROBABILISTIC_EXECUTION_HARDCOVER_PROOF_APPROVED: "false",
      PROBABILISTIC_EXECUTION_PAPERBACK_DIRECT_SALES_APPROVED: "true",
      PROBABILISTIC_EXECUTION_HARDCOVER_DIRECT_SALES_APPROVED: "true",
      PROBABILISTIC_EXECUTION_PAPERBACK_SALES_ENABLED: "true",
      PROBABILISTIC_EXECUTION_HARDCOVER_SALES_ENABLED: "true",
      STRIPE_PRICE_PROBABILISTIC_PAPERBACK: "price_probabilistic_paperback",
      STRIPE_PRICE_PROBABILISTIC_HARDCOVER: "price_probabilistic_hardcover"
    };
    assert.equal(productionSalesEnabled(configured, book), true);
    assert.equal(getStripePriceId(book, configured), configured[book.priceEnv]);
    assert.equal(productionSalesEnabled({
      ...configured,
      [`PROBABILISTIC_EXECUTION_${edition.toUpperCase()}_DIRECT_SALES_APPROVED`]: "false",
      [`PROBABILISTIC_EXECUTION_${edition.toUpperCase()}_PROOF_APPROVED`]: "true"
    }, book), false);
  }

  const config = await worker.fetch(new Request("https://paperback-api.example.com/public-config?bookSlug=probabilistic-execution&edition=paperback"), {
    PAPERBACK_ENVIRONMENT: "production",
    PAPERBACK_SALES_ENABLED: "true",
    PAPERBACK_PROOFS_APPROVED: "true",
    PAPERBACK_POLICIES_APPROVED: "true",
    PAPERBACK_ALLOWED_COUNTRIES: "US",
    PAPERBACK_STRIPE_TAX_ENABLED: "true",
    PAPERBACK_BASE_URL: "https://paperback-api.example.com",
    PROBABILISTIC_EXECUTION_PAPERBACK_FILES_VALIDATED: "true",
    PROBABILISTIC_EXECUTION_PAPERBACK_DIRECT_SALES_APPROVED: "true",
    PROBABILISTIC_EXECUTION_PAPERBACK_SALES_ENABLED: "true"
  });
  assert.deepEqual(await config.json(), {
    enabled: true,
    checkoutUrl: "https://paperback-api.example.com/print/checkout?bookSlug=probabilistic-execution&edition=paperback",
    edition: "paperback",
    priceCents: 3900
  });
});

test("Probabilistic Execution digital checkout requires a matching Stripe ID, URL, and title-specific release flag", async () => {
  const configured = {
    PROBABILISTIC_EXECUTION_DIGITAL_SALES_ENABLED: "true",
    PROBABILISTIC_EXECUTION_DIGITAL_DELIVERY_ENABLED: "true",
    STRIPE_PAYMENT_LINK_PROBABILISTIC_DIGITAL: "plink_probabilistic123",
    STRIPE_CHECKOUT_URL_PROBABILISTIC_DIGITAL: "https://buy.stripe.com/abcprobabilistic123",
    RESEND_API_KEY: "re_test_delivery_key",
    DIGITAL_EMAIL_FROM: "Grizzly Parrot Trading <sales@example.com>",
    PRINT_ASSETS: { async get() { return null; } }
  };
  assert.deepEqual(digitalCheckoutConfig("probabilistic-execution", configured), {
    enabled: true,
    checkoutUrl: "https://buy.stripe.com/abcprobabilistic123",
    priceCents: 2900
  });
  assert.equal(digitalCheckoutConfig("probabilistic-execution", {...configured, PROBABILISTIC_EXECUTION_DIGITAL_SALES_ENABLED: "false"}).enabled, false);
  assert.equal(digitalCheckoutConfig("probabilistic-execution", {...configured, STRIPE_CHECKOUT_URL_PROBABILISTIC_DIGITAL: "https://example.com/not-stripe"}).enabled, false);
  assert.equal(digitalCheckoutConfig("probabilistic-execution", {...configured, STRIPE_CHECKOUT_URL_PROBABILISTIC_DIGITAL: "https://buy.stripe.com/"}).enabled, false);
  assert.equal(digitalCheckoutConfig("probabilistic-execution", {...configured, STRIPE_CHECKOUT_URL_PROBABILISTIC_DIGITAL: "https://buy.stripe.com/test_placeholder"}).enabled, false);
  assert.equal(digitalCheckoutConfig("probabilistic-execution", {...configured, STRIPE_PAYMENT_LINK_PROBABILISTIC_DIGITAL: "plink_test"}).enabled, false);
  assert.equal(digitalCheckoutConfig("another-book", configured), null);
});

test("the $69 trilogy checkout requires its own exact Stripe link and both bundle release gates", () => {
  const configured = {
    MARKET_STRUCTURE_TRILOGY_DIGITAL_SALES_ENABLED: "true",
    MARKET_STRUCTURE_TRILOGY_DIGITAL_DELIVERY_ENABLED: "true",
    STRIPE_PAYMENT_LINK_MARKET_STRUCTURE_TRILOGY_DIGITAL: "plink_trilogy123456",
    STRIPE_CHECKOUT_URL_MARKET_STRUCTURE_TRILOGY_DIGITAL: "https://buy.stripe.com/trilogy123456",
    RESEND_API_KEY: "re_test_delivery_key",
    DIGITAL_EMAIL_FROM: "Grizzly Parrot Trading <sales@example.com>",
    PRINT_ASSETS: { async get() { return null; } }
  };
  assert.deepEqual(digitalCheckoutConfig("market-structure-trilogy", configured), {
    enabled: true,
    checkoutUrl: "https://buy.stripe.com/trilogy123456",
    priceCents: 6900
  });
  assert.equal(digitalCheckoutConfig("market-structure-trilogy", {
    ...configured,
    MARKET_STRUCTURE_TRILOGY_DIGITAL_SALES_ENABLED: "false"
  }).enabled, false);
  assert.equal(digitalCheckoutConfig("market-structure-trilogy", {
    ...configured,
    MARKET_STRUCTURE_TRILOGY_DIGITAL_DELIVERY_ENABLED: "false"
  }).enabled, false);
  assert.equal(digitalCheckoutConfig("market-structure-trilogy", {
    ...configured,
    STRIPE_CHECKOUT_URL_MARKET_STRUCTURE_TRILOGY_DIGITAL: "https://example.com/not-stripe"
  }).enabled, false);
});

test("a release-keyed print edition cannot inherit another title's proof or sales approval", () => {
  const book = Object.freeze({
    ...getBook("currency-market-structure"),
    slug: "release-isolation-test",
    seriesSlug: "release-isolation-test",
    releaseKey: "RELEASE_ISOLATION_TEST"
  });
  const globalApproval = {
    PAPERBACK_ENVIRONMENT: "production",
    PAPERBACK_SALES_ENABLED: "true",
    PAPERBACK_PROOFS_APPROVED: "true",
    PAPERBACK_POLICIES_APPROVED: "true",
    PAPERBACK_ALLOWED_COUNTRIES: "US",
    PAPERBACK_STRIPE_TAX_ENABLED: "true"
  };
  assert.equal(productionSalesEnabled(globalApproval, book), false);
  assert.equal(productionSalesEnabled({
    ...globalApproval,
    RELEASE_ISOLATION_TEST_PAPERBACK_FILES_VALIDATED: "true",
    RELEASE_ISOLATION_TEST_PAPERBACK_DIRECT_SALES_APPROVED: "true",
    RELEASE_ISOLATION_TEST_PAPERBACK_SALES_ENABLED: "true"
  }, book), true);
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
    paperbackProofsApproved: false,
    hardcoverProofsApproved: false,
    policiesApproved: false,
    shippingCountriesConfigured: false,
    allowedCountries: [],
    stripeTaxDecision: "pending"
  });
});

test("flat shipping is exactly $7.49 U.S. and $19.99 across Lulu-supported international destinations", () => {
  const env = {
    PAPERBACK_FLAT_RATE_US_CENTS: "749",
    PAPERBACK_FLAT_RATE_INTERNATIONAL_CENTS: "1999"
  };
  const config = flatShippingConfig(env);
  assert.equal(config.enabled, true);
  assert.equal(config.currency, "USD");
  assert.equal(config.usCents, 749);
  assert.equal(config.internationalCents, 1999);
  assert.equal(config.internationalCountries, DEFAULT_INTERNATIONAL_COUNTRIES);
  assert.equal(DEFAULT_INTERNATIONAL_COUNTRIES.includes("CA"), true);
  assert.equal(DEFAULT_INTERNATIONAL_COUNTRIES.includes("GB"), true);
  assert.equal(DEFAULT_INTERNATIONAL_COUNTRIES.includes("JP"), true);
  assert.equal(DEFAULT_INTERNATIONAL_COUNTRIES.includes("US"), false);
  assert.equal(DEFAULT_INTERNATIONAL_COUNTRIES.includes("AC"), false);
  assert.equal(DEFAULT_INTERNATIONAL_COUNTRIES.includes("TA"), false);
  assert.equal(DEFAULT_INTERNATIONAL_COUNTRIES.includes("RU"), false);
  assert.equal(DEFAULT_INTERNATIONAL_COUNTRIES.includes("UA"), false);
  assert.equal(DEFAULT_INTERNATIONAL_COUNTRIES.includes("VE"), false);
  assert.deepEqual(flatShippingSelection(env, "us").countries, ["US"]);
  assert.equal(countryMatchesFlatRegion(env, "us", "US"), true);
  assert.equal(countryMatchesFlatRegion(env, "us", "CA"), false);
  assert.equal(countryMatchesFlatRegion(env, "international", "CA"), true);
  assert.equal(countryMatchesFlatRegion(env, "international", "US"), false);
  assert.equal(flatShippingConfig({...env, PAPERBACK_FLAT_RATE_US_CENTS: "7.49"}).enabled, false);
  assert.equal(flatShippingConfig({...env, PAPERBACK_FLAT_RATE_US_CENTS: "750"}).enabled, false);
  assert.equal(flatShippingConfig({...env, PAPERBACK_FLAT_RATE_INTERNATIONAL_CENTS: "2000"}).enabled, false);
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

test("digital purchases map exact paid totals from the five configured Payment Links", () => {
  const env = {
    STRIPE_PAYMENT_LINK_CURRENCY_DIGITAL: "plink_currency",
    STRIPE_PAYMENT_LINK_METALS_DIGITAL: "plink_metals",
    STRIPE_PAYMENT_LINK_EQUITY_DIGITAL: "plink_equity",
    STRIPE_PAYMENT_LINK_PROBABILISTIC_DIGITAL: "plink_probabilistic",
    STRIPE_PAYMENT_LINK_MARKET_STRUCTURE_TRILOGY_DIGITAL: "plink_trilogy"
  };
  const base = { id: "cs_live_paid", mode: "payment", payment_status: "paid", amount_total: 2900, currency: "usd" };
  assert.equal(digitalPurchaseFromSession({ ...base, payment_link: "plink_currency" }, env).eventLabel, "currency_market_structure");
  assert.equal(digitalPurchaseFromSession({ ...base, payment_link: "plink_metals" }, env).eventLabel, "metals_market_structure");
  assert.equal(digitalPurchaseFromSession({ ...base, payment_link: "plink_equity" }, env).eventLabel, "equity_market_structure");
  assert.equal(digitalPurchaseFromSession({ ...base, payment_link: "plink_probabilistic" }, env).eventLabel, "probabilistic_execution");
  assert.equal(digitalPurchaseFromSession({ ...base, amount_total: 6900, payment_link: "plink_trilogy" }, env).eventLabel, "market_structure_trilogy");
  assert.equal(digitalPurchaseFromSession({ ...base, payment_link: "plink_trilogy" }, env), null);
  assert.equal(digitalPurchaseFromSession({ ...base, amount_total: 6900, payment_link: "plink_currency" }, env), null);
  assert.equal(digitalPurchaseFromSession({ ...base, payment_status: "unpaid", payment_link: "plink_currency" }, env), null);
  assert.equal(digitalPurchaseFromSession({ ...base, amount_total: 2800, payment_link: "plink_currency" }, env), null);
  assert.equal(digitalPurchaseFromSession({ ...base, payment_link: "plink_other" }, env), null);
});

test("one signed, paid Stripe event is accepted for each existing digital title without entering paperback fulfillment", async () => {
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
    STRIPE_PAYMENT_LINK_PROBABILISTIC_DIGITAL: "plink_probabilistic",
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
  assert.equal(form.get("metadata[order_type]"), "print_book");
  assert.equal(form.get("metadata[edition]"), "paperback");
  assert.equal(request.headers["Idempotency-Key"], "print-checkout-quote-123");
});

test("flat-rate checkout sends the customer directly to Stripe with a server-owned region and rate", async () => {
  let request;
  const fakeFetch = async (_url, init) => {
    request = init;
    return new Response(JSON.stringify({ id: "cs_test_flat", url: "https://checkout.stripe.com/c/pay/test" }), { status: 200 });
  };
  const env = {
    STRIPE_SECRET_KEY: "sk_test_example",
    PAPERBACK_SUCCESS_URL: "https://example.com/success",
    PAPERBACK_CANCEL_URL: "https://example.com/cancel",
    PAPERBACK_STRIPE_TAX_ENABLED: "true",
    PAPERBACK_FLAT_RATE_US_CENTS: "749",
    PAPERBACK_FLAT_RATE_INTERNATIONAL_CENTS: "1999"
  };
  const book = getBook("probabilistic-execution", "hardcover");
  const shipping = flatShippingSelection(env, "international");
  const requestId = "7d5cd080-1909-44e7-8f14-57e50ce66d7c";
  const session = await new StripeClient(env, fakeFetch).createFlatRateCheckoutSession({
    book,
    priceId: "price_probabilistic_hardcover",
    shipping,
    requestId
  });
  assert.equal(session.id, "cs_test_flat");
  const form = new URLSearchParams(request.body);
  assert.equal(form.get("line_items[0][price]"), "price_probabilistic_hardcover");
  assert.equal(form.get("line_items[0][quantity]"), "1");
  assert.equal(form.get("shipping_options[0][shipping_rate_data][fixed_amount][amount]"), "1999");
  assert.equal(form.get("shipping_options[0][shipping_rate_data][display_name]"), "International flat-rate shipping");
  assert.equal(form.get("shipping_address_collection[allowed_countries][0]"), shipping.countries[0]);
  assert.equal(form.get(`shipping_address_collection[allowed_countries][${shipping.countries.indexOf("CA")}]`), "CA");
  assert.equal(form.get("shipping_address_collection[allowed_countries][0]"), "AD");
  assert.equal(form.get("metadata[order_type]"), "print_book_flat");
  assert.equal(form.get("metadata[shipping_region]"), "international");
  assert.equal(form.get("metadata[flat_shipping_cents]"), "1999");
  assert.equal(form.get("metadata[book_price_cents]"), "4900");
  assert.equal(form.get("phone_number_collection[enabled]"), "true");
  assert.equal(form.get("automatic_tax[enabled]"), "true");
  assert.equal(request.headers["Idempotency-Key"], `print-flat-${book.slug}-international-${requestId}`);
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

test("scheduled cleanup deletes expired quotes without retaining abandoned customer addresses", async () => {
  const calls = [];
  const db = {
    prepare(sql) {
      calls.push({ sql, args: null });
      return {
        bind(...args) {
          calls[calls.length - 1].args = args;
          return { async run() { return { meta: { changes: 3 } }; } };
        }
      };
    }
  };
  const store = new OrderStore(db);
  const now = "2026-08-04T20:00:00.000Z";
  assert.equal(await store.deleteExpiredQuotes(now), 3);
  assert.match(calls[0].sql, /DELETE FROM paperback_quotes WHERE expires_at < \?/);
  assert.deepEqual(calls[0].args, [now]);
});

test("default deployment is unable to sell either print edition and reports both disabled", async () => {
  const response = await worker.fetch(new Request("https://paperback-api.example.com/health"), { PAPERBACK_SALES_ENABLED: "false", PAPERBACK_ENVIRONMENT: "sandbox" });
  assert.deepEqual(await response.json(), {
    ok: true,
    paperbackSalesEnabled: false,
    hardcoverSalesEnabled: false,
    privateOrderEnabled: false,
    environment: "sandbox",
    probabilisticDigitalDeliveryReady: false,
    marketStructureTrilogyDigitalDeliveryReady: false,
    readiness: {
      paperbackProofsApproved: false,
      hardcoverProofsApproved: false,
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
  assert.deepEqual(await configResponse.json(), { enabled: false, checkoutUrl: null, edition: "paperback", priceCents: 3900 });
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
    checkoutUrl: "https://grizzly-parrot-paperback.example.workers.dev/print/checkout?bookSlug=metals-market-structure&edition=paperback",
    edition: "paperback",
    priceCents: 3900
  });
  const checkoutResponse = await worker.fetch(new Request("https://grizzly-parrot-paperback.example.workers.dev/paperback/checkout?bookSlug=metals-market-structure"), env);
  assert.equal(checkoutResponse.status, 200);
  const checkoutHtml = await checkoutResponse.text();
  assert.match(checkoutHtml, /Calculate shipping and continue/);
  assert.match(checkoutHtml, /U\.S\. shipping only/);
  assert.match(checkoutHtml, /store-policy\.html/);
  assert.match(checkoutHtml, /privacy\.html/);
  assert.match(checkoutHtml, /name="policyAccepted"/);
  assert.match(checkoutHtml, /name="countryCode"[^>]+readonly/);
});

test("public flat-rate configuration creates a live Stripe Session without collecting an address on the Worker", async () => {
  const env = {
    PAPERBACK_ENVIRONMENT: "production",
    PAPERBACK_SALES_ENABLED: "true",
    PAPERBACK_PROOFS_APPROVED: "true",
    PAPERBACK_POLICIES_APPROVED: "true",
    PAPERBACK_ALLOWED_COUNTRIES: "US",
    PAPERBACK_FLAT_RATE_US_CENTS: "749",
    PAPERBACK_FLAT_RATE_INTERNATIONAL_CENTS: "1999",
    PAPERBACK_STRIPE_TAX_ENABLED: "false",
    PAPERBACK_BASE_URL: "https://grizzly-parrot-paperback.example.workers.dev",
    PAPERBACK_ALLOWED_ORIGIN: "https://grizzlyparrottrading.com",
    PAPERBACK_SUCCESS_URL: "https://grizzlyparrottrading.com/books/paperback-order-confirmation.html",
    PAPERBACK_CANCEL_URL: "https://grizzlyparrottrading.com/books/",
    STRIPE_SECRET_KEY: "sk_test_example",
    STRIPE_PRICE_CURRENCY_PAPERBACK: "price_currency_paperback"
  };
  const publicConfig = await worker.fetch(new Request("https://grizzly-parrot-paperback.example.workers.dev/public-config?bookSlug=currency-market-structure&edition=paperback", {
    headers: { Origin: env.PAPERBACK_ALLOWED_ORIGIN }
  }), env);
  assert.deepEqual(await publicConfig.json(), {
    enabled: true,
    checkoutUrl: "https://grizzly-parrot-paperback.example.workers.dev/print/checkout?bookSlug=currency-market-structure&edition=paperback",
    checkoutEndpoint: "https://grizzly-parrot-paperback.example.workers.dev/print/start",
    shippingRates: { currency: "USD", usCents: 749, internationalCents: 1999 },
    edition: "paperback",
    priceCents: 3900
  });

  let stripeRequest;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    stripeRequest = { url, init };
    return new Response(JSON.stringify({ id: "cs_test_started", url: "https://checkout.stripe.com/c/pay/started" }), { status: 200 });
  };
  try {
    const response = await worker.fetch(new Request("https://grizzly-parrot-paperback.example.workers.dev/print/start", {
      method: "POST",
      headers: { Origin: env.PAPERBACK_ALLOWED_ORIGIN, "content-type": "application/json" },
      body: JSON.stringify({
        bookSlug: "currency-market-structure",
        edition: "paperback",
        region: "us",
        requestId: "bba6415f-c469-4211-b971-a6c8868fa194"
      })
    }), env);
    assert.equal(response.status, 201);
    assert.deepEqual(await response.json(), {
      ok: true,
      checkoutUrl: "https://checkout.stripe.com/c/pay/started",
      sessionId: "cs_test_started"
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert.equal(stripeRequest.url, "https://api.stripe.com/v1/checkout/sessions");
  const stripeForm = new URLSearchParams(stripeRequest.init.body);
  assert.equal(stripeForm.get("shipping_address_collection[allowed_countries][0]"), "US");
  assert.equal(stripeForm.get("shipping_options[0][shipping_rate_data][fixed_amount][amount]"), "749");
});

test("a paid flat-rate Stripe Session must match the server rate, total, and selected destination region", () => {
  const env = {
    PAPERBACK_FLAT_RATE_US_CENTS: "749",
    PAPERBACK_FLAT_RATE_INTERNATIONAL_CENTS: "1999"
  };
  const requestId = "4dc26c12-6bbc-47f8-8db8-670e114e5ad7";
  const session = {
    id: "cs_test_flatvalidated",
    mode: "payment",
    payment_status: "paid",
    amount_subtotal: 3900,
    amount_total: 4649,
    currency: "usd",
    client_reference_id: requestId,
    shipping_cost: { amount_subtotal: 749 },
    total_details: { amount_shipping: 749, amount_tax: 0, amount_discount: 0 },
    metadata: {
      order_type: "print_book_flat",
      book_slug: "currency-market-structure",
      shipping_region: "us",
      flat_shipping_cents: "749",
      book_price_cents: "3900",
      request_id: requestId,
      checkout_mode: "production_flat_rate_us"
    },
    customer_details: { email: "Reader@Example.com", phone: "+1 919 555 0100" },
    shipping_details: {
      name: "Test Reader",
      address: { line1: "123 Test Street", line2: "", city: "Raleigh", state: "NC", postal_code: "27601", country: "US" }
    }
  };
  const order = flatOrderFromSession(session, env);
  assert.equal(order.book.slug, "currency-market-structure");
  assert.equal(order.buyerEmail, "reader@example.com");
  assert.equal(order.shippingCents, 749);
  assert.equal(order.shippingOption, "MAIL");
  assert.equal(flatOrderFromSession({ ...session, amount_total: 4648 }, env), null);
  assert.equal(flatOrderFromSession({
    ...session,
    shipping_details: { ...session.shipping_details, address: { ...session.shipping_details.address, country: "CA" } }
  }, env), null);
  assert.equal(flatOrderFromSession({
    ...session,
    shipping_cost: { amount_subtotal: 1999 },
    total_details: { amount_shipping: 1999, amount_tax: 0, amount_discount: 0 },
    amount_total: 5899,
    metadata: { ...session.metadata, shipping_region: "international", flat_shipping_cents: "1999" },
    shipping_details: { ...session.shipping_details, address: { ...session.shipping_details.address, state: "ON", postal_code: "M5V 2T6", country: "CA" } }
  }, env).address.countryCode, "CA");
});

test("a signed paid flat-rate webhook inserts one order and submits it automatically to Lulu", async () => {
  const secret = "whsec_flat_fulfillment";
  const requestId = "6e687b87-a10f-4fb5-b544-836b54b4f29e";
  const event = {
    id: "evt_flat_fulfillment",
    type: "checkout.session.completed",
    data: { object: {
      id: "cs_test_flatfulfillment",
      mode: "payment",
      payment_status: "paid",
      amount_subtotal: 3900,
      amount_total: 4649,
      currency: "usd",
      client_reference_id: requestId,
      shipping_cost: { amount_subtotal: 749 },
      total_details: { amount_shipping: 749, amount_tax: 0, amount_discount: 0 },
      metadata: {
        order_type: "print_book_flat",
        book_slug: "currency-market-structure",
        shipping_region: "us",
        flat_shipping_cents: "749",
        book_price_cents: "3900",
        request_id: requestId,
        checkout_mode: "production_flat_rate_us"
      },
      customer_details: { email: "reader@example.com", phone: "+1 919 555 0100" },
      shipping_details: {
        name: "Test Reader",
        address: { line1: "123 Test Street", line2: "", city: "Raleigh", state: "NC", postal_code: "27601", country: "US" }
      }
    } }
  };
  let row;
  let submitted;
  const store = {
    async insertPaidOrder(order) {
      row = {
        stripe_session_id: order.stripeSessionId,
        stripe_event_id: order.stripeEventId,
        quote_id: order.quoteId,
        book_slug: order.bookSlug,
        quantity: order.quantity,
        buyer_email: order.buyerEmail,
        shipping_address_json: JSON.stringify(order.address),
        shipping_option: order.shippingOption,
        shipping_cents: order.shippingCents,
        currency: order.currency,
        customer_total_cents: order.customerTotalCents,
        tax_cents: order.taxCents,
        checkout_mode: order.checkoutMode,
        state: "paid"
      };
      return true;
    },
    async get() { return row; },
    async claimForSubmission() { row.state = "submitting"; return true; },
    async markSubmitted(_sessionId, printJobId, status) {
      row.state = "submitted";
      row.lulu_print_job_id = printJobId;
      row.lulu_status = status;
      submitted = { printJobId, status };
    },
    async markFailure() { throw new Error("Valid flat checkout must not enter failure state."); },
    async markEmail() { throw new Error("Email cannot be marked sent without a configured provider."); }
  };
  const env = {
    STRIPE_WEBHOOK_SECRET: secret,
    PAPERBACK_FLAT_RATE_US_CENTS: "749",
    PAPERBACK_FLAT_RATE_INTERNATIONAL_CENTS: "1999",
    PAPERBACK_ENVIRONMENT: "production",
    PAPERBACK_BASE_URL: "https://grizzly-parrot-paperback.example.workers.dev",
    PAPERBACK_ASSET_SIGNING_SECRET: "asset-signing-secret",
    LULU_CLIENT_KEY: "lulu-key",
    LULU_CLIENT_SECRET: "lulu-secret",
    SHOP_CONTACT_EMAIL: "orders@example.com"
  };
  const payload = JSON.stringify(event);
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = await hmacHex(secret, `${timestamp}.${payload}`);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (String(url).includes("/openid-connect/token")) {
      return new Response(JSON.stringify({ access_token: "lulu-access-token" }), { status: 200 });
    }
    if (String(url).endsWith("/print-jobs/")) {
      return new Response(JSON.stringify({ id: "lulu-flat-job", status: "CREATED" }), { status: 201 });
    }
    throw new Error(`Unexpected provider request: ${url}`);
  };
  try {
    const response = await stripeWebhook(new Request("https://paperback-api.example.com/webhooks/stripe", {
      method: "POST",
      headers: { "stripe-signature": `t=${timestamp},v1=${signature}` },
      body: payload
    }), env, { storeFactory: () => store });
    assert.deepEqual(await response.json(), { ok: true });
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert.equal(row.quote_id, null);
  assert.equal(row.shipping_cents, 749);
  assert.equal(row.checkout_mode, "production_flat_rate_us");
  assert.deepEqual(submitted, { printJobId: "lulu-flat-job", status: "CREATED" });
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
  assert.deepEqual(await publicConfig.json(), { enabled: false, checkoutUrl: null, edition: "paperback", priceCents: 3900 });
  const privatePage = await worker.fetch(new Request("https://grizzly-parrot-paperback.example.workers.dev/paperback/private-order?bookSlug=currency-market-structure"), env);
  assert.equal(privatePage.status, 200);
  const html = await privatePage.text();
  assert.match(html, /Private order token/);
  assert.match(html, /x-paperback-private-token/);
  const unauthorizedQuote = await worker.fetch(new Request("https://grizzly-parrot-paperback.example.workers.dev/paperback/quote", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ bookSlug: "currency-market-structure" })
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
  assert.deepEqual(await response.json(), { enabled: false, checkoutUrl: null, edition: "paperback", priceCents: 3900 });
});

test("all book pages keep print controls fail-closed and use the canonical site branding", async () => {
  const pages = [
    "currency-market-structure/index.html",
    "metals-market-structure/index.html",
    "equity-market-structure/index.html"
  ];
  for (const page of pages) {
    const html = await readFile(new URL(`../../../books/${page}`, import.meta.url), "utf8");
    assert.match(html, /button-disabled js-paperback-buy/);
    assert.match(html, /button-disabled js-hardcover-buy/);
    assert.match(html, /data-shipping-region="us"/);
    assert.match(html, /data-shipping-region="international"/);
    assert.match(html, /print-checkout\.js\?v=20260825-flat-shipping/);
    assert.match(html, /GrizzlyPrintCheckout\.init/);
    assert.match(html, /grizzly-parrot-paperback\.grizzlyparrott04\.workers\.dev/);
    assert.match(html, /market-structure-series\.css\?v=20260825-trilogy/);
    assert.match(html, /<div class="logo">\s*<span class="logo-mark" aria-hidden="true">GP<\/span>\s*<span class="logo-text"><a href="https:\/\/grizzlyparrottrading\.com\/">Grizzly Parrot Trading<\/a><\/span>\s*<\/div>/s);
    assert.doesNotMatch(html, /class="brand-mark"/);
    assert.match(html, />Buy digital</);
    assert.match(html, /button-disabled js-trilogy-buy/);
    assert.match(html, /digital-checkout\.js\?v=20260825-trilogy/);
    assert.match(html, /bookSlug: 'market-structure-trilogy'/);
    assert.match(html, /expectedPriceCents: 6900/);
    assert.match(html, /Get all three &mdash; \$69/);
    assert.match(html, /usShippingCents: 749/);
    assert.match(html, /internationalShippingCents: 1999/);
    assert.doesNotMatch(html, /\/print\/checkout/);
    assert.doesNotMatch(html, /Buy (?:digital|paperback|hardcover) edition/);
  }
  const css = await readFile(new URL("../../../books/market-structure-series.css", import.meta.url), "utf8");
  assert.match(css, /\.site-header\s*\{[^}]*background:\s*rgba\(15,23,42,\.95\);/s);
  assert.match(css, /\.logo-mark\s*\{[^}]*border-radius:\s*999px;/s);
  assert.doesNotMatch(css, /\.brand-mark/);
  assert.match(css, /\.price-box \.button\s*\{[^}]*white-space:\s*normal;/s);
  assert.match(css, /\.print-checkout-actions\s*\{/);
  assert.match(css, /\.series-bundle-offer\s*\{/);
  assert.match(css, /@media \(max-width:\s*1040px\)\s*\{\s*\.purchase-card\s*\{\s*grid-template-columns:\s*1fr;/s);
  assert.match(css, /@media \(max-width:\s*760px\)\s*\{\s*\.edition-options\s*\{\s*grid-template-columns:\s*1fr;/s);

  const catalog = await readFile(new URL("../../../books/index.html", import.meta.url), "utf8");
  assert.match(catalog, /<span class="logo-mark" aria-hidden="true">GP<\/span>/);
  assert.match(catalog, /<span class="logo-text"><a href="https:\/\/grizzlyparrottrading\.com\/">Grizzly Parrot Trading<\/a><\/span>/);
  assert.doesNotMatch(catalog, /<nav class="main-nav">\s*<ul>/s);
  assert.match(catalog, /id="market-structure-digital-trilogy"/);
  assert.match(catalog, /"sku": "market-structure-digital-trilogy"/);
  assert.match(catalog, /"price": "69\.00"/);
  assert.match(catalog, /\$87 separately &middot; save \$18/);
  assert.match(catalog, /button-disabled js-trilogy-buy/);
  assert.match(catalog, /digital-checkout\.js\?v=20260825-trilogy/);

  const probabilistic = await readFile(new URL("../../../books/probabilistic-execution/index.html", import.meta.url), "utf8");
  assert.match(probabilistic, /button-disabled js-digital-buy/);
  assert.match(probabilistic, /button-disabled js-paperback-buy/);
  assert.match(probabilistic, /button-disabled js-hardcover-buy/);
  assert.doesNotMatch(probabilistic, /Coming soon|Sales have not opened/);
  assert.match(probabilistic, /digital-config\?bookSlug=probabilistic-execution/);
  assert.match(probabilistic, /print-checkout\.js\?v=20260825-flat-shipping/);
  assert.match(probabilistic, /bookSlug: 'probabilistic-execution'/);
  assert.match(probabilistic, /data-shipping-region="us"/);
  assert.match(probabilistic, /data-shipping-region="international"/);
  assert.match(probabilistic, /data-price-paperback/);
  assert.match(probabilistic, /data-price-hardcover/);
  assert.match(probabilistic, /Safe default: digital checkout remains disabled/);
  assert.match(probabilistic, /Choose your edition\./);
  assert.match(probabilistic, /<strong data-price-paperback>\$39<\/strong>/);
  assert.match(probabilistic, /<strong data-price-hardcover>\$49<\/strong>/);
  assert.doesNotMatch(probabilistic, /buy\.stripe\.com\/[A-Za-z0-9]/);
  assert.match(probabilistic, /"isbn": "9780557956548"/);
  assert.match(probabilistic, /"isbn": "9780557956531"/);

  const printCheckout = await readFile(new URL("../../../books/print-checkout.js", import.meta.url), "utf8");
  assert.match(printCheckout, /\/public-config\?bookSlug=/);
  assert.match(printCheckout, /parsed\.pathname === '\/print\/start'/);
  assert.match(printCheckout, /parsed\.hostname === 'checkout\.stripe\.com'/);
  assert.match(printCheckout, /global\.location\.assign\(checkoutUrl\)/);
  assert.match(printCheckout, /Safe default: this print edition remains disabled/);
  assert.doesNotMatch(printCheckout, /\/print\/checkout/);

  const digitalCheckout = await readFile(new URL("../../../books/digital-checkout.js", import.meta.url), "utf8");
  assert.match(digitalCheckout, /\/digital-config\?bookSlug=/);
  assert.match(digitalCheckout, /config\.priceCents !== options\.expectedPriceCents/);
  assert.match(digitalCheckout, /\['buy\.stripe\.com', 'book\.stripe\.com'\]/);
  assert.match(digitalCheckout, /Digital bundle checkout is temporarily unavailable/);
});

test("hardcover activation is independent and returns the exact hardcover checkout", async () => {
  const env = {
    PAPERBACK_ENVIRONMENT: "production",
    PAPERBACK_SALES_ENABLED: "false",
    HARDCOVER_SALES_ENABLED: "true",
    PAPERBACK_PROOFS_APPROVED: "true",
    HARDCOVER_PROOFS_APPROVED: "true",
    PAPERBACK_POLICIES_APPROVED: "true",
    PAPERBACK_ALLOWED_COUNTRIES: "US",
    PAPERBACK_STRIPE_TAX_ENABLED: "true",
    PAPERBACK_BASE_URL: "https://grizzly-parrot-paperback.example.workers.dev"
  };
  const paperback = await worker.fetch(new Request("https://grizzly-parrot-paperback.example.workers.dev/public-config?bookSlug=currency-market-structure&edition=paperback"), env);
  assert.equal((await paperback.json()).enabled, false);
  const hardcover = await worker.fetch(new Request("https://grizzly-parrot-paperback.example.workers.dev/public-config?bookSlug=currency-market-structure&edition=hardcover"), env);
  assert.deepEqual(await hardcover.json(), {
    enabled: true,
    checkoutUrl: "https://grizzly-parrot-paperback.example.workers.dev/print/checkout?bookSlug=currency-market-structure&edition=hardcover",
    edition: "hardcover",
    priceCents: 4900
  });
  const page = await worker.fetch(new Request("https://grizzly-parrot-paperback.example.workers.dev/print/checkout?bookSlug=currency-market-structure&edition=hardcover"), env);
  assert.equal(page.status, 200);
  const html = await page.text();
  assert.match(html, /Hardcover checkout/);
  assert.match(html, /\$49\.00 plus calculated shipping/);
  assert.match(html, /data\.edition=edition/);
});
