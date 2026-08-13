-- Expand the verified digital-purchase table to the fourth title, then add a
-- durable delivery queue. The old CHECK constraint cannot be altered in place.
DROP INDEX IF EXISTS digital_purchase_conversions_stripe_event;
ALTER TABLE digital_purchase_conversions RENAME TO digital_purchase_conversions_legacy;

CREATE TABLE digital_purchase_conversions (
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

INSERT INTO digital_purchase_conversions
  (stripe_session_id, stripe_event_id, stripe_payment_link_id, event_label,
   amount_total, currency, verified_at, claimed_at)
SELECT stripe_session_id, stripe_event_id, stripe_payment_link_id, event_label,
       amount_total, currency, verified_at, claimed_at
FROM digital_purchase_conversions_legacy;

DROP TABLE digital_purchase_conversions_legacy;

CREATE UNIQUE INDEX digital_purchase_conversions_stripe_event
  ON digital_purchase_conversions (stripe_event_id);

CREATE TABLE digital_deliveries (
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

CREATE INDEX digital_deliveries_due
  ON digital_deliveries (status, next_attempt_at, lease_expires_at);
