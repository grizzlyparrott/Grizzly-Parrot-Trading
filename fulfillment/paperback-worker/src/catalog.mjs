export const POD_PACKAGE_ID = "0600X0900.BW.STD.PB.060UW444.MXX";
export const HARDCOVER_POD_PACKAGE_ID = "0600X0900.BW.STD.CW.060UW444.MXX";

// `luluPublishingProjectId` is retained for audit and proof-approval records.
// Lulu's Print API does not accept Publishing project IDs when it creates print
// jobs; it requires a POD package plus hosted source files, represented below.
export const PAPERBACK_BOOKS = Object.freeze({
  "currency-market-structure": Object.freeze({
    slug: "currency-market-structure",
    seriesSlug: "currency-market-structure",
    edition: "paperback",
    editionLabel: "Paperback",
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
    seriesSlug: "metals-market-structure",
    edition: "paperback",
    editionLabel: "Paperback",
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
    seriesSlug: "equity-market-structure",
    edition: "paperback",
    editionLabel: "Paperback",
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

export const HARDCOVER_BOOKS = Object.freeze({
  "currency-market-structure-hardcover": Object.freeze({
    slug: "currency-market-structure-hardcover",
    seriesSlug: "currency-market-structure",
    edition: "hardcover",
    editionLabel: "Hardcover",
    title: "Currency Market Structure: Volume I",
    luluPublishingProjectId: "w4g2den",
    isbn: "978-1-105-03871-6",
    podPackageId: HARDCOVER_POD_PACKAGE_ID,
    interiorPages: 100,
    priceCents: 4900,
    priceEnv: "STRIPE_PRICE_CURRENCY_HARDCOVER",
    assets: Object.freeze({
      interiorKey: "Currency-Market-Structure-Volume-I-Lulu-Hardcover-Interior.pdf",
      interiorMd5: "A1DA1AF1BC179A0A5C0D38A19D559DF0",
      coverKey: "Currency-Market-Structure-Volume-I-Lulu-Hardcover-Cover.pdf",
      coverMd5: "086E80FA3FC070DD7EBFB07789992343"
    })
  }),
  "metals-market-structure-hardcover": Object.freeze({
    slug: "metals-market-structure-hardcover",
    seriesSlug: "metals-market-structure",
    edition: "hardcover",
    editionLabel: "Hardcover",
    title: "Metals Market Structure: Volume II",
    luluPublishingProjectId: "dy4ewd4",
    isbn: "978-1-105-03854-9",
    podPackageId: HARDCOVER_POD_PACKAGE_ID,
    interiorPages: 108,
    priceCents: 4900,
    priceEnv: "STRIPE_PRICE_METALS_HARDCOVER",
    assets: Object.freeze({
      interiorKey: "Metals-Market-Structure-Volume-II-Lulu-Hardcover-Interior.pdf",
      interiorMd5: "8095E8D266AAC7CA9672967A7721065A",
      coverKey: "Metals-Market-Structure-Volume-II-Lulu-Hardcover-Cover.pdf",
      coverMd5: "707B6BDE07A8DA39EF30E5F2995185B0"
    })
  }),
  "equity-market-structure-hardcover": Object.freeze({
    slug: "equity-market-structure-hardcover",
    seriesSlug: "equity-market-structure",
    edition: "hardcover",
    editionLabel: "Hardcover",
    title: "Equity Market Structure: Volume III",
    luluPublishingProjectId: "w4g2dgr",
    isbn: "978-1-105-03842-6",
    podPackageId: HARDCOVER_POD_PACKAGE_ID,
    interiorPages: 156,
    priceCents: 4900,
    priceEnv: "STRIPE_PRICE_EQUITY_HARDCOVER",
    assets: Object.freeze({
      interiorKey: "Equity-Market-Structure-Volume-III-Lulu-Hardcover-Interior.pdf",
      interiorMd5: "809BD44AD7E96FEB95C1427CF4F5F679",
      coverKey: "Equity-Market-Structure-Volume-III-Lulu-Hardcover-Cover.pdf",
      coverMd5: "E75A14B974E92B2CBD7C628D8936C348"
    })
  })
});

// These records pin the ISBN-final production files and verified Lulu identity
// and list-price data. They are release-controlled catalog entries: direct-site
// checkout remains fail-closed until file validation, direct-sales approval,
// Stripe, policy, and title-specific sales gates are supplied explicitly.
// Physical-proof and retail-distribution state is tracked separately and is not
// misrepresented by the direct-site approval gate.
export const PROBABILISTIC_EXECUTION_PRINT_EDITIONS = Object.freeze({
  "probabilistic-execution": Object.freeze({
    slug: "probabilistic-execution",
    seriesSlug: "probabilistic-execution",
    releaseKey: "PROBABILISTIC_EXECUTION",
    catalogStatus: "release-controlled",
    edition: "paperback",
    editionLabel: "Paperback",
    title: "Probabilistic Execution: Tactics to Avoid the Guillotine",
    luluPublishingProjectId: "yvep5mw",
    isbn: "978-0-557-95654-8",
    podPackageId: POD_PACKAGE_ID,
    interiorPages: 148,
    priceCents: 3900,
    priceEnv: "STRIPE_PRICE_PROBABILISTIC_PAPERBACK",
    assets: Object.freeze({
      interiorKey: "probabilistic-execution/list-restart-2026-08-13/Probabilistic-Execution-Lulu-Paperback-Interior.pdf",
      interiorMd5: "2660805CD72253BC9315A3C082AC1A62",
      coverKey: "Probabilistic-Execution-Lulu-Paperback-Cover.pdf",
      coverMd5: "5E98FA34140EA9CF97ACF575AEF6501B"
    })
  }),
  "probabilistic-execution-hardcover": Object.freeze({
    slug: "probabilistic-execution-hardcover",
    seriesSlug: "probabilistic-execution",
    releaseKey: "PROBABILISTIC_EXECUTION",
    catalogStatus: "release-controlled",
    edition: "hardcover",
    editionLabel: "Hardcover",
    title: "Probabilistic Execution: Tactics to Avoid the Guillotine",
    luluPublishingProjectId: "7kz7vk8",
    isbn: "978-0-557-95653-1",
    podPackageId: HARDCOVER_POD_PACKAGE_ID,
    interiorPages: 148,
    priceCents: 4900,
    priceEnv: "STRIPE_PRICE_PROBABILISTIC_HARDCOVER",
    assets: Object.freeze({
      interiorKey: "probabilistic-execution/list-restart-2026-08-13/Probabilistic-Execution-Lulu-Hardcover-Interior.pdf",
      interiorMd5: "410B05415AD1433753AB9158F2E8ACB5",
      coverKey: "Probabilistic-Execution-Lulu-Hardcover-Cover.pdf",
      coverMd5: "70162A861C8524468D579E068C2E2137"
    })
  })
});

export const PRINT_EDITIONS = Object.freeze({
  ...PAPERBACK_BOOKS,
  ...HARDCOVER_BOOKS,
  ...PROBABILISTIC_EXECUTION_PRINT_EDITIONS
});
export const ALL_PRINT_EDITIONS = PRINT_EDITIONS;

export const SHIPPING_OPTIONS = Object.freeze({
  MAIL: "Mail",
  PRIORITY_MAIL: "Priority mail",
  EXPEDITED: "Expedited",
  EXPRESS: "Express"
});

export function getBook(slug, edition = "paperback") {
  const normalizedEdition = edition === "hardcover" ? "hardcover" : "paperback";
  if (normalizedEdition === "hardcover" && !String(slug || "").endsWith("-hardcover")) {
    return ALL_PRINT_EDITIONS[`${slug}-hardcover`] || null;
  }
  if (ALL_PRINT_EDITIONS[slug]) return ALL_PRINT_EDITIONS[slug];
  const key = normalizedEdition === "hardcover" ? `${slug}-hardcover` : slug;
  return ALL_PRINT_EDITIONS[key] || null;
}

export function catalogReady(book) {
  return Boolean(
    book
    && book.catalogStatus !== "staged"
    && typeof book.luluPublishingProjectId === "string"
    && book.luluPublishingProjectId.length > 0
    && typeof book.isbn === "string"
    && book.isbn.length > 0
    && Number.isInteger(book.priceCents)
    && book.priceCents > 0
    && typeof book.priceEnv === "string"
    && book.priceEnv.length > 0
  );
}

export function getStripePriceId(book, env) {
  if (!catalogReady(book)) {
    throw new Error(`Print catalog is incomplete for ${book?.slug || "unknown edition"}`);
  }
  const value = env[book.priceEnv];
  if (!value || !value.startsWith("price_")) {
    throw new Error(`Missing Stripe price configuration for ${book.slug}`);
  }
  return value;
}
