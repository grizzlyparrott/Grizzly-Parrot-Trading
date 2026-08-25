const RESEND_EMAIL_LIMIT_BYTES = 40 * 1024 * 1024;

export const PROBABILISTIC_DIGITAL_DELIVERY = Object.freeze({
  eventLabel: "probabilistic_execution",
  title: "Probabilistic Execution",
  deliveryEnabledEnv: "PROBABILISTIC_EXECUTION_DIGITAL_DELIVERY_ENABLED",
  idempotencyPrefix: "probabilistic-digital",
  tagValue: "probabilistic_execution",
  liveSubject: "Your Probabilistic Execution Download (PDF + EPUB)",
  testSubject: "[TEST - NO PURCHASE] Probabilistic Execution Delivery (PDF + EPUB)",
  liveHtml: `<p>Thanks for your purchase of <strong>Probabilistic Execution</strong>.</p>
    <p>Your professionally typeset PDF and reflowable EPUB are attached to this email.</p>
    <p>If either attachment is blocked by your email provider, reply to this email and we will help.</p>`,
  testHtml: `<p><strong>This is a delivery-pipeline test. No purchase or charge occurred.</strong></p>
    <p>The proofread-final PDF and EPUB for <strong>Probabilistic Execution</strong> are attached for verification.</p>`,
  assets: Object.freeze([
    Object.freeze({
      key: "digital/probabilistic-execution/list-restart-2026-08-13/Probabilistic-Execution-Digital.pdf",
      filename: "Probabilistic-Execution-Digital.pdf",
      contentType: "application/pdf",
      sha256: "1D834086444030212CE763A02471A5BEFB78BCC4FFFCD1F21FE66AC2883B78B3"
    }),
    Object.freeze({
      key: "digital/probabilistic-execution/Probabilistic-Execution-Digital.epub",
      filename: "Probabilistic-Execution-Digital.epub",
      contentType: "application/epub+zip",
      sha256: "FD0AF7994539BD106D01BE2755CF069A8D10B2AADCCD287390D7EA41C778495E"
    })
  ])
});

export const MARKET_STRUCTURE_TRILOGY_DIGITAL_DELIVERY = Object.freeze({
  eventLabel: "market_structure_trilogy",
  title: "Market Structure Digital Trilogy",
  deliveryEnabledEnv: "MARKET_STRUCTURE_TRILOGY_DIGITAL_DELIVERY_ENABLED",
  idempotencyPrefix: "market-structure-trilogy-digital",
  tagValue: "market_structure_trilogy",
  liveSubject: "Your Market Structure Digital Trilogy Downloads (PDF + EPUB)",
  testSubject: "[TEST - NO PURCHASE] Market Structure Digital Trilogy Delivery",
  liveHtml: `<p>Thanks for purchasing the <strong>Market Structure Digital Trilogy</strong>.</p>
    <p>Your Currency, Metals, and Equity Market Structure PDFs and EPUBs are attached to this email.</p>
    <p>If an attachment is blocked by your email provider, reply to this email and we will help.</p>`,
  testHtml: `<p><strong>This is a delivery-pipeline test. No purchase or charge occurred.</strong></p>
    <p>All six Market Structure Digital Trilogy files are attached for verification.</p>`,
  assets: Object.freeze([
    Object.freeze({
      key: "digital/market-structure-trilogy/2026-07-19/Currency-Market-Structure-Volume-I.pdf",
      sourceRelativePath: "Volume I - Currency Market Structure/Sale Assets/Currency-Market-Structure-Volume-I.pdf",
      filename: "Currency-Market-Structure-Volume-I.pdf",
      contentType: "application/pdf",
      sha256: "40A6D2EE25A0CB6B66B66DAD1CD6E99F66748A79C4FA37E477FB9BDECBA61F45"
    }),
    Object.freeze({
      key: "digital/market-structure-trilogy/2026-07-19/Currency-Market-Structure-Volume-I.epub",
      sourceRelativePath: "Volume I - Currency Market Structure/Sale Assets/Currency-Market-Structure-Volume-I.epub",
      filename: "Currency-Market-Structure-Volume-I.epub",
      contentType: "application/epub+zip",
      sha256: "B207CA5C1A222492A98753DC76E8EAC31FB3D873DB0F0E38B725F36398004092"
    }),
    Object.freeze({
      key: "digital/market-structure-trilogy/2026-07-19/Metals-Market-Structure-Volume-II.pdf",
      sourceRelativePath: "Volume II - Metals Market Structure/Sale Assets/Metals-Market-Structure-Volume-II.pdf",
      filename: "Metals-Market-Structure-Volume-II.pdf",
      contentType: "application/pdf",
      sha256: "770BACC423F87123995F3871B8EF84E0AFD28700381B0D01CA8D9305F449B508"
    }),
    Object.freeze({
      key: "digital/market-structure-trilogy/2026-07-19/Metals-Market-Structure-Volume-II.epub",
      sourceRelativePath: "Volume II - Metals Market Structure/Sale Assets/Metals-Market-Structure-Volume-II.epub",
      filename: "Metals-Market-Structure-Volume-II.epub",
      contentType: "application/epub+zip",
      sha256: "E079E9C195046D5DA09AF20A3915D3109C0E46BC1E6E2CA5C5C7A8A89372C8F1"
    }),
    Object.freeze({
      key: "digital/market-structure-trilogy/2026-07-19/Equity-Market-Structure-Volume-III.pdf",
      sourceRelativePath: "Volume III - Equity Market Structure/Sale Assets/Equity-Market-Structure-Volume-III.pdf",
      filename: "Equity-Market-Structure-Volume-III.pdf",
      contentType: "application/pdf",
      sha256: "C5F28149A6259B37234E738105B6D6FCAB6B91C22D78C5CBBB07D916E8ABC601"
    }),
    Object.freeze({
      key: "digital/market-structure-trilogy/2026-07-19/Equity-Market-Structure-Volume-III.epub",
      sourceRelativePath: "Volume III - Equity Market Structure/Sale Assets/Equity-Market-Structure-Volume-III.epub",
      filename: "Equity-Market-Structure-Volume-III.epub",
      contentType: "application/epub+zip",
      sha256: "8C6620E64969CAA6B2AD216FC90DC46AF7E929775D5C757DA8D80DA5614A6332"
    })
  ])
});

export const DIGITAL_DELIVERY_CONFIGURATIONS = Object.freeze({
  [PROBABILISTIC_DIGITAL_DELIVERY.eventLabel]: PROBABILISTIC_DIGITAL_DELIVERY,
  [MARKET_STRUCTURE_TRILOGY_DIGITAL_DELIVERY.eventLabel]: MARKET_STRUCTURE_TRILOGY_DIGITAL_DELIVERY
});

export function getDigitalDeliveryConfiguration(eventLabel) {
  return DIGITAL_DELIVERY_CONFIGURATIONS[eventLabel] || null;
}

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

export function digitalDeliveryConfigured(env, configuration = PROBABILISTIC_DIGITAL_DELIVERY) {
  return env?.[configuration.deliveryEnabledEnv || "PROBABILISTIC_EXECUTION_DIGITAL_DELIVERY_ENABLED"] === "true"
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

export async function sendDigitalDelivery(env, delivery, {
  fetchImpl = fetch,
  configuration = PROBABILISTIC_DIGITAL_DELIVERY
} = {}) {
  if (!digitalDeliveryConfigured(env, configuration)) {
    throw new DigitalDeliveryError("digital_delivery_not_configured", `${configuration.title || "Digital"} delivery is not enabled and fully configured.`);
  }
  if (!delivery?.buyer_email || !delivery?.stripe_session_id) {
    throw new DigitalDeliveryError("digital_delivery_record_invalid", "The paid delivery record is missing its buyer email or Stripe session ID.");
  }

  const attachments = [];
  for (const asset of configuration.assets) attachments.push(await loadVerifiedAttachment(env, asset));

  const isTestDelivery = delivery.stripe_session_id.startsWith("cs_test_");
  const title = configuration.title || "Probabilistic Execution";
  const tagValue = configuration.tagValue || configuration.eventLabel || "probabilistic_execution";
  const idempotencyPrefix = configuration.idempotencyPrefix || "probabilistic-digital";
  const message = {
    from: env.DIGITAL_EMAIL_FROM,
    to: delivery.buyer_email,
    reply_to: env.DIGITAL_REPLY_TO || env.SHOP_CONTACT_EMAIL || undefined,
    subject: isTestDelivery
      ? (configuration.testSubject || `[TEST - NO PURCHASE] ${title} Delivery`)
      : (configuration.liveSubject || `Your ${title} Downloads`),
    html: isTestDelivery
      ? (configuration.testHtml || `<p><strong>This is a delivery-pipeline test. No purchase or charge occurred.</strong></p><p>The ${title} files are attached for verification.</p>`)
      : (configuration.liveHtml || `<p>Thanks for your purchase of <strong>${title}</strong>.</p><p>Your files are attached to this email.</p>`),
    attachments: attachments.map(({ filename, content }) => ({ filename, content })),
    tags: [
      { name: "book", value: tagValue },
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
        "Idempotency-Key": `${idempotencyPrefix}-${delivery.stripe_session_id}`
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

export function sendProbabilisticDigitalDelivery(env, delivery, options = {}) {
  return sendDigitalDelivery(env, delivery, {
    ...options,
    configuration: options.configuration || PROBABILISTIC_DIGITAL_DELIVERY
  });
}
