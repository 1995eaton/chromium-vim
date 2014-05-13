var addListeners, removeListeners;
var insertMode, commandMode, settings;

var numberMap = ")!@#$%^&*(";
var keyMap = {
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

fromKeyCode = function(e) {
  var keyCode  = e.which;
  var shiftKey = e.shiftKey;
  var convertedKey;
  if (/^F[0-9]+$/.test(e.keyIdentifier)) {
    return "<" + e.keyIdentifier + ">";
  }
  if (keyMap.hasOwnProperty(keyCode.toString())) {
    convertedKey = keyMap[keyCode.toString()];
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
        convertedKey = numberMap[keyCode - 48];
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
      ((shiftKey && !keyMap.hasOwnProperty(keyCode)) ?
       "S-" : "") +
      (!keyMap.hasOwnProperty(keyCode) ? convertedKey.toLowerCase() : convertedKey) + ">";
  }

  if (/^S-/.test(convertedKey) || (!modifier && keyCode <= 40 && keyMap.hasOwnProperty(keyCode))) convertedKey = "<" + convertedKey + ">";
  return convertedKey;
};

keyDown = function(e) {

  if (Hints.active) {
    if (e.which === 18) {
      return Hints.changeFocus();
    } else if (e.which === 191) {
      e.preventDefault();
      e.stopPropagation();
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

  var asciiKey = fromKeyCode(e);
  var validMapping = Mappings.isValidMapping(asciiKey);
  var keyType = {
    arrow: /^<(Left|Right|Up|Down)>$/.test(asciiKey),
    modifier: /^<[ACM]/.test(asciiKey),
    escape: /^<(Esc|C-\[)>$/.test(asciiKey),
  };

  if (keyType.escape && document.activeElement.isInput()) {
    document.activeElement.blur();
  }
  if (!commandMode && Mappings.actions.inputFocused && e.which === 9) {
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

  if (Visual.caretModeActive || Visual.visualModeActive) {
    e.stopPropagation();
    Visual.selection = document.getSelection();
    if (e.which === 8) {
      e.preventDefault();
    }
    if (keyType.escape) {
      if (Visual.visualModeActive === false) {
        return Visual.exit();
      }
      Visual.visualModeActive = false;
      HUD.setMessage(" -- CARET -- ");
      Visual.collapse();
    }
    return Visual.action(asciiKey.replace(/^<BS>$/, "h").replace(/^<Space>$/, "l"));
  } else {

    if (!insertMode && !document.activeElement.isInput()) {
      if (Hints.active) e.stopPropagation();
      if (Mappings.convertToAction(asciiKey)) {
        e.preventDefault();
        e.stopPropagation();
      }
    }

  }

  if (!Object.prototype.hasOwnProperty("isVisible")) {
    return false;
  }

  var isInput = (document.activeElement.isInput() ||
      insertMode ||
      Mappings.actions.inputFocused);

  if (!isInput && e.which > 40 && e.which !== 91 && e.which !== 123 && e.which !== 191) {
    if ((Mappings.queue.length && Mappings.validMatch) || validMapping) {
      e.stopPropagation();
    }
    if (!commandMode && asciiKey !== "" && validMapping) {
      e.preventDefault();
    }
  }

  if (settings.insertmappings && document.activeElement.isInput() && !insertMode && !keyType.escape && asciiKey !== "" && !(settings.cncpcompletion && asciiKey === "<C-p>" && document.activeElement.id === "cVim-command-bar-input")) {
    Mappings.insertCommand(asciiKey, function() {
      e.preventDefault();
      if (document.activeElement.id === "cVim-command-bar-input" && Command.type !== "search") {
        window.setTimeout(function() {
          Command.complete(Command.input.value);
        }, 0);
      }
    });
  } else if (Hints.active && (keyType.escape || e.which <= 40) && !(settings.typelinkhints && e.which === 32)) {
    e.stopPropagation();
    e.preventDefault();
    Hints.hideHints(false, false, true);
  } else if (!commandMode) {
    if (keyType.escape || (!isInput && (asciiKey === "<Space>" || e.which === 13))) {
      if (keyType.escape && Hints.lastHover) {
        Hints.lastHover.unhover();
        Hints.lastHover = null;
      }
      if (insertMode && !document.activeElement.isInput()) {
        insertMode = false;
        HUD.hide();
      } else if (Find.matches.length && !/Space|Enter/.test(asciiKey)) {
        Find.clear();
        HUD.hide();
      }
      Mappings.actions.inputFocused = false;
      if (Mappings.queue !== "") {
        e.preventDefault();
        Mappings.queue = "";
        Mappings.repeats  = "";
      }
      if (isInput) document.activeElement.blur();
    } else if (!isInput && keyType.arrow && validMapping) {
      e.preventDefault();
      Mappings.convertToAction(asciiKey);
    }
  } else if (keyType.escape) {
    Mappings.actions.inputFocused = false;
    if (Command.type === "search") {
      document.body.scrollTop = Command.lastScrollTop;
      Find.clear();
      HUD.hide();
    }
    Command.hideData();
    Command.hide();
  }

  if (commandMode && document.activeElement.id === "cVim-command-bar-input") {

    switch (asciiKey) {

      case "<BS>": // Backspace (Vim style)
        if (Command.input.value.length === 0) {
          Command.hide();
          e.preventDefault();
          break;
        }
        if (Command.type === "search" && settings.incsearch) {
          Find.clear();
          setTimeout(function() {
            if (Command.input.value !== "" && Command.input.value.length > 2) {
              Find.highlight(document.body, Command.input.value);
              Find.index = -1;
              Find.setIndex();
              Find.search(false, 1, true);
            } else {
              HUD.hide();
            }
          }, 0);
        } else {
          setTimeout(function() {
            Command.complete(Command.input.value);
          }, 0);
        }
        break;

      case "<Tab>":
        if (Command.type === "action") {
          e.preventDefault();
          Mappings.actions.nextCompletionResult();
        }
        break;
      case "<S-Tab>":
        if (Command.type === "action") {
          e.preventDefault();
          Mappings.actions.previousCompletionResult();
        }
        break;

      case "<C-p>":
        if (Command.type === "action" && settings.cncpcompletion) {
          e.preventDefault();
          Mappings.actions.previousCompletionResult();
        }
        break;

      case "<Up>":
      case "<Down>":
        e.preventDefault();
        Command.history.cycle(Command.type, (asciiKey === "<Up>"));
        break;

      case "<Enter>":
      case "<C-Enter>":
        if (!/^(action|search)$/.test(Command.type)) {
          break;
        }
        e.preventDefault();
        if (!(Command.history[Command.type].length > 0 && Command.history[Command.type].slice(-1)[0] === Command.input.value)) {
          Command.history[Command.type].push(Command.input.value);
          chrome.runtime.sendMessage({action: "appendHistory", value: Command.input.value, type: Command.type});
        }
        document.activeElement.blur();
        if (Command.type === "search") {
          if (Command.input.value !== "" && (Command.input.value !== Find.lastSearch || !Find.matches.length)) {
            Find.clear();
            Find.highlight(document.body, Command.input.value, false, false, false, true);
          }
          Find.index = -1;
          Find.setIndex();
          Find.search(false, 1);
          Command.hide();
        } else {
          Command.execute(Command.input.value + (e.ctrlKey ? "&" : ""), 1);
        }
        break;

      default:
        Command.history.reset = true;
        if (Command.type === "action") {
          setTimeout(function() {
            Command.complete(Command.input.value);
          }, 0);
        } else {
          setTimeout(function() {
            if (Command.type === "search" && settings.incsearch && (Command.input.value !== Find.lastSearch || !Find.highlights.length)) {
              if (Command.input.value !== "") {
                Find.clear();
                if (Command.input.value.length > 2) {
                  Find.highlight(document.body, Command.input.value);
                  Find.index = -1;
                  Find.setIndex();
                  Find.search(false, 1, true);
                }
              }
            }
          }, 2);
        }
        break;
    }

  }

};

var Mouse = {};
mouseMove = function(e) {
  Mouse.x = e.pageX;
  Mouse.y = e.pageY;
};

keyUp = function(e) {
  if (document.activeElement.id === "cVim-command-bar-input" || (!insertMode && Mappings.queue.length && Mappings.validMatch)) {
    e.stopPropagation();
    e.preventDefault();
  }
  if (Hints.active && e.which === 191) {
    document.getElementById("cVim-link-container").style.opacity = "1";
  }
};

keyPress = function(e) {
  if (Visual.caretModeActive || Visual.visualModeActive) {
    e.preventDefault();
    e.stopPropagation();
  }
};

addListeners = function() {
  document.addEventListener("keypress", keyPress, true);
  document.addEventListener("keyup", keyUp, true);
  document.addEventListener("keydown", keyDown, true);
  document.addEventListener("mousemove", mouseMove, true);
};

removeListeners = function() {
  document.removeEventListener("keypress", keyPress, true);
  document.removeEventListener("keyup", keyUp, true);
  document.removeEventListener("keydown", keyDown, true);
  document.removeEventListener("mousemove", mouseMove, true);
};

chrome.extension.onMessage.addListener(function(request, callback) {
  switch (request.action) {
    case "toggleEnabled":
      Command.init(request.state);
      break;
    case "getBlacklistStatus":
      callback(Command.blacklisted);
      break;
  }
});
