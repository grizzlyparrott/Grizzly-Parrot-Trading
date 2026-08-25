-- Admit the $69 Market Structure Digital Trilogy while preserving all prior
-- verified purchases and their one-time Microsoft UET claims. SQLite CHECK
-- constraints require the table to be rebuilt.
DROP INDEX IF EXISTS digital_deliveries_due;
ALTER TABLE digital_deliveries RENAME TO digital_deliveries_legacy;

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
    'probabilistic_execution',
    'market_structure_trilogy'
  )),
  amount_total INTEGER NOT NULL CHECK (amount_total IN (2900, 6900)),
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

INSERT INTO digital_deliveries
  (stripe_session_id, buyer_email, status, attempts, next_attempt_at,
   lease_expires_at, resend_email_id, last_error_code, last_error_message,
   created_at, updated_at, sent_at)
SELECT stripe_session_id, buyer_email, status, attempts, next_attempt_at,
       lease_expires_at, resend_email_id, last_error_code, last_error_message,
       created_at, updated_at, sent_at
FROM digital_deliveries_legacy;

DROP TABLE digital_deliveries_legacy;
DROP TABLE digital_purchase_conversions_legacy;

CREATE UNIQUE INDEX digital_purchase_conversions_stripe_event
  ON digital_purchase_conversions (stripe_event_id);

CREATE INDEX digital_deliveries_due
  ON digital_deliveries (status, next_attempt_at, lease_expires_at);
