import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const STAGES = Object.freeze(["local", "provider", "proof", "private", "release"]);
const SELECTABLE_STAGES = Object.freeze([...STAGES, "digital"]);
const EXPECTED = Object.freeze({
  book: Object.freeze({
    slug: "probabilistic-execution",
    title: "Probabilistic Execution",
    subtitle: "Tactics to Avoid the Guillotine",
    author: "Kyle Parrott",
    publisher: "Grizzly Parrot Trading"
  }),
  editorialReview: Object.freeze({
    reviewedMasterSha256: "859CE56ABC8FD412C00B7FC84309FCFC2F19C1DDB12A860E3195605DCF9D7D0B",
    reportSha256: "01F5D34A5C4E31C44F72CB429366B0D0777E4A4E2BAE8C4D9044121D784BC555",
    correctionsLedgerSha256: "F31BC9FB865FFB01CB8672E1CA272AC4AB1FDB2F1669F7B273AF60D552CE552E",
    postAdjudicationMasterSha256: "DEB166A98EB512B82FD0DEF23FAA4D3A08CB6A656B7B1A305FB5923A3CB71019"
  }),
  digital: Object.freeze({
    priceCents: 2900,
    currency: "USD",
    pdf: Object.freeze({
      filename: "Probabilistic-Execution-Digital.pdf",
      sha256: "6859F32798DD82D119ED9685B15D290CB0548440B40FC4CC835871C1EC59D9F3"
    }),
    epub: Object.freeze({
      filename: "Probabilistic-Execution-Digital.epub",
      sha256: "FD0AF7994539BD106D01BE2755CF069A8D10B2AADCCD287390D7EA41C778495E"
    })
  }),
  print: Object.freeze({
    paperback: Object.freeze({
      edition: "paperback",
      podPackageId: "0600X0900.BW.STD.PB.060UW444.MXX",
      interiorFilename: "Probabilistic-Execution-Lulu-Paperback-Interior.pdf",
      coverFilename: "Probabilistic-Execution-Lulu-Paperback-Cover.pdf",
      preIsbnInteriorMd5: "66FAD12D58D3297F868B8C92B5299677",
      preIsbnCoverMd5: "0CE8353FE6433F49995763DE1B92A4CF",
      finalInteriorMd5: "243BC3729F9C95B76780A6E0AF3EB064",
      finalCoverMd5: "5E98FA34140EA9CF97ACF575AEF6501B",
      proofQuote: Object.freeze({
        quantity: 1,
        printingCents: 569,
        distributionFeeCents: 499,
        shippingCents: 569,
        taxCents: 81,
        totalCents: 1718,
        shippingMethod: "Mail"
      })
    }),
    hardcover: Object.freeze({
      edition: "hardcover",
      podPackageId: "0600X0900.BW.STD.CW.060UW444.MXX",
      interiorFilename: "Probabilistic-Execution-Lulu-Hardcover-Interior.pdf",
      coverFilename: "Probabilistic-Execution-Lulu-Hardcover-Cover.pdf",
      preIsbnInteriorMd5: "216F1DA3D01E94A97DB10370BDA1F2CB",
      preIsbnCoverMd5: "54F235F2C4800C907430E952975FC64C",
      finalInteriorMd5: "AB4CE571C3FED8931EEB6788A9E0ED99",
      finalCoverMd5: "70162A861C8524468D579E068C2E2137",
      proofQuote: Object.freeze({
        quantity: 1,
        printingCents: 1438,
        distributionFeeCents: 499,
        shippingCents: 569,
        taxCents: 148,
        totalCents: 2654,
        shippingMethod: "Mail"
      })
    })
  })
});

function add(errors, condition, message) {
  if (!condition) errors.push(message);
}

function valueAt(object, path) {
  return path.split(".").reduce((value, key) => value?.[key], object);
}

function realIdentifier(value, prefix) {
  return typeof value === "string"
    && value.startsWith(prefix)
    && value.length > prefix.length + 5
    && !/(?:pending|placeholder|example|dummy|test)/i.test(value);
}

function validHash(value, length) {
  return typeof value === "string" && new RegExp(`^[A-F0-9]{${length}}$`).test(value);
}

export function normalizeIsbn(value) {
  if (typeof value !== "string") return null;
  const digits = value.replace(/\D/g, "");
  if (!/^(?:978|979)\d{10}$/.test(digits)) return null;
  const sum = [...digits.slice(0, 12)].reduce(
    (total, digit, index) => total + Number(digit) * (index % 2 === 0 ? 1 : 3),
    0
  );
  const check = (10 - (sum % 10)) % 10;
  return check === Number(digits[12]) ? digits : null;
}

function validCheckoutUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:"
      && parsed.hostname === "buy.stripe.com"
      && parsed.pathname.length > 6
      && !/(?:test|example|placeholder)/i.test(parsed.pathname);
  } catch {
    return false;
  }
}

function localChecks(manifest) {
  const errors = [];
  add(errors, manifest?.schemaVersion === 1, "schemaVersion must equal 1");
  for (const [field, expected] of Object.entries(EXPECTED.book)) {
    add(errors, valueAt(manifest, `book.${field}`) === expected, `book.${field} must equal ${JSON.stringify(expected)}`);
  }
  add(errors, manifest?.printProvider === "lulu", "printProvider must remain Lulu");
  add(
    errors,
    manifest?.distribution?.salesMode === "grizzly-direct-plus-lulu-global-distribution",
    "distribution.salesMode must match the established Grizzly direct plus Lulu Global Distribution model"
  );
  for (const field of [
    "grizzlyDirectLuluPrintApiTarget",
    "luluBookstoreTarget",
    "luluGlobalDistributionTarget",
    "amazonRetailViaLuluTarget"
  ]) {
    add(errors, manifest?.distribution?.[field] === true, `distribution.${field} must remain enabled as a release target`);
  }
  for (const field of [
    "luluGlobalDistributionSubmitted",
    "luluGlobalDistributionApproved",
    "luluBookstorePublished"
  ]) {
    add(errors, typeof manifest?.distribution?.[field] === "boolean", `distribution.${field} must be an explicit provider state`);
  }
  add(
    errors,
    manifest?.distribution?.luluPrivatePublicationCompleted === true,
    "both Lulu editions must be privately published before proof ordering"
  );
  add(
    errors,
    ["private", "select", "general"].includes(manifest?.distribution?.luluBookstoreAccess),
    "distribution.luluBookstoreAccess must be private, select, or general"
  );
  add(
    errors,
    typeof manifest?.distribution?.retailerAvailabilityActive === "boolean",
    "distribution.retailerAvailabilityActive must be an explicit provider state"
  );
  if (manifest?.distribution?.luluBookstorePublished === false) {
    add(
      errors,
      manifest?.distribution?.luluBookstoreAccess === "private",
      "Lulu Bookstore access must remain private until Lulu Bookstore publication is verified"
    );
  } else if (manifest?.distribution?.luluBookstorePublished === true) {
    add(
      errors,
      ["select", "general"].includes(manifest?.distribution?.luluBookstoreAccess),
      "a published Lulu Bookstore edition must use select or general access"
    );
  }
  if (manifest?.distribution?.luluGlobalDistributionApproved !== true) {
    add(
      errors,
      manifest?.distribution?.retailerAvailabilityActive === false,
      "retailer availability must remain inactive until Lulu Global Distribution approval is verified"
    );
  }
  add(errors, manifest?.distribution?.reviewFeeCentsPerBinding === 499, "the verified Lulu distribution review fee must be 499 cents per binding");
  add(errors, /^\d{4}-\d{2}-\d{2}$/.test(manifest?.distribution?.reviewFeeVerifiedAt || ""), "the distribution review fee verification date is missing");
  add(errors, typeof manifest?.distribution?.reviewFeePaymentsVerified === "boolean", "distribution.reviewFeePaymentsVerified must be an explicit provider state");
  add(errors, manifest?.distribution?.amazonKdpUsed === false, "Amazon KDP must not be used");
  add(
    errors,
    manifest?.isbnPolicy === "lulu-free",
    "isbnPolicy must match the Lulu-assigned free ISBN route used by the existing print editions"
  );
  add(errors, manifest?.editorialReview?.required === true, "independent second-agent proofreading must remain a required release gate");
  add(errors, manifest?.editorialReview?.reviewerType === "independent-codex-agent", "editorial reviewer must be an independent Codex agent");
  for (const [field, expected] of Object.entries(EXPECTED.editorialReview)) {
    add(
      errors,
      manifest?.editorialReview?.[field] === expected,
      `editorialReview.${field} must match the independently verified proofread evidence`
    );
  }
  for (const field of ["completed", "findingsAdjudicated", "acceptedCorrectionsPropagated"]) {
    add(errors, manifest?.editorialReview?.[field] === true, `editorialReview.${field} must be true after proofread adjudication`);
  }

  add(errors, manifest?.digital?.priceCents === EXPECTED.digital.priceCents, "digital.priceCents must remain 2900");
  add(errors, manifest?.digital?.currency === EXPECTED.digital.currency, "digital.currency must remain USD");
  for (const format of ["pdf", "epub"]) {
    const expected = EXPECTED.digital[format];
    add(errors, valueAt(manifest, `digital.assets.${format}.filename`) === expected.filename, `digital ${format} filename mismatch`);
    add(errors, valueAt(manifest, `digital.assets.${format}.sha256`) === expected.sha256, `digital ${format} SHA-256 mismatch`);
  }
  add(errors, manifest?.digital?.deliveryProvider === "resend", "digital.deliveryProvider must preserve the established Resend provider");
  add(errors, manifest?.digital?.deliveryMode === "private-email-attachments", "digital.deliveryMode must be private-email-attachments");
  for (const field of ["deliveryAssetsUploaded", "deliveryMigrationApplied", "deliveryWorkerDeployed"]) {
    add(errors, typeof manifest?.digital?.[field] === "boolean", `digital.${field} must be an explicit boolean`);
  }
  add(errors, typeof manifest?.digital?.paymentLinkActive === "boolean", "digital.paymentLinkActive must be an explicit boolean");
  add(
    errors,
    manifest?.digital?.salesActivationApproved === true || manifest?.digital?.paymentLinkActive === false,
    "the digital Payment Link must remain deactivated until digital sales activation is approved"
  );

  for (const binding of ["paperback", "hardcover"]) {
    const record = manifest?.print?.[binding];
    const expected = EXPECTED.print[binding];
    add(errors, record?.edition === expected.edition, `${binding}.edition mismatch`);
    add(errors, record?.podPackageId === expected.podPackageId, `${binding}.podPackageId mismatch`);
    add(errors, record?.pageCount === 148, `${binding}.pageCount must equal 148`);
    add(errors, record?.interior?.filename === expected.interiorFilename, `${binding} interior filename mismatch`);
    add(errors, record?.cover?.filename === expected.coverFilename, `${binding} cover filename mismatch`);
    add(errors, ["pre-isbn", "isbn-final"].includes(record?.fileStage), `${binding}.fileStage must be pre-isbn or isbn-final`);
    add(errors, Number.isInteger(record?.manufacturingCostCents) && record.manufacturingCostCents > 0, `${binding}.manufacturingCostCents must be a positive integer`);
    const quote = record?.proofQuote;
    const expectedQuote = expected.proofQuote;
    add(errors, /^\d{4}-\d{2}-\d{2}$/.test(quote?.quotedAt || ""), `${binding} proof quote date is missing`);
    for (const [field, expectedValue] of Object.entries(expectedQuote)) {
      add(errors, quote?.[field] === expectedValue, `${binding} proofQuote.${field} must equal ${JSON.stringify(expectedValue)}`);
    }
    add(errors, quote?.printingCents === record?.manufacturingCostCents, `${binding} proof printing cost must match the verified manufacturing cost`);
    add(errors, quote?.distributionFeeCents === manifest?.distribution?.reviewFeeCentsPerBinding, `${binding} proof distribution fee must match the verified per-binding fee`);
    add(
      errors,
      Number.isInteger(quote?.totalCents)
        && quote.totalCents === quote.printingCents + quote.distributionFeeCents + quote.shippingCents + quote.taxCents,
      `${binding} proof quote total does not equal printing plus distribution fee plus shipping plus tax`
    );
    if (record?.fileStage === "pre-isbn") {
      add(errors, record?.interior?.md5 === expected.preIsbnInteriorMd5, `${binding} pre-ISBN interior MD5 mismatch`);
      add(errors, record?.cover?.md5 === expected.preIsbnCoverMd5, `${binding} pre-ISBN cover MD5 mismatch`);
    } else if (record?.fileStage === "isbn-final") {
      add(errors, record?.interior?.md5 === expected.finalInteriorMd5, `${binding} final interior MD5 mismatch`);
      add(errors, record?.cover?.md5 === expected.finalCoverMd5, `${binding} final cover MD5 mismatch`);
    }
  }
  return errors;
}

function providerChecks(manifest) {
  const errors = [];
  add(errors, manifest?.editorialReview?.completed === true, "independent second-agent proofreading is not complete");
  add(errors, validHash(manifest?.editorialReview?.reportSha256, 64), "independent proofread report SHA-256 is missing or invalid");
  add(errors, validHash(manifest?.editorialReview?.correctionsLedgerSha256, 64), "independent proofread corrections-ledger SHA-256 is missing or invalid");
  add(errors, manifest?.editorialReview?.findingsAdjudicated === true, "independent proofread findings have not been adjudicated");
  add(errors, validHash(manifest?.editorialReview?.postAdjudicationMasterSha256, 64), "post-adjudication master SHA-256 is missing or invalid");
  add(errors, manifest?.editorialReview?.acceptedCorrectionsPropagated === true, "accepted proofread corrections have not been propagated to every edition");
  add(errors, manifest?.isbnPolicy === "lulu-free", "isbnPolicy must use Lulu-assigned free ISBNs");
  add(
    errors,
    manifest?.isbnBibliographicPublisher === "Lulu.com",
    "the assigned ISBN bibliographic publisher must be verified as Lulu.com"
  );
  add(errors, manifest?.isbnAssignmentVerified === true, "both Lulu ISBN assignments have not been verified in the provider account");
  const isbns = [];
  for (const binding of ["paperback", "hardcover"]) {
    const record = manifest?.print?.[binding];
    const expected = EXPECTED.print[binding];
    add(errors, realIdentifier(record?.luluPublishingProjectId, ""), `${binding} Lulu publishing project ID is missing or placeholder`);
    const isbn = normalizeIsbn(record?.isbn);
    add(errors, Boolean(isbn), `${binding} ISBN-13 is missing or invalid`);
    if (isbn) isbns.push(isbn);
    add(errors, record?.fileStage === "isbn-final", `${binding} files are not marked isbn-final`);
    add(errors, record?.filesValidated === true, `${binding} provider file validation is not complete`);
    add(
      errors,
      typeof record?.distributionCover?.filename === "string" && record.distributionCover.filename.endsWith(".pdf"),
      `${binding} distribution-cover filename is missing`
    );
    add(errors, record?.distributionCover?.templateVerified === true, `${binding} distribution-cover template geometry is not verified`);
    add(errors, validHash(record?.distributionCover?.md5, 32), `${binding} distribution-cover MD5 is missing or invalid`);
    add(errors, record?.distributionCover?.filesValidated === true, `${binding} distribution-cover provider validation is not complete`);
    add(errors, /^\d{4}-\d{2}-\d{2}$/.test(record?.manufacturingCostVerifiedAt || ""), `${binding} manufacturing cost verification date is missing`);
    if (record?.fileStage === "isbn-final") {
      add(errors, record?.interior?.md5 !== expected.preIsbnInteriorMd5, `${binding} final interior still has the pre-ISBN hash`);
      add(errors, record?.cover?.md5 !== expected.preIsbnCoverMd5, `${binding} final cover still has the pre-ISBN hash`);
    }
  }
  add(errors, isbns.length === 2 && new Set(isbns).size === 2, "paperback and hardcover must have two distinct valid ISBNs");
  return errors;
}

function proofChecks(manifest) {
  const errors = [];
  add(
    errors,
    manifest?.distribution?.reviewFeePaymentsVerified === true,
    "the two Lulu distribution review fee payments have not been verified"
  );
  for (const binding of ["paperback", "hardcover"]) {
    const record = manifest?.print?.[binding];
    add(errors, realIdentifier(record?.proofOrderId, ""), `${binding} proof order ID is missing or placeholder`);
    add(errors, record?.proofReceived === true, `${binding} proof has not been received`);
    add(errors, record?.userProofAccepted === true, `${binding} physical proof has not been accepted by the user`);
  }
  return errors;
}

function privateChecks(manifest) {
  const errors = [];
  const digital = manifest?.digital;
  add(errors, realIdentifier(digital?.stripeProductId, "prod_"), "digital Stripe Product ID is missing or placeholder");
  add(errors, realIdentifier(digital?.stripePriceId, "price_"), "digital Stripe Price ID is missing or placeholder");
  add(errors, realIdentifier(digital?.paymentLinkId, "plink_"), "digital Stripe Payment Link ID is missing or placeholder");
  add(errors, validCheckoutUrl(digital?.checkoutUrl), "digital Stripe checkout URL is missing, placeholder, or not on buy.stripe.com");
  add(errors, digital?.deliveryAssetsUploaded === true, "digital delivery assets have not been uploaded to private R2 storage");
  add(errors, digital?.deliveryMigrationApplied === true, "digital delivery D1 migration has not been applied");
  add(errors, digital?.deliveryWorkerDeployed === true, "digital delivery Worker has not been deployed and verified");
  add(errors, realIdentifier(digital?.deliveryConfigurationId, ""), "digital delivery configuration ID is missing or placeholder");
  add(errors, digital?.testDeliveryVerified === true, "digital test delivery has not been verified");
  add(errors, digital?.privateLiveDeliveryVerified === true, "digital private live delivery has not been verified");

  for (const binding of ["paperback", "hardcover"]) {
    const record = manifest?.print?.[binding];
    add(
      errors,
      Number.isInteger(record?.retailPriceCents) && record.retailPriceCents > record.manufacturingCostCents,
      `${binding} retail price is missing or does not exceed the verified manufacturing cost`
    );
    add(errors, realIdentifier(record?.stripePriceId, "price_"), `${binding} Stripe Price ID is missing or placeholder`);
    add(errors, record?.privateLiveOrderVerified === true, `${binding} private live order has not been verified`);
  }
  return errors;
}

function digitalReleaseChecks(manifest) {
  const errors = [];
  const digital = manifest?.digital;
  add(errors, realIdentifier(digital?.stripeProductId, "prod_"), "digital Stripe Product ID is missing or placeholder");
  add(errors, realIdentifier(digital?.stripePriceId, "price_"), "digital Stripe Price ID is missing or placeholder");
  add(errors, realIdentifier(digital?.paymentLinkId, "plink_"), "digital Stripe Payment Link ID is missing or placeholder");
  add(errors, validCheckoutUrl(digital?.checkoutUrl), "digital Stripe checkout URL is missing, placeholder, or not on buy.stripe.com");
  add(errors, digital?.deliveryAssetsUploaded === true, "digital delivery assets have not been uploaded to private R2 storage");
  add(errors, digital?.deliveryMigrationApplied === true, "digital delivery D1 migration has not been applied");
  add(errors, digital?.deliveryWorkerDeployed === true, "digital delivery Worker has not been deployed and verified");
  add(errors, realIdentifier(digital?.deliveryConfigurationId, ""), "digital delivery configuration ID is missing or placeholder");
  add(errors, digital?.testDeliveryVerified === true, "digital test delivery has not been verified");
  add(errors, digital?.salesActivationApproved === true, "digital sales activation is not approved");
  add(errors, digital?.paymentLinkActive === true, "the approved digital Payment Link is not active");
  for (const field of [
    "canonicalLiveVerified",
    "workerLiveVerified",
    "existingBooksRegressionVerified",
    "independentPostDeploymentVerified"
  ]) {
    add(errors, manifest?.publication?.[field] === true, `publication.${field} is not verified for the digital release`);
  }
  return errors;
}

function releaseChecks(manifest) {
  const errors = [];
  add(
    errors,
    manifest?.distribution?.luluGlobalDistributionSubmitted === true,
    "the Lulu Global Distribution submission has not been completed"
  );
  add(
    errors,
    manifest?.distribution?.luluGlobalDistributionApproved === true,
    "Lulu Global Distribution is not approved"
  );
  add(
    errors,
    manifest?.distribution?.luluBookstorePublished === true,
    "the Lulu Bookstore edition is not published"
  );
  add(
    errors,
    ["select", "general"].includes(manifest?.distribution?.luluBookstoreAccess),
    "Lulu Bookstore access is still private"
  );
  add(
    errors,
    manifest?.distribution?.retailerAvailabilityActive === true,
    "retailer availability is not independently verified as active"
  );
  add(errors, manifest?.digital?.salesActivationApproved === true, "digital sales activation is not approved");
  add(errors, manifest?.digital?.paymentLinkActive === true, "the approved digital Payment Link is not active");
  for (const binding of ["paperback", "hardcover"]) {
    const record = manifest?.print?.[binding];
    add(errors, record?.salesActivationApproved === true, `${binding} sales activation is not approved`);
    add(errors, realIdentifier(record?.merchantItemId, ""), `${binding} Merchant Center item ID is missing or placeholder`);
    add(errors, record?.merchantStatus === "approved", `${binding} Merchant Center status is not approved`);
  }
  for (const field of [
    "canonicalLiveVerified",
    "workerLiveVerified",
    "existingBooksRegressionVerified",
    "independentPostDeploymentVerified"
  ]) {
    add(errors, manifest?.publication?.[field] === true, `publication.${field} is not verified`);
  }
  return errors;
}

export function validateReleaseManifest(manifest) {
  const directErrors = {
    local: localChecks(manifest),
    provider: providerChecks(manifest),
    proof: proofChecks(manifest),
    private: privateChecks(manifest),
    release: releaseChecks(manifest),
    digital: digitalReleaseChecks(manifest)
  };
  const cumulativeErrors = {};
  let accumulated = [];
  for (const stage of STAGES) {
    accumulated = [...accumulated, ...directErrors[stage]];
    cumulativeErrors[stage] = accumulated;
  }
  cumulativeErrors.digital = [...directErrors.local, ...directErrors.digital];
  const readiness = Object.fromEntries(STAGES.map(stage => [stage, cumulativeErrors[stage].length === 0]));
  readiness.digital = cumulativeErrors.digital.length === 0;
  return {
    readiness,
    directErrors,
    cumulativeErrors
  };
}

async function main() {
  const args = process.argv.slice(2);
  const stageIndex = args.indexOf("--stage");
  const requestedStage = stageIndex >= 0 ? args[stageIndex + 1] : "release";
  const manifestPath = args.find((value, index) => value !== "--stage" && index !== stageIndex + 1);
  if (!manifestPath || !SELECTABLE_STAGES.includes(requestedStage)) {
    console.error("Usage: node scripts/validate-probabilistic-release.mjs <manifest.json> [--stage local|provider|proof|private|release|digital]");
    process.exitCode = 2;
    return;
  }
  const manifest = JSON.parse(await readFile(resolve(manifestPath), "utf8"));
  const report = validateReleaseManifest(manifest);
  const errors = report.cumulativeErrors[requestedStage];
  console.log(JSON.stringify({
    status: errors.length === 0 ? "PASS" : "FAIL",
    requestedStage,
    readiness: report.readiness,
    errors
  }, null, 2));
  if (errors.length) process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
