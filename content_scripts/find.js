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
  return (this.matches.length &&
          this.matches[this.index] &&
          this.matches[this.index].firstChild)
    || false;
};

Find.focusParentLink = function(node) {
  do {
    if (node.hasAttribute('href')) {
      node.focus();
      return true;
    }
  } while (node = node.parentElement);
  return false;
};

Find.getCurrentMatch = function() {
  return this.matches[this.index] || null;
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
    this.matches[this.index].style.backgroundColor = settings.highlight;
    this.matches[this.index].className = 'cVim-find-mark';
  }
  if (reverse && repeats === 1 && this.index === 0) {
    this.index = this.matches.length - 1;
  } else if (!reverse && repeats === 1 &&
             this.index + 1 === this.matches.length) {
    this.index = 0;
  } else {
    this.index = (this.index + (reverse ? -1 : 1) * repeats)
      .mod(this.matches.length);
  }
  if (!DOM.isVisible(this.matches[this.index])) {
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
  var br = this.matches[this.index].getBoundingClientRect();
  var origTop = document.scrollingElement.scrollTop;
  if (!ignoreFocus) {
    document.activeElement.blur();
    document.body.focus();
  }
  var isLink = ignoreFocus ? false : this.focusParentLink(this.matches[this.index]);
  this.matches[this.index].style.backgroundColor = activeHighlight;
  this.matches[this.index].className = 'cVim-find-mark active';
  HUD.display(this.index + 1 + ' / ' + this.matches.length);
  var paddingTop = 0,
      paddingBottom = 0;
  if (Command.active) {
    paddingBottom = Command.barPaddingBottom;
    paddingTop    = Command.barPaddingTop;
  }
  var documentZoom = parseFloat(document.body.style.zoom) || 1;
  if (br.top * documentZoom + br.height * documentZoom >
      window.innerHeight - paddingBottom) {
    if (isLink && !reverse) {
      origTop += br.height * documentZoom;
    }
    window.scrollTo(0, origTop + paddingTop + paddingBottom);
    window.scrollBy(0, br.top * documentZoom + br.height *
                       documentZoom - window.innerHeight);
  } else if (br.top < paddingTop) {
    window.scrollTo(0, origTop - paddingTop - paddingBottom);
    window.scrollBy(0, br.top * documentZoom);
  }
};

Find.highlight = function(params) {
  // params => {}
  //   base           -> node to search in
  //   search         -> text to look for
  //   reverse        -> reverse search
  //   setIndex       -> find the first match within the viewport
  //   executesearch  -> run Find.search after highlighting
  //   saveSearch     -> add search to search history
  params.base = params.base || document.body;
  var self = this;
  var regexMode = '',
      containsCap = params.search.search(/[A-Z]/) !== -1,
      useRegex = settings.regexp,
      markBase = document.createElement('mark'),
      nodes = [],
      linksOnly = false;

  markBase.style.backgroundColor = settings.highlight;
  markBase.className = 'cVim-find-mark';

  if (params.saveSearch)
    this.lastSearch = params.search;

  var search = params.search;

  if ((settings.ignorecase || /\/i$/.test(params.search)) &&
      !(settings.smartcase && containsCap)) {
    search = search.replace(/\/i$/, '');
    regexMode = 'i';
  }

  if (useRegex) {
    if (search.charAt(0) === '?') {
      search = search.slice(1);
      linksOnly = true;
    }
    try {
      var rxp = new RegExp(search, 'g' + regexMode);
      var mts = rxp.exec('.');
      if (!mts || (mts && mts[0] !== '')) { // Avoid infinite loop
        search = rxp;
      } else {
        useRegex = false;
      }
    } catch (e) { // RegExp was invalid
      useRegex = false;
    }
  }

  var acceptNode = function(node) {
    if (!node.data.trim())
      return NodeFilter.FILTER_REJECT;
    switch (node.parentNode.localName.toLowerCase()) {
    case 'script':
    case 'style':
    case 'noscript':
    case 'mark':
      return NodeFilter.FILTER_REJECT;
    }
    return DOM.isVisible(node.parentNode) ?
      NodeFilter.FILTER_ACCEPT :
      NodeFilter.FILTER_REJECT;
  };

  var acceptLinkNode = function(node) {
    if (!node.data.trim())
      return NodeFilter.FILTER_REJECT;
    Hints.type = '';
    if (!Hints.acceptHint(node.parentNode)) {
      return NodeFilter.FILTER_REJECT;
    }
    return DOM.isVisible(node.parentNode) ?
      NodeFilter.FILTER_ACCEPT :
      NodeFilter.FILTER_REJECT;
  };

  var nodeIterator = document.createNodeIterator(
    params.base,
    NodeFilter.SHOW_TEXT, {
      acceptNode: linksOnly ? acceptLinkNode : acceptNode
    },
    false
  );

  for (var node; node = nodeIterator.nextNode(); nodes.push(node));

  nodes.forEach((function() {
    if (useRegex) {
      return function(node) {
        var matches = node.data.match(search) || [];
        matches.forEach(function(match) {
          var mark = markBase.cloneNode(false);
          var mid = node.splitText(node.data.indexOf(match));
          mid.splitText(match.length);
          mark.appendChild(mid.cloneNode(true));
          mid.parentNode.replaceChild(mark, mid);
          self.matches.push(mark);
          node = mark.nextSibling;
        });
      };
    }

    return function(node) {
      var pos = containsCap || !settings.ignorecase ?
        node.data.indexOf(search) :
        node.data.toLowerCase().indexOf(search);
      if (~pos) {
        var mark = markBase.cloneNode(false),
            mid = node.splitText(pos);
        mid.splitText(search.length);
        mark.appendChild(mid.cloneNode(true));
        mid.parentNode.replaceChild(mark, mid);
        self.matches.push(mark);
      }
    };
  })());

  document.body.normalize();
  HUD.display(this.matches.length || 'No matches');
  if (params.setIndex)
    this.setIndex();
  if (params.executeSearch)
    this.search(params.reverse, 1);
};

Find.clear = function() {
  var nodes = this.matches;
  for (var i = 0; i < nodes.length; i++)
    if (nodes[i] && nodes[i].parentNode)
      nodes[i].parentNode.replaceChild(nodes[i].firstChild, nodes[i]);
  document.documentElement.normalize();
  this.matches = [];
};
