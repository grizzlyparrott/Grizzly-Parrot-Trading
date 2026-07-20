const COUNTRY = /^[A-Z]{2}$/;
const US_STATE = /^[A-Z]{2}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(value, max = 200) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function validateCheckoutRequest(input) {
  const errors = [];
  const quantity = Number(input.quantity || 1);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
    errors.push("Quantity must be a whole number from 1 to 10.");
  }
  const buyerEmail = text(input.buyerEmail, 254).toLowerCase();
  if (!EMAIL.test(buyerEmail)) errors.push("A valid email address is required.");
  const address = normalizeAddress(input.shippingAddress || {});
  if (!address.name) errors.push("Recipient name is required.");
  if (!address.street1) errors.push("Street address is required.");
  if (!address.city) errors.push("City is required.");
  if (!address.postcode) errors.push("Postal code is required.");
  if (!COUNTRY.test(address.countryCode)) errors.push("Use a two-letter country code.");
  if (address.countryCode === "US" && !US_STATE.test(address.stateCode)) {
    errors.push("A two-letter US state code is required.");
  }
  if (!address.phoneNumber || address.phoneNumber.replace(/\D/g, "").length < 7) {
    errors.push("A phone number is required by Lulu's shipping carriers.");
  }
  return { ok: errors.length === 0, errors, quantity, buyerEmail, address };
}

export function normalizeAddress(input) {
  return {
    name: text(input.name),
    street1: text(input.street1),
    street2: text(input.street2),
    city: text(input.city),
    stateCode: text(input.stateCode, 2).toUpperCase(),
    postcode: text(input.postcode, 20).toUpperCase(),
    countryCode: text(input.countryCode, 2).toUpperCase(),
    phoneNumber: text(input.phoneNumber, 40),
    isBusiness: Boolean(input.isBusiness)
  };
}

export function asLuluAddress(address) {
  return {
    name: address.name,
    street1: address.street1,
    street2: address.street2 || "",
    city: address.city,
    state_code: address.stateCode || "",
    country_code: address.countryCode,
    postcode: address.postcode,
    phone_number: address.phoneNumber,
    is_business: address.isBusiness
  };
}

export function addressesMatch(expected, received) {
  if (!received) return false;
  const actual = normalizeAddress({
    name: received.name,
    street1: received.address?.line1 ?? received.street1,
    street2: received.address?.line2 ?? received.street2,
    city: received.address?.city ?? received.city,
    stateCode: received.address?.state ?? received.state_code,
    postcode: received.address?.postal_code ?? received.postcode,
    countryCode: received.address?.country ?? received.country_code,
    phoneNumber: received.phone ?? received.phone_number
  });
  return ["name", "street1", "street2", "city", "stateCode", "postcode", "countryCode"]
    .every((key) => expected[key] === actual[key]);
}
