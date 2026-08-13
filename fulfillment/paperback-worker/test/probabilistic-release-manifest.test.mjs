import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { normalizeIsbn, validateReleaseManifest } from "../scripts/validate-probabilistic-release.mjs";

const stagedManifest = JSON.parse(
  await readFile(new URL("../release/probabilistic-execution.json", import.meta.url), "utf8")
);

function completeFixture() {
  const manifest = structuredClone(stagedManifest);
  manifest.isbnPolicy = "lulu-free";
  manifest.isbnBibliographicPublisher = "Lulu.com";
  manifest.isbnAssignmentVerified = true;
  manifest.distribution.luluGlobalDistributionSubmitted = true;
  manifest.distribution.luluGlobalDistributionApproved = true;
  manifest.distribution.luluBookstorePublished = true;
  manifest.distribution.luluBookstoreAccess = "general";
  manifest.distribution.retailerAvailabilityActive = true;
  manifest.distribution.reviewFeePaymentsVerified = true;

  Object.assign(manifest.digital, {
    stripeProductId: "prod_123456789",
    stripePriceId: "price_123456789",
    paymentLinkId: "plink_123456789",
    checkoutUrl: "https://buy.stripe.com/abc123456789",
    deliveryProvider: "resend",
    deliveryMode: "private-email-attachments",
    deliveryAssetsUploaded: true,
    deliveryMigrationApplied: true,
    deliveryWorkerDeployed: true,
    deliveryConfigurationId: "delivery_123456789",
    testDeliveryVerified: true,
    privateLiveDeliveryVerified: true,
    salesActivationApproved: true,
    paymentLinkActive: true
  });

  Object.assign(manifest.print.paperback, {
    luluPublishingProjectId: "abc1234",
    isbn: "978-0-00-000000-2",
    fileStage: "isbn-final",
    filesValidated: true,
    retailPriceCents: 3900,
    stripePriceId: "price_paperback_123456",
    proofOrderId: "proof-pb-123456",
    proofReceived: true,
    userProofAccepted: true,
    privateLiveOrderVerified: true,
    salesActivationApproved: true,
    salesActivationScope: "grizzly-direct-site",
    salesActivationApprovedAt: "2026-08-13",
    directSiteAssetsUploaded: true,
    directSiteAssetsReadbackVerified: true,
    directSiteSalesEnabled: true,
    directCheckoutUrl: "https://grizzly-parrot-paperback.grizzlyparrott04.workers.dev/print/checkout?bookSlug=probabilistic-execution&edition=paperback",
    merchantItemId: "online-en-US-probabilistic-paperback",
    merchantStatus: "approved"
  });
  Object.assign(manifest.print.paperback.distributionCover, {
    filename: "Probabilistic-Execution-Lulu-Paperback-Distribution-Cover.pdf",
    templateVerified: true,
    md5: "EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE",
    filesValidated: true
  });

  Object.assign(manifest.print.hardcover, {
    luluPublishingProjectId: "def5678",
    isbn: "978-0-00-000001-9",
    fileStage: "isbn-final",
    filesValidated: true,
    retailPriceCents: 4900,
    stripePriceId: "price_hardcover_123456",
    proofOrderId: "proof-hc-123456",
    proofReceived: true,
    userProofAccepted: true,
    privateLiveOrderVerified: true,
    salesActivationApproved: true,
    salesActivationScope: "grizzly-direct-site",
    salesActivationApprovedAt: "2026-08-13",
    directSiteAssetsUploaded: true,
    directSiteAssetsReadbackVerified: true,
    directSiteSalesEnabled: true,
    directCheckoutUrl: "https://grizzly-parrot-paperback.grizzlyparrott04.workers.dev/print/checkout?bookSlug=probabilistic-execution&edition=hardcover",
    merchantItemId: "online-en-US-probabilistic-hardcover",
    merchantStatus: "approved"
  });
  Object.assign(manifest.print.hardcover.distributionCover, {
    filename: "Probabilistic-Execution-Lulu-Hardcover-Distribution-Cover.pdf",
    templateVerified: true,
    md5: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
    filesValidated: true
  });

  Object.assign(manifest.publication, {
    canonicalLiveVerified: true,
    workerLiveVerified: true,
    existingBooksRegressionVerified: true,
    independentPostDeploymentVerified: true,
    directSitePrintSalesLiveVerified: true,
    directSitePrintSalesConfigurationId: "worker_123456789"
  });
  return manifest;
}

function digitalReleaseFixture() {
  const manifest = structuredClone(stagedManifest);
  Object.assign(manifest.digital, {
    paymentLinkActive: true,
    salesActivationApproved: true
  });
  Object.assign(manifest.publication, {
    canonicalLiveVerified: true,
    workerLiveVerified: true,
    existingBooksRegressionVerified: true,
    independentPostDeploymentVerified: true
  });
  return manifest;
}

test("the tracked release manifest records the corrected combined proof order while physical-proof and retailer gates remain closed", () => {
  const report = validateReleaseManifest(stagedManifest);
  assert.equal(report.readiness.local, true);
  assert.equal(report.readiness.provider, false);
  assert.equal(report.readiness.proof, false);
  assert.equal(report.readiness.private, false);
  assert.equal(report.readiness.release, false);
  assert.equal(report.readiness.direct, false);
  const providerErrors = report.directErrors.provider.join("\n");
  assert.doesNotMatch(providerErrors, /isbnPolicy/);
  assert.doesNotMatch(providerErrors, /bibliographic publisher/);
  assert.doesNotMatch(providerErrors, /ISBN assignments/);
  assert.equal(report.directErrors.provider.length, 8);
  assert.match(providerErrors, /paperback distribution-cover provider validation/);
  assert.match(providerErrors, /hardcover distribution-cover provider validation/);
  assert.doesNotMatch(providerErrors, /second-agent proofreading is not complete/);
  assert.equal(stagedManifest.distribution.luluPrivatePublicationCompleted, true);
  assert.equal(stagedManifest.distribution.luluBookstoreAccess, "private");
  assert.equal(stagedManifest.distribution.retailerAvailabilityActive, false);
  assert.equal(stagedManifest.distribution.reviewFeePaymentsVerified, true);
  assert.equal(stagedManifest.print.paperback.proofOrderId, "USD-C4288608");
  assert.equal(stagedManifest.print.hardcover.proofOrderId, "USD-C4288608");
  assert.equal(stagedManifest.print.paperback.salesActivationApproved, true);
  assert.equal(stagedManifest.print.hardcover.salesActivationApproved, true);
  assert.doesNotMatch(report.directErrors.proof.join("\n"), /distribution review fee payments/);
  assert.match(report.directErrors.proof.join("\n"), /proof has not been received/);
  assert.doesNotMatch(report.directErrors.private.join("\n"), /assets have not been uploaded/);
  assert.doesNotMatch(report.directErrors.private.join("\n"), /Stripe Product ID/);
  assert.doesNotMatch(report.directErrors.private.join("\n"), /digital Stripe Price ID/);
  assert.doesNotMatch(report.directErrors.private.join("\n"), /Payment Link ID/);
  assert.doesNotMatch(report.directErrors.private.join("\n"), /checkout URL/);
  assert.doesNotMatch(report.directErrors.private.join("\n"), /D1 migration has not been applied/);
  assert.doesNotMatch(report.directErrors.private.join("\n"), /Worker has not been deployed/);
  assert.match(report.directErrors.private.join("\n"), /private live delivery has not been verified/);
  assert.match(report.directErrors.release.join("\n"), /Global Distribution submission/);
  assert.match(report.directErrors.release.join("\n"), /Merchant Center status is not approved/);
});

test("ISBN validation accepts correct 978 and 979 check digits and rejects malformed identifiers", () => {
  assert.equal(normalizeIsbn("978-0-00-000000-2"), "9780000000002");
  assert.equal(normalizeIsbn("978-0-00-000001-9"), "9780000000019");
  assert.equal(normalizeIsbn("979-0-00-000000-1"), "9790000000001");
  assert.equal(normalizeIsbn("979-0-00-000000-2"), null);
  assert.equal(normalizeIsbn("978-0-00-000000-3"), null);
  assert.equal(normalizeIsbn("not-an-isbn"), null);
});

test("release readiness requires one internally consistent set of provider IDs, final hashes, proofs, private tests, activation approvals, and Merchant approvals", () => {
  const complete = completeFixture();
  const report = validateReleaseManifest(complete);
  assert.deepEqual(report.readiness, {
    local: true,
    provider: true,
    proof: true,
    private: true,
    release: true,
    digital: true,
    direct: true
  });

  complete.isbnPolicy = "user-owned";
  const wrongIsbnRoute = validateReleaseManifest(complete);
  assert.equal(wrongIsbnRoute.readiness.local, false);
  assert.match(wrongIsbnRoute.directErrors.local.join("\n"), /Lulu-assigned free ISBN/);
  complete.isbnPolicy = "lulu-free";

  complete.distribution.luluGlobalDistributionTarget = false;
  const missingGlobalDistribution = validateReleaseManifest(complete);
  assert.equal(missingGlobalDistribution.readiness.local, false);
  assert.match(missingGlobalDistribution.directErrors.local.join("\n"), /luluGlobalDistributionTarget/);
  complete.distribution.luluGlobalDistributionTarget = true;

  complete.distribution.amazonKdpUsed = true;
  const kdp = validateReleaseManifest(complete);
  assert.equal(kdp.readiness.local, false);
  assert.match(kdp.directErrors.local.join("\n"), /Amazon KDP/);
  complete.distribution.amazonKdpUsed = false;

  complete.distribution.luluBookstorePublished = false;
  const prematureBookstoreAccess = validateReleaseManifest(complete);
  assert.equal(prematureBookstoreAccess.readiness.local, false);
  assert.match(prematureBookstoreAccess.directErrors.local.join("\n"), /must remain private/);
  complete.distribution.luluBookstorePublished = true;

  complete.distribution.retailerAvailabilityActive = true;
  complete.distribution.luluGlobalDistributionApproved = false;
  const prematureRetailAvailability = validateReleaseManifest(complete);
  assert.equal(prematureRetailAvailability.readiness.local, false);
  assert.match(prematureRetailAvailability.directErrors.local.join("\n"), /must remain inactive/);
  complete.distribution.luluGlobalDistributionApproved = true;

  complete.print.paperback.proofQuote.totalCents += 1;
  const changedProofQuote = validateReleaseManifest(complete);
  assert.equal(changedProofQuote.readiness.local, false);
  assert.match(changedProofQuote.directErrors.local.join("\n"), /paperback proofQuote.totalCents/);
  assert.match(changedProofQuote.directErrors.local.join("\n"), /proof quote total/);
  complete.print.paperback.proofQuote.totalCents -= 1;

  complete.distribution.luluGlobalDistributionApproved = false;
  complete.distribution.retailerAvailabilityActive = false;
  const unapprovedDistribution = validateReleaseManifest(complete);
  assert.equal(unapprovedDistribution.readiness.provider, true);
  assert.equal(unapprovedDistribution.readiness.release, false);
  assert.match(unapprovedDistribution.directErrors.release.join("\n"), /Global Distribution is not approved/);
  complete.distribution.luluGlobalDistributionApproved = true;
  complete.distribution.retailerAvailabilityActive = true;

  complete.digital.deliveryProvider = "generic-delivery-provider";
  const changedProvider = validateReleaseManifest(complete);
  assert.equal(changedProvider.readiness.local, false);
  assert.match(changedProvider.directErrors.local.join("\n"), /established Resend provider/);
  complete.digital.deliveryProvider = "resend";

  complete.digital.deliveryMode = "public-download-links";
  const publicDelivery = validateReleaseManifest(complete);
  assert.equal(publicDelivery.readiness.local, false);
  assert.match(publicDelivery.directErrors.local.join("\n"), /private-email-attachments/);
  complete.digital.deliveryMode = "private-email-attachments";

  complete.digital.paymentLinkActive = true;
  complete.digital.salesActivationApproved = false;
  const prematurePaymentLink = validateReleaseManifest(complete);
  assert.equal(prematurePaymentLink.readiness.local, false);
  assert.match(prematurePaymentLink.directErrors.local.join("\n"), /must remain deactivated/);
  complete.digital.salesActivationApproved = true;

  complete.editorialReview.completed = false;
  const missingIndependentProofread = validateReleaseManifest(complete);
  assert.equal(missingIndependentProofread.readiness.provider, false);
  assert.match(missingIndependentProofread.directErrors.provider.join("\n"), /second-agent proofreading is not complete/);
  complete.editorialReview.completed = true;

  complete.print.hardcover.isbn = complete.print.paperback.isbn;
  const duplicate = validateReleaseManifest(complete);
  assert.equal(duplicate.readiness.provider, false);
  assert.match(duplicate.directErrors.provider.join("\n"), /two distinct valid ISBNs/);
});

test("digital readiness can pass while physical-proof and retailer gates stay closed independently of direct-site approval", () => {
  const digitalOnly = digitalReleaseFixture();
  const report = validateReleaseManifest(digitalOnly);
  assert.equal(report.readiness.digital, true);
  assert.equal(report.readiness.provider, false);
  assert.equal(report.readiness.proof, false);
  assert.equal(report.readiness.private, false);
  assert.equal(report.readiness.release, false);
  assert.equal(digitalOnly.digital.privateLiveDeliveryVerified, false);
  assert.equal(digitalOnly.print.paperback.salesActivationApproved, true);
  assert.equal(digitalOnly.print.hardcover.salesActivationApproved, true);
  assert.equal(digitalOnly.print.paperback.proofReceived, false);
  assert.equal(digitalOnly.print.hardcover.proofReceived, false);

  digitalOnly.digital.paymentLinkActive = false;
  const inactiveCheckout = validateReleaseManifest(digitalOnly);
  assert.equal(inactiveCheckout.readiness.digital, false);
  assert.match(inactiveCheckout.directErrors.digital.join("\n"), /Payment Link is not active/);

  digitalOnly.digital.paymentLinkActive = true;
  digitalOnly.publication.canonicalLiveVerified = false;
  const missingLivePage = validateReleaseManifest(digitalOnly);
  assert.equal(missingLivePage.readiness.digital, false);
  assert.match(missingLivePage.directErrors.digital.join("\n"), /canonicalLiveVerified/);
});
