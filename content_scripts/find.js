var Find = {};

Find.highlights = [];
Find.index = 0;
Find.matches = [];
Find.tries = 0;

Find.search = function(reverse, repeats) {
  if (!this.matches.length)
    return;
  if (this.index >= 0)
    this.matches[this.index].style.backgroundColor = "";
  if (reverse && repeats === 1 && this.index == 0) {
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
    return this.search(reverse, 1);
  } else {
    this.tries = 0;
  }
  this.matches[this.index].style.backgroundColor = "#ff9632";
  var b = this.matches[this.index].getBoundingClientRect();
  window.scrollBy(b.left, b.top - window.innerHeight / 2);
};

Find.highlight = function(baseNode, match, regexp) {
  if (this.clearing) return;
  if (regexp) {
    if (match === "." || match === ".*") {
      match = ".*.";
    }
    try {
      match = new RegExp(match, "gi");
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
    if (nName !== "SCRIPT" && nName !== "STYLE" && nName !== "NOSCRIPT" && node.data.trim() !== "") {
      if (regexp) {
        var matchPosition = node.data.regexIndexOf(match);
      } else {
        var matchPosition = node.data.indexOf(match);
      }
      if (!pass) {
        if (matchPosition >= 0) {
          if (regexp) {
            var matches = node.data.match(match);
            if (!matches.length)
              continue;
            var i = 0;
            if (matches[i] === "")
              continue;
          }
          var mark = document.createElement("mark");
          var mid = node.splitText(matchPosition);
          if (regexp) {
            mid.splitText(matches[i].length);
          } else {
            mid.splitText(match.length);
          }
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
  document.body.normalize();
};

Find.clear = function() {
  this.clearing = true;
  for (var i = 0; i < this.matches.length; i++) {
    try { // Ignore text nodes that have changed since last search
      this.matches[i].parentNode.replaceChild(this.matches[i].firstChild, this.matches[i]);
    } catch(e) {
      continue;
    }
  }
  this.matches = [];
  this.clearing = false;
}
