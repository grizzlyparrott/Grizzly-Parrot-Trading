-- Apply once to the existing production D1 database before the private live order.
ALTER TABLE paperback_orders ADD COLUMN tax_cents INTEGER;
ALTER TABLE paperback_orders ADD COLUMN checkout_mode TEXT NOT NULL DEFAULT 'unknown';
