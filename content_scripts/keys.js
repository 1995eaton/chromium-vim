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
  var ch = Mappings.fromKeyDown(e);
  Mappings.convertToAction(ch); // Mappable commands go here
  if (commandMode) {
    if (e.which === 27) {
      commandMode = false;
      Command.hide();
    } else if (/command/.test(document.activeElement.id || document.activeElement.className)) { // General command bar actions
      switch (e.which) {
        case 8: // Backspace
          if (Command.type === "search") {
            barInput.blur();
            window.focus();
            window.blur();
            barInput.focus();
          } else if (barInput.value !== "") {
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
          Mappings.actions.handleTab(e);
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
          }
          barInput.blur();
          if (Command.type === "search") {
            Command.search(false);
          } else if (Command.actionType === "query") {
            Search.go();
            Command.hide();
          } else {
            Command.parse(barInput.value);
            Command.hide();
          }
          break;
        default:
          if (Command.type === "action") {
            setTimeout(function() {
              Command.parse();
            }, 0);
          } else {
            barInput.blur();
            window.focus();
            window.blur();
            var i = barInput.value;
            if (document.getSelection().rangeCount) {
              document.getSelection().collapseToEnd();
            }
            document.getElementById("command_input").value = i;
            barInput.focus();
            setTimeout(function() {
              if (Command.type === "search") {
                Command.search(false);
              }
            }, 2);
          }
          break;
      }
    }
  }
};

document.addEventListener("keydown", keyDown, true);
