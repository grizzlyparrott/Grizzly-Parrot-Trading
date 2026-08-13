const RESEND_EMAIL_LIMIT_BYTES = 40 * 1024 * 1024;

export const PROBABILISTIC_DIGITAL_DELIVERY = Object.freeze({
  eventLabel: "probabilistic_execution",
  title: "Probabilistic Execution",
  assets: Object.freeze([
    Object.freeze({
      key: "digital/probabilistic-execution/Probabilistic-Execution-Digital.pdf",
      filename: "Probabilistic-Execution-Digital.pdf",
      contentType: "application/pdf",
      sha256: "6859F32798DD82D119ED9685B15D290CB0548440B40FC4CC835871C1EC59D9F3"
    }),
    Object.freeze({
      key: "digital/probabilistic-execution/Probabilistic-Execution-Digital.epub",
      filename: "Probabilistic-Execution-Digital.epub",
      contentType: "application/epub+zip",
      sha256: "FD0AF7994539BD106D01BE2755CF069A8D10B2AADCCD287390D7EA41C778495E"
    })
  ])
});

export class DigitalDeliveryError extends Error {
  constructor(code, message, { retryable = false } = {}) {
    super(message);
    this.code = code;
    this.retryable = retryable;
  }
}

export function normalizeDigitalBuyerEmail(session) {
  const candidate = session?.customer_details?.email || session?.customer_email || "";
  const email = typeof candidate === "string" ? candidate.trim().toLowerCase().slice(0, 254) : "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export function digitalDeliveryConfigured(env) {
  return env?.PROBABILISTIC_EXECUTION_DIGITAL_DELIVERY_ENABLED === "true"
    && typeof env?.RESEND_API_KEY === "string"
    && env.RESEND_API_KEY.length > 8
    && typeof env?.DIGITAL_EMAIL_FROM === "string"
    && env.DIGITAL_EMAIL_FROM.includes("@")
    && typeof env?.PRINT_ASSETS?.get === "function";
}

async function sha256Hex(buffer) {
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return [...new Uint8Array(digest)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

function base64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunks = [];
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    chunks.push(String.fromCharCode(...bytes.subarray(offset, offset + 0x8000)));
  }
  return btoa(chunks.join(""));
}

async function loadVerifiedAttachment(env, asset) {
  let object;
  try {
    object = await env.PRINT_ASSETS.get(asset.key);
  } catch {
    throw new DigitalDeliveryError("digital_asset_read_failed", `Private asset storage could not read ${asset.filename}.`, { retryable: true });
  }
  if (!object || typeof object.arrayBuffer !== "function") {
    throw new DigitalDeliveryError("digital_asset_missing", `Private asset ${asset.filename} is missing.`);
  }
  const buffer = await object.arrayBuffer();
  const actualSha256 = await sha256Hex(buffer);
  if (actualSha256 !== asset.sha256) {
    throw new DigitalDeliveryError("digital_asset_hash_mismatch", `Private asset ${asset.filename} failed its SHA-256 check.`);
  }
  return { filename: asset.filename, content: base64(buffer), contentType: asset.contentType };
}

export async function sendProbabilisticDigitalDelivery(env, delivery, {
  fetchImpl = fetch,
  configuration = PROBABILISTIC_DIGITAL_DELIVERY
} = {}) {
  if (!digitalDeliveryConfigured(env)) {
    throw new DigitalDeliveryError("digital_delivery_not_configured", "Probabilistic Execution digital delivery is not enabled and fully configured.");
  }
  if (!delivery?.buyer_email || !delivery?.stripe_session_id) {
    throw new DigitalDeliveryError("digital_delivery_record_invalid", "The paid delivery record is missing its buyer email or Stripe session ID.");
  }

  const attachments = [];
  for (const asset of configuration.assets) attachments.push(await loadVerifiedAttachment(env, asset));

  const isTestDelivery = delivery.stripe_session_id.startsWith("cs_test_");
  const message = {
    from: env.DIGITAL_EMAIL_FROM,
    to: delivery.buyer_email,
    reply_to: env.DIGITAL_REPLY_TO || env.SHOP_CONTACT_EMAIL || undefined,
    subject: isTestDelivery
      ? "[TEST - NO PURCHASE] Probabilistic Execution Delivery (PDF + EPUB)"
      : "Your Probabilistic Execution Download (PDF + EPUB)",
    html: isTestDelivery
      ? `<p><strong>This is a delivery-pipeline test. No purchase or charge occurred.</strong></p>
        <p>The proofread-final PDF and EPUB for <strong>Probabilistic Execution</strong> are attached for verification.</p>`
      : `<p>Thanks for your purchase of <strong>Probabilistic Execution</strong>.</p>
        <p>Your professionally typeset PDF and reflowable EPUB are attached to this email.</p>
        <p>If either attachment is blocked by your email provider, reply to this email and we will help.</p>`,
    attachments: attachments.map(({ filename, content }) => ({ filename, content })),
    tags: [
      { name: "book", value: "probabilistic_execution" },
      { name: "delivery", value: isTestDelivery ? "digital_delivery_test" : "digital_purchase" }
    ]
  };
  const requestBody = JSON.stringify(message);
  if (new TextEncoder().encode(requestBody).byteLength >= RESEND_EMAIL_LIMIT_BYTES) {
    throw new DigitalDeliveryError("digital_email_too_large", "The encoded digital delivery exceeds Resend's 40 MB message limit.");
  }

  let response;
  try {
    response = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `probabilistic-digital-${delivery.stripe_session_id}`
      },
      body: requestBody
    });
  } catch {
    throw new DigitalDeliveryError(
      "resend_transport_ambiguous",
      "The Resend request ended without an authoritative response; manual review prevents a duplicate delivery."
    );
  }

  const responseText = await response.text();
  if (!response.ok) {
    throw new DigitalDeliveryError(
      `resend_${response.status}`,
      `Resend rejected the digital delivery with HTTP ${response.status}.`,
      { retryable: response.status === 429 || response.status >= 500 }
    );
  }
  let result;
  try { result = JSON.parse(responseText); } catch { /* handled below */ }
  if (!result?.id || typeof result.id !== "string") {
    throw new DigitalDeliveryError("resend_response_invalid", "Resend accepted the request without returning an email ID.");
  }
  return {
    provider: "resend",
    messageId: result.id,
    filenames: attachments.map((attachment) => attachment.filename)
  };
}
