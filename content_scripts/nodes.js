function nativeTreeWalker() {
  var walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
  );

  var node;
  var textNodes = [];

  while(node = walker.nextNode()) {
    var nType = node.parentNode.nodeName;
    if (nType === "SCRIPT" || nType === "STYLE" || nType === "NOSCRIPT" || node.data.trim() === "") {
      continue;
    }
    textNodes.push(node.data);
  }
  return textNodes;
}

nativeTreeWalker();
