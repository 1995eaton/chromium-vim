function replaceTextNodes(root, s, r, group) {
  s = new RegExp(s, "g" + group);
  var w = document.createTreeWalker(root, 4, null, false);
  var node;
  while (node = w.nextNode()) {
    var n = node.parentNode.nodeName;
    if (n !== "SCRIPT" && n !== "STYLE" && n !== "NOSCRIPT" && node.data.trim() !== "" && !node.parentNode.hasAttribute("cVim")) {
      node.data = node.data.replace(s, r);
    }
  }
}
