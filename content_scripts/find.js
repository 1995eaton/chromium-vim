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
  if (!this.matches.length) return false;
  var el = this.matches[this.index];
  if (!el) return false;
  return el.firstChild;
};

Find.search = function(reverse, repeats) {
  if (Find.swap) reverse = !reverse;
  if (!this.matches.length) {
    HUD.display("No matches", 1);
    return;
  }
  if (this.index >= 0)
    this.matches[this.index].style.backgroundColor = "";
  if (reverse && repeats === 1 && this.index === 0) {
    this.index = this.matches.length - 1;
  } else if (!reverse && repeats === 1 && this.index + 1 === this.matches.length) {
    this.index = 0;
  } else {
    this.index = (((this.index + ((reverse)? -1 : 1) * repeats) % this.matches.length) + this.matches.length) % this.matches.length;
  }
  if (!this.matches[this.index].isVisible()) {
    this.tries++;
    if (this.tries > this.matches.length)
      return;
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
  document.activeElement.blur();
  document.body.focus();
  var node = this.matches[this.index];
  while (node = node.parentElement) {
    if (node.getAttribute("href") !== null) {
      node.focus();
      isLink = true;
      break;
    }
  }
  this.matches[this.index].style.backgroundColor = "#ff9632";
  HUD.display(this.index + 1 + " / " + this.matches.length);
  if (br.top + br.height > window.innerHeight) {
    if (isLink && !reverse) origTop += br.height;
    window.scrollTo(0, origTop);
    window.scrollBy(0, br.top + br.height - window.innerHeight);
  } else if (br.top < 0) {
    window.scrollTo(0, origTop);
    window.scrollBy(0, br.top);
  }
};

Find.highlight = function(baseNode, match, setIndex, search, reverse, saveSearch) {
  var mode, node, matches, mark, mid, pass, data;
  var regexp = settings.regexp;
  if (this.clearing) return;
  if (saveSearch !== undefined) this.lastSearch = match;
  if (settings.ignorecase || /\/i$/.test(match)) {
    mode = "i";
    match = match.replace(/\/i$/, "");
  } else {
    mode = "";
  }
  if (regexp) {
    if (match === "." || match === ".*") {
      match = ".*.";
    }
    try {
      match = new RegExp(match, mode);
    } catch(e) {
      return;
    }
  }
  var walker = document.createTreeWalker(baseNode, NodeFilter.SHOW_TEXT, null, false);
  document.body.normalize();
  pass = false;
  while (node = walker.nextNode()) {
    var nName = node.parentNode.nodeName;
    if (nName !== "SCRIPT" && nName !== "STYLE" && nName !== "NOSCRIPT" && node.data.trim() !== "" && !node.parentNode.hasAttribute("cVim")) {
      if (settings.ignorediacritics) {
        data = node.data.removeDiacritics();
      } else {
        data = node.data;
      }
      var matchPosition = (regexp ? data.search(match) : node.data.indexOf(match));
      if (!pass) {
        if (matchPosition >= 0) {
          if (regexp) {
            matches = data.match(match);
            if (!matches.length || matches[0] === "")
              continue;
          }
          mark = document.createElement("mark");
          mid = node.splitText(matchPosition);
          mid.splitText((regexp ? matches[0].length : match.length));
          mark.appendChild(mid.cloneNode(true));
          mid.parentNode.replaceChild(mark, mid);
          this.matches.push(mark);
          pass = true;
        }
      } else {
        pass = false;
      }
    }
  }
  if (this.matches.length === 0) {
    HUD.display("No matches");
  } else {
    HUD.display(this.matches.length);
  }
  document.body.normalize();

  if (setIndex === true)
    this.setIndex();
  if (search === true)
    return this.search(reverse, 1);

};

Find.clear = function() {
  this.clearing = true;
  for (var i = 0; i < this.matches.length; i++) {
    try { // Ignore text nodes that have changed since last search
      var parent = this.matches[i].parentNode;
      parent.replaceChild(this.matches[i].firstChild, this.matches[i]);
      parent.normalize();
    } catch(e) {
      continue;
    }
  }
  this.matches = [];
  this.clearing = false;
};
