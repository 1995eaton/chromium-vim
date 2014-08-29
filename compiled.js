function init() {
var Hints = {};

Hints.matchPatterns = function(forward) {
  var pattern = new RegExp('^' + (forward ? settings.nextmatchpattern : settings.previousmatchpattern) + '$', 'gi');
  var nodeIterator = document.createNodeIterator(document.body, 4, null, false);
  var node;
  while (node = nodeIterator.nextNode()) {
    var localName = node.localName;
    if (/script|style|noscript/.test(localName)) {
      continue;
    }
    var nodeText = node.data.trim();
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
  this.linkPreview = false;
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

  if (Key.shiftKey && !this.shiftKeyInitiator) {
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
      chrome.runtime.sendMessage({action: 'openLinkTab', active: false, url: link.src, noconvert: true});
      break;
    case 'image':
    case 'multiimage':
      var url = googleReverseImage(link.src, null);
      if (url) {
        chrome.runtime.sendMessage({action: 'openLinkTab', active: false, url: url, noconvert: true});
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
      chrome.runtime.sendMessage({action: 'openLinkWindow', focused: false, url: link.href, noconvert: true});
      break;
    default:
      if (node === 'textarea' || (node === 'input' && /^(text|password|email|search)$/i.test(link.type)) ||
          link.getAttribute('contenteditable') === 'true') {
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
        chrome.runtime.sendMessage({action: 'openLinkTab', active: this.type === 'tabbedActive', url: link.href, noconvert: true});
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
            link.firstChild.deleteData(null, 1);
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
  if (this.linkPreview) {
    this.dispatchAction(this.linkArr[this.currentIndex][1]);
  }
  if (settings.numerichints || settings.hintcharacters.split('').indexOf(key.toLowerCase()) !== -1) {
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
      if (l.offsetLeft > linkLocation.left) {
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
      if (node.getAttribute('onclick') || node.getAttribute('tabindex') || node.getAttribute('aria-haspopup') || node.getAttribute('data-cmd') || node.getAttribute('jsaction')) {
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
  if (!Command.domElementsLoaded) {
    return false;
  }
  this.shiftKeyInitiator = Key.shiftKey;
  var links, main, frag, i, l;
  this.type = type;
  this.hideHints(true, multi);
  if (document.body && document.body.style) {
    Hints.documentZoom = +document.body.style.zoom || 1;
  } else {
    Hints.documentZoom = 1;
  }
  Hints.linkElementBase = document.createElement('div');
  Hints.linkElementBase.cVim = true;
  Hints.linkElementBase.className = 'cVim-link-hint';
  links = this.getLinks();
  if (type && type.indexOf('multi') !== -1) {
    this.multi = true;
  } else {
    this.multi = false;
  }
  if (this.linkArr.length === 0) {
    return this.hideHints();
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
    this.permutations = this.genHints(this.linkArr.length);
    for (i = this.linkArr.length - 1; i >= 0; --i) {
      this.linkArr[i][0].textContent = this.permutations[i];
      frag.appendChild(this.linkArr[i][0]);
    }
  } else {
    this.linkArr = this.linkArr.sort(function(a, b) {
      return a[0] - b[0];
    }).map(function(e) {
      return e.slice(1);
    });
    for (i = 0, l = this.linkArr.length; i < l; ++i) {
      this.linkArr[i][0].textContent = (i + 1).toString() + (this.linkArr[i][3] ? ': ' + this.linkArr[i][3] : '');
      frag.appendChild(this.linkArr[i][0]);
    }
  }

  main.appendChild(frag);
  main.style.opacity = '1';
};
window.log = console.log.bind(console);

window.cVimError = function(message) {
  console.error(message);
};

window.definePrototype = function(obj, name, fn) {
  Object.defineProperty(obj.prototype, name, {
    enumerable: false,
    configurable: false,
    writeable: false,
    value: fn
  });
};

window.httpRequest = function(request) {
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

window.isValidB64 = function(a) {
  try {
    window.atob(a);
  } catch(e) {
    return false;
  }
  return true;
};

window.reverseImagePost = function(url) {
  return '<html><head><title>cVim reverse image search</title></head><body><form id="f" method="POST" action="https://www.google.com/searchbyimage/upload" enctype="multipart/form-data"><input type="hidden" name="image_content" value="' + url.substring(url.indexOf(',') + 1).replace(/\+/g, '-').replace(/\//g, '_').replace(/\./g, '=') + '"><input type="hidden" name="filename" value=""><input type="hidden" name="image_url" value=""><input type="hidden" name="sbisrc" value=""></form><script>document.getElementById("f").submit();\x3c/script></body></html>';
};

// Based off of the 'Search by Image' Chrome Extension by Google
window.googleReverseImage = function(url, source) {
  if (void 0 !== url && url.indexOf('data:') === 0) {
    if (url.search(/data:image\/(bmp|gif|jpe?g|png|webp|tiff|x-ico)/i) === 0) {
      var commaIndex = url.indexOf(',');
      if (commaIndex !== -1 && isValidB64(url.substring(commaIndex + 1))) {
        return 'data:text/html;charset=utf-8;base64,' + window.btoa(reverseImagePost(url, source));
      }
    }
  } else {
    if (url.indexOf('file://') === 0 || url.indexOf('chrome') === 0) {
      chrome.runtime.sendMessage({action: 'urlToBase64', url: url});
      return;
    }
    return 'https://www.google.com/searchbyimage?image_url=' + url;
  }
};

// ------------ End reverse image

window.getVisibleBoundingRect = function(node) {
  var boundingRect = node.getClientRects()[0] || node.getBoundingClientRect();
  if (boundingRect.top > window.innerHeight || boundingRect.left > window.innerWidth) {
    return false;
  }
  if (boundingRect.width === 1 || boundingRect.height === 1) {
    return false;
  }
  if (boundingRect.width === 0 || boundingRect.height === 0) {
    var children = node.children;
    var visibleChildNode = false;
    for (var i = 0, l = children.length; i < l; ++i) {
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

window.isVisible = function(element) {
  return element.offsetParent && !element.disabled &&
    element.getAttribute('type') !== 'hidden' &&
    getComputedStyle(element).visibility !== 'hidden' &&
    element.getAttribute('display') !== 'none';
};

definePrototype(HTMLElement, 'isInput', function() {
  return (
    (this.localName === 'textarea' || this.localName === 'input' || this.getAttribute('contenteditable') === 'true') && !this.disabled &&
    !/button|radio|file|image|checkbox|submit/i.test(this.getAttribute('type'))
  );
});

window.simulateMouseEvents = function(element, events) {
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

window.matchLocation = function(url, pattern) { // Uses @match syntax
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

window.sameType = function(a, b) {
  return a.constructor === b.constructor;
};

window.waitForLoad = function(callback, constructor) {
  if ((document.readyState === 'interactive' || document.readyState === 'complete') && document.activeElement) {
    return callback.call(constructor);
  }
  window.setTimeout(function() {
    waitForLoad(callback, constructor);
  }, 5);
};

window.decodeHTMLEntities = function(string) {
  var el = document.createElement('div');
  el.innerHTML = string;
  return el.textContent;
};

window.searchArray = function(array, search, limit, useRegex, fn) {
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
var Marks = {};
Marks.bookmarks = [];
Marks.quickMarks = {};
Marks.currentBookmarks = [];
Marks.files = [];

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
  chrome.runtime.sendMessage({action: 'updateMarks', marks: this.quickMarks});
};

Marks.openQuickMark = function(ch, tabbed, repeats) {
  if (!this.quickMarks.hasOwnProperty(ch)) {
    return Status.setMessage('mark not set', 1, 'error');
  }
  if (tabbed) {
    if (repeats !== 1) {
      if (this.quickMarks[ch][repeats - 1]) {
        chrome.runtime.sendMessage({action: 'openLinkTab', url: this.quickMarks[ch][repeats - 1]});
      } else {
        chrome.runtime.sendMessage({action: 'openLinkTab', url: this.quickMarks[ch][0]});
      }
    } else {
      for (var i = 0, l = this.quickMarks[ch].length; i < l; ++i) {
        chrome.runtime.sendMessage({action: 'openLinkTab', url: this.quickMarks[ch][i]});
      }
    }
  } else {
    if (this.quickMarks[ch][repeats - 1]) {
      chrome.runtime.sendMessage({
        action: 'openLink',
        tab: {
          pinned: false
        },
        url: this.quickMarks[ch][repeats - 1]
      });
    } else {
      chrome.runtime.sendMessage({
        action: 'openLink',
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

Marks.matchPath = function(path) {
  port.postMessage({action: 'getBookmarkPath', path: path});
};
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
    } else if (typeof codeMap[event.which.toString()] === 'string') {
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

      // Modifier keys C-A-S-M
      if ([16,17,18,91,123].indexOf(event.which) !== -1) {
        return true;
      }

      if (Hints.active || Visual.caretModeActive || Visual.visualModeActive) {
        event.preventDefault();
        event.stopPropagation();
      }

      // Don't let the keypress listener attempt to parse the key event
      // if it contains a modifier (or asciiKey that should be parsed by the parseKeyDown function
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
      } else if (commandMode || (!insertMode && document.getSelection().type === 'None' &&
                 Mappings.matchesMapping(Mappings.queue + KeyEvents.keyhandle(event, 'keydown'))))
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
          keypressTriggered = true;
          callback(KeyEvents.keyhandle(event, 'keypress'), event);
        }
      });
      window.addEventListener('keypress', boundMethod, true);

      // Wait for the keypress listener to find a match
      window.setTimeout(function() {
        window.removeEventListener('keypress', boundMethod, true);
        if (!keypressTriggered) { // keypress match wasn't found
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

var Key = {};

Key.down = function(asciiKey, e) {

  var escapeKey, isInput;
  Key.shiftKey = e.shiftKey;

  if (Hints.active) {
    e.stopPropagation();
    if (e.which === 18) {
      return Hints.changeFocus();
    } else if (e.which === 191) {
      e.preventDefault();
      return document.getElementById('cVim-link-container').style.opacity = '0';
    }
  }

  if (Hints.keyDelay) {
    e.stopPropagation();
    return e.preventDefault();
  }

  if (Cursor.overlay && settings.autohidecursor) {
    Cursor.overlay.style.display = 'block';
    Cursor.wiggleWindow();
  }

  if (Command.active && document.activeElement && document.activeElement.id === 'cVim-command-bar-input') {
    e.stopPropagation();
  }

  escapeKey = asciiKey === '<Esc>' || asciiKey === '<C-[>';

  if (Visual.caretModeActive || Visual.visualModeActive) {
    e.stopPropagation();
    Visual.selection = document.getSelection();
    if (e.which === 8) {
      e.preventDefault();
    }
    if (escapeKey) {
      Visual.lineMode = false;
      if (Visual.visualModeActive === false) {
        return Visual.exit();
      }
      Visual.visualModeActive = false;
      HUD.setMessage(' -- CARET -- ');
      Visual.collapse();
    }
    return Visual.action(asciiKey.replace(/^<BS>$/, 'h').replace(/^<Space>$/, 'l'));
  }

  if (escapeKey) {
    return Mappings.handleEscapeKey();
  }

  if (insertMode) {
    return false;
  }

  if (!commandMode && Mappings.actions.inputFocused && e.which === 9) { // When <Tab> or <S-Tab> is pressed in 'gi' mode
    if (document.activeElement && (!document.activeElement.isInput() || !Mappings.actions.inputElements.length)) {
      return Mappings.actions.inputFocused = false;
    }
    e.preventDefault();
    e.stopPropagation();
    Mappings.actions.inputElementsIndex = ((e.shiftKey ? -1 : 1) + Mappings.actions.inputElementsIndex).mod(Mappings.actions.inputElements.length);
    Mappings.actions.inputElements[Mappings.actions.inputElementsIndex].focus();
    if (Mappings.actions.inputElements[Mappings.actions.inputElementsIndex].getAttribute('readonly')) {
      Mappings.actions.inputElements[Mappings.actions.inputElementsIndex].select();
    }
    return;
  }

  isInput = document.activeElement && document.activeElement.isInput();

  if (!isInput) {
    if (Mappings.queue.length) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (Mappings.convertToAction(asciiKey)) {
      e.preventDefault();
      return e.stopPropagation();
    }
  }

  if (commandMode && document.activeElement.id === 'cVim-command-bar-input') {
    switch (asciiKey) {
      case '<Tab>': // Tab navigation/completion
      case '<S-Tab>':
        if (Command.type === 'action') {
          e.preventDefault();
          Mappings.actions[ (asciiKey === '<Tab>' ? 'next' : 'previous') + 'CompletionResult' ]();
        }
        break;
      case '<C-p>':
        if (Command.type === 'action' && settings.cncpcompletion) {
          e.preventDefault();
          Mappings.actions.previousCompletionResult();
        }
        return;

      case '<Up>': // Command history navigation/search
      case '<Down>':
        e.preventDefault();
        Command.history.cycle(Command.type, (asciiKey === '<Up>'));
        break;

      case '<Enter>':
      case '<C-Enter>':
        e.preventDefault();
        document.activeElement.blur();

        if (!(Command.history[Command.type].length > 0 && Command.history[Command.type].slice(-1)[0] === Command.input.value)) {
          Command.history[Command.type].push(Command.input.value);
          chrome.runtime.sendMessage({
            action: 'appendHistory',
            value: Command.input.value,
            type: Command.type
          });
        }

        if (Command.type === 'action') {
          var inputValue = Command.input.value + (e.ctrlKey ? '&!' : '');
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
              reverse: asciiKey === '<C-Enter>',
              saveSearch: true
            });
          }
        }

        Command.hide();
        Find.index = Command.modeIdentifier.textContent === '/' ? -1 : 1;
        Find.setIndex();
        Find.search(Command.modeIdentifier.textContent === '?', 1, true);
        port.postMessage({
          action: 'updateLastSearch',
          value: Find.lastSearch
        });
        break;
      default:
        if (asciiKey === '<BS>' && Command.input.value.length === 0) {
          Command.hide();
          e.preventDefault();
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
    Mappings.insertCommand(asciiKey, function() {
      e.preventDefault();
      if (document.activeElement.id === 'cVim-command-bar-input' && Command.type !== 'search') {
        window.setTimeout(function() {
          Command.complete(Command.input.value);
        }, 0);
      }
    });
  }

};

Key.up = function(e) {
  if ((document.activeElement && document.activeElement.id === 'cVim-command-bar-input') || (!insertMode && Mappings.queue.length && Mappings.validMatch)) {
    e.stopPropagation();
    e.preventDefault();
  }
  if (Hints.active && e.which === 191) {
    document.getElementById('cVim-link-container').style.opacity = '1';
  }
  if (Hints.active && e.which === 16 && Hints.linkPreview) {
    Hints.hideHints(false);
  }
};

Key.listener = new KeyListener(Key.down);

removeListeners = function() {
  Key.listenersActive = false;
  document.removeEventListener('keyup', Key.up, true);
  Key.listener.deactivate();
};

addListeners = function() {
  if (Key.listenersActive) {
    removeListeners();
  }
  Key.listenersActive = true;
  document.addEventListener('keyup', Key.up, true);
  Key.listener.activate();
};

addListeners();

Key.toggleCvim = function(key) {
  if (Mappings.toggleCvim.indexOf(key) !== -1) {
    chrome.runtime.sendMessage({action: 'toggleEnabled'});
  } else if (Mappings.toggleBlacklisted.indexOf(key) !== -1) {
    chrome.runtime.sendMessage({action: 'toggleBlacklisted'});
    chrome.runtime.sendMessage({
      action: 'toggleEnabled',
      singleTab: true,
      blacklisted: Key.listenersActive === true
    });
  }
};

document.addEventListener('DOMContentLoaded', function() {
  var toggleListener = new KeyListener(Key.toggleCvim);
  toggleListener.activate();
});

window.addEventListener('DOMContentLoaded', function() {
  if (self === top) {
    chrome.runtime.sendMessage({action: 'isNewInstall'}, function(message) {
      if (message) {
        alert(message);
      }
    });
  }
});
var Clipboard = {};
Clipboard.store = '';

Clipboard.copy = function(text, store) {
  if (!store) {
    this.store = text;
  } else {
    this.store += (this.store.length ? '\n' : '') + text;
  }
  chrome.runtime.sendMessage({action: 'copy', text: this.store});
};

Clipboard.paste = function(tabbed) {
  return chrome.runtime.sendMessage({action: (tabbed ? 'openPasteTab' : 'openPaste')});
};
var GitHub, Complete = {}, GitHubCache = {};

Complete.engines = ['google', 'wikipedia', 'youtube', 'imdb', 'amazon', 'google-maps', 'github', 'wolframalpha', 'google-image', 'ebay', 'webster', 'wictionary', 'urbandictionary', 'duckduckgo', 'answers', 'google-trends', 'google-finance', 'yahoo', 'bing'];

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
  github:         'https://github.com/search?q=',
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
  github:         'https://github.com/',
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
  google:         'https://www.google.com/complete/search?client=firefox&hl=en&q=%s',
  github:         '',
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
    if (input[0] === 'github') {
      return GitHub.parseInput(input.slice(1));
    }
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
    callback(response[1]);
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

GitHub = {
  parseInput: function(input) {
    if (input.length === 1) {
      return 'https://github.com/' + input[0].slice(1);
    }
    return Complete.requestUrls.github + encodeURIComponent(input.join(' '));
  }
};

Complete.github = function(query, callback) {
  var users = 'https://github.com/command_bar/users?q=%s',
      repos = 'https://github.com/command_bar/repos_for/%s';
  // paths = 'https://github.com/command_bar/%user/%repository/paths/%branchname?sha=1&q=';
  if (query.length <= 1) {
    return callback([['@&lt;USER&gt;/&lt;REPOSITORY&gt;', 'github @']]);
  }
  if (/^@[a-zA-Z_\-0-9]+$/.test(query)) {
    httpRequest({
      url: users.embedString(encodeURIComponent(query.slice(1))),
      json: true
    }).then(function(response) {
      return callback(response.results.map(function(e) {
        return [e.command];
      }));
    }, cVimError);
  } else if (/^@[a-zA-Z_\-0-9]+\/[^ ]*$/.test(query)) {

    var slashPosition = query.indexOf('/');

    if (GitHubCache[query.slice(1, slashPosition)] === void 0) {
      httpRequest({
        url: repos.embedString(encodeURIComponent(query.slice(1, -1))),
        json: true
      }).then(function(response) {
        GitHubCache[query.slice(1, slashPosition)] = response.results.map(function(e) {
          return ['@' + e.command];
        });
        return callback(GitHubCache[query.slice(1, slashPosition)]);
      }, cVimError);
    } else {
      return callback(GitHubCache[query.slice(1, slashPosition)].filter(function(e) {
        return e[0].indexOf(query) === 0;
      }));
    }

  }
};
var Mappings = {
  repeats: '',
  queue: '',
  siteSpecificBlacklists: ''
};

Mappings.actions = {

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
    chrome.runtime.sendMessage({action: 'cancelAllWebRequests'});
  },
  percentScroll: function(repeats) {
    if (Mappings.repeats === '0' || Mappings.repeats === '') {
      repeats = 0;
    }
    document.body.scrollTop =
      (document.body.scrollHeight - window.innerHeight) * repeats / 100;
  },
  goToTab: function(repeats) {
    chrome.runtime.sendMessage({action: 'goToTab', index: repeats - 1});
  },
  hideDownloadsShelf: function() {
    chrome.runtime.sendMessage({action: 'hideDownloadsShelf'});
  },
  goToRootUrl: function() {
    if (window.location.pathname.length !== 0 && window.location.pathname !== '/') {
      chrome.runtime.sendMessage({
        action: 'openLink',
        tab: {
          pinned: false
        },
        url: window.location.origin
      });
    }
  },
  goUpUrl: function(repeats) {
    var rxp = new RegExp('(\/([^\/])+){0,' + repeats + '}(\/)?$');
    if (window.location.pathname.length !== 0 && window.location.pathname !== '/') {
      var match = window.location.pathname.replace(rxp, '');
      if (match !== window.location.pathname) {
        chrome.runtime.sendMessage({
          action: 'openLink',
          tab: {
            pinned: false
          },
          url: window.location.origin + match
        });
      }
    }
  },
  nextFrame: function(repeats) {
    chrome.runtime.sendMessage({action: 'focusFrame', repeats: repeats});
  },
  rootFrame: function() {
    chrome.runtime.sendMessage({action: 'focusFrame', isRoot: true});
  },
  closeTab: function(repeats) {
    chrome.runtime.sendMessage({action: 'closeTab', repeats: repeats});
  },
  closeTabLeft: function() {
    chrome.runtime.sendMessage({action: 'closeTabLeft'});
  },
  closeTabRight: function() {
    chrome.runtime.sendMessage({action: 'closeTabRight'});
  },
  closeTabsToLeft: function() {
    chrome.runtime.sendMessage({action: 'closeTabsToLeft'});
  },
  closeTabsToRight: function() {
    chrome.runtime.sendMessage({action: 'closeTabsToRight'});
  },
  pinTab: function() {
    chrome.runtime.sendMessage({action: 'pinTab'});
  },
  firstTab: function() {
    chrome.runtime.sendMessage({action: 'firstTab'});
  },
  lastTab: function() {
    chrome.runtime.sendMessage({action: 'lastTab'});
  },
  lastClosedTab: function() {
    chrome.runtime.sendMessage({action: 'openLast'});
  },
  moveTabRight: function(repeats) {
    chrome.runtime.sendMessage({action: 'moveTabRight', repeats: repeats});
  },
  moveTabLeft: function(repeats) {
    chrome.runtime.sendMessage({action: 'moveTabLeft', repeats: repeats});
  },
  lastActiveTab: function() {
    chrome.runtime.sendMessage({action: 'lastActiveTab'});
  },
  reverseImage: function() {
    if (/\(\d+×\d+\)$/.test(document.title) === true && document.body.firstChild.localName === 'img') {
      if (document.body.firstChild.src) {
        return chrome.runtime.sendMessage({
          action: 'openLinkTab',
          active: false,
          url: 'https://www.google.com/searchbyimage?image_url=' +
                document.body.firstChild.src,
          noconvert: true
        });
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
  toggleImages: function() {
    if (!this.imagesDisabled) {
      this.images = [];
      var walker = document.createTreeWalker(document.body, 1, false, null);
      var el;
      while (el = walker.nextNode()) {
        var computedStyle = getComputedStyle(el, null);
        if (el.localName === 'img' || computedStyle.getPropertyValue('background-image') !== 'none') {
          var opacity = computedStyle.getPropertyValue('opacity');
          var bimg = computedStyle.getPropertyValue('background-image');
          if (opacity === '1') {
            opacity = null;
          }
          if (bimg === 'none') {
            bimg = null;
          }
          this.images.push([opacity, bimg, el]);
        }
      }
    }
    this.imagesDisabled = (this.imagesDisabled === void 0 ? true : !this.imagesDisabled);
    for (i = 0, l = this.images.length; i < l; ++i) {
      if (this.images[i][2].localName === 'img') {
        this.images[i][2].style.opacity = (this.imagesDisabled ? '0' : this.images[i][1]);
      }
      if (this.images[i][1] !== null) {
        if (this.imagesDisabled) {
          this.images[i][2].style.backgroundImage = 'none';
        } else {
          this.images[i][2].style.backgroundImage = this.images[i][1];
        }
      }
    }
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
    document.body.style.zoom =
      (+document.body.style.zoom ? parseFloat(document.body.style.zoom) : 1) + 0.1 * repeats;
  },
  zoomPageOut: function(repeats) {
    document.body.style.zoom =
      (+document.body.style.zoom ? parseFloat(document.body.style.zoom) : 1) - 0.1 * repeats;
  },
  zoomOrig: function() {
    document.body.style.zoom = '1';
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
    chrome.runtime.sendMessage({
      action: 'openLastLinkInTab',
      repeats: repeats
    });
  },
  openNextLinkInTab: function(repeats) {
    chrome.runtime.sendMessage({
      action: 'openNextLinkInTab',
      repeats: repeats
    });
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
  goToMark: function(repeats, queue) {
    var key = queue.slice(-1);
    if (Scroll.positions.hasOwnProperty(key)) {
      Scroll.lastPosition = [document.body.scrollLeft, document.body.scrollTop];
      window.scrollTo.apply(null, Scroll.positions[key]);
    } else {
      Status.setMessage('Mark not set', 1, 'error');
    }
  },
  setMark: function(repeats, queue) {
    Scroll.positions[queue.slice(-1)] = [document.body.scrollLeft, document.body.scrollTop];
  },
  createHint: function() {
    window.setTimeout(function() {
      Hints.create();
    }, 0);
  },
  createTabbedHint: function() {
    window.setTimeout(function() {
      Hints.create('tabbed');
    }, 0);
  },
  createActiveTabbedHint: function() {
    window.setTimeout(function() {
      Hints.create('tabbedActive');
    }, 0);
  },
  createMultiHint: function() {
    window.setTimeout(function() {
      Hints.create('multi');
    }, 0);
  },
  createHintWindow: function() {
    window.setTimeout(function() {
      Hints.create('window');
    }, 0);
  },
  createHoverHint: function() {
    window.setTimeout(function() {
      Hints.create('hover');
    }, 0);
  },
  createUnhoverHint: function() {
    window.setTimeout(function() {
      Hints.create('unhover');
    }, 0);
  },
  yankUrl: function() {
    window.setTimeout(function() {
      Hints.create('yank');
    }, 0);
  },
  multiYankUrl: function() {
    window.setTimeout(function() {
      Hints.create('multiyank');
    }, 0);
  },
  fullImageHint: function() {
    window.setTimeout(function() {
      Hints.create('fullimage');
    }, 0);
  },
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
  addQuickMark: function(repeats, queue) {
    Marks.addQuickMark(queue.slice(-1));
  },
  openQuickMark: function(repeats, queue) {
    Marks.openQuickMark(queue.slice(-1), false, repeats);
  },
  openQuickMarkTabbed: function(repeats, queue) {
    Marks.openQuickMark(queue.slice(-1), true, repeats);
  },
  insertMode: function() {
    if (Command.domElementsLoaded) {
      HUD.display(' -- INSERT -- ');
      insertMode = true;
    }
  },
  reloadTab: function() {
    chrome.runtime.sendMessage({action: 'reloadTab', nocache: false});
  },
  reloadTabUncached: function() {
    chrome.runtime.sendMessage({action: 'reloadTab', nocache: true});
  },
  reloadAllButCurrent: function() {
    chrome.runtime.sendMessage({action: 'reloadAllTabs', nocache: false, current: false});
  },
  reloadAllTabs: function() {
    chrome.runtime.sendMessage({action: 'reloadAllTabs', nocache: false, current: true});
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
    chrome.runtime.sendMessage({action: 'nextTab', repeats: r});
  },
  previousTab: function(r) {
    chrome.runtime.sendMessage({action: 'previousTab', repeats: r});
  },
  goBack: function(repeats) {
    history.go(-1 * repeats);
  },
  goForward: function(repeats) {
    history.go(1 * repeats);
  },
  goToSource: function() {
    chrome.runtime.sendMessage({
      action: 'openLinkTab',
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
    var allInput = document.querySelectorAll('input,textarea'),
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
    document.activeElement.select();
    if (!document.activeElement.getAttribute('readonly')) {
      document.getSelection().collapseToEnd();
    }
  },
  shortCuts: function(s, repeats) {
    if (!Command.domElementsLoaded) {
      return false;
    }
    for (var i = 0, l = Mappings.shortCuts.length; i < l; i++) {
      if (s === Mappings.shortCuts[i][0]) {
        commandMode = true;
        return window.setTimeout(function() {
          Command.show(false,
            Mappings.shortCuts[i][1]
                    .replace(/^:/, '')
                    .replace(/<cr>(\s+)?$/i, '')
                    .replace(/<space>/ig, ' ')
          );
          this.queue = '';
          this.repeats = '';
          if (/<cr>(\s+)?$/i.test(Mappings.shortCuts[i][1])) {
            var inputValue = Command.input.value;
            Command.hide(function() {
              Command.execute(inputValue, repeats);
            });
          } else {
            Command.complete(Command.input.value);
          }
        }, 0);
      }
    }
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
  }

};

Mappings.shortCuts = [
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
  ['ge', ':chrome://extensions!<cr>']
];

Mappings.defaults = {
  closeTab:                ['x'],
  closeTabLeft:            ['gxT'],
  closeTabRight:           ['gxt'],
  closeTabsToLeft:         ['gx0'],
  closeTabsToRight:        ['gx$'],
  scrollDown:              ['s', 'j'],
  scrollUp:                ['w', 'k'],
  scrollPageUp:            ['e', 'u'],
  scrollFullPageUp:        [],
  scrollPageDown:          ['d'],
  scrollFullPageDown:      [],
  scrollToTop:             ['gg'],
  scrollToBottom:          ['G'],
  scrollLeft:              ['h'],
  scrollRight:             ['l'],
  scrollToLeft:            ['0'],
  scrollToRight:           ['$'],
  insertMode:              ['i'],
  reloadTab:               ['r'],
  reloadAllTabs:           [],
  reloadAllButCurrent:     ['cr'],
  reloadTabUncached:       ['gR'],
  createHint:              ['f'],
  createMultiHint:         ['mf'],
  nextMatchPattern:        [']]'],
  previousMatchPattern:    ['[['],
  createHintWindow:        ['W'],
  pinTab:                  ['gp'],
  moveTabRight:            ['>'],
  moveTabLeft:             ['<'],
  toggleCvim:              ['<A-z>'],
  goBack:                  ['H', 'S'],
  fullImageHint:           [],
  reverseImage:            ['gr'],
  multiReverseImage:       ['mr'],
  goForward:               ['L', 'D'],
  firstTab:                ['g0'],
  addQuickMark:            ['M*'],
  openLastHint:            ['A'],
  openQuickMark:           ['go*'],
  openQuickMarkTabbed:     ['gn*'],
  cancelWebRequest:        ['gq'],
  openLastLinkInTab:       ['<C-S-h>', 'gh'],
  openNextLinkInTab:       ['<C-S-l>', 'gl'],
  cancelAllWebRequests:    ['gQ'],
  createHoverHint:         ['q'],
  toggleImages:            ['ci'],
  createUnhoverHint:       ['Q'],
  lastTab:                 ['g$'],
  lastClosedTab:           ['X'],
  hideDownloadsShelf:      ['gj'],
  createTabbedHint:        ['F'],
  createActiveTabbedHint:  [],
  goToInput:               ['gi'],
  goToLastInput:           ['gI'],
  nextTab:                 ['K', 'R', 'gt'],
  nextFrame:               ['gf'],
  rootFrame:               ['gF'],
  lastActiveTab:           ['g\''],
  percentScroll:           ['g%'],
  goToTab:                 ['%'],
  toggleImageZoom:         ['z<Enter>'],
  zoomPageIn:              ['zi'],
  zoomPageOut:             ['zo'],
  zoomOrig:                ['z0'],
  lastScrollPosition:      ['\'\''],
  goToMark:                ['\'*'],
  setMark:                 [';*'],
  toggleBlacklisted:       [],
  centerMatchT:            ['zt'],
  centerMatchB:            ['zb'],
  centerMatchH:            ['zz'],
  goToSource:              ['gs'],
  goToRootUrl:             ['gU'],
  goUpUrl:                 ['gu'],
  yankUrl:                 ['gy'],
  multiYankUrl:            ['my'],
  yankDocumentUrl:         ['yy'],
  openPaste:               ['p'],
  toggleVisualMode:        ['v'],
  toggleVisualLineMode:    ['V'],
  openPasteTab:            ['P'],
  previousTab:             ['J', 'E', 'gT'],
  nextSearchResult:        ['n'],
  previousSearchResult:    ['N'],
  openSearchBar:           ['/'],
  openSearchBarReverse:    ['?'],
  openCommandBar:          [':'],
  shortCuts:               []
};

Mappings.toggleCvim = [];
Mappings.toggleBlacklisted = [];
Mappings.defaultsClone = Object.clone(Mappings.defaults);
Mappings.shortCutsClone = Object.clone(Mappings.shortCuts);

Mappings.insertDefaults = {
  deleteWord:        ['<C-y>'],
  deleteForwardWord: ['<C-p>'],
  beginningOfLine:   ['<C-a>'],
  editWithVim:       ['<C-i>'],
  endOfLine:         ['<C-e>'],
  deleteToBeginning: ['<C-u>'],
  deleteToEnd:       ['<C-o>'],
  forwardChar:       ['<C-f>'],
  backwardChar:      ['<C-b>'],
  forwardWord:       ['<C-l>'],
  backwardWord:      ['<C-h>']
};

Mappings.insertFunctions = {
  editWithVim: function() {
    if (this.externalVimReq) {
      this.externalVimReq.abort();
    }
    this.externalVimReq = new XMLHttpRequest();
    var textbox = document.activeElement;
    this.externalVimReq.open('POST', 'http://127.0.0.1:8001');
    this.externalVimReq.onreadystatechange = function() {
      if (this.readyState === 4 && this.status === 200) {
        textbox.value = this.responseText.replace(/\n$/, ''); // Avoid ending newline
      }
    };
    this.externalVimReq.send(textbox.value);
  },
  deleteWord: function() {
    var activeElement = document.activeElement,
        left = activeElement.value.slice(0, activeElement.selectionStart),
        right = activeElement.value.slice(activeElement.selectionStart);
    if (activeElement.id === 'cVim-command-bar-input') {
      left = left.replace(/[^\/ ]*\/*\s*$/, '');
    } else {
      left = left.replace(/([a-zA-Z0-9_]+|[^a-zA-Z0-9\s]+)+[\n ]*$/, '');
    }
    activeElement.value = left + right;
    activeElement.selectionStart -= activeElement.value.length - left.length;
    activeElement.selectionEnd = activeElement.selectionStart;
    return true;
  },
  beginningOfLine: function() {
    document.activeElement.selectionStart = 0;
    document.activeElement.selectionEnd = 0;
    return true;
  },
  endOfLine: function() {
    document.activeElement.selectionStart = document.activeElement.value.length;
    document.activeElement.selectionEnd = document.activeElement.selectionStart;
    return true;
  },
  deleteToBeginning: function() {
    document.activeElement.value =
      document.activeElement.value.slice(document.activeElement.selectionStart - 1, -1);
    document.activeElement.selectionStart = 0;
    document.activeElement.selectionEnd = 0;
    return true;
  },
  deleteToEnd: function() {
    document.activeElement.value =
      document.activeElement.value.substring(0, document.activeElement.selectionStart);
    return true;
  },
  forwardChar: function() {
    document.activeElement.selectionStart += 1;
    return true;
  },
  backwardChar: function() {
    document.activeElement.selectionStart -= 1;
    document.activeElement.selectionEnd -= 1;
    return true;
  },
  forwardWord: function() {
    var aval = (document.activeElement.value + ' ').slice(document.activeElement.selectionStart, -1);
    var diff = aval.length - aval.replace(/^([a-zA-Z_]+|[^a-zA-Z\s]+)[\s\n]*/, '').length;
    if (diff === 0) {
      document.activeElement.selectionStart = document.activeElement.value.length;
    } else {
      document.activeElement.selectionStart += diff;
    }
    return true;
  },
  backwardWord: function() {
    var aval = document.activeElement.value.slice(0, document.activeElement.selectionStart);
    var diff = aval.length - aval.replace(/([a-zA-Z_]+|[^a-zA-Z\s]+)[\s\n]*$/, '').length;
    document.activeElement.selectionStart -= diff;
    document.activeElement.selectionEnd -= diff;
    return true;
  },
  deleteForwardWord: function() {
    var start = document.activeElement.selectionStart;
    var end = document.activeElement.selectionEnd;
    if (start !== end) {
      return false;
    }
    var s = document.activeElement.value.slice(0, start);
    var e = document.activeElement.value.slice(start);
    e = e.replace(/^([a-zA-Z_]+|\s+|[^\s\na-zA-Z]+)(\s+)?/, '');
    document.activeElement.value = s + e;
    document.activeElement.selectionStart = s.length;
    document.activeElement.selectionEnd = s.length;
    return true;
  }
};

Mappings.getInsertFunction = function(modifier, callback) {
  var validMapping = false;
  for (var key in this.insertDefaults) {
    if (typeof this.insertDefaults[key] !== 'object') {
      continue;
    }
    this.insertDefaults[key].forEach(function(item) {
      if (!validMapping && modifier === item) {
        validMapping = true;
        callback(key);
      }
    });
    if (validMapping) {
      break;
    }
  }
};

Mappings.insertCommand = function(modifier, callback) {
  this.getInsertFunction(modifier, function(func) {
    if (func && document.activeElement.hasOwnProperty('value')) {
      callback(Mappings.insertFunctions[func]());
    }
  });
};

Mappings.removeMapping = function(list, mapping) {
  for (var key in list) {
    if (Array.isArray(list[key])) {
      while (list[key].indexOf(mapping) !== -1) {
        list[key].splice(list[key].indexOf(mapping), 1);
      }
    }
  }
};

Mappings.indexFromKeybinding = function(keybinding) {
  for (var key in this.defaults) {
    if (Array.isArray(this.defaults[key]) && this.defaults[key].indexOf(keybinding) !== -1) {
      return key;
    }
  }
  return null;
};

Mappings.parseCustom = function(config) {
  config += this.siteSpecificBlacklists;
  config = config.split(/\n+/).map(function(item) {
    return item.split(/ +/).compress();
  }).compress();
  config.forEach(function(mapping) {
    var key;
    if (mapping.length === 0) {
      return false;
    }
    if (!/^(imap|(re)?map|i?unmap(All)?)$/.test(mapping[0]) ||
        (mapping.length < 3 && /^((re)?map|imap)$/.test(mapping[0]))) {
      return false;
    }

    if (mapping.length === 1) {
      if (mapping[0] === 'unmapAll') {
        for (key in Mappings.defaults) {
          if (Array.isArray(Mappings.defaults[key])) {
            Mappings.defaults[key] = [];
          }
        }
        Mappings.shortCuts = [];
      } else if (mapping[0] === 'iunmapAll') {
        for (key in Mappings.insertDefaults) {
          if (Array.isArray(Mappings.insertDefaults[key])) {
            Mappings.insertDefaults[key] = [];
          }
        }
      }
      return;
    }

    if (mapping[0] === 'map' || mapping[0] === 'remap') {
      mapping[1] = mapping[1].replace(/<c(-s-)?/i, function(e) {
        return e.toUpperCase();
      }).replace(/<leader>/i, settings.mapleader);
      var fromKey = Mappings.indexFromKeybinding(mapping[2]);
      for (key in Mappings.defaults) {
        if (Array.isArray(Mappings.defaults[key])) {
          var match = Mappings.defaults[key].indexOf(mapping[1]);
          if (match !== -1) {
            Mappings.defaults[key].splice(match, 1);
          }
          if (fromKey !== null) {
            Mappings.defaults[fromKey].push(mapping[1]);
          }
        }
      }
      if (mapping[2][0] === ':') {
        return Mappings.shortCuts.push([mapping[1], mapping.slice(2).join(' ')]);
      }
      if (Object.keys(Mappings.defaults).indexOf(mapping[2]) !== -1) {
        return Mappings.defaults[mapping[2]].push(mapping[1]);
      }
      return;
    }

    if (mapping[0] === 'imap') {
      mapping.shift();
      mapping[0] = mapping[0].replace(/<c(-s-)?/i, function(e) {
        return e.toUpperCase();
      });
      if (Mappings.insertDefaults.hasOwnProperty(mapping[1])) {
        return Mappings.insertDefaults[mapping[1]].push(mapping[0]);
      }
      return;
    }

    if (mapping.length === 2) {
      mapping[1] = mapping[1].replace(/<c(-s-)?/i, function(e) {
        return e.toUpperCase();
      });
      if (mapping[0] === 'iunmap') {
        return Mappings.removeMapping(Mappings.insertDefaults, mapping[1]);
      }
      if (mapping[0] === 'unmap') {
        Mappings.removeMapping(Mappings.defaults, mapping[1]);
        Mappings.shortCuts = Mappings.shortCuts.filter(function(item) {
          return item[0] !== mapping[1];
        });
      }
    }
  });
  Mappings.toggleCvim = Mappings.defaults.toggleCvim;
  Mappings.toggleBlacklisted = Mappings.defaults.toggleBlacklisted;
  delete Mappings.defaults.toggleCvim;
  delete Mappings.defaults.toggleBlacklisted;
  Mappings.shortCuts = Mappings.shortCuts.map(function(item) {
    item[1] = item[1].replace(/@%/, document.URL);
    return item;
  });
  Mappings.shortCuts.forEach(function(item) {
    Mappings.defaults.shortCuts.push(item[0]);
  });
};

Mappings.executeSequence = function(c, r) {
  if (!c.length) {
    return;
  }
  if (/^[0-9]+/.test(c)) {
    r = c.match(/^[0-9]+/)[0];
    c = c.replace(/^[0-9]+/, '');
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
    Mappings.executeSequence(c.substring(1), r);
  }
};

Mappings.isValidQueue = function(wildCard) {
  var wild, key, i;
  for (key in this.defaults) {
    for (i = 0, l = this.defaults[key].length; i < l; i++) {
      wild = this.defaults[key][i].replace(/\*$/, wildCard);
      if (wild.substring(0, Mappings.queue.length) === Mappings.queue) {
        return true;
      }
    }
  }
};

Mappings.handleEscapeKey = function() {

  this.queue = '';
  this.repeats = '';

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
          saveSearch: true });
        Find.index = Find.lastIndex - 1;
        Find.search(false, 1, false);
      }
    }
    Command.hideData();
    return Command.hide();
  }

  if (document.activeElement.isInput()) {
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

Mappings.matchesMapping = function(binding) {
  for (var key in this.defaults) {
    for (var i = 0; i < this.defaults[key].length; i++) {
      var pattern = this.defaults[key][i].replace('*', '');
      if (binding.indexOf(pattern) !== -1 || pattern.indexOf(binding) === 0) {
        return true;
      }
    }
  }
  return false;
};

Mappings.convertToAction = function(c) {
  if (c === '<Esc>' || c === '<C-[>') {
    return this.handleEscapeKey();
  }
  var addOne = false;
  if (!c || c.trim() === '') {
    return false;
  }
  if (Hints.active) {
    if (settings.numerichints && c === '<Enter>') {
      if (Hints.numericMatch) {
        return Hints.dispatchAction(Hints.numericMatch);
      }
      return Hints.hideHints(false);
    }
    if (settings.typelinkhints) {
      if (c === ';') {
        Hints.changeFocus();
      } else {
        Hints.handleHint(c.replace('<Space>', ' '));
      }
      return true;
    }
    if (c === '<Space>') {
      Hints.hideHints(false);
      return true;
    }
    return (c === ';' ? Hints.changeFocus() : Hints.handleHint(c));
  }
  if (/^[0-9]$/.test(c) && !(c === '0' && Mappings.repeats === '') && Mappings.queue.length === 0) {
    return Mappings.repeats += c;
  }

  Mappings.queue += c;
  for (var key in this.defaults) {
    if (!this.isValidQueue(c)) {
      Mappings.queue = '';
      Mappings.repeats = '';
      Mappings.validMatch = false;
      return false;
    }

    Mappings.validMatch = true;
    for (var i = 0, l = this.defaults[key].length; i < l; i++) {
      if (Mappings.queue === this.defaults[key][i].replace(/\*$/, c)) {
        Mappings.validMatch = false;
        if (/^0?$/.test(Mappings.repeats)) {
          addOne = true;
        }
        if (Mappings.actions.hasOwnProperty(key)) {
          if (key === 'shortCuts') {
            Mappings.actions[key](Mappings.queue, (addOne ? 1 : +Mappings.repeats));
          } else {
            Mappings.actions[key]((addOne ? 1 : +Mappings.repeats), Mappings.queue);
          }
        }
        window.clearTimeout(this.timeout);
        Mappings.queue = '';
        Mappings.repeats = '';
      }
    }
  }
  if (this.queue.length && c === settings.mapleader) {
    this.timeout = window.setTimeout(function() {
      Mappings.queue = '';
    }, settings.timeoutlen);
  }
  return true;
};
var Find = {};

Find.highlights = [];
Find.index = 0;
Find.matches = [];
Find.tries = 0;

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
var port = chrome.extension.connect({name: 'main'});

port.onMessage.addListener(function(response) {
  var key;
  switch (response.type) {
    case 'hello':
      port.postMessage({action: 'getBookmarks'});
      port.postMessage({action: 'getQuickMarks'});
      port.postMessage({action: 'getSessionNames'});
      port.postMessage({action: 'getTopSites'});
      port.postMessage({action: 'retrieveAllHistory'});
      port.postMessage({action: 'sendLastSearch'});
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
  }
});

chrome.extension.onMessage.addListener(function(request, sender, callback) {
  switch (request.action) {
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
      Mappings.shortCuts = Object.clone(Mappings.shortCutsClone);
      if (!Command.initialLoadStarted) {
        Command.configureSettings(request.settings);
      } else {
        Mappings.parseCustom(request.settings.MAPPINGS);
        settings = request.settings;
      }
      break;
    case 'confirm':
      callback(confirm(request.message));
      break;
    case 'cancelAllWebRequests':
      window.stop();
      break;
    case 'updateMarks':
      Marks.quickMarks = request.marks;
      break;
    case 'base64Image':
      chrome.runtime.sendMessage({action: 'openLinkTab', active: false, url: 'data:text/html;charset=utf-8;base64,' + window.btoa(reverseImagePost(request.data, null)), noconvert: true});
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
        chrome.runtime.sendMessage({action: 'getSettings'});
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
var HUD = {};
HUD.visible = false;
HUD.slideDuration = 40;

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
var Visual = {};

Visual.queue = '';
Visual.visualModeActive = false;
Visual.caretModeActive = false;
Visual.textNodes = [];

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
  return document.body.spellcheck = true;
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
      this.selection.modify('extend', 'backward', 'lineboundary');
    } else {
      this.selection.setPosition(bnode, 0);
      this.selection.extend(enode, enode.length);
      this.selection.modify('extend', 'forward', 'lineboundary');
    }
    this.firstExtentNode = this.selection.extentNode;
  }
};

Visual.fillLine = function() {
  this.selection = document.getSelection();
  if (this.selection.type === 'Caret') {
    this.selection.setPosition(this.selection.baseNode, 0);
    this.selection.modify('extend', 'forward', 'lineboundary');
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
      this.selection.modify('extend', 'forward', 'line');
      this.selection.modify('extend', 'backward', 'lineboundary');
      this.fillLine();
      break;
    case 'k':
      if (this.firstLine || this.selection.extentNode === this.firstExtentNode || this.selection.baseNode === this.selection.extentNode) {
        this.selection.setPosition(this.selection.baseNode, this.selection.baseNode.length);
        this.firstLine = false;
      }
      this.selection.modify('extend', 'backward', 'line');
      this.selection.modify('extend', 'forward', 'lineboundary');
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
      this.selection.modify('extend', 'forward', 'documentboundary');
      break;
  }
  Visual.scrollIntoView();
};

Visual.movements = {
  l: ['forward', 'character'],
  h: ['backward', 'character'],
  k: ['backward', 'line'],
  j: ['forward', 'line'],
  w: ['forward', 'word'],
  b: ['backward', 'word'],
  0: ['backward', 'lineboundary'],
  $: ['forward', 'lineboundary'],
  G: ['forward', 'documentboundary']
};

Visual.action = function(key) {
  this.selection = document.getSelection();
  if (key === 'g') {
    if (!this.queue.length) {
      return this.queue += 'g';
    } else {
      this.queue = '';
      if (!this.visualModeActive) {
        this.selection.modify('move', 'backward', 'documentboundary');
      } else if (this.visualModeActive) {
        this.selection.modify('extend', 'backward', 'documentboundary');
      }
      return this.scrollIntoView();
    }
  } else {
    this.queue = '';
  }
  if (key === 'v') {
    if (this.lineMode) {
      HUD.setMessage(' -- VISUAL -- ');
      return this.lineMode = false;
    }
    this.visualModeActive = !this.visualModeActive;
    if (!this.visualModeActive) {
      HUD.setMessage(' -- CARET -- ');
      return Visual.collapse();
    } else {
      HUD.setMessage(' -- VISUAL -- ');
    }
  }
  if (key === 'V') {
    this.lineMode = !this.lineMode;
    this.visualModeActive = true;
    this.enterLineMode();
    return HUD.setMessage(' -- VISUAL LINE -- ');
  }
  if (this.lineMode) {
    return this.lineAction(key);
  }
  if (this.selection.type === 'Range') {
    this.visualModeActive = true;
  }
  var movementType =
    (this.selection.type === 'Range' || this.visualModeActive) ?
    'extend' : 'move';
  if (this.movements.hasOwnProperty(key)) {
    this.selection.modify.apply(this.selection, [movementType].concat(this.movements[key]));
  } else {
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
        document.getSelection().collapseToEnd();
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
  }
  Visual.scrollIntoView();
};
var Command = {};
var settings, sessions;

Command.dataElements = [];
Command.matches = [];

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
    index += reverse? -1 : 1;
    if (Command.typed && Command.typed.trim()) {
      while (this.setInfo(type, index)) {
        if (this[type][index].substring(0, Command.typed.length) === Command.typed) {
          break;
        }
        index += reverse? -1 : 1;
      }
    }
    if (reverse && index === -1) {
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
  topsites: ['Top Site', 'darkcyan'],
  history:  ['History', 'cyan'],
  bookmarks: ['Bookmark', '#6d85fd']
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
  ['new',      'Open a link in a new window'],
  ['buffer',      'Select from a list of current tabs'],
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
  ['tabattach',    'Move current tab to another window'],
  ['chrome://',    'Opens Chrome urls'],
  ['duplicate',    'Clone the current tab'],
  ['settings',     'Open the options page for this extension'],
  ['help',         'Shows the help page'],
  ['changelog',    'Shows the changelog page'],
  ['date',         'Display the current date'],
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

    if ((search.length < 2 || Complete.engines.indexOf(search[0]) === -1) && !Complete.hasAlias(search[0]) || (Complete.hasAlias(search[0]) &&  value.slice(-1) !== ' ' && search.length < 2)) {

      if (Complete.engines.indexOf(search[0]) !== -1) {
        return this.hideData();
      }

      this.completions.engines = [];
      for (var i = 0, l = Complete.engines.length; i < l; ++i) {
        if (!search[0] || Complete.engines[i].indexOf(search.join(' ')) === 0) {
          this.completions.engines.push([Complete.engines[i], Complete.requestUrls[Complete.engines[i]]]);
        }
      }
      this.updateCompletions(true);

      this.completions.topsites = Search.topSites.filter(function(e) {
        return (e[0] + ' ' + e[1]).toLowerCase().indexOf(search.slice(0).join(' ').toLowerCase()) !== -1;
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
      return port.postMessage({action: 'searchHistory', search: value.replace(/^\S+\s+/, ''), limit: settings.searchlimit});

    }

    if (search[0] = (Complete.getAlias(search[0]) || search[0])) {
      if (search.length < 2) {
        this.hideData();
        return;
      }
    }
    if (Complete.engines.indexOf(search[0]) !== -1 && Complete.hasOwnProperty(search[0])) {
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
    chrome.runtime.sendMessage({action: 'getHistoryStates'}, function(response) {
      this.completions = {
        tabhistory: searchArray(response.links, value.replace(/\S+\s+/, ''), settings.searchlimit, true)
      };
      this.updateCompletions();
    }.bind(this));
    return;
  }

  if (/^taba(ttach)? +/.test(value)) {
    chrome.runtime.sendMessage({action: 'getWindows'});
    this.completions = { };
    return;
  }

  if (/^buffer(\s+)/.test(value)) {
    port.postMessage({action: 'getBuffers'});
    return;
  }

  if (/^restore\s+/.test(value)) {
    chrome.runtime.sendMessage({action: 'getChromeSessions'}, function(sessions) {
      this.completions = {
        chromesessions: Object.keys(sessions).map(function(e) {
          return [sessions[e].id + ': ' + sessions[e].title, sessions[e].url, sessions[e].id];
        }).filter(function(e) {
          return e.join('').toLowerCase().indexOf(value.replace(/^\S+\s+/, '').toLowerCase()) !== -1;
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
    return this.updateCompletions();
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
      return this.hideData();
    }
    this.historyMode = true;
    port.postMessage({action: 'searchHistory', search: search, limit: settings.searchlimit});
    return;
  }

  if (/^file +/.test(value)) {
    if ((search.slice(-1) === '/' && Marks.lastSearchLength < search.length) || Marks.lastSearchLength > search.length || !(Marks.lastFileSearch && Marks.lastFileSearch.replace(/[^\/]+$/, '') === search) && (search.slice(-1) === '/' && !(Marks.lastFileSearch && Marks.lastFileSearch.slice(-1) === '/'))) {
      Marks.lastFileSearch = search;
      Marks.lastSearchLength = search.length;
      if (settings.homedirectory) {
        search = search.replace('~', settings.homedirectory);
      }
      return chrome.runtime.sendMessage({action: 'getFilePath', path: search});
    } else {
      Marks.lastFileSearch = search;
      return Marks.filePath();
    }
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
      break;
    case 'duplicate':
      tab.tabbed = true;
      chrome.runtime.sendMessage({action: 'openLink', tab: tab, url: document.URL, repeats: repeats});
      break;
    case 'settings':
      tab.tabbed = true;
      chrome.runtime.sendMessage({action: 'openLink', tab: tab, url: chrome.extension.getURL('/pages/options.html'), repeats: repeats});
      break;
    case 'changelog':
      tab.tabbed = true;
      chrome.runtime.sendMessage({action: 'openLink', tab: tab, url: chrome.extension.getURL('/pages/changelog.html'), repeats: repeats});
      break;
    case 'date':
      var date = new Date();
      var weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      Status.setMessage(weekDays[date.getDay()] + ', ' + months[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear(), 2);
      break;
    case 'help':
      tab.tabbed = true;
      chrome.runtime.sendMessage({action: 'openLink', tab: tab, url: chrome.extension.getURL('/pages/mappings.html')});
      break;
    case 'stop':
      window.stop();
      break;
    case 'stopall':
      chrome.runtime.sendMessage({action: 'cancelAllWebRequests'});
      break;
    case 'viewsource':
      chrome.runtime.sendMessage({action: 'openLink', tab: tab, url: 'view-source:' + document.URL, noconvert: true});
      break;
    case 'togglepin':
      chrome.runtime.sendMessage({action: 'pinTab'});
      break;
    case 'undo':
      chrome.runtime.sendMessage({action: 'openLast'});
      break;
    case 'tabnext':
    case 'tabn':
      chrome.runtime.sendMessage({action: 'nextTab'});
      break;
    case 'tabprevious':
    case 'tabp':
    case 'tabN':
      chrome.runtime.sendMessage({action: 'previousTab'});
      break;
    case 'tabprevious':
      break;
    case 'q':
    case 'quit':
    case 'exit':
      chrome.runtime.sendMessage({action: 'closeTab', repeats: repeats});
      break;
    case 'qa':
    case 'qall':
      chrome.runtime.sendMessage({action: 'closeWindow'});
      break;
    default:
      break;
  }

  if (/^chrome:\/\/\S+$/.test(value)) {
    return chrome.runtime.sendMessage({
      action: 'openLink',
      tab: tab,
      url: value,
      noconvert: true
    });
  }

  if (/^bookmarks +/.test(value) && !/^\S+\s*$/.test(value)) {
    if (/^\S+\s+\//.test(value)) {
      return chrome.runtime.sendMessage({
        action: 'openBookmarkFolder',
        path: value.replace(/\S+\s+/, ''),
        noconvert: true
      });
    }
    return chrome.runtime.sendMessage({
      action: 'openLink',
      tab: tab,
      url: value.replace(/^\S+\s+/, ''),
      noconvert: true
    });
  }

  if (/^history +/.test(value) && !/^\S+\s*$/.test(value)) {
    return chrome.runtime.sendMessage({
      action: 'openLink',
      tab: tab,
      url: Complete.convertToLink(value),
      noconvert: true
    });
  }

  if (/^taba(ttach)? +/.test(value) && !/^\S+\s*$/.test(value)) {
    var windowId;
    if (windowId = this.completionResults[parseInt(value.replace(/^\S+ */, '')) - 1]) {
      return chrome.runtime.sendMessage({
        action: 'moveTab',
        windowId: windowId[3]
      });
    }
  }

  if (/^file +/.test(value)) {
    return chrome.runtime.sendMessage({
      action: 'openLink',
      tab: tab,
      url: 'file://' + value.replace(/\S+ +/, '').replace(/^~/, settings.homedirectory),
      noconvert: true
    });
  }

  if (/^(new|winopen|wo)$/.test(value.replace(/ .*/, '')) && !/^\S+\s*$/.test(value)) {
    return chrome.runtime.sendMessage({
      action: 'openLinkWindow',
      tab: tab,
      url: Complete.convertToLink(value),
      repeats: repeats,
      noconvert: true
    });
  }

  if (/^restore\s+/.test(value)) {
    chrome.runtime.sendMessage({
      action: 'restoreChromeSession',
      sessionId: value.replace(/\S+\s+/, '').trimAround()
    });
  }

  if (/^(tabnew|tabedit|tabe|to|tabopen|tabhistory)$/.test(value.replace(/ .*/, ''))) {
    tab.tabbed = true;
    return chrome.runtime.sendMessage({
      action: 'openLink',
      tab: tab,
      url: Complete.convertToLink(value),
      repeats: repeats,
      noconvert: true
    });
  }

  if (/^(o|open)$/.test(value.replace(/ .*/, '')) && !/^\S+\s*$/.test(value)) {
    return chrome.runtime.sendMessage({
      action: 'openLink',
      tab: tab,
      url: Complete.convertToLink(value),
      noconvert: true
    });
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
      chrome.runtime.sendMessage({
        action: 'goToTab',
        id: selectedBuffer[3]
      });
    }
    return;
  }

  if (/^execute +/.test(value)) {
    var command = value.replace(/^\S+/, '').trim();
    realKeys = '';
    repeats = '';
    Command.hide();
    return Mappings.executeSequence(command);
  }

  if (/^delsession/.test(value)) {
    value = value.replace(/^\S+(\s+)?/, '').trimAround();
    if (value === '') {
      return Status.setMessage('argument required', 1, 'error');
    }
    if (sessions.indexOf(value) !== -1) {
      sessions.splice(sessions.indexOf(value), 1);
    }
    value.split(' ').forEach(function(v) {
      chrome.runtime.sendMessage({action: 'deleteSession', name: v});
    });
    return port.postMessage({action: 'getSessionNames'});
  }

  if (/^mksession/.test(value)) {
    value = value.replace(/^\S+(\s+)?/, '').trimAround();
    if (value === '') {
      return Status.setMessage('session name required', 1, 'error');
    }
    if (/[^a-zA-Z0-9_-]/.test(value)) {
      return Status.setMessage('only alphanumeric characters, dashes, and underscores are allowed', 1, 'error');
    }
    if (sessions.indexOf(value) === -1) {
      sessions.push(value);
    }
    chrome.runtime.sendMessage({
      action: 'createSession',
      name: value
    });
    return;
  }

  if (/^session/.test(value)) {
    value = value.replace(/^\S+(\s+)?/, '').trimAround();
    if (value === '') {
      return Status.setMessage('session name required', 1, 'error');
    }
    return chrome.runtime.sendMessage({
      action: 'openSession',
      name: value,
      sameWindow: !tab.active
    }, function() {
      Status.setMessage('session does not exist', 1, 'error');
    });
  }

  if (/^set +/.test(value) && value !== 'set') {
    value = value.replace(/^set +/, '').split(/[ =]+/);
    var isSet, swapVal,
        isQuery = /\?$/.test(value[0]);
    value[0] = value[0].replace(/\?$/, '');
    if (!settings.hasOwnProperty(value[0].replace(/^no|!$/g, ''))) {
      return Status.setMessage('unknown option: ' + value[0], 1, 'error');
    }

    if (isQuery) {
      return Status.setMessage(value + ': ' + settings[value[0]], 1);
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
      chrome.runtime.sendMessage({action: 'syncSettings', settings: settings});
    }
    return;
  }

};

Command.show = function(search, value) {
  if (!this.domElementsLoaded) {
    return false;
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
  if (!head.length && window.location.protocol !== 'chrome-extensions:' && window.location.pathname !== '/_/chrome/newtab') {
    if (window.location.protocol !== 'chrome:') {
      chrome.runtime.sendMessage({
        action: 'injectCSS',
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
        if (/input|textarea/i.test(document.activeElement.localName) && !manualFocus) {
          document.activeElement.blur();
        }
      }
      if (manualFocus) {
        window.clearInterval(initialFocus);
      }
    }, 5);
    var initialKeyDown = document.addEventListener('keydown', function() {
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
  Mappings.shortCuts = Object.clone(Mappings.shortCutsClone);
  Mappings.parseCustom(settings.MAPPINGS);
  if (enabled) {
    this.loaded = true;

    if (Array.isArray(settings.completionengines) && settings.completionengines.length) {
      Complete.engines = Complete.engines.filter(function(e) {
        return settings.completionengines.indexOf(e) !== -1;
      });
    }
    if (settings.searchengines && settings.searchengines.constructor === Object) {
      for (key in settings.searchengines) {
        if (Complete.engines.indexOf(key) === -1 && typeof settings.searchengines[key] === 'string') {
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
    chrome.runtime.sendMessage({action: 'setIconEnabled'});
    Command.init(true);
  };
  Search.settings = Object.keys(settings).filter(function(e) {
    return settings[e].constructor === Boolean;
  });
  removeListeners();
  settings.searchlimit = +settings.searchlimit;
  if (!checkBlacklist()) {
    chrome.runtime.sendMessage({action: 'getActiveState'}, function(response) {
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
  chrome.runtime.sendMessage({action: 'getSettings'});
}
var Scroll = {};
Scroll.positions = {};

var ease = {
  outSine: function(t, b, c, d) {
    return c * Math.sin(t/d * (Math.PI/2)) + b;
  },
  outQuint: function(t, b, c, d) {
    t /= d;
    t--;
    return c*(t*t*t*t*t + 1) + b;
  },
  outQuad: function(t, b, c, d) {
    t /= d;
    return -c * t*(t-2) + b;
  },
  outExpo: function(t, b, c, d) {
    return c * ( -Math.pow( 2, -10 * t/d ) + 1 ) + b;
  },
  outQuart: function(t, b, c, d) {
    return -c * ((t=t/d-1)*t*t*t - 1) + b;
  },
  outCirc: function (t, b, c, d) {
    t /= d;
    t--;
    return c * Math.sqrt(1 - t*t) + b;
  }
};

Scroll.smoothScrollBy = function(x, y) {

  var isVertical = (y) ? true : false,
      easeFunc = ease.outExpo,
      i = 0,
      delta = 0;

  this.isScrolling = true;
  if (document.body) {
    if (document.body.scrollTop + y < 0) {
      y = -document.body.scrollTop - 5;
    } else if (document.body.scrollTop + window.innerHeight + y > document.body.scrollHeight) {
      y = document.body.scrollHeight - window.innerHeight - document.body.scrollTop + 5;
    }
  }

  function animLoop() {

    if (isVertical) {
      window.scrollBy(0, Math.round(easeFunc(i, 0, y, settings.scrollduration) - delta));
    } else {
      window.scrollBy(Math.round(easeFunc(i, 0, x, settings.scrollduration) - delta), 0);
    }

    if (i < settings.scrollduration) {
      window.requestAnimationFrame(animLoop);
    } else {
      Scroll.isScrolling = false;
    }

    delta = easeFunc(i, 0, (x || y), settings.scrollduration);
    i += 1;
  }

  animLoop();
};

Scroll.scroll = function(type, repeats) {

  var stepSize = settings ? settings.scrollstep : 60;
  
  if (document.body) {
    this.lastPosition = [document.body.scrollLeft, document.body.scrollTop];
  }

  if (settings && settings.smoothscroll) {

    switch (type) {
      case 'down':
        Scroll.smoothScrollBy(0, repeats * stepSize);
        break;
      case 'up':
        Scroll.smoothScrollBy(0, -repeats * stepSize);
        break;
      case 'pageDown':
        Scroll.smoothScrollBy(0, repeats * window.innerHeight / 2);
        break;
      case 'fullPageDown':
        Scroll.smoothScrollBy(0, repeats * window.innerHeight * (settings.fullpagescrollpercent / 100 || 0.85));
        break;
      case 'pageUp':
        Scroll.smoothScrollBy(0, -repeats * window.innerHeight / 2);
        break;
      case 'fullPageUp':
        Scroll.smoothScrollBy(0, -repeats * window.innerHeight * (settings.fullpagescrollpercent / 100 || 0.85));
        break;
      case 'top':
        Scroll.smoothScrollBy(0, -document.body.scrollTop - 10);
        break;
      case 'bottom':
        Scroll.smoothScrollBy(0, document.body.scrollHeight - document.body.scrollTop - window.innerHeight + 10);
        break;
      case 'left':
        Scroll.smoothScrollBy(repeats * -stepSize / 2, 0);
        break;
      case 'right':
        Scroll.smoothScrollBy(repeats * stepSize / 2, 0);
        break;
      case 'leftmost':
        Scroll.smoothScrollBy(-document.body.scrollLeft - 10, 0);
        break;
      case 'rightmost':
        Scroll.smoothScrollBy(document.body.scrollWidth - document.body.scrollLeft - window.innerWidth + 20, 0);
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
var Frames = {};

Frames.focus = function() {
  window.focus();
  var outline = document.createElement('div');
  outline.id = 'cVim-frames-outline';
  document.body.appendChild(outline);
  window.setTimeout(function() {
    document.body.removeChild(outline);
  }, 500);
};

Frames.isVisible = function() {
  return document.body &&
         window.innerWidth &&
         window.innerHeight;
};

Frames.init = function(isRoot) {
  if (Frames.isVisible()) {
    chrome.runtime.sendMessage({action: 'addFrame', isRoot: isRoot}, function(index) {
      Frames.index = index;
    });
  }
};

document.addEventListener('DOMContentLoaded', function() {
  Frames.init(self === top);
}, false);
}
