var addListeners, removeListeners;
var insertMode, commandMode, settings;

var Key = {};

Key.numberMap = ")!@#$%^&*(";
Key.keyMap = {
  8:   "BS",
  9:   "Tab",
  13:  "Enter",
  27:  "Esc",
  32:  "Space",
  37:  "Left",
  38:  "Up",
  39:  "Right",
  40:  "Down",
  186: [";", ":"],
  188: [",", "<"],
  189: ["-", "_"],
  190: [".", ">"],
  187: ["=", "+"],
  191: ["/", "?"],
  192: ["`", "~"],
  219: ["[", "{"],
  221: ["]", "}"],
  222: ["'", "\""]
};

Key.fromKeyCode = function(e) {
  var keyCode  = e.which;
  var shiftKey = e.shiftKey;
  var convertedKey;
  if (/^F[0-9]+$/.test(e.keyIdentifier)) {
    return "<" + e.keyIdentifier + ">";
  }
  if (this.keyMap.hasOwnProperty(keyCode.toString())) {
    convertedKey = this.keyMap[keyCode.toString()];
    if (Array.isArray(convertedKey)) {
      if (!e.ctrlKey && !e.altKey && !e.metaKey) {
        convertedKey = convertedKey[(shiftKey ? 1 : 0)];
      } else convertedKey = convertedKey[0];
    } else {
      if (shiftKey) convertedKey = "S-" + convertedKey;
    }
  } else {
    if (keyCode >= 48 && keyCode <= 57) {
      if (shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
        convertedKey = this.numberMap[keyCode - 48];
      } else {
        convertedKey = String.fromCharCode(keyCode);
      }
    } else {
      convertedKey = String.fromCharCode(keyCode);
      if (!shiftKey)
        convertedKey = String.fromCharCode(keyCode).toLowerCase();
    }
  }

  var modifier = "";
  if (e.ctrlKey) modifier += "-C";
  if (e.altKey)  modifier += "-A";
  if (e.metaKey) modifier += "-M";

  if (modifier) {
    modifier = modifier.replace(/^-/, "");
    convertedKey = "<" + modifier + "-" +
      ((shiftKey && !this.keyMap.hasOwnProperty(keyCode)) ?
       "S-" : "") +
      (!this.keyMap.hasOwnProperty(keyCode) ? convertedKey.toLowerCase() : convertedKey) + ">";
  }

  if (/^S-/.test(convertedKey) || (!modifier && keyCode <= 40 && this.keyMap.hasOwnProperty(keyCode))) {
    convertedKey = "<" + convertedKey + ">";
  }
  return convertedKey;
};

Key.down = function(e) {

  if (Hints.active) {
    e.stopPropagation();
    if (e.which === 18) {
      return Hints.changeFocus();
    } else if (e.which === 191) {
      e.preventDefault();
      return document.getElementById("cVim-link-container").style.opacity = "0";
    }
  }
  if (Hints.keyDelay) {
    e.stopPropagation();
    return e.preventDefault();
  }

  if (e.which === 17 || e.which === 16 || e.which === 91 || e.which === 123) {
    return false;
  }

  if (document.activeElement.id === "cVim-command-bar-input") {
    e.stopPropagation();
  }

  var asciiKey = Key.fromKeyCode(e);
  if (!asciiKey) {
    return false;
  }

  var keyType = {
    escape: /^<(Esc|C-\[)>$/.test(asciiKey)
  };

  if (Visual.caretModeActive || Visual.visualModeActive) {
    e.stopPropagation();
    Visual.selection = document.getSelection();
    if (e.which === 8) {
      e.preventDefault();
    }
    if (keyType.escape) {
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

  if (keyType.escape) {
    return Mappings.handleEscapeKey();
  }
  if (insertMode) {
    return false;
  }

  if (!commandMode && Mappings.actions.inputFocused && e.which === 9) { // When <Tab> or <S-Tab> is pressed in 'gi' mode
    if (!document.activeElement.isInput() || !Mappings.actions.inputElements.length) {
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

  var isInput = document.activeElement.isInput();

  if (!isInput) {
    if (Mappings.convertToAction(asciiKey)) {
      e.preventDefault();
      return e.stopPropagation();
    }
  }

  var validMapping = Mappings.isValidMapping(asciiKey);
  if (!isInput && e.which > 40 && e.which !== 91 && e.which !== 123 && e.which !== 191) { // Let sites use their own JavaScript listeners if
    if ((Mappings.queue.length && Mappings.validMatch) || validMapping) {                 // cVim isn't using the key
      e.stopPropagation();
    }
    if (!commandMode && validMapping) {
      e.preventDefault();
    }
  }

  if (settings.insertmappings && document.activeElement.isInput() && !keyType.escape && asciiKey !== "" && !(settings.cncpcompletion && asciiKey === "<C-p>" && document.activeElement.id === "cVim-command-bar-input")) { // Handle textbox shortcuts
    Mappings.insertCommand(asciiKey, function() {
      e.preventDefault();
      if (document.activeElement.id === "cVim-command-bar-input" && Command.type !== "search") {
        window.setTimeout(function() {
          Command.complete(Command.input.value);
        }, 0);
      }
    });
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
        break;

      case "<Up>": // Command history navigation/search
      case "<Down>":
        e.preventDefault();
        Command.history.cycle(Command.type, (asciiKey === "<Up>"));
        break;

      case "<Enter>":
      case "<C-Enter>":
        e.preventDefault();
        document.activeElement.blur();

        if (!(Command.history[Command.type].length > 0 && Command.history[Command.type].slice(-1)[0] === Command.input.value)) { // Push the executed command to history
          Command.history[Command.type].push(Command.input.value);
          chrome.runtime.sendMessage({action: "appendHistory", value: Command.input.value, type: Command.type});
        }

        if (Command.type === "action") {
          Command.execute(Command.input.value + (e.ctrlKey ? "&" : ""), 1);
          break;
        }

        if (Command.input.value !== "" && (Command.input.value !== Find.lastSearch || !Find.matches.length)) {
          Find.clear();
          // Find.highlight(document.body, Command.input.value, false, false, false, true);
          Find.highlight({ base: document.body,
                           search: Command.input.value,
                           setIndex: true,
                           executeSearch: true,
                           reverse: false,
                           saveSearch: true });
        }
        Find.index = -1;
        Find.setIndex();
        Find.search(false, 1);
        chrome.runtime.sendMessage({action: "updateLastSearch", value: Find.lastSearch});
        Command.hide();
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
            Command.complete(Command.input.value);
          } else if ((settings.incsearch && (Command.input.value !== Find.lastSearch || !Find.highlights.length)) && Command.input.value.length > 2) {
            Find.clear();
            Find.highlight({ base: document.body,
                             search: Command.input.value});
            Find.index = -1;
            Find.setIndex();
            Find.search(false, 1, true);
          }
        }, 0);
        break;
    }

  }

};

Key.up = function(e) {
  if (document.activeElement.id === "cVim-command-bar-input" || (!insertMode && Mappings.queue.length && Mappings.validMatch)) {
    e.stopPropagation();
    e.preventDefault();
  }
  if (Hints.active && e.which === 191) {
    document.getElementById("cVim-link-container").style.opacity = "1";
  }
};

Key.press = function(e) {
  if (Visual.caretModeActive || Visual.visualModeActive) {
    e.preventDefault();
    e.stopPropagation();
  }
};

addListeners = function() {
  document.addEventListener("keypress", Key.press, true);
  document.addEventListener("keyup", Key.up, true);
  document.addEventListener("keydown", Key.down, true);
};

removeListeners = function() {
  document.removeEventListener("keypress", Key.press, true);
  document.removeEventListener("keyup", Key.up, true);
  document.removeEventListener("keydown", Key.down, true);
};

Key.toggleCvim = function(ev) {
  var key = Key.fromKeyCode(ev);
  if (Mappings.toggleCvim.indexOf(key) !== -1) {
    chrome.runtime.sendMessage({action: "toggleEnabled"});
  }
};

document.addEventListener("DOMContentLoaded", function() {
  document.addEventListener("keydown", Key.toggleCvim, true);
});
