var addListeners, removeListeners, insertMode, commandMode, settings;

var KeyListener = (function() {

  'use strict';
  var isActive = false;

  var codeMap = {
    0:   '\\',
    8:   'BS',
    9:   'Tab',
    12:  'Num',
    13:  'Enter',
    19:  'Pause',
    20:  'Caps',
    27:  'Esc',
    32:  'Space',
    33:  'PageUp',
    34:  'PageDown',
    35:  'End',
    36:  'Home',
    37:  'Left',
    38:  'Up',
    39:  'Right',
    40:  'Down',
    42:  'PrintScreen',
    44:  'PrintScreen',
    45:  'Insert',
    46:  'Delete',
    48:  ['0', ')'],
    49:  ['1', '!'],
    50:  ['2', '@'],
    51:  ['3', '#'],
    52:  ['4', '$'],
    53:  ['5', '%'],
    54:  ['6', '^'],
    55:  ['7', '&'],
    56:  ['8', '*'],
    57:  ['9', '('],
    96:  '0',
    97:  '1',
    98:  '2',
    99:  '3',
    100: '4',
    101: '5',
    102: '6',
    103: '7',
    104: '8',
    105: ['9', ''],
    106: '*',
    107: '+',
    109: '-',
    111: '/',
    144: 'Num',
    186: [';', ':'],
    188: [',', '<'],
    189: ['-', '_'],
    190: ['.', '>'],
    187: ['=', '+'],
    191: ['/', '?'],
    192: ['`', '~'],
    219: ['[', '{'],
    221: [']', '}'],
    220: ['\\', '|'],
    222: ['\'', '"']
  };

  var parseKeyDown = function(event) {
    var key, map;
    var isFKey = false;
    var modifiers = [
      event.ctrlKey  ? 'C' : '',
      event.altKey   ? 'A' : '',
      event.metaKey  ? 'M' : '',
      event.shiftKey ? 'S' : ''
    ].join('').split('');
    if (codeMap.hasOwnProperty(event.which.toString())) {
      map = codeMap[event.which.toString()];
      if (Array.isArray(map)) {
        if (!modifiers.length) {
          modifiers.splice(modifiers.indexOf('S'), 1);
        }
        key = map[+(event.shiftKey && !modifiers.length)];
      } else {
        key = map;
      }
    } else if (/^F[0-9]+$/.test(event.keyIdentifier)) {
      isFKey = true;
      key = event.keyIdentifier;
    } else {
      key = String.fromCharCode(event.which).toLowerCase();
      if (event.shiftKey && modifiers.length === 1) {
        key = key.toUpperCase();
        if (key.toLowerCase() !== key.toUpperCase()) {
          return key;
        }
      }
    }
    modifiers = modifiers.filter(function(e) { return e; });
    if (modifiers.length) {
      if (Array.isArray(codeMap[event.which]) && modifiers[0] === 'S') {
        key = codeMap[event.which][1];
      } else {
        key = '<' + modifiers.join('-') + '-' + key + '>';
      }
    } else if (key.length !== 1 &&
        (typeof codeMap[event.which.toString()] === 'string' || isFKey)) {
      key = '<' + (event.shiftKey ? 'S-' : '') + key + '>';
    }
    return key;
  };

  var KeyEvents = {

    lastHandledEvent: null,

    keypress: function(callback, event) {
      if (typeof callback === 'function') {
        callback(event);
      }
    },

    keyhandle: function(event, type) {
      if (type === 'keypress') {
        // ascii representation of keycode
        return String.fromCharCode(event.which);
      } else {
        // Vim-like representation
        return parseKeyDown(event);
      }
    },

    keyup: function(event) {
      window.scrollKeyUp = true;
      if (Object.compare(event, KeyEvents.lastHandledEvent,
            ['which', 'ctrlKey', 'shiftKey', 'metaKey', 'altKey'])) {
        KeyEvents.lastHandledEvent = null;
        event.stopImmediatePropagation();
      }
    },

    keydown: function(callback, event) {
      var keyString = KeyEvents.keyhandle(event, 'keydown');

      // Alt key hint focus toggle
      if (Hints.active && event.which === 18) {
        return Hints.changeFocus();
      }

      // Modifier keys C-A-S-M
      if ([16,17,18,91,123].indexOf(event.which) !== -1) {
        return true;
      }

      // Don't let the keypress listener attempt to parse the key event
      // if it contains a modifier (or key that should be parsed by the parseKeyDown function
      // such as { return (13) <BR> } or { space (32) <Space> }
      if ([9,13,32].indexOf(event.which) !== -1 || event.ctrlKey || event.metaKey || event.altKey) {
        var code = KeyEvents.keyhandle(event, 'keydown');
        for (var key in Mappings.defaults) {
          if (Mappings.defaults[key].indexOf(code) !== -1) {
            event.stopImmediatePropagation();
            break;
          }
        }
        return callback.call(this, code, event);
      // Ugly, but this NEEDS to be checked before setTimeout is called. Otherwise, non-cVim keyboard listeners
      // will not be stopped. preventDefault on the other hand, can be.
      } else if (commandMode || (!insertMode && mappingTrie.at(Mappings.queue + keyString)) ||
          (keyString[0] >= '0' && keyString[0] <= '9'))
      {
        if (Command.commandBarFocused() && event.which >= 37 && event.which <= 40) {
          event.preventDefault();
        }
        KeyEvents.lastHandledEvent = event;
        event.stopImmediatePropagation();
      }

      // Create a temporary keypress listener to check if a keycode contains an
      // ascii-representable character
      var keypressTriggered = false;
      var boundMethod = KeyEvents.keypress.bind(KeyEvents, function(event) {
        if (!keypressTriggered) {
          // found a matching character...
          // use it if the setTimeout function below hasn't already timed out
          if (Hints.active || Visual.caretModeActive || Visual.visualModeActive) {
            event.preventDefault();
            event.stopImmediatePropagation();
          }
          keypressTriggered = true;
          callback.call(this, KeyEvents.keyhandle(event, 'keypress'), event);
        }
      });

      window.addEventListener('keypress', boundMethod, true);

      // Wait for the keypress listener to find a match
      window.setTimeout(function() {
        window.removeEventListener('keypress', boundMethod, true);
        if (!keypressTriggered) { // keypress match wasn't found
          if (Hints.active || Visual.caretModeActive || Visual.visualModeActive) {
            event.preventDefault();
            event.stopImmediatePropagation();
          }
          callback.call(this, KeyEvents.keyhandle(event, 'keydown'), event);
        }
      }, 0);

    }

  };
  var createEventListener = function(element, type, callback) {
    element.addEventListener(type, function() {
      return isActive ? callback.apply(this, arguments) : true;
    }, true);
  };

  var listenerFn = function(callback) {
    this.callback = callback;
    this.eventFn = KeyEvents.keydown.bind(null, this.callback);
    isActive = false;
    return this;
  };
  var initialSetup = false;
  listenerFn.prototype.activate = function() {
    if (!isActive) {
      isActive = true;
      if (!initialSetup) {
        initialSetup = true;
        createEventListener(window, 'keydown', this.eventFn);
        createEventListener(window, 'keyup', KeyEvents.keyup);
      }
    }
  };
  listenerFn.prototype.deactivate = function() {
    if (isActive) {
      isActive = false;
    }
  };
  return listenerFn;

})();

var KeyHandler = {};

KeyHandler.down = function(key, event) {

  var escapeKey, isInput;
  KeyHandler.shiftKey = event.shiftKey;
  KeyHandler.hasPressedKey = true; // noautofocus workaround for stopimmediatepropagation

  if (Hints.active) {
    event.stopImmediatePropagation();
    if (event.which === 18) {
      return Hints.changeFocus();
    } else if (event.which === 191) {
      event.preventDefault();
      return document.getElementById('cVim-link-container').style.opacity = '0';
    }
  }

  if (Hints.keyDelay) {
    event.stopImmediatePropagation();
    return event.preventDefault();
  }

  if (Cursor.overlay && settings.autohidecursor) {
    Cursor.overlay.style.display = 'block';
    Cursor.wiggleWindow();
  }

  if (Command.commandBarFocused()) {
    event.stopImmediatePropagation();
  }

  escapeKey = key === '<Esc>' || key === '<C-[>';

  if (Visual.caretModeActive || Visual.visualModeActive) {
    event.stopImmediatePropagation();
    Visual.selection = document.getSelection();
    if (event.which === 8) {
      event.preventDefault();
    }
    if (escapeKey) {
      Visual.lineMode = false;
      if (Visual.visualModeActive === false) {
        Visual.exit();
        insertMode = false;
        return;
      }
      HUD.setMessage(' -- CARET -- ');
      Visual.collapse();
      return;
    }
    return Visual.action(key.replace(/^<BS>$/, 'h').replace(/^<Space>$/, 'l'));
  }

  if (escapeKey) {
    return Mappings.handleEscapeKey();
  }

  if (insertMode) {
    return false;
  }

  if (!commandMode && Mappings.actions.inputFocused && event.which === 9) { // When <Tab> or <S-Tab> is pressed in 'gi' mode
    if (document.activeElement && (!document.activeElement.isInput() || !Mappings.actions.inputElements.length)) {
      return Mappings.actions.inputFocused = false;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    Mappings.actions.inputElementsIndex = ((event.shiftKey ? -1 : 1) + Mappings.actions.inputElementsIndex).mod(Mappings.actions.inputElements.length);
    Mappings.actions.inputElements[Mappings.actions.inputElementsIndex].focus();
    if (Mappings.actions.inputElements[Mappings.actions.inputElementsIndex].getAttribute('readonly')) {
      Mappings.actions.inputElements[Mappings.actions.inputElementsIndex].select();
    }
    return;
  }

  isInput = document.activeElement && document.activeElement.isInput();

  if (!isInput) {
    if (Mappings.queue.length) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
    if (Mappings.convertToAction(key)) {
      event.preventDefault();
      return event.stopImmediatePropagation();
    }
  }

  if (Command.commandBarFocused()) {
    window.setTimeout(function() {
      Command.lastInputValue = Command.input.value;
    }, 0);
    switch (key) {
      case '<Tab>': // Tab navigation/completion
      case '<S-Tab>':
        if (Command.type === 'action') {
          event.preventDefault();
          Mappings.actions[ (key === '<Tab>' ? 'next' : 'previous') + 'CompletionResult' ]();
        }
        break;
      case '<C-p>':
        if (Command.type === 'action' && settings.cncpcompletion) {
          event.preventDefault();
          Mappings.actions.previousCompletionResult();
        }
        return;

      case '<Up>': // Command history navigation/search
      case '<Down>':
        event.preventDefault();
        Command.history.cycle(Command.type, (key === '<Up>'));
        break;

      case '<Enter>':
      case '<C-Enter>':
        event.preventDefault();
        document.activeElement.blur();

        if (!(Command.history[Command.type].length > 0 && Command.history[Command.type].slice(-1)[0] === Command.input.value)) {
          Command.history[Command.type].push(Command.input.value);
          RUNTIME('appendHistory', {
            value: Command.input.value,
            type: Command.type
          });
        }

        if (Command.type === 'action') {
          var inputValue = Command.input.value + (event.ctrlKey ? '&!' : '');
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
              reverse: key === '<C-Enter>',
              saveSearch: true
            });
          }
        }

        Command.hide();
        Find.index = Command.modeIdentifier.textContent === '/' ? -1 : 1;
        Find.setIndex();
        Find.search(Command.modeIdentifier.textContent === '?', 1, false);
        PORT('updateLastSearch', {value: Find.lastSearch});
        break;
      default:
        if (key === '<BS>' && Command.lastInputValue.length === 0 && Command.input.value.length === 0) {
          Command.hide();
          event.preventDefault();
          break;
        }
        setTimeout(function() {
          Command.history.reset = true;
          if (Command.type === 'action') {
            return Command.complete(Command.input.value);
          }
          if (Command.input.value.length > 2) {
            if (settings.incsearch && (Command.input.value !== Find.lastSearch || !Find.highlights.length)) {
              Find.clear();
              Find.highlight({
                base: document.body,
                search: Command.input.value
              });
              Find.index = Command.modeIdentifier.textContent === '/' ? -1 : 1;
              Find.setIndex();
              Find.search(Command.modeIdentifier.textContent === '?', 1, true);
            }
          }
        }, 0);
        break;
    }
  }

  if (settings && settings.insertmappings && isInput) {
    Mappings.insertCommand(key, function() {
      event.preventDefault();
      if (Command.commandBarFocused() && Command.type !== 'search') {
        window.setTimeout(function() {
          Command.complete(Command.input.value);
        }, 0);
      }
    });
  }

};

KeyHandler.up = function(event) {
  if (Command.commandBarFocused() || (!insertMode && Mappings.queue.length && Mappings.validMatch)) {
    event.stopImmediatePropagation();
    event.preventDefault();
  }
  if (Hints.active && event.which === 191) {
    document.getElementById('cVim-link-container').style.opacity = '1';
  }
};

KeyHandler.listener = new KeyListener(KeyHandler.down);

removeListeners = function() {
  KeyHandler.listenersActive = false;
  window.removeEventListener('keyup', KeyHandler.up, true);
  KeyHandler.listener.deactivate();
};

addListeners = function() {
  if (KeyHandler.listenersActive)
    removeListeners();
  KeyHandler.listenersActive = true;
  window.addEventListener('keyup', KeyHandler.up, true);
  KeyHandler.listener.activate();
};

addListeners();

window.addEventListener('DOMContentLoaded', function() {
  if (self === top) {
    RUNTIME('isNewInstall', null, function(message) {
      if (message) {
        alert(message);
      }
    });
  }
});
