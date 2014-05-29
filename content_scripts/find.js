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
      HUD.display(this.index + 1 + " / " + this.matches.length);
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
    return HUD.display("No matches", 1);
  }
  if (this.index >= 0) {
    this.matches[this.index].style.backgroundColor = "";
  }
  if (reverse && repeats === 1 && this.index === 0) {
    this.index = this.matches.length - 1;
  } else if (!reverse && repeats === 1 && this.index + 1 === this.matches.length) {
    this.index = 0;
  } else {
    this.index = (this.index + (reverse ? -1 : 1) * repeats).mod(this.matches.length);
  }
  if (!this.matches[this.index].isVisible()) {
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
    if (node.getAttribute("href") !== null) {
      if (!ignoreFocus) {
        node.focus();
      }
      isLink = true;
      break;
    }
  }
  this.matches[this.index].style.backgroundColor = activeHighlight;
  HUD.display(this.index + 1 + " / " + this.matches.length);
  var paddingTop = 0,
      paddingBottom = 0;
  if (Command.active) {
    paddingBottom = Command.barPaddingBottom;
    paddingTop    = Command.barPaddingTop;
  }
  var documentZoom = parseFloat(document.body.style.zoom) || 1;
  if (br.top * documentZoom + br.height * documentZoom > window.innerHeight - paddingBottom) {
    if (isLink && !reverse) origTop += br.height * documentZoom;
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
  var regexMode = "",
      containsCap = params.search.search(/[A-Z]/) !== -1,
      useRegex = settings.regexp,
      markBase = document.createElement("mark"),
      node, regexMatches, mark, mid, data, nodeIterator, matchPosition;

  markBase.style.backgroundColor = settings.highlight;

  if (params.saveSearch) {
    this.lastSearch = params.search;
  }

  if ((settings.ignorecase || /\/i$/.test(params.search)) && !(settings.smartcase && containsCap)) {
    params.search = params.search.replace(/\/i$/, "");
    regexMode = "i";
  }

  if (useRegex) {
    try { params.search = new RegExp(params.search, regexMode); }
    catch(e) { useRegex = false; }
  }

  nodeIterator = document.createNodeIterator(params.base, NodeFilter.SHOW_TEXT, { acceptNode: function(node) { // Make sure HTML element isn't a script/style
    return node.isTextNode();
  }}, false);

  while (node = nodeIterator.nextNode()) {
    data = (settings.ignorediacritics ? node.data.removeDiacritics() : node.data);
    if (useRegex) {
      matchPosition = data.search(params.search);
    } else {
      matchPosition = (containsCap ? node.data.indexOf(params.search) : node.data.toLowerCase().indexOf(params.search));
    }
    if (matchPosition >= 0) {
      if (useRegex) {
        regexMatches = data.match(params.search);
      }
      mark = markBase.cloneNode(false);
      mid = node.splitText(matchPosition);
      mid.splitText(useRegex ? regexMatches[0].length : params.search.length);
      mark.appendChild(mid.cloneNode(true));
      mid.parentNode.replaceChild(mark, mid);
      this.matches.push(mark);
    }
  }

  HUD.display(this.matches.length || "No matches");

  if (params.setIndex) {
    this.setIndex();
  }
  if (params.executeSearch) {
    this.search(params.reverse, 1);
  }

};

Find.clear = function() {
  for (var i = 0; i < this.matches.length; i++) {
    try { // Ignore text nodes that have changed or been removed since last search
      var parent = this.matches[i].parentNode;
      parent.replaceChild(this.matches[i].firstChild, this.matches[i]);
      parent.normalize();
    } catch(e) {
      continue;
    }
  }
  this.matches = [];
};
