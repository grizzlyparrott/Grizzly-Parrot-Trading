import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  DigitalDeliveryError,
  digitalDeliveryConfigured,
  normalizeDigitalBuyerEmail,
  sendProbabilisticDigitalDelivery
} from "../src/digital-delivery.mjs";
import worker, {
  attemptProbabilisticDigitalDelivery,
  pollStatuses,
  retryDigitalDeliveries,
  stripeWebhook
} from "../src/index.mjs";
import { hmacHex } from "../src/crypto.mjs";

function fixtureAsset(key, filename, contentType, text) {
  const bytes = new TextEncoder().encode(text);
  return {
    bytes,
    descriptor: {
      key,
      filename,
      contentType,
      sha256: createHash("sha256").update(bytes).digest("hex").toUpperCase()
    }
  };
}

function configuredFixture() {
  const pdf = fixtureAsset("digital/test/book.pdf", "book.pdf", "application/pdf", "test-pdf");
  const epub = fixtureAsset("digital/test/book.epub", "book.epub", "application/epub+zip", "test-epub");
  const objects = new Map([[pdf.descriptor.key, pdf.bytes], [epub.descriptor.key, epub.bytes]]);
  return {
    configuration: { assets: [pdf.descriptor, epub.descriptor] },
    env: {
      PROBABILISTIC_EXECUTION_DIGITAL_DELIVERY_ENABLED: "true",
      RESEND_API_KEY: "re_test_delivery_key",
      DIGITAL_EMAIL_FROM: "Grizzly Parrot Trading <sales@example.com>",
      DIGITAL_REPLY_TO: "sales@example.com",
      PRINT_ASSETS: {
        async get(key) {
          const bytes = objects.get(key);
          return bytes ? { async arrayBuffer() { return bytes.slice().buffer; } } : null;
        }
      }
    }
  };
}

test("digital delivery stays disabled until its private assets, sender, API key, and explicit gate exist", () => {
  const { env } = configuredFixture();
  assert.equal(digitalDeliveryConfigured(env), true);
  assert.equal(digitalDeliveryConfigured({ ...env, PROBABILISTIC_EXECUTION_DIGITAL_DELIVERY_ENABLED: "false" }), false);
  assert.equal(digitalDeliveryConfigured({ ...env, RESEND_API_KEY: "" }), false);
  assert.equal(digitalDeliveryConfigured({ ...env, PRINT_ASSETS: null }), false);
});

test("digital object keys are never served through the signed print-asset route", async () => {
  let storageRead = false;
  const key = "digital/probabilistic-execution/list-restart-2026-08-13/Probabilistic-Execution-Digital.pdf";
  const response = await worker.fetch(new Request(
    `https://paperback-api.example.com/lulu-assets/${encodeURIComponent(key)}?expires=9999999999&sig=not-relevant`
  ), {
    PAPERBACK_ASSET_SIGNING_SECRET: "asset-secret",
    PRINT_ASSETS: {
      async get() { storageRead = true; return null; }
    }
  });
  assert.equal(response.status, 404);
  assert.equal(storageRead, false);
});

test("buyer email is taken only from a valid Stripe Checkout email field", () => {
  assert.equal(normalizeDigitalBuyerEmail({ customer_details: { email: " Reader@Example.com " } }), "reader@example.com");
  assert.equal(normalizeDigitalBuyerEmail({ customer_email: "fallback@example.com" }), "fallback@example.com");
  assert.equal(normalizeDigitalBuyerEmail({ customer_details: { email: "not-an-email" } }), null);
});

test("Resend receives the two hash-verified private assets with a deterministic idempotency key", async () => {
  const { env, configuration } = configuredFixture();
  let request;
  const result = await sendProbabilisticDigitalDelivery(env, {
    stripe_session_id: "cs_test_delivery123",
    buyer_email: "reader@example.com"
  }, {
    configuration,
    async fetchImpl(url, init) {
      request = { url, init, body: JSON.parse(init.body) };
      return new Response(JSON.stringify({ id: "email_delivery_123" }), { status: 200 });
    }
  });
  assert.equal(result.messageId, "email_delivery_123");
  assert.equal(request.url, "https://api.resend.com/emails");
  assert.equal(request.init.headers["Idempotency-Key"], "probabilistic-digital-cs_test_delivery123");
  assert.equal(request.body.to, "reader@example.com");
  assert.match(request.body.subject, /^\[TEST - NO PURCHASE\]/);
  assert.match(request.body.html, /No purchase or charge occurred/);
  assert.equal(request.body.tags.find(({ name }) => name === "delivery")?.value, "digital_delivery_test");
  assert.deepEqual(request.body.attachments.map(({ filename }) => filename), ["book.pdf", "book.epub"]);
  assert.deepEqual(request.body.attachments.map(({ content }) => Buffer.from(content, "base64").toString()), ["test-pdf", "test-epub"]);
});

test("a missing or hash-mismatched private asset fails closed before Resend", async () => {
  const { env, configuration } = configuredFixture();
  const badConfiguration = {
    assets: [{ ...configuration.assets[0], sha256: "0".repeat(64) }]
  };
  let called = false;
  await assert.rejects(
    sendProbabilisticDigitalDelivery(env, {
      stripe_session_id: "cs_test_hash",
      buyer_email: "reader@example.com"
    }, {
      configuration: badConfiguration,
      async fetchImpl() { called = true; return new Response("{}", { status: 200 }); }
    }),
    (error) => error instanceof DigitalDeliveryError && error.code === "digital_asset_hash_mismatch"
  );
  assert.equal(called, false);
});

test("definitive Resend throttling and server failures are retryable", async () => {
  const { env, configuration } = configuredFixture();
  for (const status of [429, 503]) {
    await assert.rejects(
      sendProbabilisticDigitalDelivery(env, {
        stripe_session_id: `cs_test_resend_${status}`,
        buyer_email: "reader@example.com"
      }, {
        configuration,
        async fetchImpl() { return new Response("provider rejected request", { status }); }
      }),
      (error) => error instanceof DigitalDeliveryError
        && error.code === `resend_${status}`
        && error.retryable === true
    );
  }
});

test("an ambiguous Resend transport outcome is non-retryable", async () => {
  const { env, configuration } = configuredFixture();
  await assert.rejects(
    sendProbabilisticDigitalDelivery(env, {
      stripe_session_id: "cs_test_resend_ambiguous",
      buyer_email: "reader@example.com"
    }, {
      configuration,
      async fetchImpl() { throw new Error("connection ended after request write"); }
    }),
    (error) => error instanceof DigitalDeliveryError
      && error.code === "resend_transport_ambiguous"
      && error.retryable === false
  );
});

test("a delivery claim is sent once and persisted with the Resend message ID", async () => {
  const delivery = {
    stripe_session_id: "cs_test_once",
    buyer_email: "reader@example.com",
    status: "queued",
    attempts: 1
  };
  const calls = [];
  const store = {
    async claimDigitalDelivery() { calls.push("claim"); return delivery; },
    async digitalDelivery() { return delivery; },
    async markDigitalDeliverySent(sessionId, messageId) { calls.push(["sent", sessionId, messageId]); },
    async markDigitalDeliveryFailure() { calls.push("failure"); }
  };
  const result = await attemptProbabilisticDigitalDelivery(store, {}, delivery.stripe_session_id, {
    async send() { calls.push("send"); return { provider: "resend", messageId: "email_once" }; }
  });
  assert.equal(result.state, "sent");
  assert.deepEqual(calls, ["claim", "send", ["sent", "cs_test_once", "email_once"]]);
});

test("a definitive retryable provider failure is scheduled and an ambiguous outcome is held for review", async () => {
  const failures = [];
  const makeStore = (sessionId) => ({
    async claimDigitalDelivery() {
      return { stripe_session_id: sessionId, buyer_email: "reader@example.com", status: "sending", attempts: 1 };
    },
    async digitalDelivery() { return null; },
    async markDigitalDeliverySent() { throw new Error("failure test must not mark sent"); },
    async markDigitalDeliveryFailure(...args) { failures.push(args); }
  });

  const beforeRetry = Date.now();
  const retryable = await attemptProbabilisticDigitalDelivery(
    makeStore("cs_test_retryable"),
    {},
    "cs_test_retryable",
    {
      async send() {
        throw new DigitalDeliveryError("resend_429", "Resend throttled the request.", { retryable: true });
      }
    }
  );
  assert.equal(retryable.state, "retryable_failure");
  assert.ok(Date.parse(retryable.nextAttemptAt) >= beforeRetry + 14 * 60 * 1000);
  assert.ok(Date.parse(retryable.nextAttemptAt) <= Date.now() + 16 * 60 * 1000);

  const ambiguous = await attemptProbabilisticDigitalDelivery(
    makeStore("cs_test_ambiguous"),
    {},
    "cs_test_ambiguous",
    {
      async send() {
        throw new DigitalDeliveryError("resend_transport_ambiguous", "Provider outcome is unknown.");
      }
    }
  );
  assert.equal(ambiguous.state, "manual_review");
  assert.equal(ambiguous.nextAttemptAt, null);
  assert.deepEqual(failures.map((args) => [args[0], args[1], args[2], args[4]]), [
    ["cs_test_retryable", "retryable_failure", "resend_429", retryable.nextAttemptAt],
    ["cs_test_ambiguous", "manual_review", "resend_transport_ambiguous", null]
  ]);
});

test("a duplicate webhook cannot resend a delivery already marked sent", async () => {
  let sends = 0;
  const result = await attemptProbabilisticDigitalDelivery({
    async claimDigitalDelivery() { return null; },
    async digitalDelivery() {
      return { stripe_session_id: "cs_test_already_sent", status: "sent", resend_email_id: "email_existing" };
    }
  }, {}, "cs_test_already_sent", {
    async send() { sends += 1; return { provider: "resend", messageId: "email_duplicate" }; }
  });
  assert.deepEqual(result, { state: "sent", attempted: false });
  assert.equal(sends, 0);
});

test("an expired in-flight lease goes to manual review instead of risking a duplicate email", async () => {
  const calls = [];
  const store = {
    async digitalDeliveriesExpiredSending() {
      return [{ stripe_session_id: "cs_test_expired_lease" }];
    },
    async markExpiredDigitalDeliveryForReview(sessionId) {
      calls.push(["manual_review", sessionId]);
      return true;
    },
    async digitalDeliveriesDue() { calls.push("due_scan"); return []; }
  };
  await retryDigitalDeliveries(store, {});
  assert.deepEqual(calls, [["manual_review", "cs_test_expired_lease"], "due_scan"]);
});

test("the scheduled poll builds its store and executes the delivery retry scan", async () => {
  const calls = [];
  const store = {
    async digitalDeliveriesExpiredSending() { calls.push("expired_scan"); return []; },
    async digitalDeliveriesDue() { calls.push("due_scan"); return []; },
    async deleteExpiredQuotes() { calls.push("quote_cleanup"); return 0; },
    async ordersNeedingConfirmation() { return []; },
    async activeOrders() { return []; }
  };
  await pollStatuses({ PAPERBACK_ORDERS: {} }, {
    storeFactory(db) { calls.push(["store", db]); return store; }
  });
  assert.deepEqual(calls, [
    ["store", {}],
    "expired_scan",
    "due_scan",
    "quote_cleanup"
  ]);
});

test("a signed paid Probabilistic webhook queues and sends to the normalized Checkout email without entering print fulfillment", async () => {
  const secret = "whsec_probabilistic_delivery";
  const event = {
    id: "evt_probabilistic_delivery",
    type: "checkout.session.completed",
    data: { object: {
      id: "cs_test_probabilistic_delivery",
      mode: "payment",
      payment_status: "paid",
      amount_total: 2900,
      currency: "usd",
      payment_link: "plink_probabilistic_delivery",
      customer_details: { email: " Reader@Example.com " }
    } }
  };
  const body = JSON.stringify(event);
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = await hmacHex(secret, `${timestamp}.${body}`);
  const recorded = {};
  const delivery = {
    stripe_session_id: event.data.object.id,
    buyer_email: "reader@example.com",
    status: "queued",
    attempts: 1
  };
  const store = {
    async insertDigitalPurchase(purchase) { recorded.purchase = purchase; return true; },
    async ensureDigitalDelivery(sessionId, buyerEmail, _now, status) {
      recorded.queue = { sessionId, buyerEmail, status };
      return delivery;
    },
    async claimDigitalDelivery() { return delivery; },
    async digitalDelivery() { return delivery; },
    async markDigitalDeliverySent(sessionId, messageId) { recorded.sent = { sessionId, messageId }; },
    async markDigitalDeliveryFailure() { throw new Error("delivery should not fail"); }
  };
  const response = await stripeWebhook(new Request("https://paperback-api.example.com/webhooks/stripe", {
    method: "POST",
    headers: { "stripe-signature": `t=${timestamp},v1=${signature}` },
    body
  }), {
    STRIPE_WEBHOOK_SECRET: secret,
    STRIPE_PAYMENT_LINK_PROBABILISTIC_DIGITAL: "plink_probabilistic_delivery"
  }, {
    storeFactory: () => store,
    async sendDigital(_env, claimed) {
      recorded.recipient = claimed.buyer_email;
      return { provider: "resend", messageId: "email_probabilistic_delivery" };
    }
  });
  assert.deepEqual(await response.json(), {
    ok: true,
    digitalPurchase: true,
    duplicate: false,
    deliveryState: "sent"
  });
  assert.equal(recorded.purchase.eventLabel, "probabilistic_execution");
  assert.deepEqual(recorded.queue, {
    sessionId: "cs_test_probabilistic_delivery",
    buyerEmail: "reader@example.com",
    status: "queued"
  });
  assert.equal(recorded.recipient, "reader@example.com");
  assert.deepEqual(recorded.sent, {
    sessionId: "cs_test_probabilistic_delivery",
    messageId: "email_probabilistic_delivery"
  });
});

test("database schema and forward migration both admit the fourth title and durable delivery states", async () => {
  const schema = await readFile(new URL("../schema.sql", import.meta.url), "utf8");
  const migration = await readFile(new URL("../migrations/0004_probabilistic_digital_delivery.sql", import.meta.url), "utf8");
  for (const text of [schema, migration]) {
    assert.match(text, /'probabilistic_execution'/);
    assert.match(text, /CREATE TABLE(?: IF NOT EXISTS)? digital_deliveries/);
    assert.match(text, /retryable_failure/);
    assert.match(text, /resend_email_id/);
  }
});
