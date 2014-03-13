(function disallowEvents() {
  var isInput = function(elem) {
    return elem.nodeName === "TEXTAREA" ||
           elem.nodeName === "INPUT";
  };
  var disabledHandlers = [];
  var isInput;
  document.addEventListener("keydown", function(e) {
    if (e.which === 73 && !isInput(e.target) && !isInput(document.activeElement)) {
      for (var i = 0; i < disabledHandlers.length; i++) {
        document.addEventListener(disabledHandlers[i][0], disabledHandlers[i][1], disabledHandlers[i][2], true);
      }
      isInput = true;
    } else if (e.which === 27 && isInput) {
      for (var i = 0; i < disabledHandlers.length; i++) {
        document.removeEventListener(disabledHandlers[i][0], disabledHandlers[i][1], disabledHandlers[i][2], true)
      }
      isInput = false;
    }}, false, true);
  var newHandler = EventTarget.prototype.addEventListener; EventTarget.prototype.addEventListener = function(eventType, func, capture, passthrough) {
    this.newHandler = newHandler;
    if (!passthrough && /keydown/.test(eventType)) {
      disabledHandlers.push([eventType, func, capture]);
      return
    }
    this.newHandler(eventType, func, capture)
  }
})();
