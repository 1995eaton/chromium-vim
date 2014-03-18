var Find = {};

Find.highlights = [];
Find.index = null;
Find.matches = [];

Find.search = function(reverse, looseFocus) {
  if (!this.matches.length)
    return;
  if (Find.index > Find.matches.length)
    Find.index = -1;
  if (this.index >= 0)
    this.matches[this.index].style.backgroundColor = "";
  if (reverse) {
    this.index--;
    if (this.index < 0)
      this.index = this.matches.length - 1;
  } else {
    this.index++;
    this.index %= this.matches.length;
  }
  if (!this.matches[this.index].isVisible())
    return this.search(reverse);
  this.matches[this.index].style.backgroundColor = "#ff9632";
  var b = this.matches[this.index].getBoundingClientRect();
  window.scrollBy(b.left, b.top - window.innerHeight / 2);
};


Find.highlight = function(node, text) {
  var walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null, false);
  var pass = false;
  document.body.normalize();
  while(node = walker.nextNode()) {
    if (node.nodeValue.trim() === "" || node.nodeType !== 3 || node.parentNode.nodeName === "SCRIPT" || node.parentNode.nodeName === "STYLE")
      continue;
    var position = node.data.indexOf(text);
    if (!pass && position >= 0) {
      var mark = document.createElement("mark");
      mark.className = "cVim-highlight";
      var middle = node.splitText(position);
      middle.splitText(text.length);
      mark.appendChild(middle.cloneNode(true));
      middle.parentNode.replaceChild(mark, middle);
      this.matches.push(mark);
      pass = true;
    } else if (pass) {
      pass = false;
    }
  }
}

Find.clear = function() {
  Find.clearing = true;
  for (var i = 0; i < this.matches.length; i++) {
    var p = this.matches[i].parentNode;
    p.normalize();
    p.replaceChild(this.matches[i].firstChild, this.matches[i]);
  }
  this.matches.length = 0;
}
