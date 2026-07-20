import { asLuluAddress } from "./validation.mjs";
import { signedAssetUrl } from "./crypto.mjs";

function formEncoded(values) {
  return new URLSearchParams(values).toString();
}

function errorMessage(responseText, status) {
  try {
    const json = JSON.parse(responseText);
    return json.detail || json.message || JSON.stringify(json);
  } catch {
    return responseText || `Lulu returned ${status}`;
  }
}

export class LuluApiError extends Error {
  constructor(code, message, retryable = false) {
    super(message);
    this.code = code;
    this.retryable = retryable;
  }
}

export class LuluClient {
  constructor(env, fetchImpl = fetch) {
    this.env = env;
    // Cloudflare's native fetch requires its original receiver. Wrapping also
    // keeps injected test doubles working without changing their call shape.
    this.fetch = (...args) => fetchImpl.call(globalThis, ...args);
    this.baseUrl = env.PAPERBACK_ENVIRONMENT === "production" ? "https://api.lulu.com" : "https://api.sandbox.lulu.com";
  }

  async token() {
    if (!this.env.LULU_CLIENT_KEY || !this.env.LULU_CLIENT_SECRET) {
      throw new LuluApiError("lulu_credentials_missing", "Lulu API credentials are not configured.");
    }
    const basic = btoa(`${this.env.LULU_CLIENT_KEY}:${this.env.LULU_CLIENT_SECRET}`);
    const response = await this.fetch(`${this.baseUrl}/auth/realms/glasstree/protocol/openid-connect/token`, {
      method: "POST",
      headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: formEncoded({ grant_type: "client_credentials" })
    });
    const text = await response.text();
    if (!response.ok) throw new LuluApiError("lulu_auth_failed", errorMessage(text, response.status), response.status >= 500);
    const json = JSON.parse(text);
    if (!json.access_token) throw new LuluApiError("lulu_auth_failed", "Lulu did not return an access token.");
    return json.access_token;
  }

  async request(path, method, body) {
    const token = await this.token();
    const response = await this.fetch(`${this.baseUrl}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined
    });
    const text = await response.text();
    if (!response.ok) {
      const retryable = response.status === 429 || response.status >= 500;
      throw new LuluApiError(`lulu_${response.status}`, errorMessage(text, response.status), retryable);
    }
    return text ? JSON.parse(text) : {};
  }

  async quote({ book, quantity, address, shippingOption }) {
    return this.request("/print-job-cost-calculations/", "POST", {
      line_items: [{ pod_package_id: book.podPackageId, page_count: book.interiorPages, quantity }],
      shipping_address: asLuluAddress(address),
      shipping_option: shippingOption
    });
  }

  async createPrintJob({ book, quantity, address, shippingOption, externalId }) {
    const [interiorUrl, coverUrl] = await Promise.all([
      signedAssetUrl(this.env.PAPERBACK_BASE_URL, book.assets.interiorKey, this.env.PAPERBACK_ASSET_SIGNING_SECRET),
      signedAssetUrl(this.env.PAPERBACK_BASE_URL, book.assets.coverKey, this.env.PAPERBACK_ASSET_SIGNING_SECRET)
    ]);
    return this.request("/print-jobs/", "POST", {
      external_id: externalId,
      contact_email: this.env.SHOP_CONTACT_EMAIL,
      shipping_level: shippingOption,
      shipping_address: asLuluAddress(address),
      line_items: [{
        external_id: `${externalId}-${book.slug}`,
        title: book.title,
        pod_package_id: book.podPackageId,
        quantity,
        interior: { source_url: interiorUrl, source_md5sum: book.assets.interiorMd5 },
        cover: { source_url: coverUrl, source_md5sum: book.assets.coverMd5 }
      }]
    });
  }

  async status(printJobId) {
    return this.request(`/print-jobs/${encodeURIComponent(printJobId)}/`, "GET");
  }
}

export function shippingCents(quote) {
  const amount = Number(quote?.shipping_cost?.total_cost_incl_tax);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new LuluApiError("lulu_shipping_quote_invalid", "Lulu did not return a usable shipping cost.");
  }
  return Math.round(amount * 100);
}
