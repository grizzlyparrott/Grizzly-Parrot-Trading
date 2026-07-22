(function (w, d, tagName, source, queueName) {
  var script;
  var firstScript;
  var load;
  w[queueName] = w[queueName] || [];
  load = function () {
    var options = { ti: "97257755", enableAutoSpaTracking: true };
    options.q = w[queueName];
    w[queueName] = new UET(options);
    w[queueName].push("pageLoad");
  };
  script = d.createElement(tagName);
  script.src = source;
  script.async = 1;
  script.onload = script.onreadystatechange = function () {
    var readyState = this.readyState;
    if (!readyState || readyState === "loaded" || readyState === "complete") {
      load();
      script.onload = script.onreadystatechange = null;
    }
  };
  firstScript = d.getElementsByTagName(tagName)[0];
  firstScript.parentNode.insertBefore(script, firstScript);
})(window, document, "script", "https://bat.bing.com/bat.js", "uetq");
