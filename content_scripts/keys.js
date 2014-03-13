//j -> 74, k -> 75, d -> 68, u -> 85, s -> 83, w -> 87, t -> 84, x -> 88, g -> 71

var keyQueue, inputFocused, insertMode, commandMode;
var inputElements = [];
var inputIndex = 0;;
var validCommandString = false;
keyDown = function(e) {
  if (e.which === 16) return;
  log(e.which);
  if (commandMode) {
    var input = document.getElementById("command_input");
    if (/command/.test(document.activeElement.id)) {
      switch (e.which) {
        case 8:
          input.blur();
          window.focus();
          window.blur();
          input.focus();
          if (input.value === "") {
            commandMode = false;
            Command.hide();
          }
          break;
        case 27:
          commandMode = false;
          Command.hide();
          break;
        case 13:
          document.getElementById("command_input").blur();
              Command.search(false);
          Command.enterHit = true;
          //document.body.focus();
          break;
        default:
          input.blur();
          window.focus();
          window.blur();
          var i = input.value;
          if (document.getSelection().rangeCount) {
            document.getSelection().collapseToEnd();
          }
          document.getElementById("command_input").value = i;
          input.focus();
          setTimeout(function() {
            if (Command.type === "search") {
              Command.search(false);
            }
          }, 2);
          break;
      }
    } else if (e.which === 191 || e.which === 186) {
      setTimeout(function() {
        input.focus();
      }, 0);
    }
  } else {
    if (e.which === 27) {
      insertMode = false;
      inputFocused = false;
      document.activeElement.blur();
    } else if (inputFocused && e.which === 9) {
      e.preventDefault();
      if (inputIndex + 1 === inputElements.length) {
        inputIndex = 0;
      } else {
        inputIndex++;
      }
      inputElements[inputIndex].focus();
    } else if (inputFocused && e.which !== 9) {
      inputFocused = false;
    }
  }
  if (!insertMode && !document.activeElement.isInput()) {
    if (keyQueue) {
      keyQueue = false;
      validCommandString = true;
      if (e.shiftKey) {
        switch (e.which) {
          case 84:
            chrome.runtime.sendMessage({action: "previousTab"});
            break;
          default:
            validCommandString = false;
            break;
        }
      } else {
        switch(e.which) {
          case 84:
            chrome.runtime.sendMessage({action: "nextTab"});
            break;
          case 71:
            Scroll.scroll("top");
            break;
          case 73:
            if (!inputElements.length) {
              var inputElementsTemp = document.querySelectorAll("input,textarea");
              for (var i = 0; i < inputElementsTemp.length; i++) {
                if (inputElementsTemp[i].nodeName === "TEXTAREA" || (inputElementsTemp[i].nodeName === "INPUT" && inputElementsTemp[i].type === "text")) {
                  inputElements.push(inputElementsTemp[i]);
                  log(inputElements);
                }
                if (i + 1 === inputElementsTemp.length) {
                  log(inputElements);
                  for (var i2 = 0; i2 < inputElements.length; i2++) {
                    if (inputElements[i2].offsetTop >= document.body.scrollTop) {
                      inputFocused = true;
                      inputIndex = i2;
                      setTimeout(function() {
                        log(inputElements);
                        log(inputIndex);
                        inputElements[i2].focus();
                      }, 0);
                      break;
                    }
                  }
                }
              }
            } else {
              setTimeout(function() {
                inputFocused = true;
                inputElements[inputIndex].focus();
              }, 0);
            }
          default:
            keyQueue = false;
            validCommandString = false;
            break;
        }
      }
    }
    log(e.which);
    if (!keyQueue) {
      if (e.which === 70 && !e.ctrlKey && !e.metaKey && !hints_active) {
        Hints.create(e.shiftKey, false);
      } else if (e.which === 27 && !e.ctrlKey && !e.shiftKey && !e.altKey && hints_active) {
        Hints.hideHints();
      } else if (hints_active && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        Hints.handleHint(String.fromCharCode(e.which));
      } else if (!e.ctrlKey && !e.metaKey) {
        if (validCommandString) return validCommandString = false;
        if (e.shiftKey) {
          switch (e.which) {
            case 71:
              Scroll.scroll("bottom");
              break;
            case 75: case 82:
              chrome.runtime.sendMessage({action: "nextTab"});
              break;
            case 74: case 69:
              chrome.runtime.sendMessage({action: "previousTab"});
              break;
            case 72: case 83:
              history.go(-1);
              break;
            case 76: case 68:
              history.go(1);
              break;
            case 78:
              if (commandMode) {
                Command.search(true, true);
              }
              break;
            case 186:
              commandMode = true;
              Command.enterHit = false;
              Command.show(false);
              break;
            default:
              break;
          }
        } else {
          switch (e.which) {
            case 74: case 83:
              Scroll.scroll("down");
              break;
            case 75: case 87:
              Scroll.scroll("up");
              break;
            case 68:
              Scroll.scroll("pageDown");
              break;
            case 85: case 69:
              Scroll.scroll("pageUp");
              break;
            case 72:
              Scroll.scroll("left");
              break;
            case 73:
              insertMode = true;
              break;
            case 76:
              Scroll.scroll("right");
              break;
            case 82:
              chrome.runtime.sendMessage({action: "reloadTab"});
              break;
            case 88:
              chrome.runtime.sendMessage({action: "closeTab"});
              break;
            case 84:
              chrome.runtime.sendMessage({action: "newTab"});
              break;
            case 71:
              keyQueue = true;
              break;
            case 78:
              if (commandMode) {
                Command.search(false, true);
              }
              break;
            case 191:
              commandMode = true;
              Command.enterHit = false;
              Command.show(true);
              break;
            default:
              break;
          }
        }
      }
    }
  }
};
document.addEventListener("keydown", keyDown, true);
var evt = document.createElement("script");
evt.innerHTML = '(function disallowEvents() {\n  if (new RegExp("http(s)?:\/\/www\.google\.com", "i").test(document.URL)) return;\n  var isInputElement = function(elem) {\n    return elem.nodeName === "TEXTAREA" || elem.nodeName === "INPUT";\n  };\n  var disabledHandlers = [];\n  var isInput;\n  document.addEventListener("keydown", function(e) {\n    if (e.which === 73 && !isInputElement(e.target) && !isInputElement(document.activeElement)) {\n      for (var i = 0; i < disabledHandlers.length; i++) {\n        document.addEventListener(disabledHandlers[i][0], disabledHandlers[i][1], disabledHandlers[i][2], true);\n      }\n      isInput = true;\n    } else if (e.which === 27 && isInput) {\n      for (var i = 0; i < disabledHandlers.length; i++) {\n        document.removeEventListener(disabledHandlers[i][0], disabledHandlers[i][1], disabledHandlers[i][2], true);\n      }\n      isInput = false;\n    }}, false, true);\n  var newHandler = EventTarget.prototype.addEventListener; EventTarget.prototype.addEventListener = function(eventType, func, capture, passthrough) {\n    this.newHandler = newHandler;\n    if (!passthrough && /keydown/.test(eventType)) {\n      disabledHandlers.push([eventType, func, capture]);\n      return;\n    }\n    this.newHandler(eventType, func, capture);\n  }\n})();';

document.lastChild.appendChild(evt);
document.addEventListener("DOMContentLoaded", function() {
  Command.setup();
});
