LOG = console.log.bind(console);

var cVimError = function(message) {
  console.error(message);
};

var definePrototype = function(obj, name, fn) {
  Object.defineProperty(obj.prototype, name, {
    enumerable: false,
    configurable: false,
    writeable: false,
    value: fn
  });
};

// ------------ Begin reverse image
var isValidB64 = function(a) {
  try {
    window.atob(a);
  } catch(e) {
    return false;
  }
  return true;
};

var reverseImagePost = function(url) {
  return '<html><head><title>cVim reverse image search</title></head><body><form id="f" method="POST" action="https://www.google.com/searchbyimage/upload" enctype="multipart/form-data"><input type="hidden" name="image_content" value="' + url.substring(url.indexOf(',') + 1).replace(/\+/g, '-').replace(/\//g, '_').replace(/\./g, '=') + '"><input type="hidden" name="filename" value=""><input type="hidden" name="image_url" value=""><input type="hidden" name="sbisrc" value=""></form><script>document.getElementById("f").submit();\x3c/script></body></html>';
};

// Based off of the 'Search by Image' Chrome Extension by Google
var googleReverseImage = function(url, source) {
  if (void 0 !== url && url.indexOf('data:') === 0) {
    if (url.search(/data:image\/(bmp|gif|jpe?g|png|webp|tiff|x-ico)/i) === 0) {
      var commaIndex = url.indexOf(',');
      if (commaIndex !== -1 && isValidB64(url.substring(commaIndex + 1))) {
        return 'data:text/html;charset=utf-8;base64,' + window.btoa(reverseImagePost(url, source));
      }
    }
  } else {
    if (url.indexOf('file://') === 0 || url.indexOf('chrome') === 0) {
      PORTCALLBACK('urlToBase64', { url: url }, function(data) {
        RUNTIME('openLinkTab', {
          active: false,
          url: 'data:text/html;charset=utf-8;base64,' +
            window.btoa(reverseImagePost(data, null)),
          noconvert: true
        });
      });
      return;
    }
    return 'https://www.google.com/searchbyimage?image_url=' + url;
  }
};
// ------------ End reverse image

var getVisibleBoundingRect = function(node) {
  var i;
  var boundingRect = node.getClientRects()[0] || node.getBoundingClientRect();
  if (boundingRect.width <= 1 && boundingRect.height <= 1) {
    var rects = node.getClientRects();
    for (i = 0; i < rects.length; i++) {
      if (rects[i].width > rects[0].height && rects[i].height > rects[0].height) {
        boundingRect = rects[i];
      }
    }
  }
  if (boundingRect === void 0) {
    return false;
  }
  if (boundingRect.top > innerHeight || boundingRect.left > innerWidth) {
    return false;
  }
  if (boundingRect.width <= 1 || boundingRect.height <= 1) {
    var children = node.children;
    var visibleChildNode = false;
    for (i = 0, l = children.length; i < l; ++i) {
      boundingRect = children[i].getClientRects()[0] || children[i].getBoundingClientRect();
      if (boundingRect.width > 1 && boundingRect.height > 1) {
        visibleChildNode = true;
        break;
      }
    }
    if (visibleChildNode === false) {
      return false;
    }
  }
  if (boundingRect.top + boundingRect.height < 10 || boundingRect.left + boundingRect.width < -10) {
    return false;
  }
  var computedStyle = getComputedStyle(node, null);
  if (computedStyle.opacity === '0' ||
      computedStyle.visibility !== 'visible' ||
      computedStyle.display === 'none' ||
      node.hasAttribute('disabled') ||
      parseInt(computedStyle.width, '10') === 0 ||
      parseInt(computedStyle.height, '10') === 0) {
    return false;
  }
  return boundingRect;
};

definePrototype(HTMLElement, 'isVisible', function() {
  return this.offsetParent && !this.disabled &&
    this.getAttribute('type') !== 'hidden' &&
    getComputedStyle(this).visibility !== 'hidden' &&
    this.getAttribute('display') !== 'none';
});

var isVisible = function(element) {
  return element.offsetParent &&
         !element.disabled &&
         element.getAttribute('type') !== 'hidden' &&
         getComputedStyle(element).visibility !== 'hidden' &&
         element.getAttribute('display') !== 'none';
};

var simulateMouseEvents = function(element, events) {
  for (var i = 0; i < events.length; ++i) {
    var ev = document.createEvent('MouseEvents');
    ev.initMouseEvent(events[i], true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
    element.dispatchEvent(ev);
  }
};

definePrototype(HTMLElement, 'hover', function() {
  simulateMouseEvents(this, ['mouseover', 'mouseenter']);
});

definePrototype(HTMLElement, 'unhover', function() {
  simulateMouseEvents(this, ['mouseout', 'mouseleave']);
});

definePrototype(HTMLElement, 'simulateClick', function() {
  simulateMouseEvents(this, ['mouseover', 'mousedown', 'mouseup', 'click']);
});

definePrototype(Array, 'unique', function() {
  var a = [];
  for (var i = 0, l = this.length; i < l; ++i) {
    if (a.indexOf(this[i]) === -1) {
      a.push(this[i]);
    }
  }
  return a;
});

definePrototype(Array, 'compress', function() {
  return this.filter(function(e) {
    return e;
  });
});

definePrototype(Number, 'mod', function(n) {
  return ((this % n) + n) % n;
});

Object.clone = function(node) {
  if (Array.isArray(node)) {
    return node.map(function(e) {
      return Object.clone(e);
    });
  } else if (typeof node === 'object') {
    var o = {};
    for (var key in node) {
      o[key] = Object.clone(node[key]);
    }
    return o;
  } else {
    return node;
  }
};

Object.compare = function(a, b, keys) {
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') {
    return a === b;
  }
  if (!Array.isArray(keys)) {
    for (var key in a) {
      if (a[key] !== b[key]) {
        return false;
      }
    }
  } else {
    return keys.every(function(e) { return a[e] === b[e]; });
  }
  return true;
};

definePrototype(String, 'trimAround', function() {
  return this.replace(/^(\s+)?(.*\S)?(\s+)?$/g, '$2');
});

definePrototype(String, 'validURL', (function() {
  var TLDs = ['abogado', 'ac', 'academy', 'accountants', 'active', 'actor', 'ad', 'adult', 'ae', 'aero', 'af', 'ag', 'agency', 'ai', 'airforce', 'al', 'allfinanz', 'alsace', 'am', 'amsterdam', 'an', 'android', 'ao', 'aq', 'aquarelle', 'ar', 'archi', 'army', 'arpa', 'as', 'asia', 'associates', 'at', 'attorney', 'au', 'auction', 'audio', 'autos', 'aw', 'ax', 'axa', 'az', 'ba', 'band', 'bank', 'bar', 'barclaycard', 'barclays', 'bargains', 'bayern', 'bb', 'bd', 'be', 'beer', 'berlin', 'best', 'bf', 'bg', 'bh', 'bi', 'bid', 'bike', 'bio', 'biz', 'bj', 'black', 'blackfriday', 'bloomberg', 'blue', 'bm', 'bmw', 'bn', 'bnpparibas', 'bo', 'boo', 'boutique', 'br', 'brussels', 'bs', 'bt', 'budapest', 'build', 'builders', 'business', 'buzz', 'bv', 'bw', 'by', 'bz', 'bzh', 'ca', 'cab', 'cal', 'camera', 'camp', 'cancerresearch', 'capetown', 'capital', 'caravan', 'cards', 'care', 'career', 'careers', 'cartier', 'casa', 'cash', 'cat', 'catering', 'cc', 'cd', 'center', 'ceo', 'cern', 'cf', 'cg', 'ch', 'channel', 'cheap', 'christmas', 'chrome', 'church', 'ci', 'citic', 'city', 'ck', 'cl', 'claims', 'cleaning', 'click', 'clinic', 'clothing', 'club', 'cm', 'cn', 'co', 'coach', 'codes', 'coffee', 'college', 'cologne', 'com', 'community', 'company', 'computer', 'condos', 'construction', 'consulting', 'contractors', 'cooking', 'cool', 'coop', 'country', 'cr', 'credit', 'creditcard', 'cricket', 'crs', 'cruises', 'cu', 'cuisinella', 'cv', 'cw', 'cx', 'cy', 'cymru', 'cz', 'dabur', 'dad', 'dance', 'dating', 'day', 'dclk', 'de', 'deals', 'degree', 'delivery', 'democrat', 'dental', 'dentist', 'desi', 'design', 'dev', 'diamonds', 'diet', 'digital', 'direct', 'directory', 'discount', 'dj', 'dk', 'dm', 'dnp', 'do', 'docs', 'domains', 'doosan', 'durban', 'dvag', 'dz', 'eat', 'ec', 'edu', 'education', 'ee', 'eg', 'email', 'emerck', 'energy', 'engineer', 'engineering', 'enterprises', 'equipment', 'er', 'es', 'esq', 'estate', 'et', 'eu', 'eurovision', 'eus', 'events', 'everbank', 'exchange', 'expert', 'exposed', 'fail', 'farm', 'fashion', 'feedback', 'fi', 'finance', 'financial', 'firmdale', 'fish', 'fishing', 'fit', 'fitness', 'fj', 'fk', 'flights', 'florist', 'flowers', 'flsmidth', 'fly', 'fm', 'fo', 'foo', 'forsale', 'foundation', 'fr', 'frl', 'frogans', 'fund', 'furniture', 'futbol', 'ga', 'gal', 'gallery', 'garden', 'gb', 'gbiz', 'gd', 'ge', 'gent', 'gf', 'gg', 'ggee', 'gh', 'gi', 'gift', 'gifts', 'gives', 'gl', 'glass', 'gle', 'global', 'globo', 'gm', 'gmail', 'gmo', 'gmx', 'gn', 'goog', 'google', 'gop', 'gov', 'gp', 'gq', 'gr', 'graphics', 'gratis', 'green', 'gripe', 'gs', 'gt', 'gu', 'guide', 'guitars', 'guru', 'gw', 'gy', 'hamburg', 'hangout', 'haus', 'healthcare', 'help', 'here', 'hermes', 'hiphop', 'hiv', 'hk', 'hm', 'hn', 'holdings', 'holiday', 'homes', 'horse', 'host', 'hosting', 'house', 'how', 'hr', 'ht', 'hu', 'ibm', 'id', 'ie', 'ifm', 'il', 'im', 'immo', 'immobilien', 'in', 'industries', 'info', 'ing', 'ink', 'institute', 'insure', 'int', 'international', 'investments', 'io', 'iq', 'ir', 'irish', 'is', 'it', 'iwc', 'jcb', 'je', 'jetzt', 'jm', 'jo', 'jobs', 'joburg', 'jp', 'juegos', 'kaufen', 'kddi', 'ke', 'kg', 'kh', 'ki', 'kim', 'kitchen', 'kiwi', 'km', 'kn', 'koeln', 'kp', 'kr', 'krd', 'kred', 'kw', 'ky', 'kyoto', 'kz', 'la', 'lacaixa', 'land', 'lat', 'latrobe', 'lawyer', 'lb', 'lc', 'lds', 'lease', 'legal', 'lgbt', 'li', 'lidl', 'life', 'lighting', 'limited', 'limo', 'link', 'lk', 'loans', 'london', 'lotte', 'lotto', 'lr', 'ls', 'lt', 'ltda', 'lu', 'luxe', 'luxury', 'lv', 'ly', 'ma', 'madrid', 'maison', 'management', 'mango', 'market', 'marketing', 'marriott', 'mc', 'md', 'me', 'media', 'meet', 'melbourne', 'meme', 'memorial', 'menu', 'mg', 'mh', 'miami', 'mil', 'mini', 'mk', 'ml', 'mm', 'mn', 'mo', 'mobi', 'moda', 'moe', 'monash', 'money', 'mormon', 'mortgage', 'moscow', 'motorcycles', 'mov', 'mp', 'mq', 'mr', 'ms', 'mt', 'mu', 'museum', 'mv', 'mw', 'mx', 'my', 'mz', 'na', 'nagoya', 'name', 'navy', 'nc', 'ne', 'net', 'network', 'neustar', 'new', 'nexus', 'nf', 'ng', 'ngo', 'nhk', 'ni', 'ninja', 'nl', 'no', 'np', 'nr', 'nra', 'nrw', 'nu', 'nyc', 'nz', 'okinawa', 'om', 'one', 'ong', 'onl', 'ooo', 'org', 'organic', 'osaka', 'otsuka', 'ovh', 'pa', 'paris', 'partners', 'parts', 'party', 'pe', 'pf', 'pg', 'ph', 'pharmacy', 'photo', 'photography', 'photos', 'physio', 'pics', 'pictures', 'pink', 'pizza', 'pk', 'pl', 'place', 'plumbing', 'pm', 'pn', 'pohl', 'poker', 'porn', 'post', 'pr', 'praxi', 'press', 'pro', 'prod', 'productions', 'prof', 'properties', 'property', 'ps', 'pt', 'pub', 'pw', 'py', 'qa', 'qpon', 'quebec', 're', 'realtor', 'recipes', 'red', 'rehab', 'reise', 'reisen', 'reit', 'ren', 'rentals', 'repair', 'report', 'republican', 'rest', 'restaurant', 'reviews', 'rich', 'rio', 'rip', 'ro', 'rocks', 'rodeo', 'rs', 'rsvp', 'ru', 'ruhr', 'rw', 'ryukyu', 'sa', 'saarland', 'sale', 'samsung', 'sarl', 'sb', 'sc', 'sca', 'scb', 'schmidt', 'schule', 'schwarz', 'science', 'scot', 'sd', 'se', 'services', 'sew', 'sexy', 'sg', 'sh', 'shiksha', 'shoes', 'shriram', 'si', 'singles', 'sj', 'sk', 'sky', 'sl', 'sm', 'sn', 'so', 'social', 'software', 'sohu', 'solar', 'solutions', 'soy', 'space', 'spiegel', 'sr', 'st', 'su', 'supplies', 'supply', 'support', 'surf', 'surgery', 'suzuki', 'sv', 'sx', 'sy', 'sydney', 'systems', 'sz', 'taipei', 'tatar', 'tattoo', 'tax', 'tc', 'td', 'technology', 'tel', 'temasek', 'tf', 'tg', 'th', 'tienda', 'tips', 'tires', 'tirol', 'tj', 'tk', 'tl', 'tm', 'tn', 'to', 'today', 'tokyo', 'tools', 'top', 'town', 'toys', 'tp', 'tr', 'trade', 'training', 'travel', 'trust', 'tt', 'tui', 'tv', 'tw', 'tz', 'ua', 'ug', 'uk', 'university', 'uno', 'uol', 'us', 'uy', 'uz', 'va', 'vacations', 'vc', 've', 'vegas', 'ventures', 'versicherung', 'vet', 'vg', 'vi', 'viajes', 'video', 'villas', 'vision', 'vlaanderen', 'vn', 'vodka', 'vote', 'voting', 'voto', 'voyage', 'vu', 'wales', 'wang', 'watch', 'webcam', 'website', 'wed', 'wedding', 'wf', 'whoswho', 'wien', 'wiki', 'williamhill', 'wme', 'work', 'works', 'world', 'ws', 'wtc', 'wtf', 'xn--1qqw23a', 'xn--3bst00m', 'xn--3ds443g', 'xn--3e0b707e', 'xn--45brj9c', 'xn--45q11c', 'xn--4gbrim', 'xn--55qw42g', 'xn--55qx5d', 'xn--6frz82g', 'xn--6qq986b3xl', 'xn--80adxhks', 'xn--80ao21a', 'xn--80asehdb', 'xn--80aswg', 'xn--90a3ac', 'xn--b4w605ferd', 'xn--c1avg', 'xn--cg4bki', 'xn--clchc0ea0b2g2a9gcd', 'xn--czr694b', 'xn--czrs0t', 'xn--czru2d', 'xn--d1acj3b', 'xn--d1alf', 'xn--fiq228c5hs', 'xn--fiq64b', 'xn--fiqs8s', 'xn--fiqz9s', 'xn--flw351e', 'xn--fpcrj9c3d', 'xn--fzc2c9e2c', 'xn--gecrj9c', 'xn--h2brj9c', 'xn--hxt814e', 'xn--i1b6b1a6a2e', 'xn--io0a7i', 'xn--j1amh', 'xn--j6w193g', 'xn--kprw13d', 'xn--kpry57d', 'xn--kput3i', 'xn--l1acc', 'xn--lgbbat1ad8j', 'xn--mgb9awbf', 'xn--mgba3a4f16a', 'xn--mgbaam7a8h', 'xn--mgbab2bd', 'xn--mgbayh7gpa', 'xn--mgbbh1a71e', 'xn--mgbc0a9azcg', 'xn--mgberp4a5d4ar', 'xn--mgbx4cd0ab', 'xn--ngbc5azd', 'xn--node', 'xn--nqv7f', 'xn--nqv7fs00ema', 'xn--o3cw4h', 'xn--ogbpf8fl', 'xn--p1acf', 'xn--p1ai', 'xn--pgbs0dh', 'xn--q9jyb4c', 'xn--qcka1pmc', 'xn--rhqv96g', 'xn--s9brj9c', 'xn--ses554g', 'xn--unup4y', 'xn--vermgensberater-ctb', 'xn--vermgensberatung-pwb', 'xn--vhquv', 'xn--wgbh1c', 'xn--wgbl6a', 'xn--xhq521b', 'xn--xkc2al3hye2a', 'xn--xkc2dl3a5ee0h', 'xn--yfro4i67o', 'xn--ygbi2ammx', 'xn--zfr164b', 'xxx', 'xyz', 'yachts', 'yandex', 'ye', 'yoga', 'yokohama', 'youtube', 'yt', 'za', 'zip', 'zm', 'zone', 'zuerich', 'zw'];
  var PROTOCOLS = ['http:', 'https:', 'file:', 'ftp:', 'chrome:', 'chrome-extension:'];
  return function() {
    var url = this.trimAround();
    if (~url.indexOf(' '))
      return false;
    if (~url.search(/^(about|file):[^:]/))
      return true;
    var protocol = (url.match(/^([a-zA-Z\-]+:)[^:]/) || [''])[0].slice(0, -1);
    var protocolMatch = PROTOCOLS.indexOf(protocol) !== -1;
    if (protocolMatch)
      url = url.replace(/^[a-zA-Z\-]+:\/*/, '');
    var hasPath = /.*[a-zA-Z].*\//.test(url);
    url = url.replace(/(:[0-9]+)?([#\/].*|$)/g, '').split('.');
    if (protocolMatch && /^[a-zA-Z0-9@!]+$/.test(url))
      return true;
    if (protocol && !protocolMatch && protocol !== 'localhost:')
      return false;
    var isIP = url.every(function(e) { // IP addresses
      return /^[0-9]+$/.test(e) && +e >= 0 && +e < 256;
    });
    if ((isIP && !protocol && url.length === 4) || (isIP && protocolMatch))
      return true;
    return (url.every(function(e) { return /^[a-z0-9\-]+$/i.test(e); }) &&
            (url.length > 1 && TLDs.indexOf(url[url.length - 1]) !== -1)) ||
           (url.length === 1 && url[0] === 'localhost') || hasPath;
  };
})());

definePrototype(String, 'embedString', function(string) {
  return this.split('%s').join(string);
});

definePrototype(String, 'convertLink', function() {
  if (this.validURL()) {
    return (!/^[a-zA-Z\-]+:/.test(this) ? 'http://' : '') + this;
  }
  return 'https://www.google.com/search?q=' + encodeURIComponent(this);
});

var matchLocation = function(url, pattern) { // Uses @match syntax
  // See https://code.google.com/p/chromium/codesearch#chromium/src/extensions/common/url_pattern.h&sq=package:chromium
  if (typeof pattern !== 'string' || !pattern.trim()) {
    return false;
  }
  var protocol = (pattern.match(/.*:\/\//) || [''])[0].slice(0, -2),
      hostname, path, pathMatch, hostMatch;
  url = new URL(url);
  if (/\*\*/.test(pattern)) {
    console.error('cVim Error: Invalid pattern: "%s"', pattern);
    return false;
  }
  if (!protocol.length) {
    console.error('cVim Error: Invalid protocol in pattern: "%s"', pattern);
    return false;
  }
  pattern = pattern.replace(/.*:\/\//, '');
  if (protocol !== '*:' && url.protocol !== protocol) {
    return false;
  }
  if (url.protocol !== 'file:') {
    hostname = pattern.match(/^[^\/]+\//g);
    if (!hostname) {
      console.error('cVim Error: Invalid host in pattern: "%s"', pattern);
      return false;
    }
    var origHostname = hostname;
    hostname = hostname[0].slice(0, -1).replace(/([.])/g, '\\$1').replace(/\*/g, '.*');
    hostMatch = url.hostname.match(new RegExp(hostname, 'i'));
    if (!hostMatch || hostMatch[0].length !== url.hostname.length) {
      return false;
    }
    pattern = '/' + pattern.slice(origHostname[0].length);
  }
  if (pattern.length) {
    path = pattern.replace(/([.&\\\/\(\)\[\]!?])/g, '\\$1').replace(/\*/g, '.*');
    pathMatch = url.pathname.match(new RegExp(path));
    if (!pathMatch || pathMatch[0].length !== url.pathname.length) {
      return false;
    }
  }
  return true;
};

var waitForLoad = function(callback, constructor) {
  if ((document.readyState === 'interactive' || document.readyState === 'complete') && document.activeElement) {
    return callback.call(constructor);
  }
  window.setTimeout(function() {
    waitForLoad(callback, constructor);
  }, 5);
};

var decodeHTMLEntities = function(string) {
  var el = document.createElement('div');
  el.innerHTML = string;
  return el.textContent;
};

var basicSearchArray = function(array, search, limit, useRegex, fn, ignoreIndex) {
  if (search === '') {
    return array.slice(0, limit || settings.searchlimit);
  }
  if (useRegex) {
    try {
      search = new RegExp(search, 'i');
    } catch (e) {
      useRegex = false;
    }
  }
  var matches = {
    0: [],
    1: []
  };
  var exactMatchCount = 0;
  fn = fn || function(item) { return item; };
  for (var i = 0; i < array.length; i++) {
    var matchIndex = fn(array[i])[useRegex ? 'search' : 'indexOf'](search);
    if (!ignoreIndex && matchIndex === 0) {
      matches[0].push(array[i]);
      exactMatchCount++;
      if (exactMatchCount === limit) {
        break;
      }
    } else if (matchIndex !== -1) {
      matches[1].push(array[i]);
    }
  }
  return matches[0].concat(matches[1]).slice(0, limit);
};

var fuzzySearchArray = function(array, search, limit, useRegex, fn, ignoreIndex) {
    var matches = {
        0: [],
        1: [],
        2: []
    };

    matches[0] = basicSearchArray(array, search, limit, true, fn, ignoreIndex);

    var slashed = search.replace(/\//g, '.*/.*');
    matches[1] = basicSearchArray(array, slashed, limit, true, fn, ignoreIndex);

    var whiteSpaced = search.replace(/ /g, '.*');
    matches[2] = basicSearchArray(array, whiteSpaced, limit, true, fn, ignoreIndex);

    return matches[0].concat(matches[1]).concat(matches[2]).slice(0, limit);
};

var searchArray = function(array, search, limit, useRegex, fn, ignoreIndex) {
    if (typeof Settings !== 'undefined' && Settings.fuzzy) {
        return fuzzySearchArray(array, search, limit, useRegex, fn, ignoreIndex);
    }
    return basicSearchArray(array, search.split(' ')[0], limit, useRegex, fn, ignoreIndex);
};

Object.extend = function() {
  var _ret = {};
  for (var i = 0, l = arguments.length; i < l; ++i) {
    for (var key in arguments[i]) {
      _ret[key] = arguments[i][key];
    }
  }
  return _ret;
};

Object.merge = function(a, b) {
  Object.keys(b).forEach(function(key) {
    if (typeof b[key] === 'object' && !Array.isArray(b[key]) &&
        typeof a[key] === 'object' && !Array.isArray(a[key])) {
      Object.merge(a[key], b[key]);
    } else {
      a[key] = b[key];
    }
  });
};

var Trie = (function() {
  var _ = function(parent) {
    this.data = {};
    this.parent = parent || null;
  };
  function deleteKeyValue(node, value) {
    for (var key in node) {
      if (node[key] === value) {
        delete node[key];
      }
    }
  }
  _.prototype.contains = function(item) {
    return this.data.hasOwnProperty(item);
  };
  _.prototype.splitString = function(string) {
    var blocks =
      [].slice.call(string.match(/<[^>]+>/g) || []);
    var split = [];
    for (var i = 0; i < string.length; i++) {
      if (string.slice(i).indexOf(blocks[0]) === 0) {
        i += blocks[0].length - 1;
        split.push(blocks.shift());
      } else {
        split.push(string.charAt(i));
      }
    }
    return split;
  };
  _.prototype.add = function(string, value) {
    var split = this.splitString(string);
    var node = this;
    split.forEach(function(e) {
      if (node.data.hasOwnProperty(e)) {
        node = node.data[e];
      } else {
        node.data[e] = new _(node);
        node = node.data[e];
      }
      delete node.value;
    });
    node.value = value;
  };
  _.prototype.remove = function(string) {
    var split = this.splitString(string);
    var node = this.data;
    while (split.length) {
      node = node[split.shift()];
      if (!node) {
        return null;
      }
      if (split.length) {
        node = node.data;
      }
    }
    deleteKeyValue(node.parent.data, node);
    while (node = node.parent) {
      if (!node.value && Object.keys(node.data).length === 1) {
        deleteKeyValue(node.parent.data, node);
      } else {
        break;
      }
    }
  };
  _.prototype.at = function(string) {
    var split = this.splitString(string);
    var node = this;
    while (split.length) {
      node = node.data['*'] || node.data[split[0]];
      split.shift();
      if (!node) {
        return null;
      }
    }
    return split.length !== 0 ? true : (node.value || true);
  };
  return _;
})();

var traverseDOM = function(root, accept) {
  var nodes = [root];
  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    node = node.firstChild;
    while (node !== null) {
      nodes.push(node);
      node = node.nextSibling;
    }
  }
  nodes.shift();
  return nodes.filter(accept);
};

var hasAttributes = function(node) {
  if (arguments.length < 2)
    return false;
  for (var i = 1; i < arguments.length; i++) {
    if (node.hasAttribute(arguments[i]))
      return true;
  }
  return false;
};

var getLinkableElements = (function() {
  var visible = function(node) {
    var cs = getComputedStyle(node, null);
    return cs.opacity    !== '0' &&
           cs.visibility === 'visible' &&
           cs.display    !== 'none';
  };
  return function() {
    return traverseDOM(document.body, function(node) {
      if (node.nodeType !== Node.ELEMENT_NODE || !visible(node))
        return false;
      switch (node.localName.toLowerCase()) {
        case 'a':
        case 'button':
          return true;
        default:
          return hasAttributes(node, 'jsaction', 'onclick');
      }
    });
  };
})();

var uuid4 = (function() {
  var reserved = ['8', '9', 'a', 'b'];
  return function() {
    return [].map.call('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx', function(e) {
      switch (e) {
      case 'x': return (~~(Math.random() * 16)).toString(16);
      case 'y': return reserved[~~(Math.random() * 4)];
      default: return e;
      }
    }).join('');
  };
})();

var findFirstOf = function(array, callback) {
  for (var i = 0; i < array.length; i++) {
    if (callback(array[i], i, array))
      return array[i];
  }
};
