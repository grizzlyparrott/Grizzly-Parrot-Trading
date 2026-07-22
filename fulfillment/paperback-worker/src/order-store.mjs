export class OrderStore {
  constructor(db) { this.db = db; }

  async putQuote(quote) {
    await this.db.prepare(`INSERT INTO paperback_quotes
      (quote_id, book_slug, quantity, buyer_email, shipping_address_json, shipping_option, shipping_cents, currency, lulu_quote_json, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(quote.quoteId, quote.bookSlug, quote.quantity, quote.buyerEmail, JSON.stringify(quote.address), quote.shippingOption,
        quote.shippingCents, quote.currency, JSON.stringify(quote.luluQuote), quote.expiresAt, quote.createdAt).run();
  }

  async quote(quoteId) {
    return this.db.prepare("SELECT * FROM paperback_quotes WHERE quote_id = ?").bind(quoteId).first();
  }

  async attachSession(quoteId, sessionId) {
    await this.db.prepare("UPDATE paperback_quotes SET stripe_session_id = ? WHERE quote_id = ? AND stripe_session_id IS NULL")
      .bind(sessionId, quoteId).run();
  }

  async insertPaidOrder(order) {
    const result = await this.db.prepare(`INSERT OR IGNORE INTO paperback_orders
      (stripe_session_id, stripe_event_id, quote_id, book_slug, quantity, buyer_email, shipping_address_json,
       shipping_option, shipping_cents, currency, customer_total_cents, tax_cents, checkout_mode, state, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid', ?, ?)`)
      .bind(order.stripeSessionId, order.stripeEventId, order.quoteId, order.bookSlug, order.quantity, order.buyerEmail,
        JSON.stringify(order.address), order.shippingOption, order.shippingCents, order.currency, order.customerTotalCents,
        order.taxCents, order.checkoutMode, order.now, order.now).run();
    return result.meta?.changes === 1;
  }

  async get(sessionId) {
    return this.db.prepare("SELECT * FROM paperback_orders WHERE stripe_session_id = ?").bind(sessionId).first();
  }

  async claimForSubmission(sessionId, now) {
    const result = await this.db.prepare(`UPDATE paperback_orders
      SET state = 'submitting', attempt_count = attempt_count + 1, updated_at = ?
      WHERE stripe_session_id = ? AND state IN ('paid', 'retryable_failure')`)
      .bind(now, sessionId).run();
    return result.meta?.changes === 1;
  }

  async markSubmitted(sessionId, luluPrintJobId, luluStatus, now) {
    await this.db.prepare(`UPDATE paperback_orders
      SET state = 'submitted', lulu_print_job_id = ?, lulu_status = ?, last_error_code = NULL, last_error_detail = NULL, updated_at = ?
      WHERE stripe_session_id = ?`).bind(luluPrintJobId, luluStatus || 'CREATED', now, sessionId).run();
  }

  async markFailure(sessionId, state, code, detail, now) {
    await this.db.prepare(`UPDATE paperback_orders
      SET state = ?, last_error_code = ?, last_error_detail = ?, updated_at = ? WHERE stripe_session_id = ?`)
      .bind(state, code, String(detail || '').slice(0, 1500), now, sessionId).run();
  }

  async activeOrders() {
    return (await this.db.prepare(`SELECT * FROM paperback_orders
      WHERE state = 'submitted' AND lulu_print_job_id IS NOT NULL
      AND COALESCE(lulu_status, '') NOT IN ('SHIPPED', 'CANCELLED', 'ERROR')`).all()).results || [];
  }

  async ordersNeedingConfirmation() {
    return (await this.db.prepare(`SELECT * FROM paperback_orders
      WHERE state = 'submitted' AND confirmation_emailed_at IS NULL`).all()).results || [];
  }

  async updateLuluStatus(sessionId, status, trackingJson, now) {
    await this.db.prepare(`UPDATE paperback_orders
      SET lulu_status = ?, lulu_tracking_json = ?, updated_at = ? WHERE stripe_session_id = ?`)
      .bind(status, trackingJson, now, sessionId).run();
  }

  async markEmail(sessionId, field, now) {
    const column = field === 'shipment' ? 'shipment_emailed_at' : 'confirmation_emailed_at';
    await this.db.prepare(`UPDATE paperback_orders SET ${column} = ? WHERE stripe_session_id = ?`).bind(now, sessionId).run();
  }

  async insertDigitalPurchase(purchase) {
    const result = await this.db.prepare(`INSERT OR IGNORE INTO digital_purchase_conversions
      (stripe_session_id, stripe_event_id, stripe_payment_link_id, event_label, amount_total, currency, verified_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .bind(purchase.stripeSessionId, purchase.stripeEventId, purchase.stripePaymentLinkId,
        purchase.eventLabel, purchase.amountTotal, purchase.currency, purchase.verifiedAt).run();
    return result.meta?.changes === 1;
  }

  async digitalPurchase(sessionId) {
    return this.db.prepare("SELECT * FROM digital_purchase_conversions WHERE stripe_session_id = ?")
      .bind(sessionId).first();
  }

  async claimDigitalConversion(sessionId, now) {
    const purchase = await this.digitalPurchase(sessionId);
    if (!purchase) return { status: "not_found", purchase: null };
    const result = await this.db.prepare(`UPDATE digital_purchase_conversions
      SET claimed_at = ? WHERE stripe_session_id = ? AND claimed_at IS NULL`)
      .bind(now, sessionId).run();
    return result.meta?.changes === 1
      ? { status: "claimed", purchase: { ...purchase, claimed_at: now } }
      : { status: "duplicate", purchase };
  }
}
