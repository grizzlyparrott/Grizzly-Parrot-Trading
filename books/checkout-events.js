(function (global) {
  'use strict';

  function beginCheckout(label, value) {
    var normalizedLabel = String(label || '').trim();
    if (!normalizedLabel) return;

    var payload = {
      event_category: 'Book',
      event_label: normalizedLabel
    };
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
      payload.event_value = Math.round(value * 100) / 100;
    }

    global.uetq = global.uetq || [];
    global.uetq.push('event', 'begin_checkout', payload);
  }

  global.GrizzlyCommerceAnalytics = Object.freeze({ beginCheckout: beginCheckout });
})(window);
