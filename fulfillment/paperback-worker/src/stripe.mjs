import { verifyStripeSignature } from "./crypto.mjs";

function formEncode(input) {
  const form = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined && value !== null && value !== "") form.set(key, String(value));
  }
  return form.toString();
}

export class StripeApiError extends Error {
  constructor(code, message, retryable = false) {
    super(message);
    this.code = code;
    this.retryable = retryable;
  }
}

export class StripeClient {
  constructor(env, fetchImpl = fetch) {
    this.env = env;
    // Do not detach Cloudflare's native fetch from its required receiver.
    this.fetch = (...args) => fetchImpl.call(globalThis, ...args);
  }

  async request(path, fields, idempotencyKey) {
    if (!this.env.STRIPE_SECRET_KEY) throw new StripeApiError("stripe_key_missing", "Stripe server key is not configured.");
    const response = await this.fetch(`https://api.stripe.com/v1${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {})
      },
      body: formEncode(fields)
    });
    const text = await response.text();
    if (!response.ok) {
      let message = text || `Stripe returned ${response.status}`;
      try { message = JSON.parse(text).error?.message || message; } catch {}
      throw new StripeApiError(`stripe_${response.status}`, message, response.status >= 500 || response.status === 429);
    }
    return JSON.parse(text);
  }

  async createCheckoutSession({ book, quote, priceId, customerEmail }) {
    const shippingCents = quote.shippingCents;
    const fields = {
      mode: "payment",
      success_url: `${this.env.PAPERBACK_SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: this.env.PAPERBACK_CANCEL_URL,
      customer_email: customerEmail,
      client_reference_id: quote.quoteId,
      "metadata[order_type]": "paperback",
      "metadata[book_slug]": book.slug,
      "metadata[quote_id]": quote.quoteId,
      "metadata[pipeline_version]": "1",
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": quote.quantity,
      "shipping_address_collection[allowed_countries][0]": quote.address.countryCode,
      "phone_number_collection[enabled]": "true",
      "shipping_options[0][shipping_rate_data][type]": "fixed_amount",
      "shipping_options[0][shipping_rate_data][display_name]": `Lulu ${quote.shippingOption}`,
      "shipping_options[0][shipping_rate_data][fixed_amount][amount]": shippingCents,
      "shipping_options[0][shipping_rate_data][fixed_amount][currency]": quote.currency.toLowerCase(),
      "shipping_options[0][shipping_rate_data][metadata][lulu_quote_id]": quote.quoteId
    };
    return this.request("/checkout/sessions", fields, `paperback-checkout-${quote.quoteId}`);
  }
}

export async function parseVerifiedStripeEvent(request, secret) {
  const payload = await request.text();
  const valid = await verifyStripeSignature(payload, request.headers.get("stripe-signature"), secret);
  if (!valid) throw new StripeApiError("stripe_signature_invalid", "Invalid Stripe webhook signature.");
  try {
    return JSON.parse(payload);
  } catch {
    throw new StripeApiError("stripe_event_invalid", "Stripe webhook body was not valid JSON.");
  }
}
