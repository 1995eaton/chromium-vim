var Hints = {};

Hints.tryGooglePattern = function(forward) {
  if (location.hostname.indexOf('www.google.'))
    return false;
  var target = document.getElementById(forward ? 'pnnext' : 'pnprev');
  if (target)
    target.click();
  return !!target;
};

Hints.matchPatternFilters = {
  '*://*.ebay.com/*': {
    'next': 'td a.next',
    'prev': 'td a.prev'
  },
  '*://mail.google.com/*': {
    'next': 'div[role="button"][data-tooltip="Older"]:not([aria-disabled="true"])',
    'prev': 'div[role="button"][data-tooltip="Newer"]:not([aria-disabled="true"])'
  },
  '*://*.reddit.com/*': {
    'next': 'a[rel$="next"]',
    'prev': 'a[rel$="prev"]'
  }
};

Hints.matchPatterns = function(pattern) {
  var applicableFilters = Object.keys(this.matchPatternFilters)
    .filter(function(key) {
      return matchLocation(document.URL, key);
    }).map(function(key) {
      return this.matchPatternFilters[key][
        pattern === settings.nextmatchpattern ? 'next' : 'prev'];
    }.bind(this)).compress();
  var link = null;
  for (var i = 0; i < applicableFilters.length; i++) {
    link = findFirstOf(document.querySelectorAll(applicableFilters[i]),
        function(e) {
          return DOM.isVisible(e);
        });
    if (link !== null)
      break;
  }
  if (link === null) {
    if (this.tryGooglePattern(pattern === settings.nextmatchpattern))
      return;
    if (typeof pattern === 'string')
      pattern = new RegExp('^' + pattern + '$', 'i');
    link = findFirstOf(getLinkableElements(), function(e) {
      return e.textContent.trim() &&
        (pattern.test(e.textContent) || pattern.test(e.getAttribute('value')));
    });
  }
  if (link) {
    DOM.mouseEvent('hover', link);
    DOM.mouseEvent('click', link);
  }
};

Hints.hideHints = function(reset, multi, useKeyDelay) {
  if (reset && document.getElementById('cVim-link-container') !== null) {
    document.getElementById('cVim-link-container')
      .parentNode.removeChild(document.getElementById('cVim-link-container'));
  } else if (document.getElementById('cVim-link-container') !== null) {
    if (!multi)
      HUD.hide();
    if (settings.linkanimations) {
      Hints.shadowDOM.addEventListener('transitionend', function() {
        var m = document.getElementById('cVim-link-container');
        if (m !== null) {
          m.parentNode.removeChild(m);
        }
      });
      Hints.shadowDOM.host.style.opacity = '0';
    } else {
      document.getElementById('cVim-link-container')
        .parentNode.removeChild(document.getElementById('cVim-link-container'));
    }
  }
  this.numericMatch = void 0;
  this.shouldShowLinkInfo = false;
  this.active = reset;
  this.currentString = '';
  this.linkArr = [];
  this.linkHints = [];
  this.permutations = [];
  if (useKeyDelay && !this.active &&
      settings.numerichints && settings.typelinkhints) {
    Hints.keyDelay = true;
    window.setTimeout(function() {
      Hints.keyDelay = false;
    }, settings.typelinkhintsdelay);
  }
};

Hints.changeFocus = function() {
  this.linkArr.forEach(function(item) {
    item[0].style.zIndex = 1 - +item[0].style.zIndex;
  });
};

Hints.removeContainer = function() {
  var hintContainer = document.getElementById('cVim-link-container');
  if (hintContainer !== null)
    hintContainer.parentNode.removeChild(hintContainer);
};

Hints.dispatchAction = function(link, shift) {
  if (!link)
    return false;
  var node = link.localName;
  this.lastClicked = link;

  if (settings.numerichints && settings.typelinkhints) {
    Hints.keyDelay = true;
    window.setTimeout(function() {
      Hints.keyDelay = false;
    }, settings.typelinkhintsdelay);
  }

  if (shift || KeyHandler.shiftKey) {
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
      DOM.mouseEvent('unhover', Hints.lastHover);
      if (Hints.lastHover === link) {
        Hints.lastHover = null;
        break;
      }
    }
    DOM.mouseEvent('hover', link);
    Hints.lastHover = link;
    break;
  case 'edit':
    Mappings.insertFunctions.__setElement__(link);
    link.focus();
    PORT('editWithVim', {
      text: link.value || link.textContent
    });
    break;
  case 'unhover':
    DOM.mouseEvent('unhover', link);
    break;
  case 'window':
    RUNTIME('openLinkWindow', {
      focused: true,
      url: link.href,
      noconvert: true
    });
    break;
  case 'script':
    eval(settings.FUNCTIONS[this.scriptFunction])(link);
    break;
  default:
    if (node === 'textarea' || (node === 'input' &&
          /^(text|password|email|search)$/i.test(link.type)) ||
        link.hasAttribute('contenteditable')) {
      setTimeout(function() {
        link.focus();
        if (link.hasAttribute('readonly')) {
          link.select();
        }
      }.bind(this), 0);
      break;
    }
    if (node === 'select') {
      link.focus();
      break;
    }
    if (node === 'input' ||
        /^(checkbox|menu)$/.test(link.getAttribute('role'))) {
      window.setTimeout(function() { DOM.mouseEvent('click', link); }, 0);
      break;
    }
    if ((/tabbed/.test(this.type) || this.type === 'multi') && link.href) {
      RUNTIME('openLinkTab', {
        active: this.type === 'tabbedActive',
        url: link.href, noconvert: true
      });
    } else {
      if (link.hasAttribute('tabindex'))
        link.focus();
      DOM.mouseEvent('hover', link);
      if (link.hasAttribute('href')) {
        link.click();
      } else {
        DOM.mouseEvent('click', link);
      }
    }
    break;
  }

  if (this.multi) {
    this.removeContainer();
    window.setTimeout(function() {
      if (!DOM.isEditable(document.activeElement))
        this.create(this.type, true);
    }.bind(this), 0);
  } else {
    this.hideHints(false, false, true);
  }
};

Hints.showLinkInfo = function(hint) {
  var loc = hint[1].href || hint[1].src || hint[1].onclick;
  if (!loc) {
    return false;
  }
  hint[0].textContent = loc;
  return true;
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
    if (this.shouldShowLinkInfo && this.showLinkInfo(this.linkArr[index])) {
      this.acceptLink = function(shift) {
        this.dispatchAction(this.linkArr[index][1], shift);
        this.hideHints(false);
        this.acceptLink = null;
      };
    } else {
      this.dispatchAction(this.linkArr[index][1]);
      this.hideHints(false);
    }
  }

};


Hints.handleHint = function(key) {
  key = key.replace('<Space>', ' ');
  switch (key) {
  case '/':
    return document.getElementById('cVim-link-container').style.opacity = '0';
  case '<Tab>':
    Hints.shouldShowLinkInfo = !Hints.shouldShowLinkInfo;
    return;
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

Hints.evaluateLink = function(link) {
  this.linkIndex += 1;
  var isAreaNode = false,
      imgParent, linkElement, linkStyle, mapCoordinates;
  if (link.localName === 'area' && link.parentNode && link.parentNode.localName === 'map') {
    imgParent = document.querySelector('img[usemap="#' + link.parentNode.name + '"');
    if (!imgParent) {
      return;
    }
    linkLocation = DOM.getVisibleBoundingRect(imgParent);
    isAreaNode = true;
  } else {
    linkLocation = DOM.getVisibleBoundingRect(link);
  }
  if (linkLocation === null) {
    return;
  }
  linkElement = this.linkElementBase.cloneNode(false);
  linkStyle = linkElement.style;
  linkStyle.zIndex = this.linkIndex;
  if (isAreaNode) {
    mapCoordinates = link.getAttribute('coords').split(',');
    if (mapCoordinates.length < 2) {
      return;
    }
    linkStyle.top = linkLocation.top * this.documentZoom +
      document.scrollingElement.scrollTop +
      parseInt(mapCoordinates[1], 10) + 'px';
    linkStyle.left = linkLocation.left * this.documentZoom +
      document.scrollingElement.scrollLeft +
      parseInt(mapCoordinates[0], 10) + 'px';
  } else {
    if (linkLocation.top < 0) {
      linkStyle.top = document.scrollingElement.scrollTop + 'px';
    } else {
      linkStyle.top = linkLocation.top * this.documentZoom + document.scrollingElement.scrollTop + 'px';
    }
    if (linkLocation.left < 0) {
      linkStyle.left = document.scrollingElement.scrollLeft + 'px';
    } else {
      if (linkLocation.offsetLeft > linkLocation.left) {
        linkStyle.left = link.offsetLeft * this.documentZoom + 'px';
      } else {
        linkStyle.left = linkLocation.left * this.documentZoom + document.scrollingElement.scrollLeft + 'px';
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

function HintFilter(selectors, searches) {
  this.selectors = selectors;
  this.searches = searches || [];
}
HintFilter.prototype.matches = function(node) {
  return this.selectors.some(node.matches.bind(node));
};

Hints.siteFilters = (function() {
  var filters = {
    '*://*.reddit.com/*': [[
      'a:not([href])',
      '*[onclick^=click_thing]'
    ], [
      '.grippy'
    ]],
    '*://*.google.*/*': [[
      'li[class$="_dropdownitem"]',
      'div[class$="_dropdown"]',
      'div[aria-label="Apps"]',
      '.hdtbna.notl',
      '.irc_rit',
      'a[href^="imgres"]',
      'div[id=hdtbMenus]',
      'div[aria-label="Account Information"]',
      'img[jsaction^="load:"]'
    ]],
    '*://github.com/*': [[
      '.select-menu-modal-holder.js-menu-content'
    ]],
    '*://twitter.com/*': [[], [
      '.new-tweets-bar.js-new-tweets-bar'
    ]],
    '*://imgur.com/*': [[], [
      '.thumb-title',
      '.carousel-button'
    ]]
  };
  Object.keys(filters).forEach(function(key) {
    filters[key] = new HintFilter(filters[key][0], filters[key][1]);
  });
  return filters;
})();

Hints.acceptHint = function(node) {

  if (node.nodeType !== Node.ELEMENT_NODE)
    return false;

  var name = node.localName.toLowerCase();

  if (Hints.type) {
    if (Hints.type.indexOf('yank') !== -1) {
      return name === 'a'        ||
             name === 'textarea' ||
             name === 'input';
    } else if (Hints.type.indexOf('image') !== -1) {
      return name === 'img';
    } else if (Hints.type === 'edit') {
      return DOM.isEditable(node);
    }
  }

  switch (name) {
  case 'a':
  case 'button':
  case 'select':
  case 'textarea':
  case 'input':
  case 'area':
    return true;
  }

  switch (true) {
  case node.hasAttribute('onclick'):
  case node.hasAttribute('contenteditable'):
  case node.hasAttribute('tabindex'):
  case node.hasAttribute('aria-haspopup'):
  case node.hasAttribute('data-cmd'):
  case node.hasAttribute('jsaction'):
    return true;
  }

  var role = node.getAttribute('role');
  if (role) {
    if (role === 'button' ||
        role === 'checkbox' ||
        role.indexOf('menu') === 0)
      return true;
  }
  return false;
};

Hints.getLinks = function() {
  var applicableFilters = Object.keys(this.siteFilters).filter(function(key) {
    return matchLocation(document.URL, key);
  }).map(function(key) { return this.siteFilters[key]; }.bind(this));

  if (settings.sortlinkhints) {
    traverseDOM(document.body, this.acceptHint).map(function(node) {
      var rect = node.getBoundingClientRect();
      return [node, Math.sqrt(rect.top * rect.top + rect.left * rect.left)];
    }).sort(function(a, b) {
      return a[1] - b[1];
    }).forEach(function(node) {
      if (applicableFilters.every(function(filter) {
        return !filter.matches(node[0]);
      })) Hints.evaluateLink(node[0]);
    });
  } else {
    traverseDOM(document.body, this.acceptHint).forEach(function(node) {
      if (applicableFilters.every(function(filter) {
        return !filter.matches(node);
      })) Hints.evaluateLink(node);
    });
  }

  applicableFilters.forEach(function(filter) {
    filter.searches.forEach(function(search) {
      var nodes = document.querySelectorAll(search);
      if (nodes.length) {
        for (var i = 0; i < nodes.length; i++)
          Hints.evaluateLink(nodes[i]);
      }
    });
  });
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
  var base = settings.hintcharacters.length;
  if (M <= base) {
    return settings.hintcharacters.slice(0, M).split('');
  }
  var codeWord = function(n, b) {
    for (var i = 0, word = []; i < b; i++) {
      word.push(settings.hintcharacters.charAt(n % base));
      n = ~~(n / base);
    }
    return word.reverse().join('');
  };

  var b = Math.ceil(Math.log(M) / Math.log(base));
  var cutoff = Math.pow(base, b) - M;
  var codes0 = [], codes1 = [];

  for (var i = 0, l = ~~(cutoff / (base - 1)); i < l; i++)
    codes0.push(codeWord(i, b - 1));
  codes0.sort();
  for (; i < M; i++)
    codes1.push(codeWord(i + cutoff, b));
  codes1.sort();
  return codes0.concat(codes1);
};

Hints.create = function(type, multi) {
  var self = this;
  window.setTimeout(function() {
    if (!Command.domElementsLoaded) {
      Command.callOnCvimLoad(function() {
        self.create(type, multi);
      });
      return false;
    }
    if (Command.css.parentNode === null) {
      // Fix issue with Baidu search
      document.head.appendChild(Command.css);
    }
    var main, frag, i, l;
    self.linkIndex = 0;
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
    if (settings.scalehints) {
      Hints.linkElementBase.className += ' cVim-hint-scale';
    }
    self.getLinks();
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
    main.top = document.scrollingElement.scrollTop + 'px';
    main.left = document.scrollingElement.scrollLeft + 'px';
    Hints.shadowDOM = main.createShadowRoot();

    try {
      document.lastChild.appendChild(main);
    } catch (e) {
      document.body.appendChild(main);
    }

    if (!multi && settings && settings.hud) {
      HUD.display('Follow link ' + (function() {
        return ({
          yank:          '(yank)',
          multiyank:     '(multi-yank)',
          image:         '(reverse-image)',
          fullimage:     '(full image)',
          tabbed:        '(tabbed)',
          tabbedActive:  '(tabbed)',
          window:        '(window)',
          edit:          '(edit)',
          hover:         '(hover)',
          unhover:       '(unhover)',
          multi:         '(multi)',
          script:        '(script: "' + self.scriptFunction + '")'
        })[type] || '';
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

    [].forEach.call(document.querySelectorAll('style'), function(e) {
      if (e.textContent.indexOf('cVim') !== -1) {
        Hints.shadowDOM.appendChild(e.cloneNode(true));
      }
    });

    var create = function() {
      Hints.shadowDOM.appendChild(frag);
      var style = document.createElement('style');
      style.textContent = Command.mainCSS;
      Hints.shadowDOM.appendChild(style);
      main.style.opacity = '1';
    };

    if (Command.mainCSS === undefined) {
      httpRequest({
        url: chrome.runtime.getURL('content_scripts/main.css')
      }, function(data) {
        Command.mainCSS = data;
        create();
      });
    } else {
      create();
    }

  }, 0);
};
