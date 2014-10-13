function init() {
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

var httpRequest = function(request) {
  return new Promise(function(acc, rej) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', request.url);
    xhr.addEventListener('load', function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        acc(request.json ? JSON.parse(xhr.responseText) : xhr.responseText);
      }
    });
    xhr.addEventListener('error', function() {
      rej(Error('cVim Error: Unable to resolve ' + request.url));
    });
    xhr.send();
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
  return element.offsetParent && !element.disabled &&
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

Object.clone = function(obj) {
  var old = history.state;
  history.replaceState(obj);
  var clone = history.state;
  history.replaceState(old);
  return clone;
};

definePrototype(String, 'trimAround', function() {
  return this.replace(/^(\s+)?(.*\S)?(\s+)?$/g, '$2');
});

definePrototype(String, 'validURL', function() {
  var url = this.trimLeft().trimRight();
  if (url.length === 0) {
    return 'chrome://newtab';
  }
  if (/^\//.test(url)) {
    url = 'file://' + url;
  }
  if (/^(chrome|chrome-extension|file):\/\/\S+$/.test(url)) {
    return url;
  }
  var pattern = new RegExp('^((https?|ftp):\\/\\/)?'+
  '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+
  '((\\d{1,3}\\.){3}\\d{1,3})|'+
  'localhost)' +
  '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+
  '(\\?[;:&a-z\\d%_.~+=-]*)?'+
  '(\\#[#:-a-z\\d_]*)?$','i');
  if (pattern.test(url)) {
    return true;
  }
});

definePrototype(String, 'embedString', function(string) {
  return this.split('%s').join(string);
});

definePrototype(String, 'convertLink', function() {
  var url = this.trimAround();
  if (url.length === 0) {
    return 'chrome://newtab';
  }
  if (/^\//.test(url)) {
    url = 'file://' + url;
  }
  if (/^(chrome|chrome-extension|file):\/\/\S+$/.test(url)) {
    return url;
  }
  var pattern = new RegExp('^((https?|ftp):\\/\\/)?'+
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+
    '((\\d{1,3}\\.){3}\\d{1,3})|'+
    'localhost)' +
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+
    '(\\?[;&a-z\\d%_.~+=-]*)?'+
    '(\\#[-a-z\\d_]*)?$','i');
  if (pattern.test(url)) {
    return (/:\/\//.test(url) ? '' : 'http://') + url;
  }
  return 'https://www.google.com/search?q=' + url;
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

var searchArray = function(array, search, limit, useRegex, fn) {
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
    if (matchIndex === 0) {
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

var port = chrome.extension.connect({name: 'main'});

(function() {
  var $ = function(FN) {
    return function(action, args, callback) {
      (args = args || {}).action = action;
      FN(args, typeof callback === 'function' ?
          callback : void 0);
    };
  };
  RUNTIME = $(chrome.runtime.sendMessage.bind(chrome.runtime));
  PORT = $(port.postMessage.bind(port));
})();

port.onMessage.addListener(function(response) {
  var key;
  switch (response.type) {
    case 'hello':
      port.postMessage({action: 'getBookmarks'});
      port.postMessage({action: 'getQuickMarks'});
      port.postMessage({action: 'getSessionNames'});
      port.postMessage({action: 'retrieveAllHistory'});
      port.postMessage({action: 'sendLastSearch'});
      port.postMessage({action: 'getTopSites'});
      port.postMessage({action: 'getLastCommand'});
      break;
    case 'updateLastCommand':
      Mappings.lastCommand = JSON.parse(response.data);
      break;
    case 'commandHistory':
      for (key in response.history) {
        Command.history[key] = response.history[key];
      }
      break;
    case 'history':
      var matches = [];
      for (key in response.history) {
        if (response.history[key].url) {
          if (response.history[key].title.trim() === '') {
            matches.push(['Untitled', response.history[key].url]);
          } else {
            matches.push([response.history[key].title, response.history[key].url]);
          }
        }
      }
      matches = matches.sort(function(a, b) {
        return a[1].length - b[1].length;
      });
      if (Command.historyMode) {
        if (Command.active && Command.bar.style.display !== 'none') {
          Command.completions = { history: matches };
          Command.updateCompletions(false);
        }
      } else if (Command.searchMode) {
        Command.searchMode = false;
        if (Command.active && Command.bar.style.display !== 'none') {
          Command.completions.history = matches;
          Command.updateCompletions(true);
        }
      }
      Marks.history = matches;
      break;
    case 'bookmarks':
      Marks.bookmarks = [];
      Marks.parse(response.bookmarks);
      break;
    case 'topsites':
      Search.topSites = response.sites;
      break;
    case 'buffers':
      if (Command.bar.style.display !== 'none') {
        var val = Command.input.value.replace(/\S+\s+/, '');
        Command.hideData();
        Command.completions = {
          buffers: !val.trim() || Number.isNaN(val) || !response.buffers[+val] ? searchArray(response.buffers, val, settings.searchlimit, true, function(item) {
            return item.join(' ');
          }) : [ response.buffers[+val] ] || []
        };
        Command.updateCompletions();
      }
      break;
    case 'sessions':
      sessions = response.sessions;
      break;
    case 'quickMarks':
      Marks.quickMarks = {};
      for (key in response.marks) {
        if (Array.isArray(response.marks[key])) {
          Marks.quickMarks[key] = response.marks[key];
        } else if (typeof response.marks[key] === 'string') {
          Marks.quickMarks[key] = [response.marks[key]];
        }
      }
      break;
    case 'bookmarkPath':
      if (response.path.length) {
        Command.completions = {};
        Command.completions.paths = response.path;
        Command.updateCompletions();
      } else {
        Command.hideData();
      }
      break;
    case 'editWithVim':
      var lastInputElement = Mappings.insertFunctions.__getElement__();
      if (lastInputElement) {
        lastInputElement[lastInputElement.value !== void 0 ? 'value' : 'innerHTML'] =
          response.text.replace(/\n$/, ''); // remove trailing line left by vim
      }
      break;
  }
});

chrome.extension.onMessage.addListener(function(request, sender, callback) {
  switch (request.action) {
    case 'updateLastCommand':
      Mappings.lastCommand = JSON.parse(request.data);
      break;
    case 'getWindows':
      if (request.windows && Command.active === true) {
        Command.completions = {
          windows: Object.keys(request.windows).map(function(e, i) {
            var tlen = request.windows[e].length.toString();
            return [(i+1).toString() + ' (' + tlen + (tlen === '1' ? ' Tab)' : ' Tabs)'),  request.windows[e].join(', '), e];
          })
        };
        Command.updateCompletions();
      }
      break;
    case 'commandHistory':
      for (var key in request.history) {
        Command.history[key] = request.history[key];
      }
      break;
    case 'updateLastSearch':
      Find.lastSearch = request.value;
      break;
    case 'sendSettings':
      Mappings.defaults = Object.clone(Mappings.defaultsClone);
      if (!Command.initialLoadStarted) {
        Command.configureSettings(request.settings);
      } else {
        Mappings.parseCustom(request.settings.MAPPINGS);
        settings = request.settings;
      }
      break;
    case 'cancelAllWebRequests':
      window.stop();
      break;
    case 'updateMarks':
      Marks.quickMarks = request.marks;
      break;
    case 'base64Image':
      RUNTIME('openLinkTab', {
        active: false,
        url: 'data:text/html;charset=utf-8;base64,' +
          window.btoa(reverseImagePost(request.data, null)),
        noconvert: true
      });
      break;
    case 'focusFrame':
      if (request.index === Frames.index) {
        Frames.focus();
      }
      break;
    case 'sessions':
      sessions = request.sessions;
      break;
    case 'nextCompletionResult':
      if (settings.cncpcompletion && Command.type === 'action' && commandMode && document.activeElement.id === 'cVim-command-bar-input') {
        Search.nextResult();
        break;
      }
      if (window.self === window.top) {
        callback(true);
      }
      break;
    case 'deleteBackWord':
      if (!insertMode && document.activeElement.isInput()) {
        Mappings.insertFunctions.deleteWord();
        if (document.activeElement.id === 'cVim-command-bar-input') {
          Command.complete(Command.input.value);
        }
      }
      break;
    case 'getFilePath':
      var parsed = request.data;
      Marks.files = parsed;
      Marks.filePath();
      break;
    case 'toggleEnabled':
      addListeners();
      if (!settings) {
        RUNTIME('getSettings');
      }
      Command.init(request.state);
      break;
    case 'getBlacklistStatus':
      callback(Command.blacklisted);
      break;
    case 'alert':
      alert(request.message);
      break;
  }
});
var Hints = {};

Hints.matchPatterns = function(forward) {
  var pattern = new RegExp('^' + (forward ? settings.nextmatchpattern : settings.previousmatchpattern) + '$', 'gi');
  var nodeIterator = document.createNodeIterator(document.body, 4, null, false);
  var node;
  var isGoogleSearch = location.hostname + location.pathname === 'www.google.com/search';
  while (node = nodeIterator.nextNode()) {
    var localName = node.localName;
    if (/script|style|noscript/.test(localName)) {
      continue;
    }
    var nodeText = node.data.trim();
    if (isGoogleSearch && nodeText === 'More') {
      continue;
    }
    if (pattern.test(nodeText)) {
      var parentNode = node.parentNode;
      if (/a|button/.test(parentNode.localName) || parentNode.getAttribute('jsaction') || parentNode.getAttribute('onclick')) {
        var computedStyle = getComputedStyle(parentNode);
        if (computedStyle.opacity !== '0' && computedStyle.visibility === 'visible' && computedStyle.display !== 'none') {
          node.parentNode.click();
          break;
        }
      }
    }
  }
};

Hints.hideHints = function(reset, multi, useKeyDelay) {
  if (reset && document.getElementById('cVim-link-container') !== null) {
    document.getElementById('cVim-link-container').parentNode.removeChild(document.getElementById('cVim-link-container'));
  } else if (document.getElementById('cVim-link-container') !== null) {
    if (!multi) {
      HUD.hide();
    }
    main = document.getElementById('cVim-link-container');
    if (settings.linkanimations) {
      main.addEventListener('transitionend', function() {
        var m = document.getElementById('cVim-link-container');
        if (m !== null) {
          m.parentNode.removeChild(m);
        }
      });
      main.style.opacity = '0';
    } else {
      document.getElementById('cVim-link-container').parentNode.removeChild(document.getElementById('cVim-link-container'));
    }
  }
  this.numericMatch = void 0;
  this.active = reset;
  this.currentString = '';
  this.linkArr = [];
  this.linkHints = [];
  this.permutations = [];
  if (useKeyDelay && !this.active && settings.numerichints && settings.typelinkhints) {
    Hints.keyDelay = true;
    window.setTimeout(function() {
      Hints.keyDelay = false;
    }, settings.typelinkhintsdelay);
  }
};

Hints.changeFocus = function() {
  this.linkArr.forEach(function(item) { item[0].style.zIndex = 1 - +item[0].style.zIndex; });
};

Hints.removeContainer = function() {
  var hintContainer = document.getElementById('cVim-link-container');
  if (hintContainer !== null) {
    hintContainer.parentNode.removeChild(hintContainer);
  }
};

Hints.dispatchAction = function(link) {

  if (!link) {
    return false;
  }

  var node = link.localName;
  this.lastClicked = link;

  if (settings.numerichints && settings.typelinkhints) {
    Hints.keyDelay = true;
    window.setTimeout(function() {
      Hints.keyDelay = false;
    }, settings.typelinkhintsdelay);
  }

  if (KeyHandler.shiftKey && !this.shiftKeyInitiator) {
    switch (this.type) {
      case void 0:
        this.type = 'tabbed';
        break;
    }
  }

  switch (this.type) {
    case 'yank':
    case 'multiyank':
      var text = link.href || link.value || link.getAttribute('placeholder');
      if (text) {
        Clipboard.copy(text, this.multi);
        Status.setMessage(text, 2);
      }
      break;
    case 'fullimage':
      RUNTIME('openLinkTab', {active: false, url: link.src, noconvert: true});
      break;
    case 'image':
    case 'multiimage':
      var url = googleReverseImage(link.src, null);
      if (url) {
        RUNTIME('openLinkTab', {active: false, url: url, noconvert: true});
      }
      break;
    case 'hover':
      if (Hints.lastHover) {
        Hints.lastHover.unhover();
        if (Hints.lastHover === link) {
          Hints.lastHover = null;
          break;
        }
      }
      link.hover();
      Hints.lastHover = link;
      break;
    case 'unhover':
      link.unhover();
      break;
    case 'window':
      RUNTIME('openLinkWindow', {focused: false, url: link.href, noconvert: true});
      break;
    default:
      if (node === 'textarea' || (node === 'input' && /^(text|password|email|search)$/i.test(link.type)) ||
          link.hasAttribute('contenteditable')) {
        setTimeout(function() {
          link.focus();
          if (link.getAttribute('readonly')) {
            link.select();
          }
        }.bind(this), 0);
        break;
      }
      if (node === 'input' || /button|select/i.test(node) || /^(button|checkbox|menu)$/.test(link.getAttribute('role')) ||
          link.getAttribute('jsaction') || link.getAttribute('onclick') || link.getAttribute('role') === 'checkbox') {
        window.setTimeout(function() {
          link.simulateClick();
        }, 0);
        break;
      }
      if (link.getAttribute('target') !== '_top' && (/tabbed/.test(this.type) || this.type === 'multi')) {
        RUNTIME('openLinkTab', {active: this.type === 'tabbedActive', url: link.href, noconvert: true});
      } else {
        if (link.getAttribute('href')) {
          link.click();
        } else {
          link.simulateClick();
        }
      }
      break;
  }

  if (this.multi) {
    this.removeContainer();
    window.setTimeout(function() {
      if (!document.activeElement.isInput()) {
        this.create(this.type, true);
      }
    }.bind(this), 0);
  } else {
    this.hideHints(false, false, true);
  }

};

Hints.handleHintFeedback = function() {
  var linksFound = 0,
      index,
      link,
      i,
      span;
  if (!settings.numerichints) {
    for (i = 0; i < this.permutations.length; i++) {
      link = this.linkArr[i][0];
      if (this.permutations[i].indexOf(this.currentString) === 0) {
        if (link.children.length) {
          link.replaceChild(link.firstChild.firstChild, link.firstChild);
          link.normalize();
        }
        if (settings.dimhintcharacters) {
          span = document.createElement('span');
          span.setAttribute('cVim', true);
          span.className = 'cVim-link-hint_match';
          link.firstChild.splitText(this.currentString.length);
          span.appendChild(link.firstChild.cloneNode(true));
          link.replaceChild(span, link.firstChild);
        } else if (link.textContent.length !== 1) {
          link.firstChild.deleteData(null, 1);
        }
        index = i.toString();
        linksFound++;
      } else if (link.parentNode) {
        link.style.opacity = '0';
      }
    }
  } else {
    var containsNumber, validMatch, stringNum, string;
    Hints.numericMatch = null;
    this.currentString = this.currentString.toLowerCase();
    string = this.currentString;
    containsNumber = /\d+$/.test(string);
    if (containsNumber) {
      stringNum = this.currentString.match(/[0-9]+$/)[0];
    }
    if ((!string) || (!settings.typelinkhints && /\D/.test(string.slice(-1)))) {
      return this.hideHints(false);
    }
    for (i = 0, l = this.linkArr.length; i < l; ++i) {

      link = this.linkArr[i][0];

      if (link.style.opacity === '0') {
        continue;
      }
      validMatch = false;

      if (settings.typelinkhints) {
        if (containsNumber && link.textContent.indexOf(stringNum) === 0) {
          validMatch = true;
        } else if (!containsNumber && this.linkArr[i][2].toLowerCase().indexOf(string.replace(/.*\d/g, '')) !== -1) {
          validMatch = true;
        }
      } else if (link.textContent.indexOf(string) === 0) {
        validMatch = true;
      }

      if (validMatch) {
        if (link.children.length) {
          link.replaceChild(link.firstChild.firstChild, link.firstChild);
          link.normalize();
        }
        if (settings.typelinkhints && !containsNumber) {
          var c = 0;
          for (var j = 0; j < this.linkArr.length; ++j) {
            if (this.linkArr[j][0].style.opacity !== '0') {
              this.linkArr[j][0].textContent = (c + 1).toString() + (this.linkArr[j][3] ? ': ' + this.linkArr[j][3] : '');
              c++;
            }
          }
        }
        if (!Hints.numericMatch || link.textContent === string) {
          Hints.numericMatch = this.linkArr[i][1];
        }
        if (containsNumber) {
          if (settings.dimhintcharacters) {
            span = document.createElement('span');
            span.setAttribute('cVim', true);
            span.className = 'cVim-link-hint_match';
            link.firstChild.splitText(stringNum.length);
            span.appendChild(link.firstChild.cloneNode(true));
            link.replaceChild(span, link.firstChild);
          } else if (link.textContent.length !== 1) {
            span = document.createElement('span');
            span.setAttribute('cVim', true);
            span.className = 'cVim-link-hint_match_hidden';
            link.firstChild.splitText(stringNum.length);
            span.appendChild(link.firstChild.cloneNode(true));
            link.replaceChild(span, link.firstChild);
          }
        }
        index = i.toString();
        linksFound++;
      } else if (link.parentNode) {
        link.style.opacity = '0';
      }
    }
  }

  if (linksFound === 0) {
    this.hideHints(false, false, true);
  }
  if (linksFound === 1) {
    this.dispatchAction(this.linkArr[index][1]);
    this.hideHints(false);
  }

};


Hints.handleHint = function(key) {
  key = key.replace('<Space>', ' ');
  if (key === ';') {
    return this.changeFocus();
  }
  if (settings.numerichints && key === '<Enter>') {
    return this.numericMatch ?
      this.dispatchAction(this.numericMatch) : this.hideHints(false);
  }
  if (settings.numerichints || ~settings.hintcharacters.split('').indexOf(key.toLowerCase())) {
    this.currentString += key.toLowerCase();
    this.handleHintFeedback(this.currentString);
  } else {
    this.hideHints(false, false, true);
  }
};

Hints.evaluateLink = function(link, linkIndex) {
  var isAreaNode = false,
      imgParent, linkElement, linkStyle, mapCoordinates;
  if (link.localName === 'area' && link.parentNode && link.parentNode.localName === 'map') {
    imgParent = document.querySelector('img[usemap="#' + link.parentNode.name + '"');
    if (!imgParent) {
      return;
    }
    linkLocation = getVisibleBoundingRect(imgParent);
    isAreaNode = true;
  } else {
    linkLocation = getVisibleBoundingRect(link);
  }
  if (!linkLocation) {
    return;
  }
  linkElement = this.linkElementBase.cloneNode(false);
  linkStyle = linkElement.style;
  linkStyle.zIndex = linkIndex;
  if (isAreaNode) {
    mapCoordinates = link.getAttribute('coords').split(',');
    if (mapCoordinates.length < 2) {
      return;
    }
    linkStyle.top = linkLocation.top * this.documentZoom + document.body.scrollTop + parseInt(mapCoordinates[1]) + 'px';
    linkStyle.left = linkLocation.left * this.documentZoom + document.body.scrollLeft + parseInt(mapCoordinates[0]) + 'px';
  } else {
    if (linkLocation.top < 0) {
      linkStyle.top = document.body.scrollTop+ 'px';
    } else {
      linkStyle.top = linkLocation.top * this.documentZoom + document.body.scrollTop + 'px';
    }
    if (linkLocation.left < 0) {
      linkStyle.left = document.body.scrollLeft + 'px';
    } else {
      if (linkLocation.offsetLeft > linkLocation.left) {
        linkStyle.left = link.offsetLeft * this.documentZoom + 'px';
      } else {
        linkStyle.left = linkLocation.left * this.documentZoom + document.body.scrollLeft + 'px';
      }
    }
  }
  if (settings && settings.numerichints) {
    if (!settings.typelinkhints) {
      this.linkArr.push([linkLocation.bottom * linkLocation.left, linkElement, link]);
    } else {
      var textValue = '';
      var alt = '';
      if (link.firstElementChild && link.firstElementChild.alt) {
        textValue = link.firstElementChild.alt;
        alt = textValue;
      } else {
        textValue = link.textContent || link.value || link.alt || '';
      }
      this.linkArr.push([linkLocation.left + linkLocation.top, linkElement, link, textValue, alt]);
    }
  } else {
    this.linkArr.push([linkElement, link]);
  }
};

Hints.siteFilters = {
  'reddit.com': function(node) {
    if (node.localName === 'a' && !node.getAttribute('href')) {
      return false;
    }
    if (node.getAttribute('onclick') && node.getAttribute('onclick').indexOf('click_thing') === 0) {
      return false;
    }
    return true;
  }
};

Hints.getLinks = function() {
  var node, nodeIterator, name, role, applicableFiltersLength, filterCatch,
      i = 0,
      applicableFilters = [];

  nodeIterator = document.createNodeIterator(document.body, 1, {
    acceptNode: function(node) {
      name = node.localName.toLowerCase();
      if (Hints.type) {
        if (Hints.type.indexOf('yank') !== -1) {
          return name === 'a' || name === 'textarea' || name === 'input';
        } else if (Hints.type.indexOf('image') !== -1) {
          return name === 'img';
        }
      }
      if (name === 'a' || name === 'button' || name === 'select' || name === 'textarea' || name === 'input' || name === 'area') {
        return NodeFilter.FILTER_ACCEPT;
      }
      if (node.hasAttribute('contenteditable') || node.hasAttribute('onclick') || node.hasAttribute('tabindex') || node.hasAttribute('aria-haspopup') || node.hasAttribute('data-cmd') || node.hasAttribute('jsaction')) {
        return NodeFilter.FILTER_ACCEPT;
      }
      if (role = node.getAttribute('role')) {
        if (role === 'button' || role === 'checkbox' || role.indexOf('menu') === 0) {
          return NodeFilter.FILTER_ACCEPT;
        }
      }
      return NodeFilter.FILTER_REJECT;
    }
  });

  for (var key in this.siteFilters) {
    if (window.location.origin.indexOf(key) !== -1) {
      applicableFilters.push(this.siteFilters[key]);
    }
  }
  applicableFiltersLength = applicableFilters.length;

  while (node = nodeIterator.nextNode()) {
    filterCatch = false;
    for (var j = 0; j < applicableFiltersLength; j++) {
      if (!applicableFilters[j](node)) {
        filterCatch = true;
        break;
      }
    }
    if (!filterCatch) {
      this.evaluateLink(node, i++);
    }
  }
};


// GolombExp
// Hints.genHints = function(M) {
//   var codes = [];
//   var genCodeWord = function(N) {
//     var word = '';
//     do {
//       word += settings.hintcharacters.charAt(N % settings.hintcharacters.length);
//       N = ~~(N / settings.hintcharacters.length);
//     } while (N > 0);
//     return word.split('').reverse().join('');
//   };
//   for (var i = 0; i < M; i++) {
//     var last = genCodeWord(i);
//     var first = '';
//     for (var j = 0; j < last.length - 1; j++) {
//       first += settings.hintcharacters.charAt(0);
//     }
//     codes.push(first + last);
//   }
//   return codes;
// };

// Golomb
Hints.genHints = function(M) {
  if (M <= settings.hintcharacters.length) {
    return settings.hintcharacters.slice(0, M).split('');
  }
  var codes = [];
  var genCodeWord = function(N, length) {
    for (var i = 0, word = ''; i < length; i++) {
      word += settings.hintcharacters.charAt(N % settings.hintcharacters.length);
      N = ~~(N / settings.hintcharacters.length);
    }
    codes.push(word.split('').reverse().join(''));
  };

  var b = Math.ceil(Math.log(M) / Math.log(settings.hintcharacters.length));
  var cutoff = Math.pow(settings.hintcharacters.length, b) - M;
  var cutoffR = ~~(cutoff / settings.hintcharacters.length);

  for (var i = 0; i < cutoffR; i++) {
    genCodeWord(i, b - 1);
  }
  for (i = cutoffR; i < M; i++) {
    genCodeWord(i + cutoff, b);
  }
  return codes;
};

Hints.create = function(type, multi) {
  var self = this;
  window.setTimeout(function() {
    if (!Command.domElementsLoaded) {
      return false;
    }
    self.shiftKeyInitiator = KeyHandler.shiftKey;
    var links, main, frag, i, l;
    self.type = type;
    self.hideHints(true, multi);
    if (document.body && document.body.style) {
      Hints.documentZoom = +document.body.style.zoom || 1;
    } else {
      Hints.documentZoom = 1;
    }
    Hints.linkElementBase = document.createElement('div');
    Hints.linkElementBase.cVim = true;
    Hints.linkElementBase.className = 'cVim-link-hint';
    links = self.getLinks();
    if (type && type.indexOf('multi') !== -1) {
      self.multi = true;
    } else {
      self.multi = false;
    }
    if (self.linkArr.length === 0) {
      return self.hideHints();
    }

    main = document.createElement('div');
    if (settings && settings.linkanimations) {
      main.style.opacity = '0';
    }
    main.cVim = true;
    frag = document.createDocumentFragment();

    main.id = 'cVim-link-container';
    main.top = document.body.scrollTop + 'px';
    main.left = document.body.scrollLeft + 'px';

    try {
      document.lastChild.appendChild(main);
    } catch(e) {
      document.body.appendChild(main);
    }

    if (!multi && settings && settings.hud) {
      HUD.display('Follow link ' + (function() {
        switch (type) {
          case 'yank':
            return '(yank)';
          case 'multiyank':
            return '(multi-yank)';
          case 'image':
            return '(reverse image)';
          case 'fullimage':
            return '(full image)';
          case 'tabbed':
          case 'tabbedActive':
            return '(tabbed)';
          case 'window':
            return '(window)';
          case 'hover':
            return '(hover)';
          case 'unhover':
            return '(unhover)';
          case 'multi':
            return '(multi)';
          default:
            return '';
        }
      })());
    }

    if (!settings.numerichints) {
      self.permutations = self.genHints(self.linkArr.length);
      for (i = self.linkArr.length - 1; i >= 0; --i) {
        self.linkArr[i][0].textContent = self.permutations[i];
        frag.appendChild(self.linkArr[i][0]);
      }
    } else {
      self.linkArr = self.linkArr.sort(function(a, b) {
        return a[0] - b[0];
      }).map(function(e) {
        return e.slice(1);
      });
      for (i = 0, l = self.linkArr.length; i < l; ++i) {
        self.linkArr[i][0].textContent = (i + 1).toString() + (self.linkArr[i][3] ? ': ' + self.linkArr[i][3] : '');
        frag.appendChild(self.linkArr[i][0]);
      }
    }

    main.appendChild(frag);
    main.style.opacity = '1';
  }, 0);
};
var Marks = {
  bookmarks: [],
  files: [],
  currentBookmarks: [],
  quickMarks: {}
};

Marks.filePath = function() {
  var input = Command.input.value.replace(/.*\//, '');
  Command.completions = { files: [] };
  var i, c;
  if (!this.files) {
    return;
  }
  for (i = 0, c = 0; i < this.files.length; ++i) {
    if (this.files[i][0] && this.files[i][0].indexOf(input) === 0) {
      if (!input && this.files[i][0] !== '..' && this.files[i][0][0] === '.') {
        continue;
      }
      Command.completions.files.push([this.files[i][0], this.files[i][1]]);
      c++;
      if (c > settings.searchlimit) {
        break;
      }
    }
  }
  if (c <= settings.searchlimit && !input) {
    for (i = 0; i < this.files.length; ++i) {
      if (this.files[i] !== '..' && this.files[i][0] === '.') {
        Command.completions.files.push([this.files[i][0], !this.files[i][1]]);
        c++;
        if (c > settings.searchlimit) {
          break;
        }
      }
    }
  }
  Command.updateCompletions();
};

Marks.addQuickMark = function(ch) {
  if (this.quickMarks[ch] === void 0) {
    Status.setMessage('New QuickMark "' + ch + '" added', 1);
    this.quickMarks[ch] = [document.URL];
  } else if (this.quickMarks[ch].indexOf(document.URL) === -1) {
    Status.setMessage('Current URL added to QuickMark "' + ch + '"', 1);
    this.quickMarks[ch].push(document.URL);
  } else {
    this.quickMarks[ch].splice(this.quickMarks[ch].indexOf(document.URL));
    if (this.quickMarks[ch].length === 0) {
      Status.setMessage('Quickmark "' + ch + '" removed', 1);
      delete this.quickMarks[ch];
    } else {
      Status.setMessage('Current URL removed from existing QuickMark "' + ch + '"', 1);
    }
  }
  RUNTIME('updateMarks', {marks: this.quickMarks});
};

Marks.openQuickMark = function(ch, tabbed, repeats) {
  if (!this.quickMarks.hasOwnProperty(ch)) {
    return Status.setMessage('mark not set', 1, 'error');
  }
  if (tabbed) {
    if (repeats !== 1) {
      if (this.quickMarks[ch][repeats - 1]) {
        RUNTIME('openLinkTab', {url: this.quickMarks[ch][repeats - 1]});
      } else {
        RUNTIME('openLinkTab', {url: this.quickMarks[ch][0]});
      }
    } else {
      for (var i = 0, l = this.quickMarks[ch].length; i < l; ++i) {
        RUNTIME('openLinkTab', {url: this.quickMarks[ch][i]});
      }
    }
  } else {
    if (this.quickMarks[ch][repeats - 1]) {
      RUNTIME('openLink', {
        tab: {
          pinned: false
        },
        url: this.quickMarks[ch][repeats - 1]
      });
    } else {
      RUNTIME('openLink', {
        tab: {
          pinned: false
        },
        url: this.quickMarks[ch][0]
      });
    }
  }
};

Marks.parse = function(marks) {
  marks.forEach(function(bookmark) {
    if (bookmark.url) {
      Marks.bookmarks.push([bookmark.title, bookmark.url]);
    }
    if (bookmark.children) {
      Marks.parse(bookmark.children);
    }
  });
};

Marks.match = function(string, callback, limit) {
  if (string.trim() === '') {
    return callback(this.bookmarks.slice(0, settings.searchlimit + 1));
  }
  callback(searchArray(this.bookmarks, string, limit, true, function(item) {
    return item.join(' ');
  }));
};

Marks.matchPath = function(path) { PORT('getBookmarkPath', {path: path}); };
var addListeners, removeListeners, insertMode, commandMode, settings;

var KeyListener = (function() {

  'use strict';

  var codeMap = {
    0:   '\\',
    8:   'BS',
    9:   'Tab',
    12:  'Num',
    13:  'Enter',
    19:  'Pause',
    20:  'Caps',
    27:  'Esc',
    32:  'Space',
    33:  'PageUp',
    34:  'PageDown',
    35:  'End',
    36:  'Home',
    37:  'Left',
    38:  'Up',
    39:  'Right',
    40:  'Down',
    42:  'PrintScreen',
    44:  'PrintScreen',
    45:  'Insert',
    46:  'Delete',
    48:  ['0', ')'],
    49:  ['1', '!'],
    50:  ['2', '@'],
    51:  ['3', '#'],
    52:  ['4', '$'],
    53:  ['5', '%'],
    54:  ['6', '^'],
    55:  ['7', '&'],
    56:  ['8', '*'],
    57:  ['9', '('],
    96:  '0',
    97:  '1',
    98:  '2',
    99:  '3',
    100: '4',
    101: '5',
    102: '6',
    103: '7',
    104: '8',
    105: ['9', ''],
    106: '*',
    107: '+',
    109: '-',
    111: '/',
    144: 'Num',
    186: [';', ':'],
    188: [',', '<'],
    189: ['-', '_'],
    190: ['.', '>'],
    187: ['=', '+'],
    191: ['/', '?'],
    192: ['`', '~'],
    219: ['[', '{'],
    221: [']', '}'],
    220: ['\\', '|'],
    222: ['\'', '"']
  };

  var parseKeyDown = function(event) {
    var key, map;
    var isFKey = false;
    var modifiers = [
      event.ctrlKey  ? 'C' : '',
      event.altKey   ? 'A' : '',
      event.metaKey  ? 'M' : '',
      event.shiftKey ? 'S' : ''
    ].join('').split('');
    if (codeMap.hasOwnProperty(event.which.toString())) {
      map = codeMap[event.which.toString()];
      if (Array.isArray(map)) {
        if (!modifiers.length) {
          modifiers.splice(modifiers.indexOf('S'), 1);
        }
        key = map[+(event.shiftKey && !modifiers.length)];
      } else {
        key = map;
      }
    } else if (/^F[0-9]+$/.test(event.keyIdentifier)) {
      isFKey = true;
      key = event.keyIdentifier;
    } else {
      key = String.fromCharCode(event.which).toLowerCase();
      if (event.shiftKey && modifiers.length === 1) {
        key = key.toUpperCase();
        if (key.toLowerCase() !== key.toUpperCase()) {
          return key;
        }
      }
    }
    modifiers = modifiers.filter(function(e) { return e; });
    if (modifiers.length) {
      key = '<' + modifiers.join('-') + '-' + key + '>';
    } else if (typeof codeMap[event.which.toString()] === 'string' || isFKey) {
      key = '<' + (event.shiftKey ? 'S-' : '') + key + '>';
    }
    return key;
  };

  var KeyEvents = {

    keypress: function(callback, event) {
      if (typeof callback === 'function') {
        callback(event);
      }
    },

    keyhandle: function(event, type) {
      if (type === 'keypress') {
        // ascii representation of keycode
        return String.fromCharCode(event.which);
      } else {
        // Vim-like representation
        return parseKeyDown(event);
      }
    },

    keydown: function(callback, event) {

      // Alt key hint focus toggle
      if (Hints.active && event.which === 18) {
        return Hints.changeFocus();
      }

      // Modifier keys C-A-S-M
      if ([16,17,18,91,123].indexOf(event.which) !== -1) {
        return true;
      }

      // Don't let the keypress listener attempt to parse the key event
      // if it contains a modifier (or key that should be parsed by the parseKeyDown function
      // such as { return (13) <BR> } or { space (32) <Space> }
      if ([9,13,32].indexOf(event.which) !== -1 || event.ctrlKey || event.metaKey || event.altKey) {
        var code = KeyEvents.keyhandle(event, 'keydown');
        for (var key in Mappings.defaults) {
          if (Mappings.defaults[key].indexOf(code) !== -1) {
            event.stopPropagation();
            break;
          }
        }
        return callback(code, event);
      // Ugly, but this NEEDS to be checked before setTimeout is called. Otherwise, non-cVim keyboard listeners
      // will not be stopped. preventDefault on the other hand, can be.
      } else if (commandMode || (!insertMode && mappingTrie.at(Mappings.queue + KeyEvents.keyhandle(event, 'keydown'))))
      {
        event.stopPropagation();
      }

      // Create a temporary keypress listener to check if a keycode contains an
      // ascii-representable character
      var keypressTriggered = false;
      var boundMethod = KeyEvents.keypress.bind(KeyEvents, function(event) {
        if (!keypressTriggered) {
          // found a matching character...
          // use it if the setTimeout function below hasn't already timed out
          if (Hints.active || Visual.caretModeActive || Visual.visualModeActive) {
            event.preventDefault();
            event.stopPropagation();
          }
          keypressTriggered = true;
          callback(KeyEvents.keyhandle(event, 'keypress'), event);
        }
      });

      window.addEventListener('keypress', boundMethod, true);

      // Wait for the keypress listener to find a match
      window.setTimeout(function() {
        window.removeEventListener('keypress', boundMethod, true);
        if (!keypressTriggered) { // keypress match wasn't found
          if (Hints.active || Visual.caretModeActive || Visual.visualModeActive) {
            event.preventDefault();
            event.stopPropagation();
          }
          callback(KeyEvents.keyhandle(event, 'keydown'), event);
        }
      }, 0);

    }

  };

  var listenerFn = function(callback) {
    this.callback = callback;
    this.eventFn = KeyEvents.keydown.bind(null, this.callback);
    this.active = false;
    return this;
  };
  listenerFn.prototype.activate = function() {
    if (!this.active) {
      this.active = true;
      window.addEventListener('keydown', this.eventFn, true);
    }
  };
  listenerFn.prototype.deactivate = function() {
    if (this.active) {
      this.active = false;
      window.removeEventListener('keydown', this.eventFn, true);
    }
  };
  return listenerFn;

})();

var KeyHandler = {};

KeyHandler.down = function(key, event) {

  var escapeKey, isInput;
  KeyHandler.shiftKey = event.shiftKey;

  if (Hints.active) {
    event.stopPropagation();
    if (event.which === 18) {
      return Hints.changeFocus();
    } else if (event.which === 191) {
      event.preventDefault();
      return document.getElementById('cVim-link-container').style.opacity = '0';
    }
  }

  if (Hints.keyDelay) {
    event.stopPropagation();
    return event.preventDefault();
  }

  if (Cursor.overlay && settings.autohidecursor) {
    Cursor.overlay.style.display = 'block';
    Cursor.wiggleWindow();
  }

  if (Command.active && document.activeElement && document.activeElement.id === 'cVim-command-bar-input') {
    event.stopPropagation();
  }

  escapeKey = key === '<Esc>' || key === '<C-[>';

  if (Visual.caretModeActive || Visual.visualModeActive) {
    event.stopPropagation();
    Visual.selection = document.getSelection();
    if (event.which === 8) {
      event.preventDefault();
    }
    if (escapeKey) {
      Visual.lineMode = false;
      if (Visual.visualModeActive === false) {
        Visual.exit();
        insertMode = false;
        return;
      }
      HUD.setMessage(' -- CARET -- ');
      Visual.collapse();
      return;
    }
    return Visual.action(key.replace(/^<BS>$/, 'h').replace(/^<Space>$/, 'l'));
  }

  if (escapeKey) {
    return Mappings.handleEscapeKey();
  }

  if (insertMode) {
    return false;
  }

  if (!commandMode && Mappings.actions.inputFocused && event.which === 9) { // When <Tab> or <S-Tab> is pressed in 'gi' mode
    if (document.activeElement && (!document.activeElement.isInput() || !Mappings.actions.inputElements.length)) {
      return Mappings.actions.inputFocused = false;
    }
    event.preventDefault();
    event.stopPropagation();
    Mappings.actions.inputElementsIndex = ((event.shiftKey ? -1 : 1) + Mappings.actions.inputElementsIndex).mod(Mappings.actions.inputElements.length);
    Mappings.actions.inputElements[Mappings.actions.inputElementsIndex].focus();
    if (Mappings.actions.inputElements[Mappings.actions.inputElementsIndex].getAttribute('readonly')) {
      Mappings.actions.inputElements[Mappings.actions.inputElementsIndex].select();
    }
    return;
  }

  isInput = document.activeElement && document.activeElement.isInput();

  if (!isInput) {
    if (Mappings.queue.length) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (Mappings.convertToAction(key)) {
      event.preventDefault();
      return event.stopPropagation();
    }
  }

  if (commandMode && document.activeElement.id === 'cVim-command-bar-input') {
    window.setTimeout(function() {
      Command.lastInputValue = Command.input.value;
    }, 0);
    switch (key) {
      case '<Tab>': // Tab navigation/completion
      case '<S-Tab>':
        if (Command.type === 'action') {
          event.preventDefault();
          Mappings.actions[ (key === '<Tab>' ? 'next' : 'previous') + 'CompletionResult' ]();
        }
        break;
      case '<C-p>':
        if (Command.type === 'action' && settings.cncpcompletion) {
          event.preventDefault();
          Mappings.actions.previousCompletionResult();
        }
        return;

      case '<Up>': // Command history navigation/search
      case '<Down>':
        event.preventDefault();
        Command.history.cycle(Command.type, (key === '<Up>'));
        break;

      case '<Enter>':
      case '<C-Enter>':
        event.preventDefault();
        document.activeElement.blur();

        if (!(Command.history[Command.type].length > 0 && Command.history[Command.type].slice(-1)[0] === Command.input.value)) {
          Command.history[Command.type].push(Command.input.value);
          RUNTIME('appendHistory', {
            value: Command.input.value,
            type: Command.type
          });
        }

        if (Command.type === 'action') {
          var inputValue = Command.input.value + (event.ctrlKey ? '&!' : '');
          Command.hide(function() {
            Command.execute(inputValue, 1);
          });
          break;
        }

        if (Command.input.value) {
          if (Command.input.value !== Find.lastSearch || !Find.matches.length) {
            Find.clear();
            Find.highlight({
              base: document.body,
              search: Command.input.value,
              setIndex: true,
              executeSearch: false,
              reverse: key === '<C-Enter>',
              saveSearch: true
            });
          }
        }

        Command.hide();
        Find.index = Command.modeIdentifier.textContent === '/' ? -1 : 1;
        Find.setIndex();
        Find.search(Command.modeIdentifier.textContent === '?', 1, true);
        PORT('updateLastSearch', {value: Find.lastSearch});
        break;
      default:
        if (key === '<BS>' && Command.lastInputValue.length === 0 && Command.input.value.length === 0) {
          Command.hide();
          event.preventDefault();
          break;
        }
        setTimeout(function() {
          Command.history.reset = true;
          if (Command.type === 'action') {
            return Command.complete(Command.input.value);
          }
          if (Command.input.value.length > 2) {
            if (settings.incsearch && (Command.input.value !== Find.lastSearch || !Find.highlights.length)) {
              Find.clear();
              Find.highlight({
                base: document.body,
                search: Command.input.value
              });
              Find.index = Command.modeIdentifier.textContent === '/' ? -1 : 1;
              Find.setIndex();
              Find.search(Command.modeIdentifier.textContent === '?', 1, true);
            }
          }
        }, 0);
        break;
    }
  }

  if (settings && settings.insertmappings && isInput) {
    Mappings.insertCommand(key, function() {
      event.preventDefault();
      if (document.activeElement.id === 'cVim-command-bar-input' && Command.type !== 'search') {
        window.setTimeout(function() {
          Command.complete(Command.input.value);
        }, 0);
      }
    });
  }

};

KeyHandler.up = function(event) {
  if ((document.activeElement && document.activeElement.id === 'cVim-command-bar-input') || (!insertMode && Mappings.queue.length && Mappings.validMatch)) {
    event.stopPropagation();
    event.preventDefault();
  }
  if (Hints.active && event.which === 191) {
    document.getElementById('cVim-link-container').style.opacity = '1';
  }
};

KeyHandler.listener = new KeyListener(KeyHandler.down);

removeListeners = function() {
  KeyHandler.listenersActive = false;
  document.removeEventListener('keyup', KeyHandler.up, true);
  KeyHandler.listener.deactivate();
};

addListeners = function() {
  if (KeyHandler.listenersActive) {
    removeListeners();
  }
  KeyHandler.listenersActive = true;
  document.addEventListener('keyup', KeyHandler.up, true);
  KeyHandler.listener.activate();
};

addListeners();

window.addEventListener('DOMContentLoaded', function() {
  if (self === top) {
    RUNTIME('isNewInstall', null, function(message) {
      if (message) {
        alert(message);
      }
    });
  }
});
var Clipboard = {
  store: '',
  copy: function(text, store) {
    if (!store) {
      this.store = text;
    } else {
      this.store += (this.store.length ? '\n' : '') + text;
    }
    RUNTIME('copy', {text: this.store});
  },

  paste: function(tabbed) {
    RUNTIME(tabbed ? 'openPasteTab' : 'openPaste');
  }
};
var Complete = {};

Complete.engines = ['google', 'wikipedia', 'youtube', 'imdb', 'amazon', 'google-maps', 'wolframalpha', 'google-image', 'ebay', 'webster', 'wictionary', 'urbandictionary', 'duckduckgo', 'answers', 'google-trends', 'google-finance', 'yahoo', 'bing'];

Complete.aliases = {
  g: 'google'
};

Complete.hasAlias = function(alias) {
  return this.aliases.hasOwnProperty(alias);
};

Complete.getAlias = function(alias) {
  return this.aliases[alias] || '';
};

Complete.requestUrls = {
  wikipedia:      'https://en.wikipedia.org/wiki/',
  google:         'https://www.google.com/search?q=',
  'google-image': 'https://www.google.com/search?site=imghp&tbm=isch&source=hp&q=',
  'google-maps':  'https://www.google.com/maps/search/',
  duckduckgo:     'https://duckduckgo.com/?q=',
  yahoo:          'https://search.yahoo.com/search?p=',
  answers:        'https://answers.yahoo.com/search/search_result?p=',
  bing:           'https://www.bing.com/search?q=',
  imdb:           'http://www.imdb.com/find?s=all&q=',
  amazon:         'http://www.amazon.com/s/?field-keywords=',
  wolframalpha:   'https://www.wolframalpha.com/input/?i=',
  ebay:           'https://www.ebay.com/sch/i.html?_sacat=0&_from=R40&_nkw=',
  urbandictionary: 'http://www.urbandictionary.com/define.php?term=',
  'google-trends': 'http://www.google.com/trends/explore#q=',
  'google-finance': 'https://www.google.com/finance?q=',
  webster:          'http://www.merriam-webster.com/dictionary/',
  youtube:          'https://www.youtube.com/results?search_query=',
  wictionary:       'http://en.wiktionary.org/wiki/'
};

Complete.baseUrls = {
  wikipedia:      'https://en.wikipedia.org/wiki/Main_Page',
  google:         'https://www.google.com',
  'google-image': 'http://www.google.com/imghp',
  'google-maps':  'https://www.google.com/maps/preview',
  duckduckgo:     'https://duckduckgo.com',
  yahoo:          'https://search.yahoo.com',
  answers:        'https://answers.yahoo.com',
  bing:           'https://www.bing.com',
  imdb:           'http://www.imdb.com',
  amazon:         'http://www.amazon.com',
  wolframalpha:   'https://www.wolframalpha.com',
  ebay:           'http://www.ebay.com',
  urbandictionary: 'http://www.urbandictionary.com',
  'google-trends': 'http://www.google.com/trends/',
  'google-finance': 'https://www.google.com/finance',
  webster:          'http://www.merriam-webster.com',
  youtube:          'https://www.youtube.com',
  wictionary:       'https://en.wiktionary.org/wiki/Wiktionary:Main_Page'
};

Complete.parseQuery = {
  wikipedia: function(query) {
    return query.replace(' ', '_');
  },
  bing: function(query) {
    return query + '&FORM=SEEMOR';
  },
  wolframalpha: function(query) {
    return encodeURIComponent(query);
  },
  imdb: function(query) {
    return encodeURIComponent(query);
  },
  'google-finance': function(query) {
    return encodeURIComponent(query);
  },
  wictionary: function(query) {
    return query.replace(' ', '_');
  }
};

Complete.apis = {
  wikipedia:      'https://en.wikipedia.org/w/api.php?action=opensearch&format=json&search=%s',
  google:         'https://www.google.com/complete/search?client=chrome-omni&gs_ri=chrome-ext&oit=1&cp=1&pgcl=7&q=%s',
  'google-image': 'http://www.google.com/complete/search?client=img&hl=en&gs_rn=43&gs_ri=img&ds=i&cp=1&gs_id=8&q=%s',
  yahoo:          'https://search.yahoo.com/sugg/gossip/gossip-us-ura/?output=sd1&appid=search.yahoo.com&nresults=20&command=%s',
  answers:        'https://search.yahoo.com/sugg/ss/gossip-us_ss-vertical_ss/?output=sd1&pubid=1307&appid=yanswer&command=%s&nresults=20',
  bing:           'http://api.bing.com/osjson.aspx?query=%s',
  imdb:           'http://sg.media-imdb.com/suggests/',
  amazon:         'http://completion.amazon.com/search/complete?method=completion&search-alias=aps&client=amazon-search-ui&mkt=1&q=%s',
  wolframalpha:   'https://www.wolframalpha.com/input/autocomplete.jsp?qr=0&i=%s',
  ebay:           'https://autosug.ebay.com/autosug?kwd=%s',
  urbandictionary: 'http://api.urbandictionary.com/v0/autocomplete?term=%s',
  'google-maps':   'https://www.google.com/s?tbm=map&fp=1&gs_ri=maps&source=hp&suggest=p&authuser=0&hl=en&pf=p&tch=1&ech=2&q=%s',
  'google-trends': 'http://www.google.com/trends/entitiesQuery?tn=10&q=%s',
  'google-finance': 'https://www.google.com/finance/match?matchtype=matchall&q=%s',
  webster:          'http://www.merriam-webster.com/autocomplete?query=%s',
  youtube:          'https://clients1.google.com/complete/search?client=youtube&hl=en&gl=us&gs_rn=23&gs_ri=youtube&ds=yt&cp=2&gs_id=d&q=%s',
  wictionary:       'http://en.wiktionary.org/w/api.php?action=opensearch&limit=15&format=json&search=%s',
  duckduckgo:       'https://duckduckgo.com/ac/?q=%s'
};

Complete.locales = {
  uk: {
    tld: 'co.uk',
    requestUrls: ['google'],
    baseUrls: ['google'],
    apis: ['google']
  },
  jp: {
    tld: 'co.jp',
    requestUrls: ['google'],
    baseUrls: ['google'],
    apis: ['google']
  }
};

Complete.setLocale = function(locale) {
  if (this.locales.hasOwnProperty(locale)) {
    locale = this.locales[locale];
  } else {
    return;
  }
  for (var key in locale) {
    if (key !== 'tld') {
      for (var i = 0; i < locale[key].length; i++) {
        this[key][locale[key][i]] = this[key][locale[key][i]].replace(/\.com/, '.' + locale.tld);
      }
    }
  }
};

Complete.convertToLink = function(input) {
  var prefix, suffix;
  input = input.replace(/@%/g, document.URL);
  input = input.split(/\s+/).compress();
  input.shift();
  if (input.length === 0) {
    return '';
  }
  input[0] = this.getAlias(input[0]) || input[0];
  if (Complete.engines.indexOf(input[0]) !== -1) {
    if (input.length > 1) {
      prefix = Complete.requestUrls[input[0]];
    } else {
      return Complete.baseUrls[input[0]];
    }
  } else {
    if (input.join(' ').validURL()) {
      if (!/:\/\//.test(input.join(' '))) {
        return 'http://' + input.join(' ');
      }
      return input.join(' ');
    }
    return (Complete.requestUrls[settings.defaultengine] ||
      Complete.requestUrls.google) + encodeURIComponent(input.join(' '));
  }
  if (Complete.parseQuery.hasOwnProperty(input[0])) {
    suffix = Complete.parseQuery[input[0]](input.slice(1).join(' '));
  } else {
    suffix = input.slice(1).join(' ');
  }
  if (suffix.validURL()) {
    return suffix;
  }
  return (prefix.indexOf('%s') !== -1 ?
            prefix.embedString(suffix) :
            prefix + suffix);
};

Complete.wikipedia = function(query, callback) {
  httpRequest({
    url: this.apis.wikipedia.embedString(query),
    json: true
  }).then(function(response) {
    callback(response[1]);
  }, cVimError);
};

Complete.google = function(query, callback) {
  httpRequest({
    url: this.apis.google.embedString(query),
    json: true
  }).then(function(response) {
    var data = response[1].map(function(e, i) {
      return {
        type: response[4]['google:suggesttype'][i],
        text: e
      };
    });
    callback(data.sort(function(a) {
      return a.type !== 'NAVIGATION';
    }).map(function(e) { return e.text; }));
  }, cVimError);
};

Complete['google-maps'] = function(query, callback) {
  httpRequest({
    url: this.apis['google-maps'].embedString(query),
    json: false
  }).then(function(response) {
    var data = JSON.parse(JSON.parse(JSON.stringify(response.replace(/\/\*[^\*]+\*\//g, '')))).d;
    data = data.replace(/^[^,]+,/, '')
               .replace(/\n\][^\]]+\][^\]]+$/, '')
               .replace(/,+/g, ',')
               .replace(/\n/g, '')
               .replace(/\[,/g, '[');
    data = JSON.parse(data);
    data = data.map(function(e) {
      return e[0][0][0];
    });
    callback(data);
  }, cVimError);
};

Complete['google-image'] = function(query, callback) {
  httpRequest({
    url: this.apis['google-image'].embedString(query),
    json: false
  }).then(function(response) {
    callback(JSON.parse(response.replace(/^[^\(]+\(|\)$/g, ''))[1].map(function(e) {
      return e[0].replace(/<[^>]+>/g, '');
    }));
  }, cVimError);
};

Complete['google-trends'] = function(query, callback) {
  httpRequest({
    url: this.apis['google-trends'].embedString(encodeURIComponent(query)),
    json: true
  }).then(function(response) {
    callback(response.entityList.map(function(e) {
      return [e.title + ' - ' + e.type, Complete.requestUrls['google-trends'] + encodeURIComponent(e.mid)];
    }));
  }, cVimError);
};

Complete['google-finance'] = function(query, callback) {
  httpRequest({
    url: this.apis['google-finance'].embedString(encodeURIComponent(query)),
    json: true
  }).then(function(response) {
    callback(response.matches.map(function(e) {
      return [e.t + ' - ' + e.n + ' - ' + e.e, Complete.requestUrls['google-finance'] + e.e + ':' + e.t];
    }));
  }, cVimError);
};

Complete.amazon = function(query, callback) {
  httpRequest({
    url: this.apis.amazon.embedString(encodeURIComponent(query)),
    json: true
  }).then(function(response) {
    callback(response[1]);
  }, cVimError);
};

Complete.yahoo = function(query, callback) {
  httpRequest({
    url: this.apis.yahoo.embedString(encodeURIComponent(query)),
    json: true
  }).then(function(response) {
    var _ret = [];
    for (var key in response.r) {
      if (response.r[key].hasOwnProperty('k')) {
        _ret.push(response.r[key].k);
      }
    }
    callback(_ret);
  }, cVimError);
};

Complete.answers = function(query, callback) {
  httpRequest({
    url: this.apis.answers.embedString(encodeURIComponent(query)),
    json: true
  }).then(function(response) {
    callback(response.r.map(function(e) {
      return [e.k, 'https://answers.yahoo.com/question/index?qid=' + e.d.replace(/^\{qid:|,.*/g, '')];
    }));
  }, cVimError);
};

Complete.bing = function(query, callback) {
  httpRequest({
    url: this.apis.bing.embedString(query),
    json: true
  }).then(function(response) {
    callback(response[1].map(function(e) {
      return e;
    }));
  }, cVimError);
};

Complete.ebay = function(query, callback) {
  httpRequest({
    url: this.apis.ebay.embedString(encodeURIComponent(query)),
    json: false
  }).then(function(response) {
    var _ret = JSON.parse(response.replace(/^[^\(]+\(|\)$/g, ''));
    if (!_ret.res) {
      return false;
    }
    callback(_ret.res.sug.map(function(e) {
      return e;
    }));
  }, cVimError);
};

Complete.youtube = function(query, callback) {
  httpRequest({
    url: this.apis.youtube.embedString(query),
    json: false
  }).then(function(response) {
    var _ret = JSON.parse(response.replace(/^[^\(]+\(|\)$/g, ''));
    callback(_ret[1].map(function(e) {
      return e[0];
    }));
  }, cVimError);
};

Complete.wolframalpha = function(query, callback) {
  httpRequest({
    url: this.apis.wolframalpha.embedString(encodeURIComponent(query)),
    json: true
  }).then(function(response) {
    callback(response.results.map(function(e) {
      return e.input;
    }));
  }, cVimError);
};

Complete.webster = function(query, callback) {
  httpRequest({
    url: this.apis.webster.embedString(encodeURIComponent(query)),
    json: true
  }).then(function(response) {
    callback(response.suggestions.map(function(e) {
      return e;
    }));
  }, cVimError);
};

Complete.wictionary = function(query, callback) {
  httpRequest({
    url: this.apis.wictionary.embedString(encodeURIComponent(query)),
    json: true
  }).then(function(response) {
    callback(response[1].map(function(e) {
      return e;
    }));
  }, cVimError);
};

Complete.duckduckgo = function(query, callback) {
  httpRequest({
    url: this.apis.duckduckgo.embedString(encodeURIComponent(query)),
    json: true
  }).then(function(response) {
    callback(response.map(function(e) {
      return e.phrase;
    }).compress());
  }, cVimError);
};

Complete.urbandictionary = function(query, callback) {
  httpRequest({
    url: this.apis.urbandictionary.embedString(encodeURIComponent(query)),
    json: true
  }).then(function(response) {
    callback(response.slice(1).map(function(e) {
      return e;
    }));
  }, cVimError);
};

Complete.imdb = function(query, callback) {
  httpRequest({
    url: this.apis.imdb + query[0] + '/' + query.replace(/ /g, '_') + '.json',
    json: false
  }).then(function(response) {
    var _ret = JSON.parse(response.replace(/^[^\(]+\(|\)$/g, ''));
    callback(_ret.d.map(function(e) {
      if (/:\/\//.test(e.id)) {
        return [e.l, e.id];
      }
      var _url = 'http://www.imdb.com/' + (e.id.indexOf('nm') === 0 ? 'name' : 'title') + '/' + e.id;
      if (e.q) {
        return [e.l + ' - ' + e.q + ', ' + e.s + ' (' + e.y + ')', _url];
      }
      return [e.l + ' - ' + e.s, _url];
    }));
  }, cVimError);
};
var insertMappings = new Trie(),
    mappingTrie = new Trie(),
    currentTrieNode = mappingTrie;

var Mappings = {
  repeats: '',
  queue: '',
  siteSpecificBlacklists: '',
  lastCommand: {
    fn: '',
    queue: '',
    repeats: 1
  }
};

Mappings.defaults = [
  ['j', 'scrollDown'],
  ['gg', 'scrollToTop'],
  ['a',  ':tabnew google '],
  ['zr', ':chrome://restart&<CR>'],
  ['o',  ':open '],
  ['O',  ':open @%'],
  ['b',  ':bookmarks '],
  ['t',  ':tabnew '],
  ['I',  ':history '],
  ['T',  ':tabnew @%'],
  ['B',  ':buffer '],
  ['gd', ':chrome://downloads!<cr>'],
  ['ge', ':chrome://extensions!<cr>'],
  ['x', 'closeTab'],
  ['gxT', 'closeTabLeft' ],
  ['gxt', 'closeTabRight' ],
  ['gx0', 'closeTabsToLeft' ],
  ['gx$', 'closeTabsToRight' ],
  ['s', 'scrollDown' ],
  ['j', 'scrollDown' ],
  ['w', 'scrollUp' ],
  ['k', 'scrollUp' ],
  ['e', 'scrollPageUp' ],
  ['u', 'scrollPageUp' ],
  ['d', 'scrollPageDown' ],
  ['gg', 'scrollToTop' ],
  ['G', 'scrollToBottom' ],
  ['h', 'scrollLeft' ],
  ['l', 'scrollRight' ],
  ['0', 'scrollToLeft' ],
  ['$', 'scrollToRight' ],
  ['i', 'insertMode' ],
  ['r', 'reloadTab' ],
  ['cr', 'reloadAllButCurrent' ],
  ['gR', 'reloadTabUncached' ],
  ['f', 'createHint' ],
  ['mf', 'createMultiHint' ],
  [']]', 'nextMatchPattern' ],
  ['[[', 'previousMatchPattern' ],
  ['W', 'createHintWindow' ],
  ['gp', 'pinTab' ],
  ['>', 'moveTabRight' ],
  ['<', 'moveTabLeft' ],
  ['H', 'goBack' ],
  ['S', 'goBack' ],
  ['gr', 'reverseImage' ],
  ['mr', 'multiReverseImage' ],
  ['L', 'goForward' ],
  ['D', 'goForward' ],
  ['g0', 'firstTab' ],
  ['M*', 'addQuickMark' ],
  ['A', 'openLastHint' ],
  ['go*', 'openQuickMark' ],
  ['gn*', 'openQuickMarkTabbed' ],
  ['gq', 'cancelWebRequest' ],
  ['<C-S-h>', 'openLastLinkInTab' ],
  ['gh', 'openLastLinkInTab' ],
  ['<C-S-l>', 'openNextLinkInTab' ],
  ['gl', 'openNextLinkInTab' ],
  ['gQ', 'cancelAllWebRequests' ],
  ['q', 'createHoverHint' ],
  ['Q', 'createUnhoverHint' ],
  ['g$', 'lastTab' ],
  ['X', 'lastClosedTab' ],
  ['gj', 'hideDownloadsShelf' ],
  ['F', 'createTabbedHint' ],
  ['gi', 'goToInput' ],
  ['gI', 'goToLastInput' ],
  ['K', 'nextTab' ],
  ['R', 'nextTab' ],
  ['gt', 'nextTab' ],
  ['gf', 'nextFrame' ],
  ['gF', 'rootFrame' ],
  ['g\'', 'lastActiveTab' ],
  ['g%', 'percentScroll' ],
  ['%', 'goToTab' ],
  ['z<Enter>', 'toggleImageZoom' ],
  ['zi', 'zoomPageIn' ],
  ['zo', 'zoomPageOut' ],
  ['z0', 'zoomOrig' ],
  ['\'\'', 'lastScrollPosition' ],
  ['\'*', 'goToMark' ],
  [';*', 'setMark' ],
  ['zt', 'centerMatchT' ],
  ['zb', 'centerMatchB' ],
  ['zz', 'centerMatchH' ],
  ['gs', 'goToSource' ],
  ['gU', 'goToRootUrl' ],
  ['gu', 'goUpUrl' ],
  ['gy', 'yankUrl' ],
  ['my', 'multiYankUrl' ],
  ['yy', 'yankDocumentUrl' ],
  ['p', 'openPaste' ],
  ['v', 'toggleVisualMode' ],
  ['V', 'toggleVisualLineMode' ],
  ['P', 'openPasteTab' ],
  ['J', 'previousTab' ],
  ['E', 'previousTab' ],
  ['gT', 'previousTab' ],
  ['n', 'nextSearchResult' ],
  ['N', 'previousSearchResult' ],
  ['/', 'openSearchBar' ],
  ['?', 'openSearchBarReverse' ],
  [':', 'openCommandBar' ],
  ['.', 'repeatCommand']
];
Mappings.defaultsClone = Object.clone(Mappings.defaults);

Mappings.actions = {

  '<Nop>': function() {},
  toggleVisualMode: function() {
    if (!Command.domElementsLoaded) {
      return false;
    }
    Visual.caretModeActive = true;
    Visual.getTextNodes();
    Visual.lineMode = false;
    document.body.spellcheck = false;
    document.designMode = 'on';
    Visual.selection = document.getSelection();
    if (document.getSelection().type === 'Range') {
      return false;
    }
    if (Find.matches.length) {
      Visual.focusSearchResult();
    } else {
      var closestNode = Visual.closestNode();
      if (closestNode) {
        Visual.selection.setPosition(Visual.closestNode(), 0);
        HUD.display(' -- CARET -- ');
        Visual.scrollIntoView();
      } else {
        Visual.lineMode = false;
        Visual.visualModeActive = false;
        Visual.exit();
      }
    }
  },
  toggleVisualLineMode: function() {
    if (Visual.caretModeActive || Visual.visualModeActive) {
      return false;
    }
    Visual.caretModeActive = true;
    Visual.getTextNodes();
    Visual.lineMode = true;
    document.body.spellcheck = false;
    document.designMode = 'on';
    Visual.selection = document.getSelection();
    if (document.getSelection().type === 'Range') {
      return false;
    }
    if (Find.matches.length) {
      Visual.focusSearchResult(true);
    }
  },
  openLastHint: function() {
    Hints.dispatchAction(Hints.lastClicked);
  },
  nextMatchPattern: function() {
    Hints.matchPatterns(true);
  },
  previousMatchPattern: function() {
    Hints.matchPatterns(false);
  },
  cancelWebRequest: function() {
    window.stop();
  },
  cancelAllWebRequests: function() {
    RUNTIME('cancelAllWebRequests');
  },
  percentScroll: function(repeats) {
    repeats = (Mappings.repeats === '0' || Mappings.repeats === '') ? 0 : repeats;
    document.body.scrollTop =
      (document.body.scrollHeight - window.innerHeight) * repeats / 100;
  },
  goToTab: function(repeats) {
    RUNTIME('goToTab', {index: repeats - 1});
  },
  hideDownloadsShelf: function() {
    RUNTIME('hideDownloadsShelf');
  },
  goToRootUrl: function() {
    RUNTIME('openLink', {
      url: location.protocol + '//' + location.hostname,
      tab: { pinned: null }
    });
  },
  goUpUrl: function(repeats) {
    var path = '/' + location.pathname.split('/')
      .filter(function(e) { return e; })
      .slice(0, -repeats).join('/');
    if (path !== location.pathname) {
      RUNTIME('openLink', {
        url: location.protocol + '//' + location.hostname + path,
        tab: { pinned: null }
      });
    }
  },
  nextFrame: function(repeats) {
    RUNTIME('focusFrame', {repeats: repeats});
  },
  rootFrame: function() {
    RUNTIME('focusFrame', {isRoot: true});
  },
  closeTab: function(repeats) {
    RUNTIME('closeTab', {repeats: repeats});
  },
  closeTabLeft: function() {
    RUNTIME('closeTabLeft');
  },
  closeTabRight: function() {
    RUNTIME('closeTabRight');
  },
  closeTabsToLeft: function() {
    RUNTIME('closeTabsToLeft');
  },
  closeTabsToRight: function() {
    RUNTIME('closeTabsToRight');
  },
  pinTab: function() {
    RUNTIME('pinTab');
  },
  firstTab: function() {
    RUNTIME('firstTab');
  },
  lastTab: function() {
    RUNTIME('lastTab');
  },
  lastClosedTab: function() {
    RUNTIME('openLast');
  },
  moveTabRight: function(repeats) {
    RUNTIME('moveTabRight', {repeats: repeats});
  },
  moveTabLeft: function(repeats) {
    RUNTIME('moveTabLeft', {repeats: repeats});
  },
  lastActiveTab: function() {
    RUNTIME('lastActiveTab');
  },
  reverseImage: function() {
    if (/\(\d+×\d+\)$/.test(document.title) === true && document.body.firstChild.localName === 'img') {
      if (document.body.firstChild.src) {
        RUNTIME('openLinkTab', {
          active: false,
          url: 'https://www.google.com/searchbyimage?image_url=' +
                document.body.firstChild.src,
          noconvert: true
        });
        return;
      }
    } else {
      window.setTimeout(function() {
        Hints.create('image');
      }, 0);
    }
  },
  multiReverseImage: function() {
    window.setTimeout(function() {
      Hints.create('multiimage');
    }, 0);
  },
  toggleImageZoom: function() {
    if (/\.[a-z]+\s+\(\d+×\d+\)/i.test(document.title)) {
      var images = document.getElementsByTagName('img');
      if (images.length) {
        images[0].simulateClick();
      }
    }
  },
  zoomPageIn: function(repeats) {
    RUNTIME('zoomIn', {repeats: repeats}, function() {
      document.body.style.zoom =
        (+document.body.style.zoom ? parseFloat(document.body.style.zoom) : 1) + settings.zoomfactor * repeats;
    });
  },
  zoomPageOut: function(repeats) {
    RUNTIME('zoomOut', {repeats: repeats}, function() {
      document.body.style.zoom =
        (+document.body.style.zoom ? parseFloat(document.body.style.zoom) : 1) - settings.zoomfactor * repeats;
    });
  },
  zoomOrig: function() {
    RUNTIME('zoomOrig', null, function() {
      document.body.style.zoom = '1';
    });
  },
  centerMatchT: function() {
    var documentZoom = parseFloat(document.body.style.zoom) || 1;
    if (Find.matches.length && Find.matches[Find.index]) {
      window.scrollBy(0, Find.matches[Find.index].getBoundingClientRect().top * documentZoom);
    }
  },
  centerMatchH: function() {
    var documentZoom = parseFloat(document.body.style.zoom) || 1;
    if (Find.matches.length && Find.matches[Find.index]) {
      var scrollOffset = (function() {
        return this.matches[this.index].getBoundingClientRect().top *
               documentZoom + this.matches[this.index].offsetHeight -
               0.5 * window.innerHeight;
      }).call(Find);
      window.scrollBy(0, scrollOffset);
    }
  },
  centerMatchB: function() {
    var documentZoom = parseFloat(document.body.style.zoom) || 1;
    if (Find.matches.length && Find.matches[Find.index]) {
      var scrollOffset = (function() {
        return this.matches[this.index].getBoundingClientRect().top *
               documentZoom + this.matches[this.index].offsetHeight *
               documentZoom - window.innerHeight;
      }).call(Find);
      window.scrollBy(0, scrollOffset);
    }
  },
  openLastLinkInTab: function(repeats) {
    RUNTIME('openLastLinkInTab', {repeats: repeats});
  },
  openNextLinkInTab: function(repeats) {
    RUNTIME('openNextLinkInTab', {repeats: repeats});
  },
  scrollDown: function(repeats) {
    Scroll.scroll('down', repeats);
  },
  scrollUp: function(repeats) {
    Scroll.scroll('up', repeats);
  },
  scrollPageDown: function(repeats) {
    Scroll.scroll('pageDown', repeats);
  },
  scrollFullPageDown: function(repeats) {
    Scroll.scroll('fullPageDown', repeats);
  },
  scrollPageUp: function(repeats) {
    Scroll.scroll('pageUp', repeats);
  },
  scrollFullPageUp: function(repeats) {
    Scroll.scroll('fullPageUp', repeats);
  },
  scrollLeft: function(repeats) {
    Scroll.scroll('left', repeats);
  },
  scrollRight: function(repeats) {
    Scroll.scroll('right', repeats);
  },
  scrollToTop: function() {
    Scroll.scroll('top');
  },
  scrollToBottom: function() {
    Scroll.scroll('bottom');
  },
  scrollToLeft: function() {
    Scroll.scroll('leftmost');
  },
  scrollToRight: function() {
    Scroll.scroll('rightmost');
  },
  lastScrollPosition: function() {
    if (!Scroll.lastPosition) {
      return;
    }
    var currentPosition = [document.body.scrollLeft, document.body.scrollTop];
    window.scrollTo.apply(null, Scroll.lastPosition);
    Scroll.lastPosition = currentPosition;
  },
  goToMark: function() {
    var key = Mappings.lastCommand.queue.slice(-1);
    if (Scroll.positions.hasOwnProperty(key)) {
      Scroll.lastPosition = [document.body.scrollLeft, document.body.scrollTop];
      window.scrollTo.apply(null, Scroll.positions[key]);
    } else {
      Status.setMessage('Mark not set', 1, 'error');
    }
  },
  setMark: function() {
    Scroll.positions[Mappings.lastCommand.queue.slice(-1)] =
      [document.body.scrollLeft, document.body.scrollTop];
  },
  createHint: function() { Hints.create(); },
  createTabbedHint: function() { Hints.create('tabbed'); },
  createActiveTabbedHint: function() { Hints.create('tabbedActive'); },
  createMultiHint: function() { Hints.create('multi'); },
  createHintWindow: function() { Hints.create('window'); },
  createHoverHint: function() { Hints.create('hover'); },
  createUnhoverHint: function() { Hints.create('unhover'); },
  yankUrl: function() { Hints.create('yank'); },
  multiYankUrl: function() { Hints.create('multiyank'); },
  fullImageHint: function() { Hints.create('fullimage'); },
  yankDocumentUrl: function() {
    Clipboard.copy(document.URL);
    Status.setMessage(document.URL, 2);
  },
  openPaste: function() {
    Clipboard.paste(false);
  },
  openPasteTab: function(repeats) {
    for (var i = 0; i < repeats; ++i) {
      Clipboard.paste(true);
    }
  },
  nextCompletionResult: function() {
    if (commandMode && document.activeElement.id === 'cVim-command-bar-input' && Command.type === 'action') {
      Search.nextResult(false);
    }
  },
  previousCompletionResult: function() {
    if (commandMode && document.activeElement.id === 'cVim-command-bar-input' && Command.type === 'action') {
      Search.nextResult(true);
    }
  },
  addQuickMark: function() {
    Marks.addQuickMark(Mappings.lastCommand.queue.slice(-1));
  },
  openQuickMark: function(repeats) {
    Marks.openQuickMark(Mappings.lastCommand.queue.slice(-1), false, repeats);
  },
  openQuickMarkTabbed: function(repeats) {
    Marks.openQuickMark(Mappings.lastCommand.queue.slice(-1), true, repeats);
  },
  insertMode: function() {
    if (Command.domElementsLoaded) {
      HUD.display(' -- INSERT -- ');
      insertMode = true;
    }
  },
  reloadTab: function() {
    RUNTIME('reloadTab', {nocache: false});
  },
  reloadTabUncached: function() {
    RUNTIME('reloadTab', {nocache: true});
  },
  reloadAllButCurrent: function() {
    RUNTIME('reloadAllTabs', {nocache: false, current: false});
  },
  reloadAllTabs: function() {
    RUNTIME('reloadAllTabs', {nocache: false, current: true});
  },
  nextSearchResult: function(repeats) {
    if (Find.matches.length) {
      Find.search(false, repeats);
    } else if (Find.lastSearch !== void 0 && typeof Find.lastSearch === 'string') {
      Find.highlight({
        base: document.body,
        search: Find.lastSearch,
        setIndex: true,
        executeSearch: true
      });
    }
  },
  previousSearchResult: function(repeats) {
    if (Find.matches.length) {
      Find.search(true, repeats);
    } else if (Find.lastSearch !== void 0 && typeof Find.lastSearch === 'string') {
      Find.highlight({
        base: document.body,
        search: Find.lastSearch,
        setIndex: true,
        executeSearch: true,
        reverse: true
      });
    }
  },
  nextTab: function(r) {
    RUNTIME('nextTab', {repeats: r});
  },
  previousTab: function(r) {
    RUNTIME('previousTab', {repeats: r});
  },
  goBack: function(repeats) {
    history.go(-1 * repeats);
  },
  goForward: function(repeats) {
    history.go(1 * repeats);
  },
  goToSource: function() {
    RUNTIME('openLinkTab', {
      active: true,
      url: 'view-source:' + document.URL,
      noconvert: true
    });
  },
  goToLastInput: function() {
    if (this.inputElements && this.inputElements[this.inputElementsIndex]) {
      this.inputElements[this.inputElementsIndex].focus();
    }
  },
  goToInput: function(repeats) {
    this.inputElements = [];
    var allInput = document.querySelectorAll('input,textarea,*[contenteditable]'),
        i;
    for (i = 0, l = allInput.length; i < l; i++) {
      if (allInput[i].isInput() && allInput[i].isVisible() && allInput[i].id !== 'cVim-command-bar-input') {
        this.inputElements.push(allInput[i]);
      }
    }
    if (this.inputElements.length === 0) {
      return false;
    }
    this.inputElementsIndex = repeats % this.inputElements.length - 1;
    if (this.inputElementsIndex < 0) {
      this.inputElementsIndex = 0;
    }
    for (i = 0, l = this.inputElements.length; i < l; i++) {
      var br = this.inputElements[i].getBoundingClientRect();
      if (br.top + br.height >= 0 &&
          br.left + br.width >= 0 &&
          br.right - br.width <= window.innerWidth &&
          br.top < window.innerHeight) {
        this.inputElementsIndex = i;
        break;
      }
    }
    this.inputFocused = true;
    this.inputElements[this.inputElementsIndex].focus();
    if (document.activeElement.select) {
      document.activeElement.select();
    }
    if (!document.activeElement.hasAttribute('readonly')) {
      document.getSelection().collapseToEnd();
    }
  },
  shortCuts: function(command, repeats) {
    commandMode = true;
    return window.setTimeout(function() {
      Command.show(false,
          command
          .replace(/^:/, '')
          .replace(/<cr>(\s+)?$/i, '')
          .replace(/<space>/ig, ' ')
          .replace(/@%/g, document.URL)
      );
      this.queue = '';
      this.repeats = '';
      if (/<cr>(\s+)?$/i.test(command)) {
        var inputValue = Command.input.value;
        Command.hide(function() {
          Command.execute(inputValue, repeats);
        });
      } else {
        Command.complete(Command.input.value);
      }
    }, 0);
  },
  openSearchBar: function() {
    Command.hide();
    Find.lastIndex = Find.index;
    if (document && document.body) {
      Command.lastScrollTop = document.body.scrollTop;
    }
    commandMode = true;
    Find.previousMatches = Find.matches.length > 0;
    Find.swap = false;
    return Command.show('/');
  },
  openSearchBarReverse: function() {
    Command.hide();
    Find.lastIndex = Find.index;
    commandMode = true;
    if (document && document.body) {
      Command.lastScrollTop = document.body.scrollTop;
    }
    Find.previousMatches = Find.matches.length > 0;
    Find.swap = true;
    return Command.show('?');
  },
  openCommandBar: function() {
    Command.hide();
    commandMode = true;
    return Command.show(false);
  },
  repeatCommand: function(repeats) {
    if (this.hasOwnProperty(Mappings.lastCommand.fn)) {
      this[Mappings.lastCommand.fn](Mappings.lastCommand.repeats * repeats);
    }
  }

};

Mappings.insertDefaults = [
  ['<C-y>', 'deleteWord' ],
  ['<C-p>', 'deleteForwardWord' ],
  ['<C-i>', 'beginningOfLine' ],
  ['<C-e>', 'endOfLine' ],
  ['<C-u>', 'deleteToBeginning' ],
  ['<C-o>', 'deleteToEnd' ],
  ['<C-f>', 'forwardChar' ],
  ['<C-b>', 'backwardChar' ],
  ['<C-l>', 'forwardWord' ],
  ['<C-h>', 'backwardWord' ],
];

Mappings.insertFunctions = (function() {
  var selection = document.getSelection();

  function modify() {
    if (arguments.length === 3) {
      selection.modify.apply(selection, arguments);
      return;
    }
    selection.modify.bind(
        selection,
        selection.type === 'Range' ? 'extend' : 'move'
    ).apply(null, arguments);
  }

  function deleteSelection() {
    document.execCommand('delete', false, 0);
  }

  return {
    __setElement__: function(e) {
      element = e;
    },
    __getElement__: function() {
      return element;
    },
    editWithVim: function() {
      PORT('editWithVim', {
        text: element.value || element.innerHTML
      });
    },
    forwardChar: modify.bind(null, 'right', 'character'),
    backwardChar: modify.bind(null, 'left', 'character'),
    backwardWord: function() {
      modify('left', 'word');
    },
    forwardWord: function() {
      if (element.value !== void 0) {
        var start = element.selectionStart;
        var end = element.value.slice(start).match(/[a-zA-Z_0-9]+[\s\n]*|(\n|[^a-zA-Z_0-9])\1*/);
        end = start + (end ? end[0].length : 0);
        element.selectionStart = end;
        element.selectionEnd = end;
        return;
      }
      modify('right', 'word');
    },
    deleteToBeginning: function() {
      modify('extend', 'left', 'documentboundary');
      deleteSelection();
    },
    deleteToEnd: function() {
      modify('extend', 'right', 'documentboundary');
      deleteSelection();
      modify('move', 'right', 'documentboundary');
    },
    beginningOfLine: function() {
      modify('left', 'documentboundary');
    },
    endOfLine: function() {
      modify('right', 'documentboundary');
    },
    deleteWord: function() {
      modify('extend', 'left', 'word');
      deleteSelection();
    },
    deleteForwardWord: function() {
      if (element.value !== void 0) {
        var start = element.selectionStart;
        var end = element.value.slice(start).match(/[a-zA-Z_0-9]+[\s\n]*|(\n|[^a-zA-Z_0-9])\1*/);
        end = start + (end ? end[0].length : 0);
        element.selectionStart = start;
        element.selectionEnd = end;
      } else {
        modify('extend', 'right', 'word');
      }
      deleteSelection();
    }
  };
})();

Mappings.insertCommand = function(modifier, callback) {
  var value = insertMappings.at(modifier);
  if (value) {
    callback(true);
    this.insertFunctions.__setElement__(document.activeElement);
    this.insertFunctions[value]();
  }
};

Mappings.parseLine = function(line) {
  var map = line.split(/ +/).compress();
  if (map.length) {
    switch (map[0]) {
      case 'unmapAll':
        mappingTrie.data = [];
        return;
      case 'iunmapAll':
        insertMappings.data = [];
        return;
      case 'map':
      case 'remap':
        map[1] = map[1].replace(/<leader>/ig, settings.mapleader);
        mappingTrie.remove(map[1]);
        return mappingTrie.add(map[1], mappingTrie.at(map[2]) || map.slice(2).join(' '));
      case 'imap':
      case 'iremap':
        insertMappings.remove(map[1]);
        return insertMappings.add(map[1], insertMappings.at(map[2]) || map.slice(2).join(' '));
      case 'iunmap':
        return insertMappings.remove(map[1]);
      case 'unmap':
        return mappingTrie.remove(map[1]);
    }
  }
};

Mappings.parseCustom = function(config) {
  this.defaults.forEach(function(e) {
    mappingTrie.add.apply(mappingTrie, e);
  });
  this.insertDefaults.forEach(function(e) {
    insertMappings.add.apply(insertMappings, e);
  });
  (config += this.siteSpecificBlacklists)
    .split('\n').compress().forEach(this.parseLine);
};

Mappings.executeSequence = function(c, r) {
  if (!c.length) {
    return;
  }
  if (/^\d+/.test(c)) {
    r = c.match(/^\d+/)[0];
    c = c.replace(/^\d+/, '');
    this.repeats = r;
    if (!c.length) {
      return;
    }
  }
  var com = c[0];
  this.queue += com;
  this.queue = this.queue.slice(0, -1);
  this.convertToAction(com);
  if (!commandMode && !document.activeElement.isInput()) {
    this.executeSequence(c.substring(1), r);
  }
};

Mappings.handleEscapeKey = function() {

  this.queue = '';
  this.repeats = '';
  currentTrieNode = mappingTrie;

  if (commandMode) {
    if (Command.type === 'search') {
      document.body.scrollTop = Command.lastScrollTop;
      if (Find.previousMatches && Command.input.value && Find.lastSearch && Find.lastSearch !== Command.input.value) {
        Find.clear();
        HUD.hide();
        Find.highlight({ base: document.body,
          search: Find.lastSearch,
          setIndex: false,
          executeSearch: false,
          reverse: true,
          saveSearch: true
        });
        Find.index = Find.lastIndex - 1;
        Find.search(false, 1, false);
      }
    }
    Command.hideData();
    return Command.hide();
  }

  if (document.activeElement.isInput()) {
    if (document.getSelection().type === 'Range') {
      document.getSelection().collapseToEnd();
      return;
    }
    this.actions.inputFocused = false;
    return document.activeElement.blur();
  }

  if (Hints.active) {
    return Hints.hideHints(false, false);
  }

  if (insertMode) {
    insertMode = false;
    return HUD.hide();
  }

  if (Hints.lastHover) {
    Hints.lastHover.unhover();
    Hints.lastHover = null;
    return;
  }

  if (Find.matches.length) {
    Find.clear();
    return HUD.hide();
  }
};

Mappings.nonRepeatableCommands = [
  'scrollDown',
  'scrollUp',
  'scrollLeft',
  'scrollRight',
  'reloadTab'
];

Mappings.clearQueue = function() {
  currentTrieNode = mappingTrie;
  this.queue = this.repeats = '';
  this.validMatch = false;
};

Mappings.convertToAction = function(key) {

  if (key === '<Esc>' || key === '<C-[>') {
    this.handleEscapeKey();
    return false;
  }
  if (Hints.active) {
    return Hints.handleHint(key);
  }

  if (/^[0-9]$/.test(key) && !(key === '0' && this.repeats === '')) {
    this.repeats += key;
    return;
  }

  this.queue += key;
  if (!currentTrieNode.data.hasOwnProperty(key)) {
    if (currentTrieNode.data['*']) {
      currentTrieNode = currentTrieNode.data['*'];
    } else {
      this.clearQueue();
      return false;
    }
  } else {
    currentTrieNode = currentTrieNode.data[key];
    this.validMatch = true;
  }

  if (currentTrieNode.value) {
    if (currentTrieNode.value.indexOf(':') === 0) {
      this.actions.shortCuts(currentTrieNode.value, +this.repeats || 1);
    } else {
      if (currentTrieNode.value !== 'repeatCommand') {
        if (!this.actions[currentTrieNode.value]) {
          this.clearQueue();
          return false;
        }
        if (this.nonRepeatableCommands.indexOf(currentTrieNode.value) === -1) {
          this.lastCommand.queue = this.queue;
          this.lastCommand.repeats = +this.repeats || 1;
          this.lastCommand.fn = currentTrieNode.value;
        }
        this.actions[currentTrieNode.value](this.lastCommand.repeats);
        RUNTIME('updateLastCommand', {
          data: JSON.stringify(this.lastCommand)
        });
      } else {
        this.actions.repeatCommand(+this.repeats || 1);
      }
    }
    this.clearQueue();
  }

  return true;

};
var Find = {
  highlights: [],
  matches: [],
  index: 0,
  tries: 0
};

Find.setIndex = function() {
  for (var i = 0; i < this.matches.length; i++) {
    var br = this.matches[i].getBoundingClientRect();
    if (br.top > 0 && br.left > 0) {
      this.index = i - 1;
      HUD.display(this.index + 1 + ' / ' + this.matches.length);
      break;
    }
  }
};

Find.getSelectedTextNode = function() {
  if (!this.matches.length) {
    return false;
  }
  return (this.matches[this.index] && this.matches[this.index].firstChild) || false;
};

Find.search = function(reverse, repeats, ignoreFocus) {
  var activeHighlight = settings.activehighlight;
  if (Find.swap) {
    reverse = !reverse;
  }
  if (!this.matches.length) {
    return HUD.display('No matches', 1);
  }
  if (this.index >= 0) {
    this.matches[this.index].style.backgroundColor = '';
  }
  if (reverse && repeats === 1 && this.index === 0) {
    this.index = this.matches.length - 1;
  } else if (!reverse && repeats === 1 && this.index + 1 === this.matches.length) {
    this.index = 0;
  } else {
    this.index = (this.index + (reverse ? -1 : 1) * repeats).mod(this.matches.length);
  }
  if (!this.matches[this.index].isVisible()) {
    this.matches.splice(this.index, 1);
    this.tries++;
    if (this.tries > this.matches.length) {
      return;
    }
    if (this.swap) {
      return this.search(!reverse, 1);
    }
    return this.search(reverse, 1);
  } else {
    this.tries = 0;
  }
  var isLink = false;
  var br = this.matches[this.index].getBoundingClientRect();
  var origTop = document.body.scrollTop;
  if (!ignoreFocus) {
    document.activeElement.blur();
    document.body.focus();
  }
  var node = this.matches[this.index];
  while (node = node.parentElement) {
    if (node.getAttribute('href') !== null) {
      if (!ignoreFocus) {
        node.focus();
      }
      isLink = true;
      break;
    }
  }
  this.matches[this.index].style.backgroundColor = activeHighlight;
  HUD.display(this.index + 1 + ' / ' + this.matches.length);
  var paddingTop = 0,
      paddingBottom = 0;
  if (Command.active) {
    paddingBottom = Command.barPaddingBottom;
    paddingTop    = Command.barPaddingTop;
  }
  var documentZoom = parseFloat(document.body.style.zoom) || 1;
  if (br.top * documentZoom + br.height * documentZoom > window.innerHeight - paddingBottom) {
    if (isLink && !reverse) {
      origTop += br.height * documentZoom;
    }
    window.scrollTo(0, origTop + paddingTop + paddingBottom);
    window.scrollBy(0, br.top * documentZoom + br.height * documentZoom - window.innerHeight);
  } else if (br.top < paddingTop) {
    window.scrollTo(0, origTop - paddingTop - paddingBottom);
    window.scrollBy(0, br.top * documentZoom);
  }
  Command.input.focus();
};

Find.highlight = function(params) {
  // params => {}
  //   base           -> node to search in
  //   search         -> text to look for
  //   reverse        -> reverse search
  //   setIndex       -> find the first match within the viewport
  //   executesearch  -> run Find.search after highlighting
  //   saveSearch     -> add search to search history
  var regexMode = '',
      containsCap = params.search.search(/[A-Z]/) !== -1,
      useRegex = settings.regexp,
      markBase = document.createElement('mark'),
      nodes = [],
      i = 0,
      node, mark, mid, search, nodeIterator, matchPosition;

  markBase.style.backgroundColor = settings.highlight;

  if (params.saveSearch) {
    this.lastSearch = params.search;
  }

  search = params.search;

  if ((settings.ignorecase || /\/i$/.test(params.search)) && !(settings.smartcase && containsCap)) {
    search = search.replace(/\/i$/, '');
    regexMode = 'i';
  }

  if (useRegex) {
    try {
      var rxp = new RegExp(search, 'g' + regexMode);
      var mts = rxp.exec('.');
      if (!mts || (mts && mts[0] !== '')) { // Avoid infinite loop
        search = rxp;
      } else {
        useRegex = false;
      }
    } catch(e) { // RegExp was invalid
      useRegex = false;
    }
  }

  nodeIterator = document.createNodeIterator(params.base, NodeFilter.SHOW_TEXT, { acceptNode: function(node) { // Make sure HTML element isn't a script/style
    if (!node.data.trim()) {
      return NodeFilter.FILTER_REJECT;
    }
    var nodeName = node.parentNode.localName.toLowerCase();
    if (nodeName === 'script' || nodeName === 'style' || nodeName === 'noscript' || nodeName === 'mark') {
      return NodeFilter.FILTER_REJECT;
    }
    if (isVisible(node.parentNode)) {
      return NodeFilter.FILTER_ACCEPT;
    }
    return NodeFilter.FILTER_REJECT;
  }}, false);

  if (useRegex) {
    while (node = nodeIterator.nextNode()) {
      nodes.push(node);
    }
    for (i = 0, l = nodes.length; i < l; i++) {
      node = nodes[i];
      var matches = node.data.match(search);
      if (matches) {
        for (var j = 0, k = matches.length; j < k; j++) {
          mark = markBase.cloneNode(false);
          mid = node.splitText(node.data.indexOf(matches[j]));
          mid.splitText(matches[j].length);
          mark.appendChild(mid.cloneNode(true));
          mid.parentNode.replaceChild(mark, mid);
          this.matches.push(mark);
          node = mark.nextSibling;
        }
      }
    }
  } else {
    while (node = nodeIterator.nextNode()) {
      nodes.push(node);
    }
    for (i = 0, l = nodes.length; i < l; i++) {
      node = nodes[i];
      matchPosition = (containsCap || !settings.ignorecase ? node.data.indexOf(search) : node.data.toLowerCase().indexOf(search));
      if (matchPosition !== -1) {
        mark = markBase.cloneNode(false);
        mid = node.splitText(matchPosition);
        mid.splitText(search.length);
        mark.appendChild(mid.cloneNode(true));
        mid.parentNode.replaceChild(mark, mid);
        this.matches.push(mark);
      }
    }
  }

  document.body.normalize();

  HUD.display(this.matches.length || 'No matches');

  if (params.setIndex) {
    this.setIndex();
  }
  if (params.executeSearch) {
    this.search(params.reverse, 1);
  }

};

Find.clear = function() {
  // Not pretty, but this is WAY faster than calling Node.normalize()
  var nodes = this.matches;
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i] && nodes[i].parentNode) {
      nodes[i].parentNode.innerHTML = nodes[i].parentNode.innerHTML.replace(/<mark[^>]*>([^<]+)<\/mark>/gi, '$1');
    }
  }
  // More elegant solution, but 1000's of times slower
  // for (var i = 0; i < this.matches.length; i++) {
  //   try { // Ignore text nodes that have changed or been removed since last search
  //     var parent = this.matches[i].parentNode;
  //     parent.replaceChild(this.matches[i].firstChild, this.matches[i]);
  //     parent.normalize();
  //   } catch(e) {
  //     continue;
  //   }
  // }
  this.matches = [];
};
var Cursor = {}; // Hide the mouse cursor on keydown (Linux)

// Jiggle the screen for CSS styles to take hold on pages with no overflow.
// This still doesn't seem to work on new tabs until the mouse is touched
Cursor.wiggleWindow = function() {
  document.body.style.minHeight = document.documentElement.clientHeight + 2 + 'px';
  var jiggleDirection =
    +(document.body.scrollTop !== 0 &&
      document.body.scrollHeight -
      document.body.scrollTop    -
      document.documentElement.clientHeight === 0);
  document.body.scrollTop -= jiggleDirection;
  document.body.scrollTop += jiggleDirection;
  document.body.style.minHeight = '';
};

Cursor.init = function() {
  this.overlay = document.createElement('div');
  this.overlay.id = 'cVim-cursor';
  document.body.appendChild(this.overlay);
  var oldX, oldY;
  this.overlay.style.display = 'block';
  Cursor.wiggleWindow();
  this.overlay.style.display = 'none';
  document.addEventListener('mousemove', function(e) {
    if (oldX !== e.x || oldY !== e.y) {
      Cursor.overlay.style.display = 'none';
    }
    oldX = e.x;
    oldY = e.y;
  });
};

var Status = {};
Status.defaultTimeout = 3;

Status.setMessage = function(message, timeout, type) {
  window.clearTimeout(this.delay);
  this.hide();
  if (timeout === void 0) {
    timeout = this.defaultTimeout;
  }
  this.active = true;
  Command.statusBar.textContent = '';
  if (type === 'error') {
    var error = document.createElement('span');
    error.style.color = 'red';
    error.textContent = 'Error';
    error.className = 'cVim-error';
    Command.statusBar.appendChild(error);
    Command.statusBar.appendChild(document.createTextNode(': '));
  }
  Command.statusBar.appendChild(document.createTextNode(message));
  Command.statusBar.normalize();
  Command.statusBar.style.display = 'inline-block';
  this.delay = window.setTimeout(function() {
    if (Status.active === true) {
      Command.statusBar.style.display = 'none';
      Status.active = false;
    }
  }, timeout * 1000);
};

Status.hide = function() {
  Command.statusBar.style.display = 'none';
  this.active = false;
};
var HUD = {
  visible: false,
  slideDuration: 40
};

HUD.transitionEvent = function() {
  if (HUD.overflowValue) {
    document.body.style.overflowX = HUD.overflowValue;
  }
  delete HUD.overflowValue;
  HUD.element.removeEventListener('transitionend', HUD.transitionEvent, true);
  HUD.element.parentNode.removeChild(HUD.element);
  delete HUD.element;
  HUD.visible = false;
  HUD.transition = false;
};

HUD.hide = function(ignoreSetting) {
  if (!ignoreSetting) {
    if (!settings.hud || this.element === void 0) {
      return false;
    }
    if (Find.matches.length) {
      return HUD.display(Find.index + 1 + ' / ' + Find.matches.length);
    }
  }
  if (!this.element) {
    return false;
  }
  HUD.transition = true;
  this.element.addEventListener('transitionend', this.transitionEvent, true);
  var width = this.element.offsetWidth;
  this.element.style.right = -width + 'px';
};

HUD.setMessage = function(text, duration) {
  window.clearTimeout(this.hideTimeout);
  if (!settings.hud || this.element === void 0) {
    return false;
  }
  this.element.firstElementChild.textContent = text;
  if (duration) {
    this.hideTimeout = window.setTimeout(function() {
      HUD.hide();
    }, duration * 1000);
  }
};

HUD.display = function(text, duration) {
  if (HUD.visible && HUD.transition) {
    this.element.removeEventListener('transitionend', this.transitionEvent, true);
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    delete this.element;
  }
  HUD.visible = true;
  if (!settings.hud || HUD.element !== void 0) {
    return HUD.setMessage(text, duration);
  }
  if (this.element) {
    this.element.removeEventListener('transitionend', this.transitionEvent, true);
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    delete this.element;
  }
  window.clearTimeout(this.hideTimeout);
  var span, pageWidth, screenWidth, height, width;
  if (!this.element) {
    this.element = document.createElement('div');
    this.element.id  = 'cVim-hud';
    if (Command.onBottom) {
      this.element.style.bottom = 'initial';
      this.element.style.top    = '0';
    }
  }
  this.element.innerHTML = '';
  span = document.createElement('span');
  span.textContent = text;
  this.element.appendChild(span);

  try { document.lastElementChild.appendChild(this.element); }
  catch (e) {
    if (document.body === void 0) {
      return false;
    } else {
      document.body.appendChild(this.element);
    }
  }

  height = this.element.offsetHeight;
  width  = this.element.offsetWidth;
  this.element.style.right = -this.element.offsetWidth + 'px';

  screenWidth = document.documentElement.clientWidth;
  pageWidth   =  document.body.scrollWidth;
  if (screenWidth === pageWidth) {
    this.overflowValue = getComputedStyle(document.body).overflowX;
    document.body.style.overflowX = 'hidden';
  }

  this.element.style.right = '0';

  if (duration) {
    this.hideTimeout = window.setTimeout(function() {
      HUD.hide();
    }, duration * 1000);
  }

};
var Visual = {
  queue: '',
  visualModeActive: false,
  caretModeActive: false,
  textNodes: []
};

Visual.getTextNodes = function(callback) {
  var walker = document.createTreeWalker(document.body, 4, null, false);
  var node;
  this.textNodes = [];
  while (node = walker.nextNode()) {
    if (node.nodeType === 3 && node.data.trim() !== '') {
      this.textNodes.push(node);
    }
  }
  if (callback) {
    return callback();
  }
};

Visual.exit = function() {
  this.caretModeActive  = false;
  this.visualModeActive = false;
  document.designMode   = 'off';
  if (!Find.matches.length) {
    HUD.hide();
  } else {
    HUD.display(Find.index + 1 + ' / ' + Find.matches.length);
  }
  document.body.spellcheck = true;
  return;
};

Visual.focusSearchResult = function(lineMode) {
  var node = Find.getSelectedTextNode();
  if (node.data.length === 0) {
    return false;
  }
  this.selection = document.getSelection();
  this.selection.setPosition(node, 0);
  if (lineMode) {
    this.lineMode = true;
    this.visualModeActive = true;
    this.selection.setPosition(this.selection.baseNode, 0);
    this.selection.extend(this.selection.baseNode, this.selection.baseNode.length);
    HUD.display(' -- VISUAL LINE -- ');
    return this.enterLineMode();
  }
  HUD.display(' -- VISUAL -- ');
  this.selection = document.getSelection();
  this.selection.extend(node, node.data.replace(/\s+$/, '').length);
  this.visualModeActive = true;
};

Visual.collapse = function() {
  this.visualModeActive = false;
  var b = this.textNodes.indexOf(this.selection.anchorNode);
  var e = this.textNodes.indexOf(this.selection.extentNode);
  if ((b===e && this.selection.extentOffset < this.selection.baseOffset) || (e<b)) {
    this.selection.collapseToStart();
  } else if (this.selection.isCollapsed === false) {
    this.selection.collapseToEnd();
  }
};

Visual.closestNode = function() {
  for (var i = 0; i < this.textNodes.length; ++i) {
    var ee = this.textNodes[i].parentElement;
    var br = ee.getBoundingClientRect();
    if (br.top > 0) {
      return this.textNodes[i];
    }
  }
};

Visual.selectNode = function(index) {
  this.selection.setPosition(this.textNodes[index], 0);
  this.selection.extend(this.textNodes[index], this.textNodes[index].data.replace(/\s+$/, '').length);
  this.visualModeActive = true;
};

Visual.scrollIntoView = function() {
  if (!this.selection.extentNode) {
    return false;
  }
  var extentParent = this.selection.extentNode.parentElement;
  var br = extentParent.getBoundingClientRect();
  if (br.top < 0) {
    window.scrollBy(0, br.top);
  } else if (br.top + br.height > document.documentElement.clientHeight) {
    window.scrollBy(0, br.top + br.height - document.documentElement.clientHeight);
  }
};

Visual.enterLineMode = function() {
  this.selection = document.getSelection();
  this.firstLine = true;
  var base = this.textNodes[this.textNodes.indexOf(this.selection.baseNode)];
  if (base === void 0) {
    HUD.setMessage(' -- VISUAL -- ');
    return this.lineMode = false;
  }
  if (this.selection.type === 'Caret') {
    this.selection.setPosition(base, 0);
    this.selection.extend(base, base.length);
  } else {
    var bnode = this.selection.baseNode;
    var enode = this.selection.extentNode;
    if (bnode.parentNode.getBoundingClientRect().top > enode.parentNode.getBoundingClientRect().top) {
      this.selection.setPosition(bnode, bnode.length);
      this.selection.extend(enode, 0);
      this.selection.modify('extend', 'left', 'lineboundary');
    } else {
      this.selection.setPosition(bnode, 0);
      this.selection.extend(enode, enode.length);
      this.selection.modify('extend', 'right', 'lineboundary');
    }
    this.firstExtentNode = this.selection.extentNode;
  }
};

Visual.fillLine = function() {
  this.selection = document.getSelection();
  if (this.selection.type === 'Caret') {
    this.selection.setPosition(this.selection.baseNode, 0);
    this.selection.modify('extend', 'right', 'lineboundary');
  }
};

Visual.lineAction = function(key) {
  this.selection = document.getSelection();
  switch (key) {
    case 'j':
      if (this.firstLine || this.selection.extentNode === this.firstExtentNode || this.selection.baseNode === this.selection.extentNode) {
        this.selection.setPosition(this.selection.baseNode, 0);
        this.firstLine = false;
      }
      this.selection.modify('extend', 'right', 'line');
      this.selection.modify('extend', 'left', 'lineboundary');
      this.fillLine();
      break;
    case 'k':
      if (this.firstLine || this.selection.extentNode === this.firstExtentNode || this.selection.baseNode === this.selection.extentNode) {
        this.selection.setPosition(this.selection.baseNode, this.selection.baseNode.length);
        this.firstLine = false;
      }
      this.selection.modify('extend', 'left', 'line');
      this.selection.modify('extend', 'right', 'lineboundary');
      this.fillLine();
      break;
    case 'p':
    case 'P':
      Clipboard.copy(this.selection.toString());
      Clipboard.paste(key === 'P');
      this.exit();
      break;
    case 'y':
      Clipboard.copy(this.selection.toString());
      Visual.collapse();
      break;
    case 'G':
      this.selection.modify('extend', 'right', 'documentboundary');
      break;
  }
  Visual.scrollIntoView();
};

Visual.movements = {
  l: ['right', 'character'],
  h: ['left', 'character'],
  k: ['left', 'line'],
  j: ['right', 'line'],
  w: ['right', 'word'],
  b: ['left', 'word'],
  0: ['left', 'lineboundary'],
  $: ['right', 'lineboundary'],
  G: ['right', 'documentboundary']
};

Visual.action = function(key) {

  this.selection = document.getSelection();

  switch (key) {
    case 'g':
      if (!this.queue.length) {
        this.queue += 'g';
      } else {
        this.queue = '';
        this.selection.modify((this.visualModeActive ? 'extend' : 'move'),
            'left', 'documentboundary');
        this.scrollIntoView();
      }
      return;
    case 'v':
      if (this.lineMode) {
        HUD.setMessage(' -- VISUAL -- ');
        this.lineMode = false;
        return;
      }
      this.visualModeActive = !this.visualModeActive;
      HUD.setMessage(' -- ' +
          (this.visualModeActive ? 'VISUAL' : 'CARET') +
          ' -- ');
      break;
    case 'V':
      this.lineMode = !this.lineMode;
      this.visualModeActive = true;
      this.enterLineMode();
      HUD.setMessage(' -- VISUAL LINE -- ');
      return;
    default:
      this.queue = '';
  }

  if (this.lineMode) {
    this.lineAction(key);
    return;
  }
  if (this.selection.type === 'Range') {
    this.visualModeActive = true;
  }

  var movementType =
    (this.selection.type === 'Range' || this.visualModeActive) ?
    'extend' : 'move';

  if (this.movements.hasOwnProperty(key)) {
    this.selection.modify.apply(this.selection, [movementType].concat(this.movements[key]));
    return;
  }

  switch (key) {
    case 'n':
    case 'N':
      if (key === 'N') {
        Mappings.actions.previousSearchResult(1);
      } else {
        Mappings.actions.nextSearchResult(1);
      }
      this.focusSearchResult();
      break;
    case 'p':
    case 'P':
      Clipboard.copy(this.selection.toString());
      this.selection.collapseToEnd();
      Clipboard.paste(key === 'P');
      this.exit();
      break;
    case 'y':
      if (movementType === 'extend') {
        Clipboard.copy(this.selection.toString());
        Visual.collapse();
      }
      break;
  }

  Visual.scrollIntoView();
};
var Command = {};
var settings, sessions;

Command.dataElements = [];
Command.matches = [];
Command.lastInputValue = '';

Command.setup = function() {
  this.bar = document.createElement('div');
  this.bar.id = 'cVim-command-bar';
  this.bar.cVim = true;
  this.bar.style[(this.onBottom) ? 'bottom' : 'top'] = '0';
  this.input = document.createElement('input');
  this.input.type = 'text';
  this.input.id = 'cVim-command-bar-input';
  this.input.cVim = true;
  this.statusBar = document.createElement('div');
  this.statusBar.id = 'cVim-status-bar';
  this.statusBar.style[(this.onBottom) ? 'bottom' : 'top'] = '0';
  this.modeIdentifier = document.createElement('span');
  this.modeIdentifier.id = 'cVim-command-bar-mode';
  this.modeIdentifier.cVim = true;
  this.bar.appendChild(this.modeIdentifier);
  this.bar.appendChild(this.input);
  this.bar.spellcheck = false;
  this.input.addEventListener('blur', function() { // Possible fix for #43
    window.setTimeout(function() {
      Command.hide.call(Command);
    }, 0);
  });
  try {
    document.lastChild.appendChild(this.bar);
    document.lastChild.appendChild(this.statusBar);
  } catch(e) {
    document.body.appendChild(this.bar);
    document.body.appendChild(this.statusBar);
  }
  if (!this.data) {
    this.data = document.createElement('div');
    this.data.id = 'cVim-command-bar-search-results';
    this.data.cVim = true;
    try {
      document.lastChild.appendChild(this.data);
    } catch(e) {
      document.body.appendChild(this.data);
    }
    this.barHeight = parseInt(getComputedStyle(this.bar).height);
    if (this.onBottom) {
      this.barPaddingTop = 0;
      this.barPaddingBottom = this.barHeight;
      this.data.style.bottom = this.barHeight + 'px';
    } else {
      this.barPaddingBottom = 0;
      this.barPaddingTop = this.barHeight;
      this.data.style.top = this.barHeight + 'px';
    }
  }
};

Command.history = {
  index: {},
  search: [],
  url: [],
  action: [],
  setInfo: function(type, index) {
    var fail = false;
    if (index < 0) {
      index = 0;
      fail = true;
    }
    if (index >= this[type].length) {
      index = this[type].length;
      fail = true;
    }
    this.index[type] = index;
    return !fail;
  },
  cycle: function(type, reverse) {
    if (this[type].length === 0) {
      return false;
    }
    var len = this[type].length,
        index = this.index[type];
    if (index === void 0) {
      index = len;
    }
    var lastIndex = index;
    index += reverse ? -1 : 1;
    if (Command.typed && Command.typed.trim()) {
      while (this.setInfo(type, index)) {
        if (this[type][index].substring(0, Command.typed.length) === Command.typed) {
          break;
        }
        index += reverse ? -1 : 1;
      }
    }
    if (reverse && !~index) {
      this.index[type] = lastIndex;
      return;
    }
    Command.hideData();
    this.setInfo(type, index);
    if (this.index[type] !== this[type].length) {
      Command.input.value = this[type][this.index[type]];
    } else {
      Command.input.value = Command.typed || '';
    }
  }
};

Command.completions = {};

Command.completionStyles = {
  topsites:  [ 'Top Site', 'darkcyan' ],
  history:   [ 'History',      'cyan' ],
  bookmarks: [ 'Bookmark',  '#6d85fd' ]
};

Command.completionOrder = {
  engines: 5,
  topsites: 4,
  bookmarks: 2,
  history: 3,
  getImportance: function(item) {
    if (!this.hasOwnProperty(item)) {
      return -1;
    }
    return this[item];
  }
};

Command.updateCompletions = function(useStyles) {
  this.completionResults = [];
  this.dataElements = [];
  this.data.innerHTML = '';
  var key, i;
  var completionKeys = Object.keys(this.completions).sort(function(a, b) {
    return this.completionOrder.getImportance(b) - this.completionOrder.getImportance(a);
  }.bind(this));
  for (i = 0; i < completionKeys.length; i++) {
    key = completionKeys[i];
    for (var j = 0; j < this.completions[key].length; ++j) {
      this.completionResults.push([key].concat(this.completions[key][j]));
    }
  }
  for (i = 0; i < this.completionResults.length; ++i) {
    if (i > settings.searchlimit) {
      break;
    }
    var item = document.createElement('div');
    item.className = 'cVim-completion-item';
    var identifier;
    if (useStyles && this.completionStyles.hasOwnProperty(this.completionResults[i][0])) {
      var styles = this.completionStyles[this.completionResults[i][0]];
      identifier = document.createElement('span');
      identifier.style.color = styles[1];
      identifier.textContent = styles[0] + ': ';
    }
    if (this.completionResults[i].length >= 3) {
      var left = document.createElement('span');
      left.className = 'cVim-left';
      left.textContent = decodeHTMLEntities(this.completionResults[i][1]);
      var right = document.createElement('span');
      right.className = 'cVim-right';
      right.textContent = decodeHTMLEntities(this.completionResults[i][2]);
      if (identifier) {
        left.insertBefore(identifier, left.firstChild);
      }
      item.appendChild(left);
      item.appendChild(right);
    } else {
      var full = document.createElement('span');
      full.className = 'cVim-full';
      full.textContent = decodeHTMLEntities(this.completionResults[i][1]);
      item.appendChild(full);
    }
    this.dataElements.push(item);
    this.data.appendChild(item);
  }
  if (!this.active || !commandMode) {
    this.hideData();
  } else {
    this.data.style.display = 'block';
  }
};

Command.hideData = function() {
  this.completions = {};
  Search.lastActive = null;
  this.dataElements.length = 0;
  if (this.data) {
    this.data.innerHTML = '';
    Search.index = null;
  }
};

Command.descriptions = [
  ['open',         'Open a link in the current tab'],
  ['tabnew',       'Open a link in a new tab'],
  ['tabnext',      'Switch to the next open tab'],
  ['tabprevious',  'Switch to the previous open tab'],
  ['new',          'Open a link in a new window'],
  ['buffer',       'Select from a list of current tabs'],
  ['history',      'Search through your browser history'],
  ['bookmarks',    'Search through your bookmarks'],
  ['file',         'Browse local directories'],
  ['set',          'Configure Settings'],
  ['tabhistory',   'Open a tab from its history states'],
  ['execute',      'Execute a sequence of keys'],
  ['session',      'Open a saved session in a new window'],
  ['restore',      'Open a recently closed tab'],
  ['mksession',    'Create a saved session of current tabs'],
  ['delsession',   'Delete sessions'],
  ['map',          'Map a command'],
  ['unmap',        'Unmap a command'],
  ['tabattach',    'Move current tab to another window'],
  ['chrome://',    'Opens Chrome urls'],
  ['duplicate',    'Clone the current tab'],
  ['settings',     'Open the options page for this extension'],
  ['help',         'Shows the help page'],
  ['changelog',    'Shows the changelog page'],
  ['quit',         'Close the current tab'],
  ['qall',         'Close the current window'],
  ['stop',         'Stop the current page from loading'],
  ['stopall',      'Stop all pages in Chrome from loading'],
  ['undo',         'Reopen the last closed tab'],
  ['togglepin',    'Toggle the tab\'s pinned state'],
  ['nohl',         'Clears the search highlight'],
  ['viewsource',   'View the source for the current document']
];

Command.deleteCompletions = function(completions) {
  completions = completions.split(',');
  for (var i = 0, l = completions.length; i < l; ++i) {
    this.completions[completions[i]] = [];
  }
};

Command.complete = function(value) {
  Search.index = null;
  this.typed = this.input.value;
  value = value.replace(/(^[^\s&!*]+)[&!*]*/, '$1');
  var search = value.replace(/^(chrome:\/\/|\S+ +)/, '');

  if (/^(tabnew|tabedit|tabe|tabopen|to|open|o|wo|new|winopen)(\s+)/.test(value)) {

    this.deleteCompletions('engines,bookmarks,complete,chrome,search');
    search = search.split(/ +/).compress();

    if ((search.length < 2 || !~Complete.engines.indexOf(search[0])) && !Complete.hasAlias(search[0]) || (Complete.hasAlias(search[0]) &&  value.slice(-1) !== ' ' && search.length < 2)) {

      if (~Complete.engines.indexOf(search[0])) {
        this.hideData();
        return;
      }

      this.completions.engines = [];
      for (var i = 0, l = Complete.engines.length; i < l; ++i) {
        if (!search[0] || Complete.engines[i].indexOf(search.join(' ')) === 0) {
          this.completions.engines.push([Complete.engines[i], Complete.requestUrls[Complete.engines[i]]]);
        }
      }
      this.updateCompletions(true);

      this.completions.topsites = Search.topSites.filter(function(e) {
        return ~(e[0] + ' ' + e[1]).toLowerCase().indexOf(search.slice(0).join(' ').toLowerCase());
      }).slice(0, 5).map(function(e) {
        return [e[0], e[1]];
      });
      this.updateCompletions(true);

      if (search.length) {
        Marks.match(search.join(' '), function(response) {
          this.completions.bookmarks = response;
          this.updateCompletions(true);
        }.bind(this), 2);
      }

      this.historyMode = false;
      this.searchMode = true;
      PORT('searchHistory', {search: value.replace(/^\S+\s+/, ''), limit: settings.searchlimit});
      return;

    }

    if (search[0] = (Complete.getAlias(search[0]) || search[0])) {
      if (search.length < 2) {
        this.hideData();
        return;
      }
    }
    if (~Complete.engines.indexOf(search[0]) && Complete.hasOwnProperty(search[0])) {
      Complete[search[0]](search.slice(1).join(' '), function(response) {
        this.completions = { search: response };
        this.updateCompletions();
      }.bind(this));
    }
    return;

  }

  if (/^chrome:\/\//.test(value)) {
    Search.chromeMatch(search, function(matches) {
      this.completions = { chrome: matches };
      this.updateCompletions();
    }.bind(this));
    return;
  }

  if (/^tabhistory +/.test(value)) {
    RUNTIME('getHistoryStates', null, function(response) {
      this.completions = {
        tabhistory: searchArray(response.links, value.replace(/\S+\s+/, ''), settings.searchlimit, true)
      };
      this.updateCompletions();
    }.bind(this));
    return;
  }

  if (/^taba(ttach)? +/.test(value)) {
    RUNTIME('getWindows');
    this.completions = { };
    return;
  }

  if (/^buffer(\s+)/.test(value)) {
    PORT('getBuffers');
    return;
  }

  if (/^restore\s+/.test(value)) {
    RUNTIME('getChromeSessions', null, function(sessions) {
      this.completions = {
        chromesessions: Object.keys(sessions).map(function(e) {
          return [sessions[e].id + ': ' + sessions[e].title, sessions[e].url, sessions[e].id];
        }).filter(function(e) {
          return ~e.join('').toLowerCase().indexOf(value.replace(/^\S+\s+/, '').toLowerCase());
        })
      };
      this.updateCompletions();
    }.bind(this));
    return;
  }

  if (/^(del)?session(\s+)/.test(value)) {
    this.completions = {
      sessions: sessions.filter(function(e) {
        var regexp;
        var isValidRegex = true;
        try {
          regexp = new RegExp(search, 'i');
        } catch (ex) {
          isValidRegex = false;
        }
        if (isValidRegex) {
          return regexp.test(e[0]);
        }
        return e[0].substring(0, search.length) === search;
      })
    };
    this.updateCompletions();
    return;
  }

  if (/^set(\s+)/.test(value)) {
    Search.settingsMatch(search, function(matches) {
      this.completions = {settings: matches};
      this.updateCompletions();
    }.bind(this));
    return;
  }

  if (/^hist(ory)?(\s+)/.test(value)) {
    if (search.trim() === '') {
      this.hideData();
      return;
    }
    this.historyMode = true;
    PORT('searchHistory', {search: search, limit: settings.searchlimit});
    return;
  }

  if (/^file +/.test(value)) {
    if ((search.slice(-1) === '/' && Marks.lastSearchLength < search.length) || Marks.lastSearchLength > search.length || !(Marks.lastFileSearch && Marks.lastFileSearch.replace(/[^\/]+$/, '') === search) && (search.slice(-1) === '/' && !(Marks.lastFileSearch && Marks.lastFileSearch.slice(-1) === '/'))) {
      Marks.lastFileSearch = search;
      Marks.lastSearchLength = search.length;
      if (settings.homedirectory) {
        search = search.replace('~', settings.homedirectory);
      }
      RUNTIME('getFilePath', {path: search});
    } else {
      Marks.lastFileSearch = search;
      Marks.filePath();
    }
    return;
  }

  if (/^b(ook)?marks(\s+)/.test(value)) {
    this.completions = {};
    if (search[0] === '/') {
      return Marks.matchPath(search);
    }
    Marks.match(search, function(response) {
      this.completions.bookmarks = response;
      this.updateCompletions();
    }.bind(this));
    return;
  }

  this.completions = {
    complete: this.descriptions.filter(function(element) {
      return value === element[0].slice(0, value.length);
    })
  };
  this.updateCompletions();
};

Command.execute = function(value, repeats) {

  // Match commands like ':tabnew*&! search' before commands like ':tabnew search&*!'
  // e.g. :tabnew& google asdf* => opens a new pinned tab
  // ! == whether to open in a new tab or not
  // & == whether the tab will be active
  // * == whether the tab will be pinned
  var tab = {
    active: value === (value = value.replace(/(^[^\s&]+)&([*!]*)/, '$1$2')),
    pinned: value !== (value = value.replace(/(^[^\s*]+)\*([!]*)/, '$1$2')),
    tabbed: value !== (value = value.replace(/(^[^\s!]+)!/, '$1'))
  };
  var glob = {
    active: value === (value = value.replace(/&([*!]*)$/, '$1')),
    pinned: value !== (value = value.replace(/\*([!]*)$/, '$1')),
    tabbed: value !== (value = value.replace(/!$/, ''))
  };
  tab.active = tab.active && glob.active;
  tab.pinned = tab.pinned || glob.pinned;
  tab.tabbed = tab.tabbed || glob.tabbed;
  if (!tab.active && !tab.tabbed) {
    tab.tabbed = true;
  }

  this.history.index = {};

  switch (value) {
    case 'nohl':
      Find.clear();
      HUD.hide();
      return;
    case 'duplicate':
      RUNTIME('duplicateTab', {repeats: repeats});
      return;
    case 'settings':
      tab.tabbed = true;
      RUNTIME('openLink', {
        tab: tab,
        url: chrome.extension.getURL('/pages/options.html'),
        repeats: repeats
      });
      return;
    case 'changelog':
      tab.tabbed = true;
      RUNTIME('openLink', {
        tab: tab,
        url: chrome.extension.getURL('/pages/changelog.html'),
        repeats: repeats
      });
      return;
    case 'help':
      tab.tabbed = true;
      RUNTIME('openLink', {tab: tab, url: chrome.extension.getURL('/pages/mappings.html')});
      return;
    case 'stop':
      window.stop();
      return;
    case 'stopall':
      RUNTIME('cancelAllWebRequests');
      return;
    case 'viewsource':
      RUNTIME('openLink', {tab: tab, url: 'view-source:' + document.URL, noconvert: true});
      return;
    case 'togglepin':
      RUNTIME('pinTab');
      return;
    case 'undo':
      RUNTIME('openLast');
      return;
    case 'tabnext':
    case 'tabn':
      RUNTIME('nextTab');
      return;
    case 'tabprevious':
    case 'tabp':
    case 'tabN':
      RUNTIME('previousTab');
      return;
    case 'tabprevious':
      return;
    case 'q':
    case 'quit':
    case 'exit':
      RUNTIME('closeTab', {repeats: repeats});
      return;
    case 'qa':
    case 'qall':
      RUNTIME('closeWindow');
      return;
  }

  if (/^chrome:\/\/\S+$/.test(value)) {
    RUNTIME('openLink', {
      tab: tab,
      url: value,
      noconvert: true
    });
    return;
  }

  if (/^bookmarks +/.test(value) && !/^\S+\s*$/.test(value)) {
    if (/^\S+\s+\//.test(value)) {
      RUNTIME('openBookmarkFolder', {
        path: value.replace(/\S+\s+/, ''),
        noconvert: true
      });
      return;
    }
    RUNTIME('openLink', {
      tab: tab,
      url: value.replace(/^\S+\s+/, ''),
      noconvert: true
    });
    return;
  }

  if (/^history +/.test(value) && !/^\S+\s*$/.test(value)) {
    RUNTIME('openLink', {
      tab: tab,
      url: Complete.convertToLink(value),
      noconvert: true
    });
    return;
  }

  if (/^taba(ttach)? +/.test(value) && !/^\S+\s*$/.test(value)) {
    var windowId;
    if (windowId = this.completionResults[parseInt(value.replace(/^\S+ */, '')) - 1]) {
      RUNTIME('moveTab', {
        windowId: windowId[3]
      });
      return;
    }
  }

  if (/^file +/.test(value)) {
    RUNTIME('openLink', {
      tab: tab,
      url: 'file://' + value.replace(/\S+ +/, '').replace(/^~/, settings.homedirectory),
      noconvert: true
    });
    return;
  }

  if (/^(new|winopen|wo)$/.test(value.replace(/ .*/, '')) && !/^\S+\s*$/.test(value)) {
    RUNTIME('openLinkWindow', {
      tab: tab,
      url: Complete.convertToLink(value),
      repeats: repeats,
      noconvert: true
    });
    return;
  }

  if (/^restore\s+/.test(value)) {
    RUNTIME('restoreChromeSession', {
      sessionId: value.replace(/\S+\s+/, '').trimAround()
    });
  }

  if (/^(tabnew|tabedit|tabe|to|tabopen|tabhistory)$/.test(value.replace(/ .*/, ''))) {
    tab.tabbed = true;
    RUNTIME('openLink', {
      tab: tab,
      url: Complete.convertToLink(value),
      repeats: repeats,
      noconvert: true
    });
    return;
  }

  if (/^(o|open)$/.test(value.replace(/ .*/, '')) && !/^\S+\s*$/.test(value)) {
    RUNTIME('openLink', {
      tab: tab,
      url: Complete.convertToLink(value),
      noconvert: true
    });
    return;
  }

  if (/^buffer +/.test(value)) {
    var index = +value.replace(/^\S+\s+/, ''),
        selectedBuffer;
    if (Number.isNaN(index)) {
      selectedBuffer = Command.completionResults[0];
      if (selectedBuffer === void 0) {
        return;
      }
    } else {
      selectedBuffer = Command.completionResults.filter(function(e) {
        return e[1].indexOf(index.toString()) === 0;
      })[0];
    }
    if (selectedBuffer !== void 0) {
      RUNTIME('goToTab', {id: selectedBuffer[3]});
    }
    return;
  }

  if (/^execute +/.test(value)) {
    var command = value.replace(/^\S+/, '').trim();
    realKeys = '';
    repeats = '';
    Command.hide();
    Mappings.executeSequence(command);
    return;
  }

  if (/^delsession/.test(value)) {
    value = value.replace(/^\S+(\s+)?/, '').trimAround();
    if (value === '') {
      Status.setMessage('argument required', 1, 'error');
      return;
    }
    if (~sessions.indexOf(value)) {
      sessions.splice(sessions.indexOf(value), 1);
    }
    value.split(' ').forEach(function(v) {
      RUNTIME('deleteSession', {name: v});
    });
    PORT('getSessionNames');
    return;
  }

  if (/^mksession/.test(value)) {
    value = value.replace(/^\S+(\s+)?/, '').trimAround();
    if (value === '') {
      Status.setMessage('session name required', 1, 'error');
      return;
    }
    if (/[^a-zA-Z0-9_-]/.test(value)) {
      Status.setMessage('only alphanumeric characters, dashes, and underscores are allowed', 1, 'error');
      return;
    }
    if (!~sessions.indexOf(value)) {
      sessions.push(value);
    }
    RUNTIME('createSession', {name: value});
    return;
  }

  if (/^session/.test(value)) {
    value = value.replace(/^\S+(\s+)?/, '').trimAround();
    if (value === '') {
      Status.setMessage('session name required', 1, 'error');
      return;
    }
    RUNTIME('openSession', {name: value, sameWindow: !tab.active}, function() {
      Status.setMessage('session does not exist', 1, 'error');
    });
    return;
  }

  if (/^((i?(re)?map)|i?unmap(All)?)+/.test(value)) {
    Mappings.parseLine(value);
    return;
  }

  if (/^set +/.test(value) && value !== 'set') {
    value = value.replace(/^set +/, '').split(/[ =]+/);
    var isSet, swapVal,
        isQuery = /\?$/.test(value[0]);
    value[0] = value[0].replace(/\?$/, '');
    if (!settings.hasOwnProperty(value[0].replace(/^no|!$/g, ''))) {
      Status.setMessage('unknown option: ' + value[0], 1, 'error');
      return;
    }

    if (isQuery) {
      Status.setMessage(value + ': ' + settings[value[0]], 1);
      return;
    }

    isSet    = !/^no/.test(value[0]);
    swapVal  = tab.tabbed;
    value[0] = value[0].replace(/^no|\?$/g, '');

    if (value.length === 1 && Boolean(settings[value]) === settings[value]) {
      if (value[0] === 'hud' && !isSet) {
        HUD.hide(true);
      }
      if (swapVal) {
        settings[value[0]] = !settings[value[0]];
      } else {
        settings[value[0]] = isSet;
      }
      RUNTIME('syncSettings', {settings: settings});
    }
    return;
  }

};

Command.show = function(search, value) {
  if (!this.domElementsLoaded) {
    return;
  }
  this.type = '';
  this.active = true;
  if (document.activeElement) {
    document.activeElement.blur();
  }
  if (search) {
    this.type = 'search';
    this.modeIdentifier.innerHTML = search;
  } else {
    this.type = 'action';
    this.modeIdentifier.innerHTML = ':';
  }
  if (value) {
    this.input.value = value;
    this.typed = value;
  }
  if (Status.active) {
    Status.hide();
  }
  this.bar.style.display = 'inline-block';
  setTimeout(function() {
    this.input.focus();

    // Temp fix for Chromium issue in #97
    if (document.activeElement.id === 'cVim-command-bar-input') {
      document.activeElement.select();
      document.getSelection().collapseToEnd();
    }
    // End temp fix

  }.bind(this), 0);
};

Command.hide = function(callback) {
  if (document.activeElement) {
    document.activeElement.blur();
  }
  this.hideData();
  if (this.bar) {
    this.bar.style.display = 'none';
  }
  if (this.input) {
    this.input.value = '';
  }
  if (this.data) {
    this.data.style.display = 'none';
  }
  this.historyMode = false;
  this.active = false;
  commandMode = false;
  Search.index = null;
  this.history.index = {};
  this.typed = '';
  this.dataElements = [];
  if (callback) {
    callback();
  }
};

Command.insertCSS = function() {
  if (!settings.COMMANDBARCSS) {
    return;
  }
  var head = document.getElementsByTagName('head');
  if (!head.length && location.protocol !== 'chrome-extensions:' &&
      location.pathname !== '/_/chrome/newtab') {
    if (location.protocol !== 'chrome:') {
      RUNTIME('injectCSS', {
        css: settings.COMMANDBARCSS,
        runAt: 'document_start'
      });
    }
  }
  // For some reason, Chrome's own implementation of CSS injection seems to miss some styles.
  if (head.length) {
    this.css = document.createElement('style');
    this.css.textContent = settings.COMMANDBARCSS;
    head[0].appendChild(this.css);
  }
};

Command.onDOMLoad = function() {
  this.insertCSS();
  this.onBottom = settings.barposition === 'bottom';
  if (this.data !== void 0) {
    this.data.style[(!this.onBottom) ? 'bottom' : 'top'] = '';
    this.data.style[(this.onBottom) ? 'bottom' : 'top'] = '20px';
  }
  if (!settings.autofocus) {
    var manualFocus = false;
    var initialFocus = window.setInterval(function() {
      if (document.activeElement) {
        if (/input|textarea/i.test(document.activeElement.localName) && !manualFocus &&
            document.activeElement.id !== 'cVim-command-bar-input') {
          document.activeElement.blur();
        }
      }
      if (manualFocus) {
        window.clearInterval(initialFocus);
      }
    }, 5);
    var initialKeyDown = window.addEventListener('keydown', function() {
      manualFocus = true;
      document.removeEventListener('keydown', initialKeyDown, true);
    }, true);
    var initialMouseDown = document.addEventListener('mousedown', function() {
      manualFocus = true;
      document.removeEventListener('mousedown', initialMouseDown, true);
    }, true);
  }
  this.setup();
  this.domElementsLoaded = true;
};

Command.init = function(enabled) {
  var key;
  Mappings.defaults = Object.clone(Mappings.defaultsClone);
  Mappings.parseCustom(settings.MAPPINGS);
  if (enabled) {
    this.loaded = true;

    if (Array.isArray(settings.completionengines) && settings.completionengines.length) {
      Complete.engines = Complete.engines.filter(function(e) {
        return ~settings.completionengines.indexOf(e);
      });
    }
    if (settings.searchengines && settings.searchengines.constructor === Object) {
      for (key in settings.searchengines) {
        if (!~Complete.engines.indexOf(key) && typeof settings.searchengines[key] === 'string') {
          Complete.engines.push(key);
          Complete.requestUrls[key] = settings.searchengines[key];
        }
      }
    }
    if (settings.searchaliases && settings.searchaliases.constructor === Object) {
      for (key in settings.searchaliases) {
        if (Complete.engines.indexOf(key)) {
          Complete.aliases[key] = settings.searchaliases[key];
        }
      }
    }

    if (settings.locale) {
      Complete.setLocale(settings.locale);
    }

    waitForLoad(this.onDOMLoad, this);
    if (settings.autohidecursor) {
      waitForLoad(Cursor.init, Cursor);
    }
    Scroll.smoothScroll = settings.smoothscroll;
    Scroll.stepSize = +settings.scrollstep;
    if (settings.hintcharacters.split('').unique().length > 1) {
      settings.hintcharacters = settings.hintcharacters.split('').unique().join('');
    }
  } else {
    this.loaded = false;
    if (this.css && this.css.parentNode) {
      this.css.parentNode.removeChild(this.css);
    }
    var links = document.getElementById('cVim-link-container');
    if (Cursor.overlay && Cursor.overlay.parentNode) {
      Cursor.overlay.parentNode.removeChild(Cursor.overlay);
    }
    if (this.bar && this.bar.parentNode) {
      this.bar.parentNode.removeChild(this.bar);
    }
    if (links) {
      links.parentNode.removeChild(links);
    }
    removeListeners();
  }
};

Command.configureSettings = function(_settings) {

  settings = _settings;
  this.initialLoadStarted = true;
  var checkBlacklist = function() {
    var blacklists = settings.blacklists,
        blacklist;
    Command.blacklisted = false;
    for (var i = 0, l = blacklists.length; i < l; i++) {
      blacklist = blacklists[i].trimAround().split(/\s+/g);
      if (!blacklist.length) {
        continue;
      }
      if (matchLocation(document.URL, blacklist[0])) {
        if (blacklist.length > 1) {
          var unmaps      = blacklist.slice(1),
            unmapString = '';
          for (var j = 0, q = unmaps.length; j < q; ++j) {
            unmapString += '\nunmap ' + unmaps[j];
          }
          Mappings.siteSpecificBlacklists += unmapString;
          break;
        }
        return true;
      }
    }
  };
  var loadMain = function() {
    Command.loaded = true;
    RUNTIME('setIconEnabled');
    Command.init(true);
  };
  Search.settings = Object.keys(settings).filter(function(e) {
    return settings[e].constructor === Boolean;
  });
  removeListeners();
  settings.searchlimit = +settings.searchlimit;
  if (!checkBlacklist()) {
    RUNTIME('getActiveState', null, function(response) {
      if (response) {
        addListeners();
        loadMain();
      } else {
        Command.init(false);
      }
    });
  } else {
    this.init(false);
  }
};

if (!Command.loaded) {
  RUNTIME('getSettings');
}
var Scroll = {};
Scroll.positions = {};

var Easing = {
  // jQuery Easing v1.3 - http://gsgd.co.uk/sandbox/jquery/easing/
  // Open source under the BSD License.
  // Copyright © 2008 George McGinley Smith
  // All rights reserved.
  // https://raw.github.com/danro/jquery-easing/master/LICENSE
  inQuad: function(t, b, c, d) {
    return c*(t/=d)*t + b;
  },
  outQuad: function(t, b, c, d) {
    return -c *(t/=d)*(t-2) + b;
  },
  inOutQuad: function(t, b, c, d) {
    if ((t /= d/2) < 1) {
      return c/2*t*t + b;
    }
    return -c/2 * ((--t)*(t-2) - 1) + b;
  },
  inCubic: function(t, b, c, d) {
    return c*(t/=d)*t*t + b;
  },
  outCubic: function(t, b, c, d) {
    return c*((t=t/d-1)*t*t + 1) + b;
  },
  inOutCubic: function(t, b, c, d) {
    if ((t /= d/2) < 1) {
      return c/2*t*t*t + b;
    }
    return c/2*((t-=2)*t*t + 2) + b;
  },
  inQuart: function(t, b, c, d) {
    return c*(t/=d)*t*t*t + b;
  },
  outQuart: function(t, b, c, d) {
    return -c * ((t=t/d-1)*t*t*t - 1) + b;
  },
  inOutQuart: function(t, b, c, d) {
    if ((t /= d/2) < 1) {
      return c/2*t*t*t*t + b;
    }
    return -c/2 * ((t-=2)*t*t*t - 2) + b;
  },
  inQuint: function(t, b, c, d) {
    return c*(t/=d)*t*t*t*t + b;
  },
  outQuint: function(t, b, c, d) {
    return c*((t=t/d-1)*t*t*t*t + 1) + b;
  },
  inOutQuint: function(t, b, c, d) {
    if ((t /= d/2) < 1) {
      return c/2*t*t*t*t*t + b;
    }
    return c/2*((t-=2)*t*t*t*t + 2) + b;
  },
  inSine: function(t, b, c, d) {
    return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
  },
  outSine: function(t, b, c, d) {
    return c * Math.sin(t/d * (Math.PI/2)) + b;
  },
  inOutSine: function(t, b, c, d) {
    return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
  },
  inExpo: function(t, b, c, d) {
    return (t===0) ? b : c * Math.pow(2, 10 * (t/d - 1)) + b;
  },
  outExpo: function(t, b, c, d) {
    return (t===d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
  },
  inOutExpo: function(t, b, c, d) {
    if (t===0) {
      return b;
    }
    if (t===d) {
      return b+c;
    }
    if ((t /= d/2) < 1) {
      return c/2 * Math.pow(2, 10 * (t - 1)) + b;
    }
    return c/2 * (-Math.pow(2, -10 * --t) + 2) + b;
  },
  inCirc: function(t, b, c, d) {
    return -c * (Math.sqrt(1 - (t/=d)*t) - 1) + b;
  },
  outCirc: function(t, b, c, d) {
    return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
  },
  inOutCirc: function(t, b, c, d) {
    if ((t /= d/2) < 1) {
      return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
    }
    return c/2 * (Math.sqrt(1 - (t-=2)*t) + 1) + b;
  },
  inElastic: function(t, b, c, d) {
    var s=1.70158;var p=0;var a=c;
    if (t===0) {
      return b;
    }
    if ((t/=d)===1) {
      return b+c;
    }
    if (!p) {
      p=d*0.3;
    }
    if (a < Math.abs(c)) {
      a=c;
      s=p/4;
    } else {
      s = p/(2*Math.PI) * Math.asin (c/a);
    }
    return -(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
  },
  outElastic: function(t, b, c, d) {
    var s=1.70158;var p=0;var a=c;
    if (t===0) {
      return b;
    }
    if ((t/=d)===1) {
      return b+c;
    }
    if (!p) {
      p=d*0.3;
    }
    if (a < Math.abs(c)) {
      a=c;
      s=p/4;
    } else {
      s = p/(2*Math.PI) * Math.asin (c/a);
    }
    return a*Math.pow(2,-10*t) * Math.sin( (t*d-s)*(2*Math.PI)/p ) + c + b;
  },
  inOutElastic: function(t, b, c, d) {
    var s=1.70158;var p=0;var a=c;
    if (t===0) {
      return b;
    }
    if ((t /= d/2)===2) {
      return b+c;
    }
    if (!p) {
      p=d*(0.3*1.5);
    }
    if (a < Math.abs(c)) {
      a=c;
      s=p/4;
    } else {
      s = p/(2*Math.PI) * Math.asin (c/a);
    }
    if (t < 1) {
      return -0.5*(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
    }
    return a*Math.pow(2,-10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )*0.5 + c + b;
  },
  inBack: function(t, b, c, d, s) {
    if (s === undefined) {
      s = 1.70158;
    }
    return c*(t/=d)*t*((s+1)*t - s) + b;
  },
  outBack: function(t, b, c, d, s) {
    if (s === undefined) {
      s = 1.70158;
    }
    return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
  },
  inOutBack: function(t, b, c, d, s) {
    if (s === undefined) {
      s = 1.70158;
    }
    if ((t /= d/2) < 1) {
      return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
    }
    return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
  },
  outBounce: function(t, b, c, d) {
    if ((t/=d) < (1/2.75)) {
      return c*(7.5625*t*t) + b;
    } else if (t < (2/2.75)) {
      return c*(7.5625*(t-=(1.5/2.75))*t + 0.75) + b;
    } else if (t < (2.5/2.75)) {
      return c*(7.5625*(t-=(2.25/2.75))*t + 0.9375) + b;
    } else {
      return c*(7.5625*(t-=(2.625/2.75))*t + 0.984375) + b;
    }
  },
  inBounce: function(t, b, c, d) {
    return c - ease.outBounce (d-t, 0, c, d) + b;
  },
  inOutBounce: function(t, b, c, d) {
    if (t < d/2) {
      return ease.inBounce (t*2, 0, c, d) * 0.5 + b;
    }
    return ease.outBounce (t*2-d, 0, c, d) * 0.5 + c*0.5 + b;
  }
};

(function($) {

  var animationYFrame, animationXFrame,
      scrollXFunction, scrollYFunction;

  var easeFn = Easing.outExpo;
  var timeFn = typeof window.performance === 'undefined' ?
    Date.now : performance.now.bind(performance);

  var scroll = {
    x0:   0, // starting x position
    x1:   0, // ending x position
    xc:   0, // delta-x during scroll
    tx:   0, // delta-t
    txo:  0, // last time measurement
    dx:   0, // x-duration
    y0:   0,
    y1:   0,
    yc:   0,
    ty:   0,
    tyo:  0,
    dy:   0
  };

  scrollYFunction = function() {
    var delta = easeFn(scroll.ty, scroll.y0, scroll.y1 - scroll.y0, scroll.dy);
    var time = timeFn();
    scroll.yc = delta;
    scroll.ty += time - scroll.tyo;
    scroll.tyo = time;
    $.scrollTo($.scrollX, delta);
    if (scroll.ty <= scroll.dy) {
      animationYFrame = $.requestAnimationFrame(scrollYFunction);
    } else {
      $.cancelAnimationFrame(animationYFrame);
      $.scrollTo($.scrollX, scroll.y1);
      scroll.y0 = scroll.y1 = scroll.yc = scroll.ty = 0;
    }
  };

  scrollXFunction = function() {
    var delta = easeFn(scroll.tx, scroll.x0, scroll.x1 - scroll.x0, scroll.dx);
    var time = timeFn();
    scroll.xc = delta;
    scroll.tx += time - scroll.txo;
    scroll.txo = time;
    $.scrollTo(delta, $.scrollY);
    if (scroll.tx <= scroll.dx) {
      animationXFrame = $.requestAnimationFrame(scrollXFunction);
    } else {
      $.cancelAnimationFrame(animationXFrame);
      $.scrollTo(scroll.x1, $.scrollY);
      scroll.x0 = scroll.x1 = scroll.xc = scroll.tx = 0;
    }
  };

  $.setSmoothScrollEaseFN = function(fn) {
    easeFn = fn;
  };

  $.smoothScrollTo = function(x, y, d) {
    $.cancelAnimationFrame(animationXFrame);
    $.cancelAnimationFrame(animationYFrame);
    scroll.dx = scroll.dy = d;
    if (x !== $.scrollX) {
      scroll.x0 = $.scrollX;
      scroll.x1 = x;
      scroll.tx = 0;
      scroll.txo = timeFn();
      scrollXFunction();
    }
    if (y !== $.scrollY) {
      scroll.y0 = $.scrollY;
      scroll.y1 = y;
      scroll.ty = 0;
      scroll.tyo = timeFn();
      scrollYFunction();
    }
  };

  $.smoothScrollBy = function(x, y, d) {
    if (x) {
      var oldDx = scroll.x1 - scroll.xc;
      $.cancelAnimationFrame(animationXFrame);
      scroll.dx = d;
      scroll.x0 = $.scrollX;
      scroll.x1 = oldDx + scroll.x0 + x;
      scroll.tx = 0;
      scroll.txo = timeFn();
      scrollXFunction();
    }
    if (y) {
      var oldDy = scroll.y1 - scroll.yc;
      $.cancelAnimationFrame(animationYFrame);
      scroll.dy = d;
      scroll.y0 = $.scrollY;
      scroll.y1 = oldDy + scroll.y0 + y;
      scroll.ty = 0;
      scroll.tyo = timeFn();
      scrollYFunction();
    }
  };

})(this);

Scroll.scroll = function(type, repeats) {

  var stepSize = settings ? settings.scrollstep : 60;

  if (document.body) {
    this.lastPosition = [document.body.scrollLeft, document.body.scrollTop];
  }

  if (settings && settings.smoothscroll) {

    switch (type) {
      case 'down':
        window.smoothScrollBy(0, repeats * stepSize, settings.scrollduration);
        break;
      case 'up':
        window.smoothScrollBy(0, -repeats * stepSize, settings.scrollduration);
        break;
      case 'pageDown':
        window.smoothScrollBy(0, repeats * window.innerHeight / 2, settings.scrollduration);
        break;
      case 'fullPageDown':
        window.smoothScrollBy(0, repeats * window.innerHeight * (settings.fullpagescrollpercent / 100 || 1), settings.scrollduration);
        break;
      case 'pageUp':
        window.smoothScrollBy(0, -repeats * window.innerHeight / 2, settings.scrollduration);
        break;
      case 'fullPageUp':
        window.smoothScrollBy(0, -repeats * window.innerHeight * (settings.fullpagescrollpercent / 100 || 1), settings.scrollduration);
        break;
      case 'top':
        window.smoothScrollBy(0, -document.body.scrollTop, settings.scrollduration);
        break;
      case 'bottom':
        window.smoothScrollTo(window.scrollX, document.body.scrollHeight - document.documentElement.clientHeight, settings.scrollduration);
        break;
      case 'left':
        window.smoothScrollBy(repeats * -stepSize / 2, 0, settings.scrollduration);
        break;
      case 'right':
        window.smoothScrollBy(repeats * stepSize / 2, 0, settings.scrollduration);
        break;
      case 'leftmost':
        window.smoothScrollBy(-document.body.scrollLeft - 10, 0, settings.scrollduration);
        break;
      case 'rightmost':
        window.smoothScrollBy(document.body.scrollWidth - document.body.scrollLeft - window.innerWidth + 20, 0, settings.scrollduration);
        break;
      default:
        break;
    }

  } else {

    switch (type) {
      case 'down':
        scrollBy(0, repeats * stepSize);
        break;
      case 'up':
        scrollBy(0, -repeats * stepSize);
        break;
      case 'pageDown':
        scrollBy(0, repeats * window.innerHeight / 2);
        break;
      case 'fullPageDown':
        scrollBy(0, repeats * window.innerHeight * (settings.fullpagescrollpercent / 100 || 0.85));
        break;
      case 'pageUp':
        scrollBy(0, -repeats * window.innerHeight / 2);
        break;
      case 'fullPageUp':
        scrollBy(0, -repeats * window.innerHeight * (settings.fullpagescrollpercent / 100 || 0.85));
        break;
      case 'top':
        scrollTo(0, 0);
        break;
      case 'bottom':
        scrollTo(0, document.body.scrollHeight);
        break;
      case 'left':
        scrollBy(-repeats * stepSize, 0);
        break;
      case 'right':
        scrollBy(repeats * stepSize, 0);
        break;
      case 'leftmost':
        scrollTo(0, document.body.scrollTop);
        break;
      case 'rightmost':
        scrollTo(document.body.scrollWidth - document.documentElement.offsetWidth, document.body.scrollTop);
        break;
      default:
        break;
    }

  }

};
var Search = {};

Search.index = null;
Search.topSites = [];

Search.chromeUrls = ['accessibility', 'appcache-internals', 'apps', 'blob-internals', 'bookmarks', 'cache', 'chrome', 'chrome-urls', 'components', 'crashes', 'credits', 'devices', 'dns', 'downloads', 'extensions', 'flags', 'flash', 'gcm-internals', 'gpu', 'help', 'histograms', 'history', 'indexeddb-internals', 'inspect', 'invalidations', 'ipc', 'linux-proxy-config', 'media-internals', 'memory', 'memory-internals', 'nacl', 'net-internals', 'newtab', 'omnibox', 'plugins', 'policy', 'predictors', 'print', 'profiler', 'quota-internals', 'sandbox', 'serviceworker-internals', 'settings', 'signin-internals', 'stats', 'sync-internals', 'system', 'terms', 'tracing', 'translate-internals', 'user-actions', 'version', 'view-http-cache', 'webrtc-internals', 'webrtc-logs', 'crash', 'kill', 'hang', 'shorthang', 'gpuclean', 'gpucrash', 'gpuhang', 'ppapiflashcrash', 'ppapiflashhang', 'quit', 'restart'];

Search.chromeMatch = function(string, callback) {
  callback(searchArray(this.chromeUrls, string, settings.searchlimit, false));
};

Search.settingsMatch = function(string, callback) {
  callback(searchArray(this.settings, string.replace(/^no/, ''), settings.searchlimit, false));
};

Search.nextResult = function(reverse) {
  var i, l;
  if (!Command.dataElements.length) {
    if (Command.input.value.length) {
      return false;
    }
    return Command.complete('');
  }

  if (this.index === null) {
    if (!reverse) {
      this.index = 0;
    } else {
      this.index = Command.dataElements.length - 1;
    }
  } else {
    Command.dataElements[this.index].style.backgroundColor = '';
    Command.dataElements[this.index].style.color = '';
    spanElements = Command.dataElements[this.index].getElementsByTagName('span');
    for (i = 0, l = spanElements.length; i < l; ++i) {
      spanElements[i].style.color = '';
    }
    if (this.lastStyle) {
      spanElements[0].firstElementChild.style.color = this.lastStyle;
    }
    if (!reverse) {
      if (this.index + 1 < Command.dataElements.length) {
        this.index++;
      } else {
        this.index = null;
        Command.input.value = Command.typed || '';
        return;
      }
    } else {
      if (this.index === 0) {
        this.index = null;
        Command.input.value = Command.typed || '';
        return;
      } else {
        this.index--;
      }
    }
  }

  Command.dataElements[this.index].style.backgroundColor = '#fefefe';
  Command.dataElements[this.index].style.color = '#1b1d1e';
  spanElements = Command.dataElements[this.index].getElementsByTagName('span');
  l = spanElements.length;
  if (spanElements[0].childNodes.length === 2) {
    this.lastStyle = spanElements[0].firstElementChild.style.color;
  } else {
    delete this.lastStyle;
  }
  for (i = 0; i < l; ++i) {
    spanElements[i].style.color = '#1b1d1e';
  }
  switch (Command.completionResults[this.index][0]) {
    case 'chrome':
      Command.input.value = 'chrome://' + Command.completionResults[this.index][1];
      break;
    case 'bookmarks':
    case 'history':
    case 'topsites':
      Command.input.value = Command.input.value.match(/^\S+ /)[0] + Command.completionResults[this.index][2];
      break;
    case 'tabhistory':
      Command.input.value = 'tabhistory ' + Command.completionResults[this.index][1];
      break;
    case 'engines':
      Command.input.value = Command.input.value.match(/^\S+ /)[0] + Command.completionResults[this.index][1];
      break;
    case 'search':
      var value = Command.input.value.split(/\s+/).filter(function(e) { return e; });
      if (Command.completionResults[this.index].length === 3) {
        Command.input.value = value[0] + ' ' + Command.completionResults[this.index][2];
      } else {
        Command.input.value = value.slice(0, 2).join(' ') + ' ' + Command.completionResults[this.index][1];
      }
      break;
    case 'windows':
      Command.input.value = Command.input.value.match(/^\S+/)[0] + ' ' + Command.completionResults[this.index][1].replace(/ .*/, '');
      break;
    case 'chromesessions':
      Command.input.value = Command.input.value.match(/^\S+/)[0] + ' ' + Command.completionResults[this.index][3].replace(/ .*/, '');
      break;
    case 'sessions':
      Command.input.value = Command.input.value.match(/^\S+/)[0] + ' ' + Command.completionResults[this.index][1];
      break;
    case 'files':
      Command.input.value = Command.input.value.replace(/[^\/]+$/, '') + Command.completionResults[this.index][1];
      break;
    case 'settings':
      var command = Command.input.value.split(/\s+/);
      Command.input.value = command[0] + ' ' + (/^no/.test(command[1]) ? 'no' : '') + Command.completionResults[this.index][1];
      break;
    case 'paths':
      if (Command.completionResults[this.index][2] !== 'folder') {
        Command.input.value = 'bookmarks ' + Command.completionResults[this.index][2];
      } else {
        Command.input.value = 'bookmarks ' + Command.completionResults[this.index][3] + Command.completionResults[this.index][1];
      }
      break;
    case 'buffers':
      Command.input.value = Command.input.value.match(/^\S+/)[0] + ' ' + Command.completionResults[this.index][1][0];
      break;
    case 'complete':
      if (Command.completionResults[this.index][1] !== void 0) {
        Command.input.value = Command.completionResults[this.index][1];
      }
      break;
  }

};
var Frames = {
  focus: function() {
    window.focus();
    var outline = document.createElement('div');
    outline.id = 'cVim-frames-outline';
    document.body.appendChild(outline);
    window.setTimeout(function() {
      document.body.removeChild(outline);
    }, 500);
  },
  isVisible: function() {
    return document.body && window.innerWidth && window.innerHeight;
  },
  init: function(isRoot) {
    if (Frames.isVisible()) {
      RUNTIME('addFrame', {isRoot: isRoot}, function(index) {
        Frames.index = index;
      });
    }
  }
};

document.addEventListener('DOMContentLoaded', function() {
  Frames.init(self === top);
}, false);
}
