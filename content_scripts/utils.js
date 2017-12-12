LOG = console.log.bind(console);

var Utils = {
  cacheFunction: function(callback) {
    var cache = new Map();
    var result = function(arg) {
      if (cache.has(arg))
        return cache.get(arg);
      var retval = callback(arg);
      cache.set(arg, retval);
      return retval;
    };
    result.clearCache = function() {
      cache.clear();
    };
    return result;
  },
  trueModulo: function(a, b) {
    return ((a % b) + b) % b;
  },
  uniqueElements: function(array) {
    var result = [];
    for (var i = 0; i < array.length; i++) {
      if (result.indexOf(array[i]) === -1)
        result.push(array[i]);
    }
    return result;
  },
  compressArray: function(array) {
    var result = [];
    // faster than using [].filter
    for (var i = 0; i < array.length; i++) {
      if (array[i])
        result.push(array[i]);
    }
    return result;
  },
  // splits a string without leaving empty strings in the resultant array
  split: function(string, pattern) {
    return this.compressArray(string.split(pattern));
  },
  trim: function(string) {
    return string.replace(/^(\s+)?(.*\S)?(\s+)?$/g, '$2');
  },
  format: function(string, value) {
    var index = string.lastIndexOf('%s');
    if (index < 0)
      return string + value;
    return string.slice(0, index) + value + string.slice(index + 2);
  },
  toSearchURL: function(query, engineUrl) {
    if (Utils.isValidURL(query)) {
      return (!/^[a-zA-Z\-]+:/.test(query) ? 'http://' : '') + query;
    }
    engineUrl = engineUrl || 'https://www.google.com/search?q=';
    return Utils.format(engineUrl, encodeURIComponent(query));
  },

  isValidURL: (function() {
    var TLDs = ['abogado', 'ac', 'academy', 'accountants', 'active', 'actor', 'ad', 'adult', 'ae', 'aero', 'af', 'ag', 'agency', 'ai', 'airforce', 'al', 'allfinanz', 'alsace', 'am', 'amsterdam', 'an', 'android', 'ao', 'aq', 'aquarelle', 'ar', 'archi', 'army', 'arpa', 'as', 'asia', 'associates', 'at', 'attorney', 'au', 'auction', 'audio', 'autos', 'aw', 'ax', 'axa', 'az', 'ba', 'band', 'bank', 'bar', 'barclaycard', 'barclays', 'bargains', 'bayern', 'bb', 'bd', 'be', 'beer', 'berlin', 'best', 'bf', 'bg', 'bh', 'bi', 'bid', 'bike', 'bio', 'biz', 'bj', 'black', 'blackfriday', 'bloomberg', 'blue', 'bm', 'bmw', 'bn', 'bnpparibas', 'bo', 'boo', 'boutique', 'br', 'brussels', 'bs', 'bt', 'budapest', 'build', 'builders', 'business', 'buzz', 'bv', 'bw', 'by', 'bz', 'bzh', 'ca', 'cab', 'cal', 'camera', 'camp', 'cancerresearch', 'capetown', 'capital', 'caravan', 'cards', 'care', 'career', 'careers', 'cartier', 'casa', 'cash', 'cat', 'catering', 'cc', 'cd', 'center', 'ceo', 'cern', 'cf', 'cg', 'ch', 'channel', 'cheap', 'christmas', 'chrome', 'church', 'ci', 'citic', 'city', 'ck', 'cl', 'claims', 'cleaning', 'click', 'clinic', 'clothing', 'club', 'cm', 'cn', 'co', 'coach', 'codes', 'coffee', 'college', 'cologne', 'com', 'community', 'company', 'computer', 'condos', 'construction', 'consulting', 'contractors', 'cooking', 'cool', 'coop', 'country', 'cr', 'credit', 'creditcard', 'cricket', 'crs', 'cruises', 'cu', 'cuisinella', 'cv', 'cw', 'cx', 'cy', 'cymru', 'cz', 'dabur', 'dad', 'dance', 'dating', 'day', 'dclk', 'de', 'deals', 'degree', 'delivery', 'democrat', 'dental', 'dentist', 'desi', 'design', 'dev', 'diamonds', 'diet', 'digital', 'direct', 'directory', 'discount', 'dj', 'dk', 'dm', 'dnp', 'do', 'docs', 'domains', 'doosan', 'durban', 'dvag', 'dz', 'eat', 'ec', 'edu', 'education', 'ee', 'eg', 'email', 'emerck', 'energy', 'engineer', 'engineering', 'enterprises', 'equipment', 'er', 'es', 'esq', 'estate', 'et', 'eu', 'eurovision', 'eus', 'events', 'everbank', 'exchange', 'expert', 'exposed', 'fail', 'farm', 'fashion', 'feedback', 'fi', 'finance', 'financial', 'firmdale', 'fish', 'fishing', 'fit', 'fitness', 'fj', 'fk', 'flights', 'florist', 'flowers', 'flsmidth', 'fly', 'fm', 'fo', 'foo', 'forsale', 'foundation', 'fr', 'frl', 'frogans', 'fund', 'furniture', 'futbol', 'ga', 'gal', 'gallery', 'garden', 'gb', 'gbiz', 'gd', 'ge', 'gent', 'gf', 'gg', 'ggee', 'gh', 'gi', 'gift', 'gifts', 'gives', 'gl', 'glass', 'gle', 'global', 'globo', 'gm', 'gmail', 'gmo', 'gmx', 'gn', 'goog', 'google', 'gop', 'gov', 'gp', 'gq', 'gr', 'graphics', 'gratis', 'green', 'gripe', 'gs', 'gt', 'gu', 'guide', 'guitars', 'guru', 'gw', 'gy', 'hamburg', 'hangout', 'haus', 'healthcare', 'help', 'here', 'hermes', 'hiphop', 'hiv', 'hk', 'hm', 'hn', 'holdings', 'holiday', 'homes', 'horse', 'host', 'hosting', 'house', 'how', 'hr', 'ht', 'hu', 'ibm', 'id', 'ie', 'ifm', 'il', 'im', 'immo', 'immobilien', 'in', 'industries', 'info', 'ing', 'ink', 'institute', 'insure', 'int', 'international', 'investments', 'io', 'iq', 'ir', 'irish', 'is', 'it', 'iwc', 'jcb', 'je', 'jetzt', 'jm', 'jo', 'jobs', 'joburg', 'jp', 'juegos', 'kaufen', 'kddi', 'ke', 'kg', 'kh', 'ki', 'kim', 'kitchen', 'kiwi', 'km', 'kn', 'koeln', 'kp', 'kr', 'krd', 'kred', 'kw', 'ky', 'kyoto', 'kz', 'la', 'lacaixa', 'land', 'lat', 'latrobe', 'lawyer', 'lb', 'lc', 'lds', 'lease', 'legal', 'lgbt', 'li', 'lidl', 'life', 'lighting', 'limited', 'limo', 'link', 'lk', 'loans', 'london', 'lotte', 'lotto', 'lr', 'ls', 'lt', 'ltda', 'lu', 'luxe', 'luxury', 'lv', 'ly', 'ma', 'madrid', 'maison', 'management', 'mango', 'market', 'marketing', 'marriott', 'mc', 'md', 'me', 'media', 'meet', 'melbourne', 'meme', 'memorial', 'menu', 'mg', 'mh', 'miami', 'mil', 'mini', 'mk', 'ml', 'mm', 'mn', 'mo', 'mobi', 'moda', 'moe', 'monash', 'money', 'mormon', 'mortgage', 'moscow', 'motorcycles', 'mov', 'mp', 'mq', 'mr', 'ms', 'mt', 'mu', 'museum', 'mv', 'mw', 'mx', 'my', 'mz', 'na', 'nagoya', 'name', 'navy', 'nc', 'ne', 'net', 'network', 'neustar', 'new', 'nexus', 'nf', 'ng', 'ngo', 'nhk', 'ni', 'ninja', 'nl', 'no', 'np', 'nr', 'nra', 'nrw', 'nu', 'nyc', 'nz', 'okinawa', 'om', 'one', 'ong', 'onl', 'ooo', 'org', 'organic', 'osaka', 'otsuka', 'ovh', 'pa', 'paris', 'partners', 'parts', 'party', 'pe', 'pf', 'pg', 'ph', 'pharmacy', 'photo', 'photography', 'photos', 'physio', 'pics', 'pictures', 'pink', 'pizza', 'pk', 'pl', 'place', 'plumbing', 'pm', 'pn', 'pohl', 'poker', 'porn', 'post', 'pr', 'praxi', 'press', 'pro', 'prod', 'productions', 'prof', 'properties', 'property', 'ps', 'pt', 'pub', 'pw', 'py', 'qa', 'qpon', 'quebec', 're', 'realtor', 'recipes', 'red', 'rehab', 'reise', 'reisen', 'reit', 'ren', 'rentals', 'repair', 'report', 'republican', 'rest', 'restaurant', 'reviews', 'rich', 'rio', 'rip', 'ro', 'rocks', 'rodeo', 'rs', 'rsvp', 'ru', 'ruhr', 'rw', 'ryukyu', 'sa', 'saarland', 'sale', 'samsung', 'sarl', 'sb', 'sc', 'sca', 'scb', 'schmidt', 'schule', 'schwarz', 'science', 'scot', 'sd', 'se', 'services', 'sew', 'sexy', 'sg', 'sh', 'shiksha', 'shoes', 'shriram', 'si', 'singles', 'sj', 'sk', 'sky', 'sl', 'sm', 'sn', 'so', 'social', 'software', 'sohu', 'solar', 'solutions', 'soy', 'space', 'spiegel', 'sr', 'st', 'su', 'supplies', 'supply', 'support', 'surf', 'surgery', 'suzuki', 'sv', 'sx', 'sy', 'sydney', 'systems', 'sz', 'taipei', 'tatar', 'tattoo', 'tax', 'tc', 'td', 'technology', 'tel', 'temasek', 'tf', 'tg', 'th', 'tienda', 'tips', 'tires', 'tirol', 'tj', 'tk', 'tl', 'tm', 'tn', 'to', 'today', 'tokyo', 'tools', 'top', 'town', 'toys', 'tp', 'tr', 'trade', 'training', 'travel', 'trust', 'tt', 'tui', 'tv', 'tw', 'tz', 'ua', 'ug', 'uk', 'university', 'uno', 'uol', 'us', 'uy', 'uz', 'va', 'vacations', 'vc', 've', 'vegas', 'ventures', 'versicherung', 'vet', 'vg', 'vi', 'viajes', 'video', 'villas', 'vision', 'vlaanderen', 'vn', 'vodka', 'vote', 'voting', 'voto', 'voyage', 'vu', 'wales', 'wang', 'watch', 'webcam', 'website', 'wed', 'wedding', 'wf', 'whoswho', 'wien', 'wiki', 'williamhill', 'wme', 'work', 'works', 'world', 'ws', 'wtc', 'wtf', 'xn--1qqw23a', 'xn--3bst00m', 'xn--3ds443g', 'xn--3e0b707e', 'xn--45brj9c', 'xn--45q11c', 'xn--4gbrim', 'xn--55qw42g', 'xn--55qx5d', 'xn--6frz82g', 'xn--6qq986b3xl', 'xn--80adxhks', 'xn--80ao21a', 'xn--80asehdb', 'xn--80aswg', 'xn--90a3ac', 'xn--b4w605ferd', 'xn--c1avg', 'xn--cg4bki', 'xn--clchc0ea0b2g2a9gcd', 'xn--czr694b', 'xn--czrs0t', 'xn--czru2d', 'xn--d1acj3b', 'xn--d1alf', 'xn--fiq228c5hs', 'xn--fiq64b', 'xn--fiqs8s', 'xn--fiqz9s', 'xn--flw351e', 'xn--fpcrj9c3d', 'xn--fzc2c9e2c', 'xn--gecrj9c', 'xn--h2brj9c', 'xn--hxt814e', 'xn--i1b6b1a6a2e', 'xn--io0a7i', 'xn--j1amh', 'xn--j6w193g', 'xn--kprw13d', 'xn--kpry57d', 'xn--kput3i', 'xn--l1acc', 'xn--lgbbat1ad8j', 'xn--mgb9awbf', 'xn--mgba3a4f16a', 'xn--mgbaam7a8h', 'xn--mgbab2bd', 'xn--mgbayh7gpa', 'xn--mgbbh1a71e', 'xn--mgbc0a9azcg', 'xn--mgberp4a5d4ar', 'xn--mgbx4cd0ab', 'xn--ngbc5azd', 'xn--node', 'xn--nqv7f', 'xn--nqv7fs00ema', 'xn--o3cw4h', 'xn--ogbpf8fl', 'xn--p1acf', 'xn--p1ai', 'xn--pgbs0dh', 'xn--q9jyb4c', 'xn--qcka1pmc', 'xn--rhqv96g', 'xn--s9brj9c', 'xn--ses554g', 'xn--unup4y', 'xn--vermgensberater-ctb', 'xn--vermgensberatung-pwb', 'xn--vhquv', 'xn--wgbh1c', 'xn--wgbl6a', 'xn--xhq521b', 'xn--xkc2al3hye2a', 'xn--xkc2dl3a5ee0h', 'xn--yfro4i67o', 'xn--ygbi2ammx', 'xn--zfr164b', 'xxx', 'xyz', 'yachts', 'yandex', 'ye', 'yoga', 'yokohama', 'youtube', 'yt', 'za', 'zip', 'zm', 'zone', 'zuerich', 'zw'];
    var PROTOCOLS = ['http:', 'https:', 'file:', 'ftp:', 'chrome:', 'chrome-extension:'];
    return function(url) {
      url = this.trim(url);
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
  })(),
};

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
    hostname = pattern.match(/^[^\/]+/g);
    if (!hostname) {
      console.error('cVim Error: Invalid host in pattern: "%s"', pattern);
      return false;
    }
    var origHostname = hostname;
    hostname = hostname[0].replace(/([.])/g, '\\$1').replace(/\*/g, '.*');
    hostMatch = url.hostname.match(new RegExp(hostname, 'i'));
    if (!hostMatch || hostMatch[0].length !== url.hostname.length) {
      return false;
    }
    pattern = pattern.slice(origHostname[0].length);
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
  if (document.body)
    return callback.call(constructor);
  window.setTimeout(function() {
    waitForLoad(callback, constructor);
  }, 5);
};

var eachUntil = function(array, callback) {
  for (var i = 0; i < array.length; i++) {
    if (callback(array[i], i, array)) {
      break;
    }
  }
};

/**
 * Searches an array using fuzzy search or regex search.
 *
 * @param opt options for searching the array
 * @param opt.array   the array to search
 * @param opt.search  the search string to use
 * @param opt.limit   max search results to return
 * @param opt.fn      the function to use to convert the items in {@code opt.array}
 *                    to their string representations when searching
 *                    (assumes they are already strings if falsey value)
 *
 * @return the matching items in the given array
 */
var searchArray = function(opt) {
  var split = /[\/?:.\-\s]+/;
  var search = Utils.split(opt.search.toLowerCase(), split);
  var fn = opt.fn || function(item) { return item; };
  var matches = [];
  eachUntil(opt.array, function(item) {
    var text = fn(item).split(split);
    if (search.every(function(searchTerm) {
      return text.some(function(textTerm) {
        return textTerm.toLowerCase().indexOf(searchTerm) === 0;
      });
    })) {
      matches.push(item);
      return matches.length === opt.limit;
    }
    return false;
  });
  return matches;
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


function TrieNode(parent, value) {
  this.parent = parent;
  this.children = {};
  this.value = value || null;
}
Object.setPrototypeOf(TrieNode.prototype, {
  remove: function() {
    this.value = null;
    var parent = this.parent;
    if (parent && Object.keys(this.children).length === 0) {
      parent.removeChild(this);
      if (parent.value === null)
        parent.remove();
    }
  },
  removeByKey: function(keys) {
    var node = this.find(keys);
    if (node !== null)
      node.remove();
    return node !== null;
  },
  removeChild: function(node) {
    for (var key in this.children) {
      if (this.children[key] === node) {
        delete this.children[key];
        break;
      }
    }
  },
  insert: function(keys, value) {
    var node = this;
    keys.forEach(function(e) {
      node.value = null;
      node = node.children[e] || (node.children[e] = new TrieNode(node));
    });
    node.value = value;
  },
  find: function(keys) {
    var node = this;
    for (var i = 0; i < keys.length; i++) {
      if (!node.hasKey(keys[i]))
        return null;
      node = node.getKey(keys[i]);
    }
    return node;
  },
  hasKey: function(key) {
    return this.children.hasOwnProperty(key);
  },
  getKey: function(key) {
    return this.children[key] || null;
  },
  findValue: function(keys) {
    return (this.find(keys) || {}).value || null;
  },
});
function Trie() {
  TrieNode.call(this, null);
}
Trie.prototype = Object.create(TrieNode.prototype);

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

var mapDOM = function(root, accept) {
  var nodes = [root];
  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    node = node.firstChild;
    while (node !== null) {
      nodes.push(node);
      node = node.nextSibling;
    }
  }
  var acceptedValues = [];
  for (i = 1; i < nodes.length; i++) {
    var value = accept(nodes[i]);
    if (value !== null)
      acceptedValues.push(value);
  }
  return acceptedValues;
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

var findFirstOf = function(array, callback) {
  for (var i = 0; i < array.length; i++) {
    if (callback(array[i], i, array))
      return array[i];
  }
  return null;
};

window.parseConfig = (function() {
  var formatConfig = function(configText, config) {
    var result = {
      MAPPINGS: [],
    };
    for (var key in config) {
      if (key === 'MAPPINGS') {
        result.MAPPINGS.push(config[key]);
      } else if (config[key].constructor === Object) {
        result[key] = Object.extend(result[key], config[key]);
      } else {
        result[key] = config[key];
      }
    }
    result.MAPPINGS = result.MAPPINGS.join('\n');
    result.RC = configText;
    return result;
  };
  return function(value) {
    try {
      return {
        error: null,
        value: formatConfig(value, RCParser.parse(value))
      };
    } catch (e) {
      return {
        error: {
          lineno: e.line,
          message: e.message
        },
        value: null
      };
    }
  };
})();
