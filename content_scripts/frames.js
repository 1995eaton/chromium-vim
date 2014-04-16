var Frames = {};
var focusDocumentNext = false;
Frames.oldBorder = "";

Frames.focusMain = function() {
  document.body.appendChild(Frames.highlight);
  window.focus();
  document.body.focus();
  setTimeout(function() {
    document.body.removeChild(Frames.highlight);
  }, 350);
};

Frames.nextFrame = function(repeats) {
  if (focusDocumentNext) {
    focusDocumentNext = false;
    Frames.focusMain();
  } else {
    Frames.elements[(Frames.index < 0)? 0 : Frames.index].style.border = Frames.oldBorder;
    Frames.index = (((repeats + Frames.index) % Frames.elements.length) + Frames.elements.length) % Frames.elements.length;
    Frames.elements[Frames.index].focus();
    log(Frames.elements[Frames.index].innerHTML);
    Frames.oldBorder = Frames.elements[Frames.index].style.border;
    Frames.boxSizing = Frames.elements[Frames.index].style.boxSizing;
    Frames.elements[Frames.index].style.boxSizing = "border-box";
    Frames.elements[Frames.index].style.border = "4px solid yellow";
    setTimeout(function() {
      Frames.elements[Frames.index].style.border = Frames.oldBorder;
      Frames.elements[Frames.index].style.boxSizing = Frames.boxSizing;
    }, 350);
    Mappings.queue = "";
    var wtf = (((repeats + Frames.index) % Frames.elements.length) + Frames.elements.length) % Frames.elements.length;
    if (wtf === 0) {
      focusDocumentNext = true;
    }
  }
};

chrome.runtime.onMessage.addListener(function(request) {
  if (request.action === "focus" && window.self === window.top) {
    Frames.nextFrame(request.repeats);
  }
});

document.addEventListener("DOMContentLoaded", function() {
  Frames.highlight = document.createElement("div");
  Frames.highlight.style.zIndex = "99999";
  Frames.highlight.style.border = "4px solid yellow";
  Frames.highlight.style.boxSizing = "border-box";
  Frames.highlight.style.position = "fixed";
  Frames.highlight.style.width = "100%";
  Frames.highlight.style.height = "100%";
  Frames.highlight.style.left = "0";
  Frames.highlight.style.top = "0";
  if (window.self === window.top) {
    Frames.elements = document.getElementsByTagName("iframe");
    if (window.top.Frames.elements.length === 0) {
      Frames.nextFrame = function() {
        return Frames.focusMain();
      };
    }
    Frames.index = -1;
  }
});
