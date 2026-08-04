# Paperback fulfillment worker

This Worker owns paperback fulfillment. It also records a minimal, isolated Microsoft UET attribution row for each verified $29 digital Payment Link purchase; it does **not** replace or modify digital delivery.

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

1. A checkout UI sends the buyer's address to `POST /paperback/quote`.
2. The Worker validates the address locally and asks Lulu's Print API for an address-specific shipping quote.
3. The quote is stored in D1 for 30 minutes. `POST /paperback/checkout` creates one Stripe Checkout Session using the configured paperback Price plus the quoted Lulu shipping amount. Stripe Tax is included only when the explicit tax setting is `true`.
4. Stripe collects the shipping address again. The webhook verifies Stripe's signature, verifies the address stayed the same, and writes one D1 row keyed by the Stripe Checkout Session ID.
5. The Worker submits the corresponding Lulu Print API job using the exact paperback POD package and signed R2 PDF URLs. It never uses a Lulu Publishing project ID as an API order ID.
6. D1 prevents duplicate Stripe webhook delivery from creating a second print job. Ambiguous Lulu submission failures are held for manual review rather than retried into a possible duplicate print.
7. A scheduled Worker run polls Lulu status every 15 minutes and sends confirmation/shipment emails through Resend.
8. The same scheduled run deletes expired shipping quotes, so abandoned checkout emails and addresses are not retained after the 30-minute quote window.

Digital Payment Link events take a separate path. A signed Stripe `checkout.session.completed` or `checkout.session.async_payment_succeeded` event is accepted only when it is paid, totals exactly $29 USD, and matches one of the three configured live Payment Link IDs. D1 permits the corresponding UET purchase event to be claimed once, so page visits, checkout opens, unpaid sessions, and confirmation-page refreshes cannot create purchases.

## Existing Lulu proof projects recorded in the catalog

| Paperback | Publishing project ID | ISBN |
| --- | --- | --- |
| Currency Market Structure: Volume I | `84mdgqe` | `978-1-105-03891-4` |
| Metals Market Structure: Volume II | `dy4ewg4` | `978-1-105-03858-7` |
| Equity Market Structure: Volume III | `zmnedzn` | `978-1-105-03848-8` |

These IDs document the existing proof copies. Lulu Direct's Print API instead needs the configured package `0600X0900.BW.STD.PB.060UW444.MXX` and the hosted PDF source URLs.

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
5. Apply `migrations/0002_private_launch_and_tax.sql` and `migrations/0003_digital_uet_conversions.sql` once to the existing D1 database.
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

Hardcovers are intentionally absent from this worker.
