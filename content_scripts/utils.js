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
      RUNTIME('urlToBase64', {url: url});
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
  if (boundingRect.top > window.innerHeight || boundingRect.left > window.innerWidth) {
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
  var computedStyle = getComputedStyle(node);
  if (computedStyle.opacity === '0' || computedStyle.visibility !== 'visible' || computedStyle.display === 'none' || node.hasAttribute('disabled')) {
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

definePrototype(HTMLElement, 'isInput', function() {
  return (
    (this.localName === 'textarea' || this.localName === 'input' || this.hasAttribute('contenteditable')) && !this.disabled &&
    !/button|radio|file|image|checkbox|submit/i.test(this.getAttribute('type'))
  );
});

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
  var TLDs = ['ac', 'ad', 'ae', 'aero', 'af', 'ag', 'ai', 'al', 'am', 'an', 'ao', 'aq', 'ar', 'as', 'at', 'au', 'aw', 'ax', 'az', 'ba', 'bb', 'bd', 'be', 'bf', 'bg', 'bh', 'bi', 'biz', 'bj', 'bm', 'bn', 'bo', 'br', 'bs', 'bt', 'bv', 'bw', 'by', 'bz', 'ca', 'cc', 'cf', 'cg', 'ch', 'ci', 'ck', 'cl', 'cm', 'cn', 'co', 'com', 'edu', 'coop', 'cr', 'cs', 'cu', 'cv', 'cx', 'cy', 'cz', 'de', 'dj', 'dk', 'dm', 'dz', 'ec', 'ee', 'eg', 'eh', 'er', 'es', 'et', 'eu', 'fi', 'fj', 'fk', 'fo', 'fr', 'ga', 'gb', 'gd', 'ge', 'gf', 'gg', 'gh', 'gi', 'gl', 'gm', 'gn', 'gov', 'gp', 'gq', 'gr', 'gt', 'gu', 'gw', 'gy', 'hk', 'hn', 'hr', 'ht', 'hu', 'id', 'ie', 'il', 'im', 'in', 'info', 'iq', 'ir', 'is', 'it', 'je', 'jm', 'jo', 'jobs', 'jp', 'ke', 'kg', 'kh', 'ki', 'km', 'kn', 'kr', 'kw', 'ky', 'kz', 'lb', 'lc', 'li', 'lk', 'lr', 'ls', 'lt', 'lu', 'lv', 'ly', 'ma', 'mc', 'md', 'mg', 'mh', 'mil', 'ml', 'mm', 'mn', 'mo', 'mp', 'mq', 'mr', 'ms', 'mt', 'mu', 'museum', 'mv', 'mw', 'mx', 'my', 'mz', 'na', 'name', 'nc', 'ne', 'net', 'nf', 'ng', 'ni', 'nl', 'no', 'np', 'nr', 'nu', 'nz', 'om', 'org', 'pa', 'pe', 'pf', 'pg', 'ph', 'pk', 'pl', 'pm', 'pn', 'pr', 'pro', 'ps', 'pt', 'pw', 'py', 'qa', 're', 'ro', 'ru', 'rw', 'sa', 'sb', 'sc', 'sd', 'se', 'sg', 'sh', 'si', 'sk', 'sl', 'sm', 'sn', 'so', 'sr', 'st', 'sv', 'sy', 'sz', 'tc', 'td', 'tf', 'tg', 'th', 'tj', 'tk', 'tl', 'tm', 'tn', 'to', 'tp', 'tr', 'travel', 'tt', 'tv', 'tw', 'tz', 'ua', 'ug', 'uk', 'us', 'uy', 'uz', 've', 'vg', 'vi', 'vn', 'vu', 'wf', 'ws', 'ye', 'yt', 'yu', 'za', 'zm', 'zw'];
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
            TLDs.indexOf(url[url.length - 1]) !== -1) ||
           (url.length === 1 && url[0] === 'localhost');
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

var searchArray = function(array, search, limit, useRegex, fn, ignoreIndex) {
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

Object.extend = function() {
  var _ret = {};
  for (var i = 0, l = arguments.length; i < l; ++i) {
    for (var key in arguments[i]) {
      _ret[key] = arguments[i][key];
    }
  }
  return _ret;
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
