var keyQueue, inputFocused, insertMode, commandMode, port;
var inputElements = [];
var inputIndex = 0;
var validCommandString = false;
keyDown = function(e) {
  if (e.which === 16) return;
  if (commandMode) {
    var input = document.getElementById("command_input");
    if (e.which === 27) {
      commandMode = false;
      Command.hide();
    } else if (/command/.test(document.activeElement.id || document.activeElement.className)) {
      switch (e.which) {
        case 8: // Backspace
          if (Command.type === "search") {
            input.blur();
            window.focus();
            window.blur();
            input.focus();
          } else if (input.value !== "") {
            Search.index = null;
            setTimeout(function() {
              Command.parse()
            }, 0);
          } else {
            commandMode = false;
            Command.hide();
          }
          break;
        case 9: // Tab
          e.preventDefault();
          if (Command.type === "action") {
            if (Command.actionType === "query") {
              Search.nextResult(e.shiftKey);
            } else {
              if (!Command.typed) {
                input.value = "";
                Command.complete(input.value, e.shiftKey, true);
              } else {
                Command.complete(Command.typed, e.shiftKey, true);
              }
            }
          }
          break;
        case 38: // Up
          e.preventDefault();
          Command.history.cycle("action", true);
          break;
        case 40: // Down
          e.preventDefault();
          Command.history.cycle("action", false);
          break;
        case 13: // Enter
          if (Command.type === "action" && Command.history["action"]) {
            Command.history.action.push(barInput.value);
            chrome.runtime.sendMessage({action: "appendHistory", value: barInput.value, type: "action"});
          }
          document.getElementById("command_input").blur();
          if (Command.type === "search") {
            Command.search(false);
            Command.enterHit = true;
          } else if (Command.actionType === "query") {
            Search.go();
            Command.hide();
          } else {
            Command.hide();
          }
          break;
        default:
          if (Command.type === "action") {
            setTimeout(function() {
              Command.parse();
            }, 0);
          } else {
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
          }
          break;
      }
    } else if (e.which === 191 || e.which === 186) { // / + :
      setTimeout(function() {
        input.focus();
      }, 0);
    }
  } else {
    if (e.which === 27) { // Esc
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
    if (e.which > 40 && e.which !== 91 && e.which !== 123) {
      e.stopPropagation();
    }
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
                if (!inputElementsTemp[i].disabled && inputElementsTemp[i].style.display !== "none" && inputElementsTemp[i].style.opacity !== "0" && (inputElementsTemp[i].nodeName === "TEXTAREA" || (inputElementsTemp[i].nodeName === "INPUT" && (inputElementsTemp[i].type === "text" || inputElementsTemp[i].type === "search")))) {
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
            case 71: // G
              Scroll.scroll("bottom");
              break;
            case 75: case 82: // K, R
              chrome.runtime.sendMessage({action: "nextTab"});
              break;
            case 74: case 69: // J, E
              chrome.runtime.sendMessage({action: "previousTab"});
              break;
            case 72: case 83: // L
              history.go(-1);
              break;
            case 76: case 68: // H
              history.go(1);
              break;
            case 79: // O
              commandMode = true;
              Command.show(false, "tabopen ");
              break;
            case 78: // N
              if (Command.type === "search") {
                Command.search(true, true);
              }
              break;
            case 186: // :
              Command.hide();
              commandMode = true;
              Command.enterHit = false;
              Command.show(false);
              break;
            default:
              break;
          }
        } else {
          switch (e.which) {
            case 74: case 83: // j, s
              Scroll.scroll("down");
              break;
            case 75: case 87: // k, w
              Scroll.scroll("up");
              break;
            case 68: // d
              Scroll.scroll("pageDown");
              break;
            case 85: case 69: // u, e
              Scroll.scroll("pageUp");
              break;
            case 72: // h
              Scroll.scroll("left");
              break;
            case 73: // i
              insertMode = true;
              break;
            case 76: // l
              Scroll.scroll("right");
              break;
            case 79: // o
              commandMode = true;
              Command.show(false, "open ");
              break;
            case 82: // r
              chrome.runtime.sendMessage({action: "reloadTab"});
              break;
            case 88: // x
              chrome.runtime.sendMessage({action: "closeTab"});
              break;
            case 84: // t
              commandMode = true;
              Command.show(false, "tabopen ");
              break;
            case 71: // g
              keyQueue = true;
              break;
            case 78: // n
              if (Command.type === "search") {
                Command.search(false, true);
              }
              break;
            case 191: // /
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
document.addEventListener("DOMContentLoaded", function() {
  Command.setup();
});
