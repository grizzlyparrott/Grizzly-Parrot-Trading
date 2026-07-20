# Paperback fulfillment worker

This is a new Cloudflare Worker for paperback orders only. It intentionally does **not** replace or import the existing ebook Stripe/Resend/R2 Worker.

## Safety gate

The default configuration is safe:

- `PAPERBACK_SALES_ENABLED = "false"`
- public paperback pages keep `paperbackCheckoutUrl = ""`
- sandbox checkout requests need `x-paperback-test-token`
- production checkout is reachable only after the deliberate combination of `PAPERBACK_ENVIRONMENT=production` and `PAPERBACK_SALES_ENABLED=true`

## Architecture

1. A checkout UI sends the buyer's address to `POST /paperback/quote`.
2. The Worker validates the address locally and asks Lulu's Print API for an address-specific shipping quote.
3. The quote is stored in D1 for 30 minutes. `POST /paperback/checkout` creates one Stripe Checkout Session using the configured paperback Price plus the quoted Lulu shipping amount.
4. Stripe collects the shipping address again. The webhook verifies Stripe's signature, verifies the address stayed the same, and writes one D1 row keyed by the Stripe Checkout Session ID.
5. The Worker submits the corresponding Lulu Print API job using the exact paperback POD package and signed R2 PDF URLs. It never uses a Lulu Publishing project ID as an API order ID.
6. D1 prevents duplicate Stripe webhook delivery from creating a second print job. Ambiguous Lulu submission failures are held for manual review rather than retried into a possible duplicate print.
7. A scheduled Worker run polls Lulu status every 15 minutes and sends confirmation/shipment emails through Resend.

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
3. Put the seven secrets in the Worker dashboard or with `wrangler secret put`:
   - `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`
   - `LULU_CLIENT_KEY` and `LULU_CLIENT_SECRET`
   - `RESEND_API_KEY`
   - `PAPERBACK_TEST_TOKEN`
   - `PAPERBACK_ASSET_SIGNING_SECRET`
4. The non-secret Stripe sandbox Price IDs are already present in `wrangler.example.toml`:

| Paperback | Stripe test Price ID |
| --- | --- |
| Currency Market Structure: Volume I | `price_1TvNP4IA3p8RBkZIKlVaLG4V` |
| Metals Market Structure: Volume II | `price_1TvNQ3IA3p8RBkZIretIKedz` |
| Equity Market Structure: Volume III | `price_1TvNQrIA3p8RBkZI4SmXnkjj` |

   Replace all three with new **live** Stripe Price IDs before any production activation.
5. Run `node scripts/print-asset-manifest.mjs` and execute the generated R2 upload commands only after the physical proofs are approved.
6. In Stripe, create a webhook to `/webhooks/stripe` for `checkout.session.completed`. Use a sandbox/test endpoint first.
7. In Lulu's **separate sandbox Print API account**, add a test card on file. Lulu holds API print jobs in `UNPAID` until a card is on file for automatic payment.

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

## Activation after proofs

Do not change the book buttons yet. After each proof is approved:

1. Upload only the final approved paperback PDFs and re-run the Lulu sandbox file validation.
2. Create separate live Stripe Prices and production Lulu Print API credentials/card-on-file.
3. Deploy the Worker to `paperback-api.grizzlyparrottrading.com` with `PAPERBACK_ENVIRONMENT=production`, production secrets, and **only then** `PAPERBACK_SALES_ENABLED=true`.
4. The three existing book pages safely check `/public-config` at runtime. They remain disabled unless that endpoint reports the production gate as enabled; no page edit is needed to activate them.

Hardcovers are intentionally absent from this worker.
