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

Find.search = function(reverse, repeats, enterHit) {
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
  var orig = [document.body.scrollLeft, document.body.scrollTop];
  var br = this.matches[this.index].getBoundingClientRect();
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
  var v = 0;
  var h = 0;
  var linkOffset = 0;
  if (isLink) linkOffset = 25;
  if (br.top < 0) {
    v = br.top;
  } else if (br.top + linkOffset + br.height > document.documentElement.clientHeight) {
    v = br.top + linkOffset + br.height - document.documentElement.clientHeight;
  }
  if (br.left < 0) {
    h = br.left;
  } else if (br.left + br.width > document.documentElement.clientWidth) {
    h = br.left + br.width - document.documentElement.clientWidth;
  }
  document.body.scrollTop = orig[1] + v;
  document.body.scrollLeft = orig[0] + h;
};

Find.highlight = function(baseNode, match, setIndex, search, reverse, saveSearch) {
  var regexp = settings.useRegex;
  if (this.clearing) return;
  if (saveSearch !== undefined) this.lastSearch = match;
  var mode;
  if (settings.ignoreSearchCase || /\/i$/.test(match)) {
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
  var pass = false;
  var node;
  var names = [];
  while (node = walker.nextNode()) {
    var nName = node.parentNode.nodeName;
    if (nName !== "SCRIPT" && nName !== "STYLE" && nName !== "NOSCRIPT" && node.data.trim() !== "" && !node.parentNode.hasAttribute("cVim")) {
      var matchPosition = (regexp ? node.data.search(match) : node.data.indexOf(match));
      if (!pass) {
        if (matchPosition >= 0) {
          if (regexp) {
            var matches = node.data.match(match);
            if (!matches.length || matches[0] === "")
              continue;
          }
          var mark = document.createElement("mark");
          var mid = node.splitText(matchPosition);
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
