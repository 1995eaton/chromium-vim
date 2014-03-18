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
      Hints.hideHints();
    }
    insertMode = false;
    Mappings.actions.inputFocused = false;
    if (document.activeElement.isInput()) {
      document.activeElement.blur();
    }
  }
  var ch = Mappings.fromKeyDown(e);
  setTimeout(function() {
    Mappings.convertToAction(ch); // Mappable commands go here
  }, 0);
  if (!Command.enterHit && Command.type === "search") {
    document.activeElement.blur();
    barInput.focus();
  } else if (Command.enterHit && Command.type === "search") {
    if (e.which === 78) {
      e.preventDefault();
      //Find.search(e.shiftKey, false);
    }
    //document.activeElement.blur();
  }
  if (Mappings.actions.inputFocused || commandMode) {
    if (e.which === 27) {
      Mappings.actions.inputFocused = false;
      commandMode = false;
      Command.hide();
    } else if (Mappings.actions.inputFocused || /command/.test(document.activeElement.id || document.activeElement.className)) { // General command bar actions
      switch (e.which) {
        case 8: // Backspace
          if (barInput.value === "") {
            commandMode = false;
            Command.hide();
          } else if (Command.type === "search") {
            Find.clear();
            setTimeout(function() {
              if (barInput.value !== "") {
                Find.highlight(document.body, barInput.value);
              }
            }, 0);
            barInput.blur();
            window.focus();
            window.blur();
            barInput.focus();
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
            Find.search(false);
          } else if (Command.actionType === "query") {
            Search.go();
          } else {
            Command.parse(barInput.value);
          }
          Command.hide();
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
                  Find.highlight(document.body, barInput.value);
                }
              }
            }, 2);
          }
          break;
      }
    }
  }
};

document.addEventListener("keydown", keyDown, true);
