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
