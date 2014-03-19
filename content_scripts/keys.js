var keyQueue, inputFocused, insertMode, commandMode, port, skipDefault, settings;
var inputElements = [];
var inputIndex = 0;
keyDown = function(e) {
  if (e.which === 16) return;
  if (!insertMode && !document.activeElement.isInput()) {
    if (e.which > 40 && e.which !== 91 && e.which !== 123) {
      e.stopPropagation();
    }
  }
  if (e.which === 27) {
    if (hints_active) {
      e.preventDefault();
      e.stopPropagation();
      Hints.hideHints();
    }
    insertMode = false;
    Mappings.actions.inputFocused = false;
    if (document.activeElement.isInput()) {
      document.activeElement.blur();
    }
  } else if (e.which === 32 && hints_active) {
    e.preventDefault();
    e.stopPropagation();
    Hints.hideHints();
  }
  if (Mappings.actions.inputFocused || commandMode) {
    if (e.keyCode === 27) {
      Mappings.actions.inputFocused = false;
      commandMode = false;
      Command.hide();
    } else if (Mappings.actions.inputFocused && e.keyCode === 9) { // Tab
      e.preventDefault();
      Mappings.actions.handleTab(e);
    } else if (bar.style.display === "block" && /command/.test(document.activeElement.id || document.activeElement.className)) { // General command bar actions
      switch (e.keyCode) {
        case 8: // Backspace
          if (barInput.value === "") {
            commandMode = false;
            Command.hide();
          } else if (Command.type === "search") {
            Find.clear();
            setTimeout(function() {
              if (barInput.value !== "") {
                Find.highlight(document.body, barInput.value, true);
              }
            }, 0);
          } else if (barInput.value !== "") {
            Search.index = null;
            setTimeout(function() {
              Command.parse()
            }, 0);
          }
          break;
        case 9: // Tab
          if (!/input|textarea/i.test(document.activeElement.nodeName)) {
            Mappings.actions.inputFocused = false;
          } else {
            e.preventDefault();
            Mappings.actions.handleTab(e);
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
          Command.enterHit = true;
          if (Command.type === "action" && Command.history["action"]) {
            Command.history.action.push(barInput.value);
            chrome.runtime.sendMessage({action: "appendHistory", value: barInput.value, type: "action"});
          } else if (Command.type === "search") {
            e.preventDefault();
            document.activeElement.blur();
          }
          if (Command.type === "search") {
            Find.index = 0;
            Find.search(false, 1);
            Command.hide();
          } else if (Command.actionType === "query") {
            Search.go();
          } else {
            Command.parse(barInput.value);
          }
          break;
        default:
          if (Command.type === "action") {
            setTimeout(function() {
              Command.parse();
            }, 0);
          } else {
            setTimeout(function() {
              if (Command.type === "search") {
                Find.clear();
                if (barInput.value !== "") {
                  Find.highlight(document.body, barInput.value, true);
                }
              }
            }, 2);
          }
          break;
      }
    }
  }
};

keyPress = function(e) {
  if (!insertMode && !document.activeElement.isInput()) {
    setTimeout(function() {
      Mappings.convertToAction(String.fromCharCode(e.which)); // Mappable commands go here
    }, 0);
  }
};

document.addEventListener("keypress", keyPress, true);
document.addEventListener("keydown", keyDown, true);
