# Print-book fulfillment worker

This Worker owns paperback and hardcover fulfillment. For the three existing Market Structure digital titles, it continues to record only the isolated Microsoft UET attribution row. For Probabilistic Execution, it preserves the established Stripe webhook to Resend delivery architecture and adds a durable, title-specific queue for the exact PDF and EPUB attachments.

## Safety gate

The default configuration is safe:

- `PAPERBACK_SALES_ENABLED = "false"`
- `PAPERBACK_PRIVATE_ORDER_ENABLED = "false"`
- `PAPERBACK_PROOFS_APPROVED = "false"` and `PAPERBACK_POLICIES_APPROVED = "false"`
- production shipping countries are empty and the Stripe Tax decision is `pending`
- public paperback pages keep `paperbackCheckoutUrl = ""`
- sandbox checkout requests need `x-paperback-test-token`
- a private live order uses a separate token-gated page and does not enable `/public-config`
- public production checkout requires every approval/configuration gate plus `PAPERBACK_SALES_ENABLED=true`

## Architecture

1. A checkout UI sends the buyer's address and chosen edition to `POST /print/quote`.
2. The Worker validates the address locally and asks Lulu's Print API for an address-specific shipping quote.
3. The quote is stored in D1 for 30 minutes. `POST /print/checkout` creates one Stripe Checkout Session using the configured edition Price plus the quoted Lulu shipping amount. Stripe Tax is included only when the explicit tax setting is `true`.
4. Stripe collects the shipping address again. The webhook verifies Stripe's signature, verifies the address stayed the same, and writes one D1 row keyed by the Stripe Checkout Session ID.
5. The Worker submits the corresponding Lulu Print API job using the exact paperback or case-wrap hardcover POD package and signed R2 PDF URLs. It never uses a Lulu Publishing project ID as an API order ID.
6. D1 prevents duplicate Stripe webhook delivery from creating a second print job. Ambiguous Lulu submission failures are held for manual review rather than retried into a possible duplicate print.
7. A scheduled Worker run polls Lulu status every 15 minutes and sends confirmation/shipment emails through Resend.
8. The same scheduled run deletes expired shipping quotes, so abandoned checkout emails and addresses are not retained after the 30-minute quote window.

Digital Payment Link events take a separate path. A signed Stripe `checkout.session.completed` or `checkout.session.async_payment_succeeded` event is accepted only when it is paid, totals exactly $29 USD, and matches a configured live Payment Link ID. D1 permits the corresponding UET purchase event to be claimed once, so page visits, checkout opens, unpaid sessions, and confirmation-page refreshes cannot create purchases.

For `probabilistic_execution` only, that verified event also creates one D1 delivery row keyed by the Stripe Checkout Session ID. The Worker reads the two immutable objects from the private R2 binding, verifies each SHA-256, and sends both as Resend attachments with a deterministic idempotency key. Definitive throttling or server rejection receives at most two timed retries; an ambiguous transport result or expired in-flight lease moves to manual review instead of risking a duplicate email. Digital object keys are not admitted by the signed public print-asset route.

## Probabilistic Execution digital and direct-site release

The exact four ISBN-final print PDFs are pinned in `PROBABILISTIC_EXECUTION_PRINT_EDITIONS` by object key, filename, page count, POD package, and MD5. The two verified Lulu project IDs, distinct free Lulu-assigned ISBNs, established $39 paperback/$49 hardcover prices, and title-specific Stripe Product/Price IDs are recorded. These release-controlled catalog records remain fail-closed until every direct-site gate is explicit.

Probabilistic Execution adds title-and-edition-specific gates on top of the existing global production gates:

- `PROBABILISTIC_EXECUTION_<EDITION>_FILES_VALIDATED`
- `PROBABILISTIC_EXECUTION_<EDITION>_DIRECT_SALES_APPROVED`
- `PROBABILISTIC_EXECUTION_<EDITION>_PRIVATE_ORDER_ENABLED`
- `PROBABILISTIC_EXECUTION_<EDITION>_SALES_ENABLED`

`PROBABILISTIC_EXECUTION_<EDITION>_PROOF_APPROVED` remains an explicit evidence field for physical-proof and distribution workflows, but it is not used to imply that Lulu's direct Print API requires a received proof. For a release-keyed edition, the Worker requires the separate `DIRECT_SALES_APPROVED` flag instead. Existing books without a release key retain their established global proof gate.

The digital edition additionally requires `PROBABILISTIC_EXECUTION_DIGITAL_SALES_ENABLED=true`, `PROBABILISTIC_EXECUTION_DIGITAL_DELIVERY_ENABLED=true`, a configured Resend sender/API key, the private R2 binding, a real `STRIPE_PAYMENT_LINK_PROBABILISTIC_DIGITAL`, and its matching `STRIPE_CHECKOUT_URL_PROBABILISTIC_DIGITAL` on `buy.stripe.com`. The user approved the digital release on 2026-08-12 and approved Grizzly direct-site paperback and hardcover sales on 2026-08-13. Physical-proof receipt/acceptance and Lulu retailer-distribution states remain independently false until actually verified.

Run `node scripts/probabilistic-execution-asset-manifest.mjs "C:\\absolute\\path\\to\\production\\print"` to verify the frozen files and print the four R2 upload commands. The script never uploads files. After an authorized upload, download every remote object again and compare its byte count and MD5 to the release-controlled catalog before enabling sales.

Run `node scripts/probabilistic-execution-digital-asset-manifest.mjs "C:\\absolute\\path\\to\\production\\digital"` to verify the exact PDF and EPUB SHA-256 values and print their two private R2 upload commands. The script itself is read-only. On 2026-08-12, both exact objects were uploaded to their private R2 keys and independently downloaded again; both readback byte counts and SHA-256 hashes matched the frozen production files.

Cloudflare Worker version `3f85dfcf-7a8b-48c6-86e8-d57ecd08a248` contains the private-delivery implementation with the D1 and R2 bindings and all seven required secret names. Its Probabilistic Execution digital, print-file, proof, private-order, and sales flags are all false. Live no-cache checks returned disabled/null checkout configuration and 404 for both public and private print routes; the six existing print editions retained enabled configuration at their established prices. A controlled `cs_test_...` delivery completed once through R2, D1, and Resend; the received PDF and EPUB matched the frozen byte counts and SHA-256 hashes, and the email was explicitly labeled as a no-purchase test.

After the user's digital-only release approval, Stripe Payment Link `plink_1U3l6oIA3p8RBkZIwwzIcM95` was activated and Worker version `c9b2e311-15ce-4b1c-b6c6-92482a7a61e8` was deployed on 2026-08-12. Fresh no-cache checks reported the $29 digital configuration enabled and private delivery ready. At that point, the Probabilistic Execution paperback and hardcover configurations both remained disabled with null checkout URLs.

After the user's Grizzly direct-site approval on 2026-08-13, all four corrected print objects were uploaded to production R2 and independently downloaded again. Every byte count, MD5, and SHA-256 matched the final local source. Worker version `63de6589-0444-4ced-bfa9-aaa4e44dfcd6` then enabled the $39 paperback and $49 hardcover configurations while leaving both title-specific physical-proof flags false. Fresh checks returned HTTP 200 for both exact checkout forms, kept the $29 digital configuration enabled, preserved all six pre-existing print configurations, and confirmed all required Lulu, Stripe, Resend, and asset-signing secret names.

GitHub Pages source commit `c4f1cd78074ca20e8cff6aea8dad31e874ccf18f` was merged through PR #26 on 2026-08-13. Independent no-cache and browser checks verified the canonical page and books hub after propagation, all three active prices and destination URLs, no remaining `Coming soon` copy, no horizontal overflow, the live $29 Stripe page, and both $39/$49 Worker forms. Release QA stopped before entering customer data or creating a paid order.

GitHub Pages commit `5da0da5f769b0a75482a6549a46154a498c536da` published the canonical landing page on 2026-08-12. Independent production checks verified HTTP 200, the exact active Stripe URL, two `Coming soon` print cards with no print activation code, the live hub and sitemap entry, a private-attachment confirmation page with no paid-file URLs, and 404 for digital keys through the public signed-asset route. All six pre-existing print configurations remained enabled at $39 paperback and $49 hardcover.

The tracked `release/probabilistic-execution.json` manifest is the fail-closed handoff for provider data and release evidence. Null and false values are unresolved for the specific field they represent; direct-site approval must never be used to claim proof acceptance or retailer availability. Check the current local stage with:

```text
node scripts/validate-probabilistic-release.mjs release/probabilistic-execution.json --stage local
```

The same validator supports cumulative `provider`, `proof`, `private`, and `release` stages. Its separate `digital` stage validates the digital checkout and delivery release. Its separate `direct` stage validates Grizzly direct-site print assets, Stripe prices, scoped sales approval, Worker checkouts, and post-deployment evidence without weakening the physical-proof or retailer-distribution gates. The cumulative stages still validate ISBN-13 check digits and binding uniqueness, final hashes, provider IDs, proof acceptance, private live verification, Merchant approval, and independent live verification.

The release model matches the six existing Grizzly Parrot print editions: Lulu is the print-on-demand provider; each binding receives a free Lulu-assigned ISBN; Grizzly direct checkout uses Lulu's Print API fulfillment; and Lulu Bookstore plus Lulu Global Distribution are release targets. The separate Lulu account goal named `Lulu Direct` is not selected. Amazon KDP is not used. Retail availability through Lulu's distribution network is not a KDP publication. Provider-state fields remain false until the corresponding Lulu submission, proof acceptance, approval, and publication are actually verified.

## Existing Lulu proof projects recorded in the catalog

| Paperback | Publishing project ID | ISBN |
| --- | --- | --- |
| Currency Market Structure: Volume I | `84mdgqe` | `978-1-105-03891-4` |
| Metals Market Structure: Volume II | `dy4ewg4` | `978-1-105-03858-7` |
| Equity Market Structure: Volume III | `zmnedzn` | `978-1-105-03848-8` |

These IDs document the existing proof copies. Lulu's Print API instead needs the configured package `0600X0900.BW.STD.PB.060UW444.MXX` and the hosted PDF source URLs.

## Cloudflare setup

1. Copy `wrangler.example.toml` to a local, uncommitted `wrangler.toml` and create the D1 database plus R2 bucket named there.
2. Run `wrangler d1 execute grizzly-parrot-paperback-orders --file schema.sql --remote`.
3. Put the eight secrets in the Worker dashboard or with `wrangler secret put`:
   - `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`
   - `LULU_CLIENT_KEY` and `LULU_CLIENT_SECRET`
   - `RESEND_API_KEY`
   - `PAPERBACK_TEST_TOKEN`
   - `PAPERBACK_ASSET_SIGNING_SECRET`
   - `PAPERBACK_PRIVATE_ORDER_TOKEN`
4. The non-secret Stripe sandbox Price IDs are already present in `wrangler.example.toml`:

| Paperback | Stripe test Price ID |
| --- | --- |
| Currency Market Structure: Volume I | `price_1TvNP4IA3p8RBkZIKlVaLG4V` |
| Metals Market Structure: Volume II | `price_1TvNQ3IA3p8RBkZIretIKedz` |
| Equity Market Structure: Volume III | `price_1TvNQrIA3p8RBkZI4SmXnkjj` |

   Replace all three with new **live** Stripe Price IDs before any production activation.
5. Apply `migrations/0002_private_launch_and_tax.sql` and `migrations/0003_digital_uet_conversions.sql` once to the existing D1 database. Before enabling Probabilistic Execution digital delivery, apply `migrations/0004_probabilistic_digital_delivery.sql`; it preserves the three existing conversion labels, adds the fourth label, and creates the delivery queue.
6. Run the applicable asset-manifest script with an explicit absolute source path. Execute its generated R2 commands only after the relevant proof-based or direct-site sales authorization, then download and hash every remote object before enabling checkout. The explicit path prevents an older or relocated worktree from selecting the wrong files.
7. In Stripe, send `checkout.session.completed` and `checkout.session.async_payment_succeeded` to `/webhooks/stripe`. Use a sandbox/test endpoint first.
8. In Lulu's **separate sandbox Print API account**, add a test card on file. Lulu holds API print jobs in `UNPAID` until a card is on file for automatic payment.

## Cloudflare Git deployment

The Worker uses the existing `workers.dev` hostname; no DNS or custom Worker domain is required. In Cloudflare Builds, keep the root directory at `/fulfillment/paperback-worker` and use:

```text
npx wrangler deploy --config wrangler.toml
```

Do not pass `src/index.mjs`, `--name`, or `--compatibility-date` in the deploy command. Those values are already in `wrangler.toml`; overriding them caused a prior Git deployment to omit the D1/R2 bindings and runtime configuration. Before any live order, confirm the active Worker version lists both `PAPERBACK_ORDERS` and `PRINT_ASSETS` and retains the required secret names.

## Test procedure

With sandbox secrets and R2 files configured, call the Worker with the private test token:

```powershell
$headers = @{ "x-paperback-test-token" = "YOUR_TEST_TOKEN"; "Content-Type" = "application/json" }
$quote = Invoke-RestMethod -Method Post -Uri "https://YOUR-WORKER/paperback/quote" -Headers $headers -Body (@{
  bookSlug = "currency-market-structure"; buyerEmail = "you@example.com"; quantity = 1; shippingOption = "MAIL";
  shippingAddress = @{ name = "Test Reader"; street1 = "123 Test Street"; city = "Raleigh"; stateCode = "NC"; postcode = "27601"; countryCode = "US"; phoneNumber = "+1 919 555 0100" }
} | ConvertTo-Json -Depth 5)
Invoke-RestMethod -Method Post -Uri "https://YOUR-WORKER/paperback/checkout" -Headers $headers -Body (@{ quoteId = $quote.quoteId } | ConvertTo-Json)
```

Open the returned Stripe **test-mode** URL and pay only with Stripe's documented test card. Then confirm the D1 order row, Lulu sandbox Print-Job status, and the Resend emails. Do not use a live Stripe key or production Lulu credentials in this test procedure.

## Direct-site activation and optional private verification

Do not make a public button independently authoritative. The page must load each print link from `/public-config`, and that endpoint must stay disabled until its exact edition is ready:

1. Pin the final interior and cover hashes in the catalog, upload those exact objects, then download and hash them again from remote storage.
2. Configure the exact live Stripe Price, approved countries, policy decision, and Stripe Tax decision.
3. For a release-keyed title, set `FILES_VALIDATED=true` and the scoped `DIRECT_SALES_APPROVED=true` while leaving `PROOF_APPROVED=false` unless a physical proof was actually accepted.
4. Optionally use the token-gated private-order mode for one controlled live verification. Never treat opening a private page or creating a Stripe session as proof of successful fulfillment.
5. Enable the title-and-edition `SALES_ENABLED` flag, deploy the complete `wrangler.toml`, and verify the Worker version retains D1, R2, and required secrets.
6. Confirm both `/public-config` responses, both rendered checkout pages, an address-specific Lulu quote, all pre-existing book configurations, and the canonical page after propagation. Do not create a paid customer order during release QA.

The catalog contains four paperbacks and four case-wrap hardcovers. Probabilistic Execution uses its scoped direct-site gate; its physical-proof and retailer-distribution records remain separate.
