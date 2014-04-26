var Visual = {};

var textNodes = [];
var nodePositions = [];
var currentNode = 0;

function getTextNodes() {
  var t = document.createTreeWalker(document.body, 4, null, false);
  var node;
  while (node = t.nextNode()) {
    if (node.nodeType === 3 && node.data.trim() !== "") {
      textNodes.push(node);
      nodePositions.push(0);
    }
  }
}
Visual.collapse = function() {
  visualMode = false;
  var b = textNodes.indexOf(s.anchorNode);
  var e = textNodes.indexOf(s.extentNode);
  if ((b===e && s.extentOffset < s.baseOffset) || (e<b)) {
    s.collapseToStart();
  } else {
    s.collapseToEnd();
  }
};
Visual.closestNode = function() {
  for (var i = 0; i < textNodes.length; ++i) {
    var ee = textNodes[i].parentElement;
    var br = ee.getBoundingClientRect();
    if (br.top > 0) {
      return textNodes[i];
    }
  }
};
Visual.scrollIntoView = function() {
  var ee = s.extentNode.parentElement;
  var br = ee.getBoundingClientRect();
  if (br.top < 0) {
    window.scrollBy(0, br.top);
  } else if (br.top + br.height > document.documentElement.clientHeight) {
    window.scrollBy(0, br.top + br.height - document.documentElement.clientHeight);
  }
};
Visual.queue = "";
Visual.action = function(key) {
  s = document.getSelection();
  if (key === "g") {
    if (!this.queue.length) {
      return this.queue += "q";
    } else {
      this.queue = "";
      if (!visualMode) {
        s.modify("move", "backward", "documentboundary");
      } else if (visualMode) {
        s.modify("extend", "backward", "documentboundary");
      }
      return;
    }
  } else this.queue = "";
  log(key);
  if (key === "v") {
    // if (!visualMode) {
    visualMode = !visualMode;
    // }
  }
  nodePositions[currentNode] = s.extentOffset;
  currentNode = textNodes.indexOf(s.extentNode);
  if (s.type === "Caret" && !visualMode) {
    switch (key) {
      case "l":
        s.modify("move", "forward", "character");
        break;
      case "h":
        s.modify("move", "backward", "character");
        break;
      case "k":
        s.modify("move", "backward", "line");
        break;
      case "j":
        s.modify("move", "forward", "line");
        break;
      case "w":
        s.modify("move", "forward", "word");
        break;
      case "b":
        s.modify("move", "backward", "word");
        break;
      case "0":
        s.modify("move", "backward", "lineboundary");
        break;
      case "$":
        s.modify("move", "forward", "lineboundary");
        break;
      case "G":
        s.modify("move", "forward", "documentboundary");
        break;
    }
  } else if (s.type === "Range" || visualMode) {
    visualMode = true;
    switch (key) {
      case "l":
        s.modify("extend", "forward", "character");
        break;
      case "h":
        s.modify("extend", "backward", "character");
        break;
      case "k":
        s.modify("extend", "backward", "line");
        break;
      case "j":
        s.modify("extend", "forward", "line");
        break;
      case "w":
        s.modify("extend", "forward", "word");
        break;
      case "b":
        s.modify("extend", "backward", "word");
        break;
      case "0":
        s.modify("extend", "backward", "lineboundary");
        break;
      case "$":
        s.modify("extend", "forward", "lineboundary");
        break;
      case "G":
        s.modify("extend", "forward", "documentboundary");
        break;
      case "y":
        Clipboard.copy(s.toString());
        Visual.collapse();
        break;
    }
  }
  Visual.scrollIntoView();
};
