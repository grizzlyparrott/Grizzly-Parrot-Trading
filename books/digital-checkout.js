(function (global) {
  'use strict';

  var STRIPE_HOSTS = ['buy.stripe.com', 'book.stripe.com'];

  function validCheckoutUrl(value) {
    try {
      var parsed = new URL(value);
      return parsed.protocol === 'https:'
        && STRIPE_HOSTS.indexOf(parsed.hostname) !== -1
        && parsed.pathname.length > 6
        && !/(?:test|example|placeholder|dummy)/i.test(parsed.pathname);
    } catch (_error) {
      return false;
    }
  }

  function setUnavailable(button, status, message) {
    button.href = '#';
    button.classList.add('button-disabled');
    button.setAttribute('aria-disabled', 'true');
    if (status) status.textContent = message;
  }

  function init(options) {
    var button = document.querySelector(options.buttonSelector);
    var status = document.querySelector(options.statusSelector);
    if (!button) return;

    setUnavailable(button, status, 'Checking secure digital checkout…');
    button.addEventListener('click', function (event) {
      if (button.getAttribute('aria-disabled') === 'true') event.preventDefault();
    });

    var endpoint = String(options.apiBaseUrl || '').replace(/\/$/, '')
      + '/digital-config?bookSlug=' + encodeURIComponent(options.bookSlug);

    fetch(endpoint, { credentials: 'omit', cache: 'no-store' })
      .then(function (response) {
        if (!response.ok) throw new Error('Digital checkout configuration is unavailable.');
        return response.json();
      })
      .then(function (config) {
        if (config.enabled !== true
          || config.priceCents !== options.expectedPriceCents
          || !validCheckoutUrl(config.checkoutUrl)) {
          throw new Error('Digital checkout is not enabled.');
        }
        button.href = config.checkoutUrl;
        button.target = '_blank';
        button.rel = 'noopener';
        button.classList.remove('button-disabled');
        button.setAttribute('aria-disabled', 'false');
        if (status) status.textContent = options.readyMessage;
        button.addEventListener('click', function () {
          if (typeof global.gtag === 'function') {
            global.gtag('event', 'begin_checkout', {
              event_category: 'Book',
              event_label: options.analyticsLabel,
              value: options.expectedPriceCents / 100,
              currency: 'USD'
            });
          }
        });
      })
      .catch(function () {
        setUnavailable(button, status, 'Digital bundle checkout is temporarily unavailable.');
      });
  }

  global.GrizzlyDigitalCheckout = Object.freeze({ init: init });
})(window);
