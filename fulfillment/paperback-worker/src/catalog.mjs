export const POD_PACKAGE_ID = "0600X0900.BW.STD.PB.060UW444.MXX";

// `luluPublishingProjectId` is retained for audit and proof-approval records.
// Lulu Direct does not accept Publishing project IDs when it creates print jobs;
// it requires a POD package plus hosted source files, represented below.
export const PAPERBACK_BOOKS = Object.freeze({
  "currency-market-structure": Object.freeze({
    slug: "currency-market-structure",
    title: "Currency Market Structure: Volume I",
    luluPublishingProjectId: "84mdgqe",
    isbn: "978-1-105-03891-4",
    podPackageId: POD_PACKAGE_ID,
    interiorPages: 100,
    priceCents: 3900,
    priceEnv: "STRIPE_PRICE_CURRENCY_PAPERBACK",
    assets: Object.freeze({
      interiorKey: "Currency-Market-Structure-Volume-I-Lulu-Paperback-Interior.pdf",
      interiorMd5: "FAFB7BF94A27485663E5FBE2C2989A2C",
      coverKey: "Currency-Market-Structure-Volume-I-Lulu-Paperback-Cover.pdf",
      coverMd5: "A6CED9A0E5D88EA1AEF3675C7F865CC3"
    })
  }),
  "metals-market-structure": Object.freeze({
    slug: "metals-market-structure",
    title: "Metals Market Structure: Volume II",
    luluPublishingProjectId: "dy4ewg4",
    isbn: "978-1-105-03858-7",
    podPackageId: POD_PACKAGE_ID,
    interiorPages: 108,
    priceCents: 3900,
    priceEnv: "STRIPE_PRICE_METALS_PAPERBACK",
    assets: Object.freeze({
      interiorKey: "Metals-Market-Structure-Volume-II-Lulu-Paperback-Interior.pdf",
      interiorMd5: "1131F1B9F0726E8298F9E4FB7EADD37D",
      coverKey: "Metals-Market-Structure-Volume-II-Lulu-Paperback-Cover.pdf",
      coverMd5: "524E132DB7A67FFCC381678D2E708120"
    })
  }),
  "equity-market-structure": Object.freeze({
    slug: "equity-market-structure",
    title: "Equity Market Structure: Volume III",
    luluPublishingProjectId: "zmnedzn",
    isbn: "978-1-105-03848-8",
    podPackageId: POD_PACKAGE_ID,
    interiorPages: 156,
    priceCents: 3900,
    priceEnv: "STRIPE_PRICE_EQUITY_PAPERBACK",
    assets: Object.freeze({
      interiorKey: "Equity-Market-Structure-Volume-III-Lulu-Paperback-Interior.pdf",
      interiorMd5: "01E4E27887150353B45B269316C76A01",
      coverKey: "Equity-Market-Structure-Volume-III-Lulu-Paperback-Cover.pdf",
      coverMd5: "C6C7E2F1B886C9AA4CDA303EF7AFDD4C"
    })
  })
});

export const SHIPPING_OPTIONS = Object.freeze({
  MAIL: "Mail",
  PRIORITY_MAIL: "Priority mail",
  EXPEDITED: "Expedited",
  EXPRESS: "Express"
});

export function getBook(slug) {
  return PAPERBACK_BOOKS[slug] || null;
}

export function getStripePriceId(book, env) {
  const value = env[book.priceEnv];
  if (!value || !value.startsWith("price_")) {
    throw new Error(`Missing Stripe price configuration for ${book.slug}`);
  }
  return value;
}
