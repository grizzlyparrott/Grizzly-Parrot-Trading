const encoder = new TextEncoder();

export async function hmacHex(secret, value) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function constantTimeEqual(left, right) {
  if (typeof left !== "string" || typeof right !== "string" || left.length !== right.length) return false;
  let result = 0;
  for (let i = 0; i < left.length; i += 1) result |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return result === 0;
}

export async function verifyStripeSignature(payload, header, secret, toleranceSeconds = 300) {
  if (!header || !secret) return false;
  const entries = header.split(",").map((part) => part.trim());
  const timestamp = entries.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = entries.filter((part) => part.startsWith("v1=")).map((part) => part.slice(3));
  if (!timestamp || signatures.length === 0 || !/^\d+$/.test(timestamp)) return false;
  const ageSeconds = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (ageSeconds > toleranceSeconds) return false;
  const expected = await hmacHex(secret, `${timestamp}.${payload}`);
  return signatures.some((signature) => constantTimeEqual(signature, expected));
}

export async function signedAssetUrl(baseUrl, assetKey, secret, now = Date.now()) {
  const expires = Math.floor(now / 1000) + 24 * 60 * 60;
  const material = `${assetKey}.${expires}`;
  const signature = await hmacHex(secret, material);
  return `${baseUrl.replace(/\/$/, "")}/lulu-assets/${encodeURIComponent(assetKey)}?expires=${expires}&sig=${signature}`;
}

export async function verifyAssetRequest(assetKey, expires, signature, secret, now = Date.now()) {
  if (!/^\d+$/.test(String(expires)) || Number(expires) < Math.floor(now / 1000)) return false;
  const expected = await hmacHex(secret, `${assetKey}.${expires}`);
  return constantTimeEqual(expected, signature || "");
}
