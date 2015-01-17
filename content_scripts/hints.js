var Hints = {};

Hints.tryGooglePattern = function(forward) {
  if (new URL(document.URL).hostname.indexOf('www.google.') !== 0 ||
      !document.querySelector('li.g div.rc'))
    return false;
  var target = document.getElementById(forward ? 'pnnext' : 'pnprev');
  if (target)
    target.click();
  return !!target;
};

Hints.matchPatterns = function(pattern) {
  if (this.tryGooglePattern(pattern === settings.nextmatchpattern))
    return;
  if (typeof pattern === 'string')
    pattern = new RegExp('^' + pattern + '$', 'i');
  var link = findFirstOf(getLinkableElements(), function(e) {
    return pattern.test(e.textContent) || pattern.test(e.getAttribute('value'));
  });
  if (link)
    link.click();
};

Hints.hideHints = function(reset, multi, useKeyDelay) {
  if (reset && document.getElementById('cVim-link-container') !== null) {
    document.getElementById('cVim-link-container')
      .parentNode.removeChild(document.getElementById('cVim-link-container'));
  } else if (document.getElementById('cVim-link-container') !== null) {
    if (!multi)
      HUD.hide();
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
      document.getElementById('cVim-link-container')
        .parentNode.removeChild(document.getElementById('cVim-link-container'));
    }
  }
  this.numericMatch = void 0;
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

Hints.dispatchAction = function(link) {
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
      RUNTIME('openLinkWindow', {
        focused: false,
        url: link.href,
        noconvert: true
      });
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
      if (node === 'input' ||
          node === 'select' ||
          /^(checkbox|menu)$/.test(link.getAttribute('role')))
      {
        window.setTimeout(function() { link.simulateClick(); }, 0);
        break;
      }
      if (link.getAttribute('target') !== '_top' &&
          (/tabbed/.test(this.type) || this.type === 'multi')) {
        RUNTIME('openLinkTab', {
          active: this.type === 'tabbedActive',
          url: link.href, noconvert: true
        });
      } else {
        link[link.hasAttribute('href') ? 'click' : 'simulateClick']();
      }
      break;
  }

  if (this.multi) {
    this.removeContainer();
    window.setTimeout(function() {
      if (!document.activeElement.isInput())
        this.create(this.type, true);
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
  } else if (key === '/') {
    document.getElementById('cVim-link-container').style.opacity = '0';
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
    if (node.localName === 'a' && !node.hasAttribute('href')) {
      return false;
    }
    if (node.hasAttribute('onclick') && node.getAttribute('onclick').indexOf('click_thing') === 0) {
      return false;
    }
    return true;
  }
};

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
  var nodes = traverseDOM(document.body, this.acceptHint);
  var applicableFiltersLength,
      applicableFilters = [];
  for (var key in this.siteFilters) {
    if (window.location.origin.indexOf(key) !== -1) {
      applicableFilters.push(this.siteFilters[key]);
    }
  }
  applicableFiltersLength = applicableFilters.length;
  nodes.forEach(function(node, i) {
    if (applicableFilters.every(function(filter) { return filter(node); }))
      Hints.evaluateLink(node, i);
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
      Command.callOnCvimLoad(function() {
        self.create(type, multi);
      });
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
        return ({
          yank: '(yank)',
          multiyank: '(multi-yank)',
          image: '(reverse-image)',
          fullimage: '(full image)',
          tabbed: '(tabbed)',
          tabbedActive: '(tabbed)',
          window: '(window)',
          hover: '(hover)',
          unhover: '(unhover)',
          multi: '(multi)'
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

    main.appendChild(frag);
    main.style.opacity = '1';
  }, 0);
};
