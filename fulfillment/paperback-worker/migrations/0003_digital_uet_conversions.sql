-- Record one Microsoft UET purchase conversion per verified, paid Stripe
-- Checkout Session for the three $29 digital editions.
CREATE TABLE IF NOT EXISTS digital_purchase_conversions (
  stripe_session_id TEXT PRIMARY KEY NOT NULL,
  stripe_event_id TEXT NOT NULL,
  stripe_payment_link_id TEXT NOT NULL,
  event_label TEXT NOT NULL CHECK (event_label IN (
    'currency_market_structure',
    'metals_market_structure',
    'equity_market_structure'
  )),
  amount_total INTEGER NOT NULL CHECK (amount_total = 2900),
  currency TEXT NOT NULL CHECK (currency = 'usd'),
  verified_at TEXT NOT NULL,
  claimed_at TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS digital_purchase_conversions_stripe_event
  ON digital_purchase_conversions (stripe_event_id);
