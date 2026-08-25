(function (global) {
  'use strict';

  function dollars(cents) {
    return '$' + (cents / 100).toFixed(0);
  }

  function validEndpoint(value, workerHost) {
    try {
      var parsed = new URL(value);
      return parsed.protocol === 'https:'
        && parsed.hostname === workerHost
        && parsed.pathname === '/print/start'
        && parsed.search === '';
    } catch (error) {
      return false;
    }
  }

  function validStripeCheckout(value) {
    try {
      var parsed = new URL(value);
      return parsed.protocol === 'https:' && parsed.hostname === 'checkout.stripe.com';
    } catch (error) {
      return false;
    }
  }

  function newRequestId() {
    if (global.crypto && typeof global.crypto.randomUUID === 'function') return global.crypto.randomUUID();
    if (!global.crypto || typeof global.crypto.getRandomValues !== 'function') throw new Error('Secure checkout is unavailable in this browser.');
    var bytes = new Uint8Array(16);
    global.crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    var hex = Array.prototype.map.call(bytes, function (byte) { return byte.toString(16).padStart(2, '0'); }).join('');
    return hex.slice(0, 8) + '-' + hex.slice(8, 12) + '-' + hex.slice(12, 16) + '-' + hex.slice(16, 20) + '-' + hex.slice(20);
  }

  function setBusy(buttons, busy) {
    buttons.forEach(function (button) {
      button.disabled = busy;
      button.classList.toggle('button-loading', busy);
    });
  }

  function unavailable(item) {
    var buttons = Array.prototype.slice.call(document.querySelectorAll(item.buttonSelector));
    var status = document.querySelector(item.statusSelector);
    buttons.forEach(function (button) {
      button.disabled = true;
      button.classList.add('button-disabled');
    });
    if (status) status.textContent = 'Print checkout is temporarily unavailable. Please try again shortly.';
  }

  function configValid(config, options) {
    return Boolean(config
      && config.enabled === true
      && validEndpoint(config.checkoutEndpoint, options.workerHost)
      && config.shippingRates
      && config.shippingRates.currency === 'USD'
      && config.shippingRates.usCents === options.usShippingCents
      && config.shippingRates.internationalCents === options.internationalShippingCents);
  }

  function enableEdition(item, config, options) {
    var buttons = Array.prototype.slice.call(document.querySelectorAll(item.buttonSelector));
    var status = document.querySelector(item.statusSelector);
    var price = document.querySelector(item.priceSelector);
    if (!buttons.length || !configValid(config, options)) {
      unavailable(item);
      return;
    }
    if (Number.isInteger(config.priceCents) && config.priceCents > 0 && price) price.textContent = dollars(config.priceCents);
    buttons.forEach(function (button) {
      button.disabled = false;
      button.classList.remove('button-disabled');
      button.addEventListener('click', function () {
        var region = button.getAttribute('data-shipping-region');
        if (region !== 'us' && region !== 'international') return;
        setBusy(buttons, true);
        var originalText = button.textContent;
        button.textContent = 'Opening Stripe checkout…';
        if (status) status.textContent = 'Creating a secure Stripe checkout. No payment has been placed yet.';
        if (typeof global.gtag === 'function') {
          global.gtag('event', 'click', {
            event_category: 'Book',
            event_label: 'Buy ' + options.analyticsTitle + ' (' + item.edition + ', ' + region + ')'
          });
        }
        var requestId;
        try { requestId = newRequestId(); }
        catch (error) {
          button.textContent = originalText;
          setBusy(buttons, false);
          if (status) status.textContent = error.message;
          return;
        }
        fetch(config.checkoutEndpoint, {
          method: 'POST',
          mode: 'cors',
          credentials: 'omit',
          cache: 'no-store',
          headers: {'content-type': 'application/json'},
          body: JSON.stringify({
            bookSlug: options.bookSlug,
            edition: item.edition,
            region: region,
            requestId: requestId
          })
        })
          .then(function (response) {
            return response.json().catch(function () { return null; }).then(function (body) {
              if (!response.ok || !body || !validStripeCheckout(body.checkoutUrl)) {
                throw new Error(body && body.message ? body.message : 'Stripe checkout could not be opened.');
              }
              return body.checkoutUrl;
            });
          })
          .then(function (checkoutUrl) { global.location.assign(checkoutUrl); })
          .catch(function (error) {
            button.textContent = originalText;
            setBusy(buttons, false);
            if (status) status.textContent = error.message + ' No charge was made.';
          });
      });
    });
    if (status) status.textContent = '$7.49 U.S. shipping or $19.99 international shipping. Address and payment are entered securely on Stripe.';
  }

  function init(options) {
    if (!options || !Array.isArray(options.editions)) throw new Error('Print checkout configuration is incomplete.');
    options.editions.forEach(unavailable);
    options.editions.forEach(function (item) {
      fetch(options.workerBase + '/public-config?bookSlug=' + encodeURIComponent(options.bookSlug) + '&edition=' + encodeURIComponent(item.edition), {
        credentials: 'omit',
        cache: 'no-store'
      })
        .then(function (response) { return response.ok ? response.json() : null; })
        .then(function (config) { enableEdition(item, config, options); })
        .catch(function () {
          unavailable(item);
          // Safe default: this print edition remains disabled.
        });
    });
  }

  global.GrizzlyPrintCheckout = Object.freeze({init: init});
}(window));
