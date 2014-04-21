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

Frames.getFrames = function() {
  var elements = document.getElementsByTagName("iframe");
  Frames.elements = [];
  for (var i = 0; i < elements.length; i++) {
    var computedStyle = getComputedStyle(elements[i]);
    var br = elements[i].getBoundingClientRect();
    if (elements[i].getAttribute("aria-hidden") !== "true" && br.top >= 0 && br.left >= 0 && br.top < window.innerHeight && computedStyle.display !== "none" && computedStyle.opacity !== "0") {
      Frames.elements.push(elements[i]);
    }
  }
};

Frames.nextFrame = function(repeats, n) {
  if (focusDocumentNext) {
    focusDocumentNext = false;
    Frames.focusMain();
  } else {
    if (Frames.elements.length === 0 || repeats === -1) return Frames.focusMain();
    if (!n) {
      Frames.index = (((repeats + Frames.index) % Frames.elements.length) + Frames.elements.length) % Frames.elements.length;
    } else if (Frames.index + 1 >= Frames.elements.length) return false;
    document.activeElement.blur();
    Frames.elements[Frames.index].focus();
    Frames.oldBorder = Frames.elements[Frames.index].style.border;
    Frames.boxSizing = Frames.elements[Frames.index].style.boxSizing;
    Frames.elements[Frames.index].style.boxSizing = "border-box";
    Frames.elements[Frames.index].style.border = "4px solid yellow";
    setTimeout(function() {
      Frames.elements[Frames.index].style.border = Frames.oldBorder;
      Frames.elements[Frames.index].style.boxSizing = Frames.boxSizing;
    }, 350);
    Mappings.queue = "";
    if (!n) {
      var wtf = (((repeats + Frames.index) % Frames.elements.length) + Frames.elements.length) % Frames.elements.length;
      if (wtf === 0) {
        focusDocumentNext = true;
      }
    }
  }
};

chrome.runtime.onMessage.addListener(function(request) {
  if (request.action === "focus" && window.self === window.top) {
    Frames.getFrames();
    if (request.repeats > 1) {
      Frames.index = request.repeats - 1;
      return Frames.nextFrame(request.repeats - 1, true);
    } else if (request.repeats === -1) return Frames.focusMain();
    Frames.nextFrame(1);
  } else if (request.action === "focusMain") {
    Frames.focusMain();
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
    Frames.getFrames();
    Frames.index = -1;
  }
});
