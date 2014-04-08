var keyQueue, inputFocused, insertMode, commandMode, port, skipDefault, settings;
var inputElements = [];
var inputIndex = 0;
var modifier = "";

keyDown = function(e) {
  if (e.which === 16) return;

  if (e.ctrlKey) {
    modifier = "<C-";
  } else if (e.metaKey) {
    modifier = "<M-";
  } else if (e.altKey) {
    modifier = "<A-";
  } else {
    modifier = "";
  }

  if (modifier) {
    modifier = modifier + (e.shiftKey? String.fromCharCode(e.which) : String.fromCharCode(e.which).toLowerCase()) + ">";
  } else {
    modifier = null;
  }

  if (!insertMode && !document.activeElement.isInput()) {
    if (e.which > 40 && e.which !== 91 && e.which !== 123) {
      e.stopPropagation();
    }
  }

  if (e.which === 27 || (e.which === 219 && e.ctrlKey)) {
    if (Hints.active) {
      e.preventDefault();
      e.stopPropagation();
      Hints.hideHints();
    }
    insertMode = false;
    Mappings.actions.inputFocused = false;
    if (document.activeElement.isInput()) {
      document.activeElement.blur();
    }
  } else if (e.which === 32 && Hints.active) {
    e.preventDefault();
    e.stopPropagation();
    Hints.hideHints();
  }

  if (Mappings.actions.inputFocused || commandMode) {

    if (e.keyCode === 27 || (e.which === 219 && e.ctrlKey)) { // <Esc> + <C-[>
      Mappings.actions.inputFocused = false;
      commandMode = false;
      Command.hide();
    } else if (Mappings.actions.inputFocused && e.keyCode === 9) { // Tab
      e.preventDefault();
      if (!e.shiftKey) {
        if (Mappings.actions.inputElementsIndex + 1 === Mappings.actions.inputElements.length) {
          Mappings.actions.inputElementsIndex = 0;
        } else {
          Mappings.actions.inputElementsIndex++;
        }
      } else {
        if (Mappings.actions.inputElementsIndex - 1 < 0) {
          Mappings.actions.inputElementsIndex = Mappings.actions.inputElements.length - 1;
        } else {
          Mappings.actions.inputElementsIndex--;
        }
      }
      if (Mappings.actions.inputElements.length) {
        Mappings.actions.inputElements[Mappings.actions.inputElementsIndex].focus();
      }
    } else if (Command.bar.style.display === "block" && document.activeElement.hasOwnProperty("cVim") && document.activeElement.id === "command_input") { // Non-mappable command bar actions

      switch (e.keyCode) {
        case 18: case 17: case 91: case 123: case 16: // Ignore non-character keys (CTRL, SHIFT, etc)
          break;
        case 8: // Backspace
          if (Command.input.value === "") {
            commandMode = false;
            Command.hide();
          } else if (Command.type === "search") {
            Find.clear();
            setTimeout(function() {
              if (Command.input.value !== "") {
                Find.highlight(document.body, Command.input.value, true);
              }
            }, 0);
          } else if (Command.input.value !== "") {
            Search.index = null;
            setTimeout(function() {
              Command.parse()
            }, 0);
          }
          break;
        case 9: // Tab
          if (!document.activeElement.isInput()) {
            Mappings.actions.inputFocused = false;
            break;
          }
          e.preventDefault();
          if (Mappings.actions.inputFocused) {
          } else if (document.activeElement.hasOwnProperty("cVim")) {
            if (Command.type === "action") {
              if (Command.actionType === "query" || Command.actionType === "bookmarks") {
                Search.nextResult(e.shiftKey);
              }else {
                if (!Command.typed) {
                  Command.input.value = "";
                  Command.complete(Command.input.value, e.shiftKey, true);
                } else {
                  Command.complete(Command.typed, e.shiftKey, true);
                }
              }
            }
          }
          break;
        case 38: // Up
          if (Command.type !== "search") {
            e.preventDefault();
            Command.history.cycle("action", true);
          }
          break;
        case 40: // Down
          e.preventDefault();
          Command.history.cycle("action", false);
          break;
        case 13: // Enter
          Command.enterHit = true;
          if (Command.type === "action" && Command.history["action"]) {
            Command.history.action.push(Command.input.value);
            chrome.runtime.sendMessage({action: "appendHistory", value: Command.input.value, type: "action"});
          } else if (Command.type === "search") {
            e.preventDefault();
            document.activeElement.blur();
          }
          if (Command.type === "search") {
            setTimeout(function() {
              Find.index = -1;
              Find.search(false, 1);
              Command.hide();
            }, 0);
          } else if (Command.actionType === "query") {
            Search.go();
          } else {
            Command.parse(Command.input.value);
          }
          break;
        default:
          Command.history.reset = true;
          if (Command.type === "action") {
            setTimeout(function() {
              Command.parse();
            }, 0);
          } else {
            setTimeout(function() {
              if (Command.type === "search") {
                Find.clear();
                if (Command.input.value !== "") {
                  Find.highlight(document.body, Command.input.value, true);
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
      e.preventDefault();
      e.stopPropagation();
      if (modifier) {
        Mappings.convertToAction(modifier); // Mappable commands go here
      } else {
        Mappings.convertToAction(String.fromCharCode(e.which)) // Mappable commands go here
      }
    }, 0);
  }
};


var Mouse = {};
mouseMove = function(e) {
  Mouse.x = e.pageX;
  Mouse.y = e.pageY;
};


keyUp = function(e) {
  if (!insertMode) {
    e.stopPropagation();
    e.preventDefault();
  }
};

document.addEventListener("DOMContentLoaded", function() {
  document.addEventListener("keypress", keyPress, true);
  document.addEventListener("keyup", keyUp, true);
  document.addEventListener("keydown", keyDown, true);
  document.addEventListener("mousemove", mouseMove, true);
});
