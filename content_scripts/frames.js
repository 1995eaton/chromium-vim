var Frames = {};

Frames.focus = function() {
  window.focus();
  var outline = document.createElement("div");
  outline.style.position = "fixed";
  outline.style.width = "100%";
  outline.style.height = "100%";
  outline.style.left = "0";
  outline.style.top = "0";
  outline.style.right = "0";
  outline.style.zIndex = "9999999999";
  outline.style.boxSizing = "border-box";
  outline.style.border = "3px solid yellow";
  document.body.appendChild(outline);
  window.setTimeout(function() {
    document.body.removeChild(outline);
  }, 500);
};

Frames.isVisible = function() {
  return document.body &&
         window.innerWidth &&
         window.innerHeight;
};

Frames.init = function(isRoot) {
  if (Frames.isVisible()) {
    chrome.runtime.sendMessage({action: "addFrame", isRoot: isRoot}, function(index) {
      Frames.index = index;
    });
  }
};

document.addEventListener("DOMContentLoaded", function() {
  Frames.init(self === top);
}, false);
