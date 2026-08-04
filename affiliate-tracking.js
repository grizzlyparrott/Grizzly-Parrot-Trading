(function () {
  "use strict";

  var GENERIC_SELECTOR = "a[data-affiliate-program][data-affiliate-location]";
  var BOOKMAP_SELECTOR = 'a[data-affiliate-partner="bookmap"]';
  var SESSION_KEY = "gpt_affiliate_acquisition_v1";

  function safeUrl(value) {
    try {
      return new URL(value, window.location.href);
    } catch (_error) {
      return null;
    }
  }

  function normalizedText(link) {
    return (link.textContent || "").replace(/\s+/g, " ").trim().slice(0, 100);
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

  function emit(name, parameters) {
    if (typeof window.gtag === "function") {
      window.gtag("event", name, parameters);
      return;
    }
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: name }, parameters));
  }

  function recordGenericClick(link) {
    var destination = safeUrl(link.href);
    emit("affiliate_click", {
      affiliate_program: link.getAttribute("data-affiliate-program") || "unknown",
      link_location: link.getAttribute("data-affiliate-location") || "unknown",
      link_text: normalizedText(link),
      link_url: destination ? destination.href : link.href,
      outbound_domain: destination ? destination.hostname : "unknown",
      page_path: window.location.pathname,
      device_type: classifyDevice(),
      traffic_channel: sessionAcquisition(),
      transport_type: "beacon"
    });
  }

  function recordBookmapClick(link) {
    var parameters = {
      affiliate_partner: "bookmap",
      link_page: window.location.pathname,
      link_location: link.getAttribute("data-link-location") || "unknown",
      link_destination: link.getAttribute("data-link-destination") || "bookmap-subscription",
      link_url: link.href,
      link_text: normalizedText(link),
      device_type: classifyDevice(),
      traffic_channel: sessionAcquisition(),
      outbound: true,
      transport_type: "beacon"
    };
    emit("bookmap_affiliate_click", parameters);
    window.dispatchEvent(new CustomEvent("bookmap:affiliate-click", { detail: parameters }));
  }

  function handleClick(event) {
    if (event.type === "auxclick" && event.button !== 1) return;
    var target = event.target;
    if (!target || typeof target.closest !== "function") return;

    var genericLink = target.closest(GENERIC_SELECTOR);
    if (genericLink) recordGenericClick(genericLink);

    var bookmapLink = target.closest(BOOKMAP_SELECTOR);
    if (bookmapLink) recordBookmapClick(bookmapLink);
  }

  document.addEventListener("click", handleClick, false);
  document.addEventListener("auxclick", handleClick, false);
}());
