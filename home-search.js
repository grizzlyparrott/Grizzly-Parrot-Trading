(function (root, factory) {
  'use strict';

  var api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  if (root && root.document) {
    root.GrizzlySiteSearch = api;
    if (root.document.readyState === 'loading') {
      root.document.addEventListener('DOMContentLoaded', function () {
        api.init(root.document, root);
      });
    } else {
      api.init(root.document, root);
    }
  }
}(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  var RESULT_LIMIT = 12;
  var STOP_WORDS = Object.create(null);
  var STOP_WORD_LIST = [
    'a', 'about', 'all', 'an', 'and', 'are', 'as', 'at', 'be', 'can', 'could',
    'did', 'do', 'does', 'for', 'from', 'get', 'gets', 'getting', 'give', 'goes',
    'had', 'has', 'have', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its',
    'me', 'much', 'my', 'of', 'on', 'one', 'or', 'our', 'should', 'show', 'that',
    'the', 'their', 'them', 'then', 'there', 'these', 'they', 'this', 'to', 'too',
    'us', 'want', 'what', 'when', 'where', 'which', 'who', 'why', 'will', 'with',
    'work', 'works', 'worth', 'would', 'you', 'your'
  ];
  var ENTITY_MAP = {
    amp: '&', apos: "'", gt: '>', hellip: '…', laquo: '«', ldquo: '“',
    lsquo: '‘', lt: '<', mdash: '—', ndash: '–', nbsp: ' ', quot: '"',
    raquo: '»', rdquo: '”', rsquo: '’'
  };
  var ALIAS_GROUPS = [
    ['6e', 'euro', 'eurofx', 'eurusd'],
    ['6a', 'audusd', 'australian'],
    ['6b', 'gbpusd', 'pound', 'sterling'],
    ['6c', 'cadusd', 'canadian'],
    ['6j', 'jpyusd', 'yen'],
    ['6m', 'mxnusd', 'peso'],
    ['6s', 'chfusd', 'swiss'],
    ['6z', 'zarusd', 'rand'],
    ['cl', 'crude', 'oil', 'wti'],
    ['gc', 'gold'],
    ['nq', 'nasdaq'],
    ['es', 'sp500', 'sandp'],
    ['roll', 'rolled', 'rolling', 'rollover'],
    ['expire', 'expires', 'expiration', 'expiry'],
    ['slip', 'slippage'],
    ['pnl', 'profit', 'profitloss'],
    ['drawdown', 'floor'],
    ['ninja', 'ninjatrader', 'nt8'],
    ['footprint', 'numbersbars', 'orderflow'],
    ['hours', 'session', 'sessions', 'time', 'times'],
    ['bidask', 'spread', 'spreads'],
    ['buyingpower', 'leverage', 'margin'],
    ['evaluation', 'funded', 'prop'],
    ['micro', 'micros'],
    ['rmultiple', 'rvalue'],
    ['stop', 'stoploss']
  ];
  var aliasLookup = Object.create(null);

  STOP_WORD_LIST.forEach(function (word) {
    STOP_WORDS[word] = true;
  });

  function decodeEntities(value) {
    return String(value == null ? '' : value)
      .replace(/&#(x?[0-9a-f]+);/gi, function (match, numeric) {
        var radix = numeric.charAt(0).toLowerCase() === 'x' ? 16 : 10;
        var digits = radix === 16 ? numeric.slice(1) : numeric;
        var codePoint = parseInt(digits, radix);
        if (!Number.isFinite(codePoint) || codePoint < 0 || codePoint > 1114111) return match;
        try {
          return String.fromCodePoint(codePoint);
        } catch (error) {
          return match;
        }
      })
      .replace(/&([a-z]+);/gi, function (match, name) {
        return Object.prototype.hasOwnProperty.call(ENTITY_MAP, name.toLowerCase())
          ? ENTITY_MAP[name.toLowerCase()]
          : match;
      });
  }

  function normalizeText(value) {
    var text = decodeEntities(value)
      .replace(/\bp\s*(?:&|and)\s*l\b/gi, ' pnl profitloss ')
      .replace(/\bs\s*&\s*p\s*500\b/gi, ' sp500 sandp ')
      .replace(/\beur\s*\/\s*usd\b/gi, ' eurusd 6e eurofx ')
      .replace(/\baud\s*\/\s*usd\b/gi, ' audusd 6a ')
      .replace(/\bgbp\s*\/\s*usd\b/gi, ' gbpusd 6b ')
      .replace(/\bcad\s*\/\s*usd\b/gi, ' cadusd 6c ')
      .replace(/\beuro\s+fx\b/gi, ' eurofx 6e ')
      .replace(/\bninja\s+trader\b/gi, ' ninjatrader ')
      .replace(/\border\s+flow\b/gi, ' orderflow ')
      .replace(/\bnumbers?\s+bars?\b/gi, ' numbersbars ')
      .replace(/\bbid\s*(?:-|\/|and)\s*ask\b/gi, ' bidask spread ')
      .replace(/\bbuying\s+power\b/gi, ' buyingpower ')
      .replace(/\br\s*[- ]?multiple\b/gi, ' rmultiple ')
      .replace(/\bstop\s*[- ]?loss\b/gi, ' stoploss ')
      .replace(/\b6\s+e\b/gi, ' 6e ')
      .replace(/&/g, ' and ')
      .toLowerCase();

    if (typeof text.normalize === 'function') {
      text = text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
    }

    return text.replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function stem(token) {
    var value = String(token || '');
    if (value.length > 5 && /ies$/.test(value)) return value.slice(0, -3) + 'y';
    if (value.length > 6 && /ing$/.test(value)) return value.slice(0, -3);
    if (value.length > 5 && /ed$/.test(value)) return value.slice(0, -2);
    if (value.length > 5 && /es$/.test(value) && !/(ses|xes|zes)$/.test(value)) return value.slice(0, -2);
    if (value.length > 3 && /s$/.test(value) && !/ss$/.test(value)) return value.slice(0, -1);
    return value;
  }

  function fieldTokens(value) {
    var normalized = normalizeText(value);
    if (!normalized) return [];
    return normalized.split(' ').map(stem).filter(Boolean);
  }

  ALIAS_GROUPS.forEach(function (group) {
    var normalizedGroup = [];
    group.forEach(function (entry) {
      fieldTokens(entry).forEach(function (token) {
        if (normalizedGroup.indexOf(token) === -1) normalizedGroup.push(token);
      });
    });
    normalizedGroup.forEach(function (token) {
      aliasLookup[token] = normalizedGroup.filter(function (candidate) {
        return candidate !== token;
      });
    });
  });

  function unique(values) {
    var seen = Object.create(null);
    return values.filter(function (value) {
      if (!value || seen[value]) return false;
      seen[value] = true;
      return true;
    });
  }

  function queryModel(value) {
    var normalized = normalizeText(value);
    var rawTokens = normalized ? normalized.split(' ').filter(Boolean) : [];
    var significant = unique(rawTokens.map(stem).filter(function (token) {
      return token && !STOP_WORDS[token];
    }));

    if (!significant.length && rawTokens.length) {
      significant = unique(rawTokens.map(stem).filter(Boolean));
    }

    var terms = significant.map(function (token) {
      var variants = [{ value: token, multiplier: 1 }];
      (aliasLookup[token] || []).forEach(function (alias) {
        variants.push({ value: alias, multiplier: 0.78 });
      });
      return { value: token, variants: variants };
    });

    return {
      original: String(value || '').trim(),
      normalized: normalized,
      terms: terms,
      phrase: significant.join(' '),
      highlightTerms: significant
    };
  }

  function canonicalUrl(url) {
    var value = String(url || '').split('#')[0].split('?')[0];
    if (value.length > 11 && value.slice(-11) === '/index.html') {
      value = value.slice(0, -10);
    }
    return value.replace(/\/{2,}/g, '/');
  }

  function createCorpus(data) {
    var seenUrls = Object.create(null);
    var corpus = [];

    (Array.isArray(data) ? data : []).forEach(function (item, sourceIndex) {
      if (!item || typeof item.url !== 'string' || item.url.charAt(0) !== '/' ||
          item.url.charAt(1) === '/' || /[\\\u0000-\u001f]/.test(item.url) ||
          typeof item.title !== 'string') return;
      var key = canonicalUrl(item.url).toLowerCase();
      if (!key || seenUrls[key]) return;
      seenUrls[key] = true;

      var title = decodeEntities(item.title || 'Untitled resource');
      var description = decodeEntities(item.description || 'Open this Grizzly Parrot Trading resource.');
      var category = decodeEntities(item.category || 'Resource');
      var titleTokens = fieldTokens(title);
      var descriptionTokens = fieldTokens(description);
      var categoryTokens = fieldTokens(category);
      var urlTokens = fieldTokens(item.url.replace(/[\/_-]+/g, ' '));

      corpus.push({
        item: {
          title: title,
          description: description,
          category: category,
          url: item.url
        },
        order: sourceIndex,
        categoryKey: normalizeText(category),
        titleText: normalizeText(title),
        descriptionText: normalizeText(description),
        titleTokenText: titleTokens.join(' '),
        descriptionTokenText: descriptionTokens.join(' '),
        titleTokens: unique(titleTokens),
        descriptionTokens: unique(descriptionTokens),
        categoryTokens: unique(categoryTokens),
        urlTokens: unique(urlTokens)
      });
    });

    return corpus;
  }

  function withinEditDistance(left, right, maximum) {
    if (left === right) return true;
    if (Math.abs(left.length - right.length) > maximum) return false;

    var previous = [];
    var current = [];
    var column;
    var row;

    for (column = 0; column <= right.length; column += 1) previous[column] = column;

    for (row = 1; row <= left.length; row += 1) {
      current[0] = row;
      var rowMinimum = current[0];
      for (column = 1; column <= right.length; column += 1) {
        var substitution = previous[column - 1] + (left.charAt(row - 1) === right.charAt(column - 1) ? 0 : 1);
        current[column] = Math.min(previous[column] + 1, current[column - 1] + 1, substitution);
        if (current[column] < rowMinimum) rowMinimum = current[column];
      }
      if (rowMinimum > maximum) return false;
      previous = current.slice();
    }

    return previous[right.length] <= maximum;
  }

  function basicTokenQuality(queryToken, targetToken) {
    if (queryToken === targetToken) return 1;

    var shortest = Math.min(queryToken.length, targetToken.length);
    var lengthDifference = Math.abs(queryToken.length - targetToken.length);

    if (shortest >= 3 && lengthDifference <= 3 &&
        (targetToken.indexOf(queryToken) === 0 || queryToken.indexOf(targetToken) === 0)) {
      return 0.78;
    }

    if (shortest >= 4 && lengthDifference <= 1 && withinEditDistance(queryToken, targetToken, 1)) {
      return 0.7;
    }

    if (shortest >= 8 && lengthDifference <= 2 && withinEditDistance(queryToken, targetToken, 2)) {
      return 0.56;
    }

    return 0;
  }

  function fieldMatch(term, tokens, weight) {
    var best = 0;

    term.variants.forEach(function (variant) {
      tokens.forEach(function (targetToken) {
        var quality = basicTokenQuality(variant.value, targetToken) * variant.multiplier;
        if (quality * weight > best) best = quality * weight;
      });
    });

    return best;
  }

  function scoreEntry(entry, query) {
    var matched = 0;
    var titleMatches = 0;
    var score = 0;

    query.terms.forEach(function (term) {
      var titleScore = fieldMatch(term, entry.titleTokens, 80);
      var descriptionScore = fieldMatch(term, entry.descriptionTokens, 28);
      var categoryScore = fieldMatch(term, entry.categoryTokens, 18);
      var urlScore = fieldMatch(term, entry.urlTokens, 11);
      var best = Math.max(titleScore, descriptionScore, categoryScore, urlScore);

      if (best > 0) {
        matched += 1;
        score += best;
        if (titleScore >= 44) titleMatches += 1;
      } else {
        score -= 7;
      }
    });

    var totalTerms = query.terms.length;
    var coverage = totalTerms ? matched / totalTerms : 0;
    var minimumMatches = totalTerms <= 2 ? 1 : Math.ceil(totalTerms * 0.5);

    if (matched < minimumMatches) return null;

    score += coverage * 70;
    score += titleMatches * 15;
    if (matched === totalTerms) score += 34;

    if (query.phrase) {
      if (entry.titleTokenText.indexOf(query.phrase) !== -1) score += 150;
      else if (entry.descriptionTokenText.indexOf(query.phrase) !== -1) score += 48;
    }

    if (totalTerms === 1 && entry.titleTokens.length &&
        basicTokenQuality(query.terms[0].value, entry.titleTokens[0]) >= 0.78) {
      score += 18;
    }

    var leadingContractSymbol = entry.titleTokens.length && /^[0-9][a-z]$/.test(entry.titleTokens[0])
      ? entry.titleTokens[0]
      : '';
    if (leadingContractSymbol) {
      var symbolRequested = query.terms.some(function (term) {
        return term.variants.some(function (variant) {
          return variant.value === leadingContractSymbol;
        });
      });
      if (!symbolRequested) score -= 28;
    }

    return {
      item: entry.item,
      score: score,
      matched: matched,
      titleMatches: titleMatches,
      coverage: coverage,
      order: entry.order
    };
  }

  function search(corpus, value, category) {
    var query = queryModel(value);
    var categoryKey = normalizeText(category || 'all');
    var categoryFiltered = corpus.filter(function (entry) {
      return categoryKey === 'all' || entry.categoryKey === categoryKey;
    });

    if (!query.terms.length) {
      return {
        query: query,
        matches: categoryFiltered.map(function (entry) {
          return { item: entry.item, score: 0, matched: 0, titleMatches: 0, coverage: 0, order: entry.order };
        })
      };
    }

    var matches = categoryFiltered.map(function (entry) {
      return scoreEntry(entry, query);
    }).filter(Boolean);

    matches.sort(function (left, right) {
      if (right.score !== left.score) return right.score - left.score;
      if (right.titleMatches !== left.titleMatches) return right.titleMatches - left.titleMatches;
      if (right.coverage !== left.coverage) return right.coverage - left.coverage;
      if (right.matched !== left.matched) return right.matched - left.matched;
      return left.order - right.order;
    });

    return { query: query, matches: matches };
  }

  function defaultResults(corpus, preferredUrls) {
    var byUrl = Object.create(null);
    corpus.forEach(function (entry) {
      byUrl[canonicalUrl(entry.item.url)] = entry.item;
    });

    var selected = [];
    preferredUrls.forEach(function (url) {
      var item = byUrl[canonicalUrl(url)];
      if (item) selected.push(item);
    });

    return selected.length ? selected : corpus.slice(0, 8).map(function (entry) { return entry.item; });
  }

  function escapePattern(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function appendHighlighted(element, value, terms, documentObject) {
    var text = decodeEntities(value);
    var needles = unique((terms || []).filter(function (term) {
      return term.length >= 2;
    })).sort(function (left, right) {
      return right.length - left.length;
    });

    if (!needles.length) {
      element.textContent = text;
      return;
    }

    var pattern = new RegExp('(' + needles.map(escapePattern).join('|') + ')', 'ig');
    var cursor = 0;
    var match;

    while ((match = pattern.exec(text)) !== null) {
      if (match.index > cursor) element.appendChild(documentObject.createTextNode(text.slice(cursor, match.index)));
      var marker = documentObject.createElement('mark');
      marker.textContent = match[0];
      element.appendChild(marker);
      cursor = match.index + match[0].length;
      if (pattern.lastIndex === match.index) pattern.lastIndex += 1;
    }

    if (cursor < text.length) element.appendChild(documentObject.createTextNode(text.slice(cursor)));
  }

  function init(documentObject, windowObject) {
    var form = documentObject.getElementById('home-search-form');
    if (!form || form.dataset.searchReady === 'true') return;

    var input = documentObject.getElementById('home-search-input');
    var clearButton = documentObject.getElementById('home-search-clear');
    var status = documentObject.getElementById('home-search-status');
    var results = documentObject.getElementById('home-search-results');
    var empty = documentObject.getElementById('home-search-empty');
    var total = documentObject.getElementById('home-library-total');
    var heroHelp = documentObject.getElementById('home-search-help');
    var resultSection = documentObject.getElementById('site-search');
    var year = documentObject.getElementById('year');
    var filterButtons = Array.prototype.slice.call(documentObject.querySelectorAll('.home-search-filters button'));
    var exampleButtons = Array.prototype.slice.call(documentObject.querySelectorAll('[data-search-query]'));

    if (!input || !clearButton || !status || !results || !empty || !heroHelp || !resultSection) return;

    var corpus = [];
    var activeCategory = 'all';
    var ready = false;
    var preferredUrls = [
      '/platforms-tutorials/sierra-chart-numbers-bars-guide.html',
      '/market-basics/risk-per-trade-small-accounts.html',
      '/prop-firm-trading/static-vs-trailing-drawdown.html',
      '/futures-basics/ticks-points-dollar-value.html',
      '/futures-basics/contract-expiration-and-roll.html',
      '/futures-basics/gc-market-microstructure.html',
      '/futures-basics/how-rate-differentials-drive-6e-price.html',
      '/futures-basics/how-to-read-order-flow-on-6e.html'
    ];

    form.dataset.searchReady = 'true';
    results.setAttribute('aria-busy', 'true');
    if (year) year.textContent = new Date().getFullYear();

    function emptyResults() {
      while (results.firstChild) results.removeChild(results.firstChild);
    }

    function makeResult(item, highlightTerms, bestMatch) {
      var link = documentObject.createElement('a');
      var category = documentObject.createElement('span');
      var title = documentObject.createElement('strong');
      var description = documentObject.createElement('p');

      link.href = item.url;
      if (bestMatch) link.classList.add('is-best-match');
      category.textContent = item.category + (bestMatch ? ' · Best match' : '');
      appendHighlighted(title, item.title, highlightTerms, documentObject);
      appendHighlighted(description, item.description, highlightTerms, documentObject);
      link.appendChild(category);
      link.appendChild(title);
      link.appendChild(description);
      return link;
    }

    function updateMessages(query, matchCount, visibleItems) {
      var hasQuery = Boolean(query.original);

      if (!hasQuery && activeCategory === 'all') {
        status.textContent = 'Showing ' + visibleItems.length + ' featured resources from ' + corpus.length.toLocaleString() + ' indexed items.';
        heroHelp.textContent = 'Search ' + corpus.length.toLocaleString() + ' indexed resources. Natural questions and minor misspellings are okay.';
        return;
      }

      if (!matchCount) {
        status.textContent = 'No matching resources found.';
        heroHelp.textContent = 'No matches yet. Try fewer words, a contract symbol, or a nearby term.';
        return;
      }

      if (!hasQuery) {
        var activeButton = filterButtons.find(function (button) {
          return button.dataset.category === activeCategory;
        });
        var categoryLabel = activeButton ? activeButton.textContent.trim() : 'selected section';
        status.textContent = 'Showing ' + visibleItems.length + ' of ' + matchCount + ' resources in ' + categoryLabel + '.';
        heroHelp.textContent = matchCount + ' resources in ' + categoryLabel + '. Enter a question or topic to narrow the results.';
        return;
      }

      var resultWord = matchCount === 1 ? 'resource' : 'resources';
      status.textContent = 'Showing ' + visibleItems.length + ' of ' + matchCount + ' matching ' + resultWord + ', ranked by relevance.';
      heroHelp.textContent = matchCount + ' ' + (matchCount === 1 ? 'match' : 'matches') + '. Best match: ' + visibleItems[0].title + '. Press Enter or choose Search site to jump to the results.';
    }

    function render() {
      if (!ready) return;

      var queryValue = input.value;
      var query = queryModel(queryValue);
      var matches;

      if (!query.terms.length && activeCategory === 'all') {
        matches = defaultResults(corpus, preferredUrls).map(function (item) {
          return { item: item };
        });
      } else {
        matches = search(corpus, queryValue, activeCategory).matches;
      }

      var visibleMatches = matches.slice(0, RESULT_LIMIT);
      var visibleItems = visibleMatches.map(function (match) { return match.item; });
      emptyResults();
      visibleItems.forEach(function (item, index) {
        results.appendChild(makeResult(item, query.highlightTerms, Boolean(query.original) && index === 0));
      });

      empty.hidden = visibleItems.length !== 0;
      results.setAttribute('aria-busy', 'false');
      updateMessages(query, matches.length, visibleItems);
    }

    function setCategory(button) {
      if (!button) return;
      activeCategory = button.dataset.category || 'all';
      filterButtons.forEach(function (item) {
        var active = item === button;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      render();
    }

    function clearSearch() {
      input.value = '';
      var allButton = filterButtons.find(function (button) {
        return button.dataset.category === 'all';
      });
      setCategory(allButton);
      input.focus();
    }

    function revealResults() {
      resultSection.scrollIntoView({ behavior: 'auto', block: 'start' });
    }

    windowObject.fetch('/search-index.json', {
      cache: 'no-cache',
      credentials: 'same-origin'
    })
      .then(function (response) {
        if (!response.ok) throw new Error('Search index unavailable');
        return response.json();
      })
      .then(function (data) {
        corpus = createCorpus(data);
        if (!corpus.length) throw new Error('Search index empty');
        ready = true;
        if (total) total.textContent = corpus.length.toLocaleString() + ' indexed resources';
        render();
      })
      .catch(function () {
        results.setAttribute('aria-busy', 'false');
        status.textContent = 'Search is temporarily unavailable. The featured resources below remain accessible.';
        heroHelp.textContent = 'Search is temporarily unavailable; browse the site sections below.';
      });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      render();
      windowObject.setTimeout(revealResults, 0);
    });
    input.addEventListener('input', render);
    input.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') clearSearch();
    });
    clearButton.addEventListener('click', clearSearch);
    filterButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        setCategory(button);
        windowObject.setTimeout(revealResults, 0);
      });
    });
    exampleButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        input.value = button.dataset.searchQuery || '';
        var allButton = filterButtons.find(function (filterButton) {
          return filterButton.dataset.category === 'all';
        });
        setCategory(allButton);
        input.focus();
        windowObject.setTimeout(revealResults, 0);
      });
    });
  }

  return {
    canonicalUrl: canonicalUrl,
    createCorpus: createCorpus,
    decodeEntities: decodeEntities,
    init: init,
    normalizeText: normalizeText,
    queryModel: queryModel,
    search: search,
    withinEditDistance: withinEditDistance
  };
}));
