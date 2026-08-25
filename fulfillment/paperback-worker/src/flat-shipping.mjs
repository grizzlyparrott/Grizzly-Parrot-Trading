const COUNTRY_CODE = /^[A-Z]{2}$/;
const APPROVED_US_CENTS = 749;
const APPROVED_INTERNATIONAL_CENTS = 1999;

// Stripe Checkout accepts ISO 3166-1 alpha-2 destinations plus AC, TA, and XK.
// This list deliberately excludes the country and territory codes Stripe marks
// unsupported for shipping-address collection.
const STRIPE_CHECKOUT_COUNTRIES = Object.freeze((
  "AC,AD,AE,AF,AG,AI,AL,AM,AO,AQ,AR,AT,AU,AW,AX,AZ," +
  "BA,BB,BD,BE,BF,BG,BH,BI,BJ,BL,BM,BN,BO,BQ,BR,BS,BT,BV,BW,BY,BZ," +
  "CA,CD,CF,CG,CH,CI,CK,CL,CM,CN,CO,CR,CV,CW,CY,CZ," +
  "DE,DJ,DK,DM,DO,DZ,EC,EE,EG,EH,ER,ES,ET,FI,FJ,FK,FO,FR," +
  "GA,GB,GD,GE,GF,GG,GH,GI,GL,GM,GN,GP,GQ,GR,GS,GT,GU,GW,GY," +
  "HK,HN,HR,HT,HU,ID,IE,IL,IM,IN,IO,IQ,IS,IT,JE,JM,JO,JP," +
  "KE,KG,KH,KI,KM,KN,KR,KW,KY,KZ,LA,LB,LC,LI,LK,LR,LS,LT,LU,LV,LY," +
  "MA,MC,MD,ME,MF,MG,MK,ML,MM,MN,MO,MQ,MR,MS,MT,MU,MV,MW,MX,MY,MZ," +
  "NA,NC,NE,NG,NI,NL,NO,NP,NR,NU,NZ,OM,PA,PE,PF,PG,PH,PK,PL,PM,PN,PR,PS,PT,PY," +
  "QA,RE,RO,RS,RU,RW,SA,SB,SC,SE,SG,SH,SI,SJ,SK,SL,SM,SN,SO,SR,SS,ST,SV,SX,SZ," +
  "TA,TC,TD,TF,TG,TH,TJ,TK,TL,TM,TN,TO,TR,TT,TV,TW,TZ,UA,UG,US,UY,UZ," +
  "VA,VC,VE,VG,VN,VU,WF,WS,XK,YE,YT,ZA,ZM,ZW"
).split(","));

// Lulu's current global-shipping exclusion list. Codes Stripe already excludes
// are repeated here where applicable so this policy remains clear and auditable.
const LULU_UNAVAILABLE_COUNTRIES = new Set((
  "AC,BY,CF,KM,CU,GQ,FK,GW,IR,KI,MM,NR,NU,KP,RU,SH,PM,ST,SL,SB,SO,SS,SD,SY,TA,TJ,TK,TM,TV,UA,VE,YE,UM"
).split(","));

export const DEFAULT_INTERNATIONAL_COUNTRIES = Object.freeze(
  STRIPE_CHECKOUT_COUNTRIES.filter((code) => code !== "US" && !LULU_UNAVAILABLE_COUNTRIES.has(code))
);

function parseCents(value) {
  const cents = Number(value);
  return Number.isInteger(cents) && cents > 0 && cents <= 100000 ? cents : null;
}

function configuredInternationalCountries(env) {
  const configured = String(env.PAPERBACK_INTERNATIONAL_COUNTRIES || "").trim();
  if (!configured) return DEFAULT_INTERNATIONAL_COUNTRIES;
  const stripeCountries = new Set(STRIPE_CHECKOUT_COUNTRIES);
  return [...new Set(configured
    .split(",")
    .map((value) => value.trim().toUpperCase())
    .filter((value) => COUNTRY_CODE.test(value)
      && value !== "US"
      && stripeCountries.has(value)
      && !LULU_UNAVAILABLE_COUNTRIES.has(value)))];
}

export function flatShippingConfig(env) {
  const usCents = parseCents(env.PAPERBACK_FLAT_RATE_US_CENTS);
  const internationalCents = parseCents(env.PAPERBACK_FLAT_RATE_INTERNATIONAL_CENTS);
  const internationalCountries = configuredInternationalCountries(env);
  return {
    enabled: usCents === APPROVED_US_CENTS
      && internationalCents === APPROVED_INTERNATIONAL_CENTS
      && internationalCountries.length > 0,
    currency: "USD",
    usCents,
    internationalCents,
    internationalCountries
  };
}

export function flatShippingSelection(env, region) {
  const config = flatShippingConfig(env);
  if (!config.enabled) return null;
  if (region === "us") {
    return {
      region,
      cents: config.usCents,
      currency: config.currency,
      countries: ["US"],
      displayName: "U.S. flat-rate shipping"
    };
  }
  if (region === "international") {
    return {
      region,
      cents: config.internationalCents,
      currency: config.currency,
      countries: config.internationalCountries,
      displayName: "International flat-rate shipping"
    };
  }
  return null;
}

export function countryMatchesFlatRegion(env, region, countryCode) {
  const selection = flatShippingSelection(env, region);
  return Boolean(selection && selection.countries.includes(String(countryCode || "").toUpperCase()));
}
