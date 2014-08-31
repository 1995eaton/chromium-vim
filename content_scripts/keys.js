var addListeners, removeListeners, insertMode, commandMode, settings;

var KeyListener = (function() {

  'use strict';

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
      key = '<' + modifiers.join('-') + '-' + key + '>';
    } else if (typeof codeMap[event.which.toString()] === 'string') {
      key = '<' + (event.shiftKey ? 'S-' : '') + key + '>';
    }
    return key;
  };

  var KeyEvents = {

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

    keydown: function(callback, event) {

      if (Hints.active && event.which === 18) {
        return Hints.changeFocus();
      }

      // Modifier keys C-A-S-M
      if ([16,17,18,91,123].indexOf(event.which) !== -1) {
        return true;
      }

      if (Hints.active || Visual.caretModeActive || Visual.visualModeActive) {
        event.preventDefault();
        event.stopPropagation();
      }

      // Don't let the keypress listener attempt to parse the key event
      // if it contains a modifier (or asciiKey that should be parsed by the parseKeyDown function
      // such as { return (13) <BR> } or { space (32) <Space> }
      if ([9,13,32].indexOf(event.which) !== -1 || event.ctrlKey || event.metaKey || event.altKey) {
        var code = KeyEvents.keyhandle(event, 'keydown');
        for (var key in Mappings.defaults) {
          if (Mappings.defaults[key].indexOf(code) !== -1) {
            event.stopPropagation();
            break;
          }
        }
        return callback(code, event);
      // Ugly, but this NEEDS to be checked before setTimeout is called. Otherwise, non-cVim keyboard listeners
      // will not be stopped. preventDefault on the other hand, can be.
      } else if (commandMode || (!insertMode && document.getSelection().type === 'None' &&
                 Mappings.matchesMapping(Mappings.queue + KeyEvents.keyhandle(event, 'keydown'))))
      {
        event.stopPropagation();
      }

      // Create a temporary keypress listener to check if a keycode contains an
      // ascii-representable character
      var keypressTriggered = false;
      var boundMethod = KeyEvents.keypress.bind(KeyEvents, function(event) {
        if (!keypressTriggered) {
          // found a matching character...
          // use it if the setTimeout function below hasn't already timed out
          keypressTriggered = true;
          callback(KeyEvents.keyhandle(event, 'keypress'), event);
        }
      });
      window.addEventListener('keypress', boundMethod, true);

      // Wait for the keypress listener to find a match
      window.setTimeout(function() {
        window.removeEventListener('keypress', boundMethod, true);
        if (!keypressTriggered) { // keypress match wasn't found
          callback(KeyEvents.keyhandle(event, 'keydown'), event);
        }
      }, 0);

    }

  };

  var listenerFn = function(callback) {
    this.callback = callback;
    this.eventFn = KeyEvents.keydown.bind(null, this.callback);
    this.active = false;
    return this;
  };
  listenerFn.prototype.activate = function() {
    if (!this.active) {
      this.active = true;
      window.addEventListener('keydown', this.eventFn, true);
    }
  };
  listenerFn.prototype.deactivate = function() {
    if (this.active) {
      this.active = false;
      window.removeEventListener('keydown', this.eventFn, true);
    }
  };
  return listenerFn;

})();

var Key = {};

Key.down = function(asciiKey, e) {

  var escapeKey, isInput;
  Key.shiftKey = e.shiftKey;

  if (Hints.active) {
    e.stopPropagation();
    if (e.which === 18) {
      return Hints.changeFocus();
    } else if (e.which === 191) {
      e.preventDefault();
      return document.getElementById('cVim-link-container').style.opacity = '0';
    }
  }

  if (Hints.keyDelay) {
    e.stopPropagation();
    return e.preventDefault();
  }

  if (Cursor.overlay && settings.autohidecursor) {
    Cursor.overlay.style.display = 'block';
    Cursor.wiggleWindow();
  }

  if (Command.active && document.activeElement && document.activeElement.id === 'cVim-command-bar-input') {
    e.stopPropagation();
  }

  escapeKey = asciiKey === '<Esc>' || asciiKey === '<C-[>';

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
      HUD.setMessage(' -- CARET -- ');
      Visual.collapse();
    }
    return Visual.action(asciiKey.replace(/^<BS>$/, 'h').replace(/^<Space>$/, 'l'));
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
    if (Mappings.actions.inputElements[Mappings.actions.inputElementsIndex].getAttribute('readonly')) {
      Mappings.actions.inputElements[Mappings.actions.inputElementsIndex].select();
    }
    return;
  }

  isInput = document.activeElement && document.activeElement.isInput();

  if (!isInput) {
    if (Mappings.queue.length) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (Mappings.convertToAction(asciiKey)) {
      e.preventDefault();
      return e.stopPropagation();
    }
  }

  if (commandMode && document.activeElement.id === 'cVim-command-bar-input') {
    window.setTimeout(function() {
      Command.lastInputValue = Command.input.value;
    }, 0);
    switch (asciiKey) {
      case '<Tab>': // Tab navigation/completion
      case '<S-Tab>':
        if (Command.type === 'action') {
          e.preventDefault();
          Mappings.actions[ (asciiKey === '<Tab>' ? 'next' : 'previous') + 'CompletionResult' ]();
        }
        break;
      case '<C-p>':
        if (Command.type === 'action' && settings.cncpcompletion) {
          e.preventDefault();
          Mappings.actions.previousCompletionResult();
        }
        return;

      case '<Up>': // Command history navigation/search
      case '<Down>':
        e.preventDefault();
        Command.history.cycle(Command.type, (asciiKey === '<Up>'));
        break;

      case '<Enter>':
      case '<C-Enter>':
        e.preventDefault();
        document.activeElement.blur();

        if (!(Command.history[Command.type].length > 0 && Command.history[Command.type].slice(-1)[0] === Command.input.value)) {
          Command.history[Command.type].push(Command.input.value);
          chrome.runtime.sendMessage({
            action: 'appendHistory',
            value: Command.input.value,
            type: Command.type
          });
        }

        if (Command.type === 'action') {
          var inputValue = Command.input.value + (e.ctrlKey ? '&!' : '');
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
              reverse: asciiKey === '<C-Enter>',
              saveSearch: true
            });
          }
        }

        Command.hide();
        Find.index = Command.modeIdentifier.textContent === '/' ? -1 : 1;
        Find.setIndex();
        Find.search(Command.modeIdentifier.textContent === '?', 1, true);
        port.postMessage({
          action: 'updateLastSearch',
          value: Find.lastSearch
        });
        break;
      default:
        if (asciiKey === '<BS>' && Command.lastInputValue.length === 0 && Command.input.value.length === 0) {
          Command.hide();
          e.preventDefault();
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
    Mappings.insertCommand(asciiKey, function() {
      e.preventDefault();
      if (document.activeElement.id === 'cVim-command-bar-input' && Command.type !== 'search') {
        window.setTimeout(function() {
          Command.complete(Command.input.value);
        }, 0);
      }
    });
  }

};

Key.up = function(e) {
  if ((document.activeElement && document.activeElement.id === 'cVim-command-bar-input') || (!insertMode && Mappings.queue.length && Mappings.validMatch)) {
    e.stopPropagation();
    e.preventDefault();
  }
  if (Hints.active && e.which === 191) {
    document.getElementById('cVim-link-container').style.opacity = '1';
  }
  if (Hints.active && e.which === 16 && Hints.linkPreview) {
    Hints.hideHints(false);
  }
};

Key.listener = new KeyListener(Key.down);

removeListeners = function() {
  Key.listenersActive = false;
  document.removeEventListener('keyup', Key.up, true);
  Key.listener.deactivate();
};

addListeners = function() {
  if (Key.listenersActive) {
    removeListeners();
  }
  Key.listenersActive = true;
  document.addEventListener('keyup', Key.up, true);
  Key.listener.activate();
};

addListeners();

window.addEventListener('DOMContentLoaded', function() {
  if (self === top) {
    chrome.runtime.sendMessage({action: 'isNewInstall'}, function(message) {
      if (message) {
        alert(message);
      }
    });
  }
});
