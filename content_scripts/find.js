var Find = {};

Find.search = function(reverse, looseFocus) {
  var selection;
  if (Command.enterHit) {
    var i = barInput.value;
    barInput.value = "";
    window.find(i, false, reverse, true, false, true, false);
    barInput.value = i;
  } else {
    window.find(barInput.value, false, reverse, true, false, true, false);
  }
  if (/command/.test(document.getSelection().baseNode.id)) {
    document.getElementById("command_bar").focus();
  }
};

Find.highlight = function(node, text) {
  if (Find.clearing) return;
  var skip = 0;
  if (node.nodeType === 3) {
    var p = node.data.toUpperCase().indexOf(text);
    if (p >= 0) {
      var span = document.createElement("span");
      span.className = "highlight";
      span.style.backgroundColor = "yellow";
      var m = node.splitText(p);
      var e = m.splitText(text.length);
      var mc = m.cloneNode(true);
      span.appendChild(mc);
      m.parentNode.replaceChild(span, m);
      skip = 1;
    }
  }
  else if (node.nodeType === 1 && node.childNodes && node.tagName !== "SCRIPT" && node.tagName !== "STYLE") {
    for (var i = 0; i < node.childNodes.length; ++i) {
      i += this.highlight(node.childNodes[i], text);
    }
  }
  return skip;
}

Find.clear = function() {
  Find.clearing = true;
  var h = document.getElementsByClassName("highlight");
  for (var i = 0; i < h.length; i++) {
    var p = h[i].parentNode;
    p.replaceChild(h[i].firstChild, h[i]);
    p.normalize();
  }
  if (document.getElementsByClassName("highlight").length) {
    this.clear();
  } else {
    Find.clearing = false;
  }
}
