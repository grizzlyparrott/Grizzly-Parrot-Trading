-- One row per Stripe Checkout Session. The unique session id is the durable
-- idempotency key for Stripe's at-least-once webhook delivery.
CREATE TABLE IF NOT EXISTS paperback_orders (
  stripe_session_id TEXT PRIMARY KEY NOT NULL,
  stripe_event_id TEXT NOT NULL,
  quote_id TEXT,
  book_slug TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  buyer_email TEXT NOT NULL,
  shipping_address_json TEXT NOT NULL,
  shipping_option TEXT NOT NULL,
  shipping_cents INTEGER NOT NULL,
  currency TEXT NOT NULL,
  customer_total_cents INTEGER,
  tax_cents INTEGER,
  checkout_mode TEXT NOT NULL DEFAULT 'unknown',
  state TEXT NOT NULL,
  lulu_print_job_id TEXT,
  lulu_status TEXT,
  lulu_tracking_json TEXT,
  last_error_code TEXT,
  last_error_detail TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  confirmation_emailed_at TEXT,
  shipment_emailed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS paperback_orders_stripe_event
  ON paperback_orders (stripe_event_id);

CREATE INDEX IF NOT EXISTS paperback_orders_active_status
  ON paperback_orders (state, lulu_status, updated_at);

-- Quotes hold the address used to price shipping before Checkout is created.
-- They expire quickly and are never a substitute for Stripe's final address.
CREATE TABLE IF NOT EXISTS paperback_quotes (
  quote_id TEXT PRIMARY KEY NOT NULL,
  book_slug TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  buyer_email TEXT NOT NULL,
  shipping_address_json TEXT NOT NULL,
  shipping_option TEXT NOT NULL,
  shipping_cents INTEGER NOT NULL,
  currency TEXT NOT NULL,
  lulu_quote_json TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  stripe_session_id TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS paperback_quotes_expiry
  ON paperback_quotes (expires_at);

-- Paid digital Checkout Sessions are written only from a verified Stripe
-- webhook. The primary key and one-time claim timestamp prevent duplicate UET
-- purchase events when Stripe retries a webhook or a buyer refreshes the
-- confirmation page.
CREATE TABLE IF NOT EXISTS digital_purchase_conversions (
  stripe_session_id TEXT PRIMARY KEY NOT NULL,
  stripe_event_id TEXT NOT NULL,
  stripe_payment_link_id TEXT NOT NULL,
  event_label TEXT NOT NULL CHECK (event_label IN (
    'currency_market_structure',
    'metals_market_structure',
    'equity_market_structure',
    'probabilistic_execution'
  )),
  amount_total INTEGER NOT NULL CHECK (amount_total = 2900),
  currency TEXT NOT NULL CHECK (currency = 'usd'),
  verified_at TEXT NOT NULL,
  claimed_at TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS digital_purchase_conversions_stripe_event
  ON digital_purchase_conversions (stripe_event_id);

-- Probabilistic Execution preserves the established Stripe -> custom webhook
-- -> Resend attachment flow, but records every attempt so a paid buyer cannot
-- silently lose delivery. No digital object is exposed through a public route.
CREATE TABLE IF NOT EXISTS digital_deliveries (
  stripe_session_id TEXT PRIMARY KEY NOT NULL,
  buyer_email TEXT,
  status TEXT NOT NULL CHECK (status IN (
    'queued', 'sending', 'sent', 'retryable_failure', 'manual_review'
  )),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0 AND attempts <= 3),
  next_attempt_at TEXT,
  lease_expires_at TEXT,
  resend_email_id TEXT,
  last_error_code TEXT,
  last_error_message TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  sent_at TEXT,
  FOREIGN KEY (stripe_session_id) REFERENCES digital_purchase_conversions(stripe_session_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS digital_deliveries_due
  ON digital_deliveries (status, next_attempt_at, lease_expires_at);
