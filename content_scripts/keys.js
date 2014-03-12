//j -> 74, k -> 75, d -> 68, u -> 85, s -> 83, w -> 87, t -> 84, x -> 88, g -> 71

var keyQueue, inputFocused, insertMode, commandMode;
var inputElements = [];
var inputIndex = 0;;
var validCommandString = false;
keyDown = function(e) {
  if (e.which === 16) return;
  if (e.which === 27) {
    insertMode = false;
    inputFocused = false;
    if (commandMode) {
      commandMode = false;
      Command.hide();
    }
    document.activeElement.blur();
  } else if (inputFocused && e.which === 9) {
    e.preventDefault();
    if (inputIndex + 1 === inputElements.length) {
      inputIndex = 0;
    } else {
      inputIndex++;
    }
    log(inputIndex);
    log(inputElements);
    inputElements[inputIndex].focus();
  } else if (inputFocused && e.which !== 9) {
    inputFocused = false;
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
      } else if (e.which === 27 && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        Hints.hideHints();
      } else if (hints_active) {
        Hints.handleHint(e);
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
            case 88:
              chrome.runtime.sendMessage({action: "closeTab"});
              break;
            case 84:
              chrome.runtime.sendMessage({action: "newTab"});
              break;
            case 71:
              keyQueue = true;
              break;
            case 191:
              commandMode = true;
              Command.show();
              break;
          }
        }
      }
    }
  }
};

window.onload = function() {
  if (/google\.com/.test(document.URL)) {
    setTimeout(function() {
      document.activeElement.blur();
      document.body.firstChild.focus();
    }, 0);
  }
};

document.addEventListener("DOMContentLoaded", function() {
  document.addEventListener("keydown", keyDown, false);
});
