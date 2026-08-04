(function () {
  "use strict";

  var LINK_SELECTOR = "a[data-affiliate-program][data-affiliate-location]";
  var SESSION_KEY = "gpt_affiliate_acquisition_v1";

  function safeUrl(value) {
    try {
      return new URL(value, window.location.href);
    } catch (_error) {
      return null;
    }
  }

  function classifyDevice() {
    var width = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    if (width < 768) return "mobile";
    if (width < 1024) return "tablet";
    return "desktop";
  }

  function classifyAcquisition() {
    var params = new URLSearchParams(window.location.search);
    var campaignSource = (params.get("utm_source") || "").toLowerCase();
    var campaignMedium = (params.get("utm_medium") || "").toLowerCase();
    var aiPattern = /(chatgpt|openai|claude|anthropic|copilot|perplexity|gemini|bard|you\.com)/;

    if (campaignSource || campaignMedium) {
      if (aiPattern.test(campaignSource + " " + campaignMedium)) return "ai_referral";
      if (campaignMedium === "organic") return "organic_search";
      if (/(social|social-network|social-media)/.test(campaignMedium)) return "social";
      if (/(cpc|ppc|paid|display)/.test(campaignMedium)) return "paid";
      return "campaign";
    }

    if (!document.referrer) return "direct";

    var referrer = safeUrl(document.referrer);
    if (!referrer) return "other";
    if (referrer.origin === window.location.origin) return "internal";

    var host = referrer.hostname.toLowerCase();
    if (aiPattern.test(host)) return "ai_referral";
    if (/(google\.|bing\.|duckduckgo\.|search\.yahoo\.|search\.brave\.)/.test(host)) return "organic_search";
    if (/(facebook\.|instagram\.|reddit\.|linkedin\.|twitter\.|x\.com$|youtube\.|tiktok\.)/.test(host)) return "social";
    return "referral";
  }

  function sessionAcquisition() {
    try {
      var existing = window.sessionStorage.getItem(SESSION_KEY);
      if (existing) return existing;
      var current = classifyAcquisition();
      window.sessionStorage.setItem(SESSION_KEY, current);
      return current;
    } catch (_error) {
      return classifyAcquisition();
    }
  }

  function sendAffiliateEvent(link) {
    var destination = safeUrl(link.href);
    var parameters = {
      affiliate_program: link.getAttribute("data-affiliate-program") || "unknown",
      link_location: link.getAttribute("data-affiliate-location") || "unknown",
      link_text: (link.textContent || "").trim().slice(0, 100),
      link_url: destination ? destination.href : link.href,
      outbound_domain: destination ? destination.hostname : "unknown",
      page_path: window.location.pathname,
      device_type: classifyDevice(),
      traffic_channel: sessionAcquisition(),
      transport_type: "beacon"
    };

    if (typeof window.gtag === "function") {
      window.gtag("event", "affiliate_click", parameters);
      return;
    }

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: "affiliate_click" }, parameters));
  }

  document.addEventListener("click", function (event) {
    var target = event.target;
    if (!target || typeof target.closest !== "function") return;
    var link = target.closest(LINK_SELECTOR);
    if (!link) return;
    sendAffiliateEvent(link);
  }, true);
}());

