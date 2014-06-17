var addListeners, removeListeners, insertMode, commandMode, settings;
var Key = {};

Key.keyMap = {
  0:   "\\",
  8:   "BS",
  9:   "Tab",
  12:  "Num",
  13:  "Enter",
  19:  "Pause",
  20:  "Caps",
  27:  "Esc",
  32:  "Space",
  33:  "PageUp",
  34:  "PageDown",
  35:  "End",
  36:  "Home",
  37:  "Left",
  38:  "Up",
  39:  "Right",
  40:  "Down",
  44:  "Print",
  45:  "Insert",
  46:  "Delete",
  48:  ["0", ")"],
  49:  ["1", "!"],
  50:  ["2", "@"],
  51:  ["3", "#"],
  52:  ["4", "$"],
  53:  ["5", "%"],
  54:  ["6", "^"],
  55:  ["7", "&"],
  56:  ["8", "*"],
  57:  ["9", "("],
  96:  "0",
  97:  "1",
  98:  "2",
  99:  "3",
  100: "4",
  101: "5",
  102: "6",
  103: "7",
  104: "8",
  105: ["9", ""],
  106: "*",
  107: "+",
  109: "-",
  111: "/",
  144: "Num",
  186: [";", ":"],
  188: [",", "<"],
  189: ["-", "_"],
  190: [".", ">"],
  187: ["=", "+"],
  191: ["/", "?"],
  192: ["`", "~"],
  219: ["[", "{"],
  221: ["]", "}"],
  220: ["\\", "|"],
  222: ["'", "\""]
};

Key.fromKeyCode = function(event) {
  var key, map;
  var modifiers = [
    event.ctrlKey  ? "C" : "",
    event.altKey   ? "A" : "",
    event.metaKey  ? "M" : "",
    event.shiftKey ? "S" : ""
  ];
  var hasModifier = event.ctrlKey || event.altKey || event.metaKey;
  if (this.keyMap.hasOwnProperty(event.which.toString())) {
    map = this.keyMap[event.which.toString()];
    if (Array.isArray(map)) {
      if (!hasModifier) {
        modifiers.splice(modifiers.indexOf("S"), 1);
      }
      key = map[+(event.shiftKey && !hasModifier)];
    } else {
      key = map;
    }
  } else if (/^F[0-9]+$/.test(event.keyIdentifier)) {
    key = event.keyIdentifier;
  } else {
    key = String.fromCharCode(event.which).toLowerCase();
    if (event.shiftKey && !hasModifier) {
      key = key.toUpperCase();
    }
  }
  modifiers = modifiers.compress();
  if (modifiers.length && hasModifier) {
    return "<" + modifiers.join("-") + "-" + key + ">";
  }
  if (typeof this.keyMap[event.which.toString()] === "string") {
    return "<" + (event.shiftKey ? "S-" : "") + key + ">";
  }
  return key;
};

Key.down = function(e) {

  var asciiKey, escapeKey, validMapping, isInput;

  if (Hints.active) {
    e.stopPropagation();
    if (e.which === 18) {
      Hints.changeFocus();
    } else if (e.which === 191) {
      e.preventDefault();
      document.getElementById("cVim-link-container").style.opacity = "0";
    }
  }

  if (Hints.keyDelay) {
    e.stopPropagation();
    return e.preventDefault();
  }

  if ((e.which >= 16 && e.which <= 18) || e.which === 91 || e.which === 123) {
    return false;
  }

  if (Cursor.overlay && settings.autohidecursor) {
    Cursor.overlay.style.display = "block";
    Cursor.wiggleWindow();
  }

  if (Command.active && document.activeElement && document.activeElement.id === "cVim-command-bar-input") {
    e.stopPropagation();
  }

  asciiKey = Key.fromKeyCode(e);

  if (!asciiKey) {
    return false;
  }

  escapeKey = /^<(Esc|C-\[)>$/.test(asciiKey);

  if (Visual.caretModeActive || Visual.visualModeActive) {
    e.stopPropagation();
    Visual.selection = document.getSelection();
    if (e.which === 8) {
      e.preventDefault();
    }
    if (escapeKey) {
      Visual.lineMode = false;
      if (Visual.visualModeActive === false) {
        return Visual.exit();
      }
      Visual.visualModeActive = false;
      HUD.setMessage(" -- CARET -- ");
      Visual.collapse();
    }
    return Visual.action(asciiKey.replace(/^<BS>$/, "h").replace(/^<Space>$/, "l"));
  }

  if (escapeKey) {
    return Mappings.handleEscapeKey();
  }

  if (insertMode) {
    return false;
  }

  if (!commandMode && Mappings.actions.inputFocused && e.which === 9) { // When <Tab> or <S-Tab> is pressed in 'gi' mode
    if (document.activeElement && (!document.activeElement.isInput() || !Mappings.actions.inputElements.length)) {
      return Mappings.actions.inputFocused = false;
    }
    e.preventDefault();
    e.stopPropagation();
    Mappings.actions.inputElementsIndex = ((e.shiftKey ? -1 : 1) + Mappings.actions.inputElementsIndex).mod(Mappings.actions.inputElements.length);
    Mappings.actions.inputElements[Mappings.actions.inputElementsIndex].focus();
    if (Mappings.actions.inputElements[Mappings.actions.inputElementsIndex].getAttribute("readonly")) {
      Mappings.actions.inputElements[Mappings.actions.inputElementsIndex].select();
    }
    return;
  }

  isInput = document.activeElement && document.activeElement.isInput();

  if (!isInput) {
    if (Mappings.convertToAction(asciiKey)) {
      e.preventDefault();
      return e.stopPropagation();
    }
  }

  validMapping = Mappings.isValidMapping(asciiKey);
  if (!isInput && e.which > 40 && e.which !== 91 && e.which !== 123 && e.which !== 191) { // Let sites use their own JavaScript listeners if
    if ((Mappings.queue.length && Mappings.validMatch) || validMapping) {                 // cVim isn't using the key
      e.stopPropagation();
    }
    if (!commandMode && validMapping) {
      e.preventDefault();
    }
  }


  if (commandMode && document.activeElement.id === "cVim-command-bar-input") {
    switch (asciiKey) {
      case "<Tab>": // Tab navigation/completion
      case "<S-Tab>":
        if (Command.type === "action") {
          e.preventDefault();
          Mappings.actions[ (asciiKey === "<Tab>" ? "next" : "previous") + "CompletionResult" ]();
        }
        break;
      case "<C-p>":
        if (Command.type === "action" && settings.cncpcompletion) {
          e.preventDefault();
          Mappings.actions.previousCompletionResult();
        }
        return;

      case "<Up>": // Command history navigation/search
      case "<Down>":
        e.preventDefault();
        Command.history.cycle(Command.type, (asciiKey === "<Up>"));
        break;

      case "<Enter>":
      case "<C-Enter>":
        e.preventDefault();
        document.activeElement.blur();

        if (!(Command.history[Command.type].length > 0 && Command.history[Command.type].slice(-1)[0] === Command.input.value)) {
          Command.history[Command.type].push(Command.input.value);
          chrome.runtime.sendMessage({
            action: "appendHistory",
            value: Command.input.value,
            type: Command.type
          });
        }

        if (Command.type === "action") {
          var inputValue = Command.input.value + (e.ctrlKey ? "&":"");
          Command.hide(function() {
            Command.execute(inputValue, 1);
          });
          break;
        }

        if (Command.input.value) {
          if (Command.input.value !== Find.lastSearch || !Find.matches.length) {
            Find.clear();
            Find.highlight({
              base: document.body,
              search: Command.input.value,
              setIndex: true,
              executeSearch: false,
              reverse: asciiKey === "<C-Enter>",
              saveSearch: true
            });
          }
        }

        Command.hide();
        Find.index = Command.modeIdentifier.textContent === "/" ? -1 : 1;
        Find.setIndex();
        Find.search(Command.modeIdentifier.textContent === "?", 1, true);
        port.postMessage({
          action: "updateLastSearch",
          value: Find.lastSearch
        });
        break;
      default:
        if (asciiKey === "<BS>" && Command.input.value.length === 0) {
          Command.hide();
          e.preventDefault();
          break;
        }
        setTimeout(function() {
          Command.history.reset = true;
          if (Command.type === "action") {
            return Command.complete(Command.input.value);
          }
          if (Command.input.value.length > 2) {
            if (settings.incsearch && (Command.input.value !== Find.lastSearch || !Find.highlights.length)) {
              Find.clear();
              Find.highlight({
                base: document.body,
                search: Command.input.value
              });
              Find.index = Command.modeIdentifier.textContent === "/" ? -1 : 1;
              Find.setIndex();
              Find.search(Command.modeIdentifier.textContent === "?", 1, true);
            }
          }
        }, 0);
        break;
    }
  }

  if (settings.insertmappings && isInput) {
    Mappings.insertCommand(asciiKey, function() {
      e.preventDefault();
      if (document.activeElement.id === "cVim-command-bar-input" && Command.type !== "search") {
        window.setTimeout(function() {
          Command.complete(Command.input.value);
        }, 0);
      }
    });
  }

};

Key.up = function(e) {
  if ((document.activeElement && document.activeElement.id === "cVim-command-bar-input") || (!insertMode && Mappings.queue.length && Mappings.validMatch)) {
    e.stopPropagation();
    e.preventDefault();
  }
  if (Hints.active && e.which === 191) {
    document.getElementById("cVim-link-container").style.opacity = "1";
  }
  if (Hints.active && e.which === 16 && Hints.linkPreview) {
    Hints.hideHints(false);
  }
};

Key.press = function(e) {
  if (Command.active || (document.activeElement && document.activeElement.id === "cVim-command-bar-input")) {
    e.stopPropagation();
  }
  if (Visual.caretModeActive || Visual.visualModeActive) {
    e.preventDefault();
    e.stopPropagation();
  }
};

removeListeners = function() {
  Key.listenersActive = false;
  document.removeEventListener("keypress", Key.press, true);
  document.removeEventListener("keyup", Key.up, true);
  document.removeEventListener("keydown", Key.down, true);
};

addListeners = function() {
  if (Key.listenersActive) {
    removeListeners();
  }
  Key.listenersActive = true;
  document.addEventListener("keypress", Key.press, true);
  document.addEventListener("keyup", Key.up, true);
  document.addEventListener("keydown", Key.down, true);
};

addListeners();

Key.toggleCvim = function(ev) {
  var key = Key.fromKeyCode(ev);
  if (Mappings.toggleCvim.indexOf(key) !== -1) {
    chrome.runtime.sendMessage({action: "toggleEnabled"});
  }
};

document.addEventListener("DOMContentLoaded", function() {
  document.addEventListener("keydown", Key.toggleCvim, true);
});

window.addEventListener("DOMContentLoaded", function() {
  if (self === top) {
    chrome.runtime.sendMessage({action: "isNewInstall"}, function(message) {
      if (message) {
        alert(message);
      }
    });
  }
});
