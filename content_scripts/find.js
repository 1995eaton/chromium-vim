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
    if (node.parentNode.isVisible()) {
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
