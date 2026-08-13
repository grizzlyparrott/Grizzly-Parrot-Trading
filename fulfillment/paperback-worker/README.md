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

## Probabilistic Execution digital release and print staging

The exact four ISBN-final print PDFs are pinned in `STAGED_PRINT_EDITIONS` by filename, page count, POD package, and MD5. The two verified Lulu project IDs, distinct free Lulu-assigned ISBNs, established $39 paperback/$49 hardcover list prices, and title-specific Stripe Product/Price IDs are recorded. Release approvals remain absent. A staged record fails `catalogReady()` and therefore cannot quote, open a public or private checkout, or submit a print job.

Probabilistic Execution adds title-and-edition-specific gates on top of the existing global production gates:

- `PROBABILISTIC_EXECUTION_<EDITION>_FILES_VALIDATED`
- `PROBABILISTIC_EXECUTION_<EDITION>_PROOF_APPROVED`
- `PROBABILISTIC_EXECUTION_<EDITION>_PRIVATE_ORDER_ENABLED`
- `PROBABILISTIC_EXECUTION_<EDITION>_SALES_ENABLED`

The digital edition additionally requires `PROBABILISTIC_EXECUTION_DIGITAL_SALES_ENABLED=true`, `PROBABILISTIC_EXECUTION_DIGITAL_DELIVERY_ENABLED=true`, a configured Resend sender/API key, the private R2 binding, a real `STRIPE_PAYMENT_LINK_PROBABILISTIC_DIGITAL`, and its matching `STRIPE_CHECKOUT_URL_PROBABILISTIC_DIGITAL` on `buy.stripe.com`. The user approved the digital-only release on 2026-08-12, so the two digital title flags are enabled for production. Every Probabilistic Execution print flag remains false, and the public page contains no print-checkout activation code.

Run `node scripts/probabilistic-execution-asset-manifest.mjs "C:\\absolute\\path\\to\\production\\print"` to verify the frozen files and print the four R2 upload commands. The script never uploads files.

Run `node scripts/probabilistic-execution-digital-asset-manifest.mjs "C:\\absolute\\path\\to\\production\\digital"` to verify the exact PDF and EPUB SHA-256 values and print their two private R2 upload commands. The script itself is read-only. On 2026-08-12, both exact objects were uploaded to their private R2 keys and independently downloaded again; both readback byte counts and SHA-256 hashes matched the frozen production files.

Cloudflare Worker version `3f85dfcf-7a8b-48c6-86e8-d57ecd08a248` contains the private-delivery implementation with the D1 and R2 bindings and all seven required secret names. Its Probabilistic Execution digital, print-file, proof, private-order, and sales flags are all false. Live no-cache checks returned disabled/null checkout configuration and 404 for both public and private print routes; the six existing print editions retained enabled configuration at their established prices. A controlled `cs_test_...` delivery completed once through R2, D1, and Resend; the received PDF and EPUB matched the frozen byte counts and SHA-256 hashes, and the email was explicitly labeled as a no-purchase test.

After the user's digital-only release approval, Stripe Payment Link `plink_1U3l6oIA3p8RBkZIwwzIcM95` was activated and Worker version `c9b2e311-15ce-4b1c-b6c6-92482a7a61e8` was deployed on 2026-08-12. Fresh no-cache checks reported the $29 digital configuration enabled and private delivery ready. The Probabilistic Execution paperback and hardcover configurations both remained disabled with null checkout URLs and `staged` catalog status.

The tracked `release/probabilistic-execution.json` manifest is the fail-closed handoff for provider data and release evidence. Null and false values are unresolved gates; do not infer or bulk-replace them. Check the current local stage with:

```text
node scripts/validate-probabilistic-release.mjs release/probabilistic-execution.json --stage local
```

The same validator supports cumulative `provider`, `proof`, `private`, and `release` stages. Its separate `digital` stage validates the approved live checkout, private delivery configuration, canonical page, Worker, and post-deployment evidence without weakening any physical-proof or print-release gate. The cumulative stages still validate ISBN-13 check digits and binding uniqueness, final hashes, provider IDs, proof acceptance, private live verification, Merchant approval, and independent live verification.

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
6. Run `node scripts/print-asset-manifest.mjs "C:\\absolute\\path\\to\\POD Production"` and execute the generated R2 upload commands only after the physical proofs are approved. The explicit path prevents an older or relocated worktree from selecting the wrong files.
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

## Private live order and activation after proofs

Do not change the book buttons first. After all three proofs and the store-policy decisions are approved:

1. If a proof requires correction, replace the source PDF, update its catalog MD5, upload only the approved replacements, and re-run Lulu file validation.
2. Set the approved countries and Stripe Tax decision, then set `PAPERBACK_PROOFS_APPROVED=true` and `PAPERBACK_POLICIES_APPROVED=true`. Keep `PAPERBACK_SALES_ENABLED=false`.
3. Set `PAPERBACK_PRIVATE_ORDER_ENABLED=true`, open `/paperback/private-order?bookSlug=...` on the `workers.dev` hostname, and place exactly one real paid paperback order with the private token.
4. Verify the Stripe payment/tax result, D1 row (`checkout_mode=private_live_order`), single Lulu production job, confirmation email, Lulu status polling, shipment status, and tracking email.
5. Set `PAPERBACK_PRIVATE_ORDER_ENABLED=false` after the one private order.
6. Only after the live order passes, deliberately set `PAPERBACK_SALES_ENABLED=true`. The three book pages remain disabled unless `/public-config` reports every gate ready; no button markup edit is needed.

The catalog contains all three approved paperbacks and all three approved case-wrap hardcovers. Paperback and hardcover sales have independent proof and activation gates.
