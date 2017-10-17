var insertMode, commandMode, settings;

var KeyListener;

var HAS_EVENT_KEY_SUPPORT = KeyboardEvent.prototype.hasOwnProperty('key');

// Use when KeyboardEvent.prototype.key becomes standard in most
// versions of Chrome (52+)
if (HAS_EVENT_KEY_SUPPORT) {
  KeyListener = function(onKeyDown, onKeyUp) {
    this.eventCallbacks = {keydown: [], keyup: []};
    this.addListener('keydown', onKeyDown);
    this.addListener('keyup', onKeyUp);
    this.isActive = false;
    this.langMap = {};
    window.addEventListener('keydown', this.createListener('keydown'), true);
    window.addEventListener('keyup', this.createListener('keyup'), true);
  };

  KeyListener.prototype.addListener = function(type, callback) {
    if (typeof callback !== 'function' || ['keydown', 'keyup'].indexOf(type) === -1)
      return;
    this.eventCallbacks[type] = this.eventCallbacks[type] || [];
    this.eventCallbacks[type].push(callback);
  };

  KeyListener.prototype.removeListener = function(type, callback) {
    if (!this.eventCallbacks.hasOwnProperty(type) || typeof callback !== 'function')
      return false;
    var listeners = this.eventCallbacks[type];
    var origLen = listeners.length;
    listeners = listeners.filter(function(e) {
      return e !== callback;
    });
    this.eventCallbacks[type] = listeners;
    return origLen !== listeners.length;
  };

  KeyListener.keyEquals = function(a, b) {
    function normalizeKey(key) {
      if (!/^<.*>$/.test(key))
        return key;
      key = key.slice(1, -1).toLowerCase();
      var mods = key.split('-').filter(function(e) { return e; }).sort();
      var char;
      if (key.charAt(key.length - 1) === '-')
        char = '-';
      else
        char = mods.pop();
      return '<' +
        mods.sort().join('-') + '-' + char +
      '>';
    }

    a = normalizeKey(a);
    b = normalizeKey(b);

    return a === b;
  };

  KeyListener.prototype.keyMap = {
    'Backspace': 'BS',
    'Numlock': 'Num',
    'Escape': 'Esc',
    ' ': 'Space',
    'ArrowLeft': 'Left',
    'ArrowRight': 'Right',
    'ArrowUp': 'Up',
    'ArrowDown': 'Down',
    'Print': 'PrintScreen',
  };

  KeyListener.prototype.lowerCaseMap = {
    '~': '`',
    '!': '1',
    '@': '2',
    '#': '3',
    '$': '4',
    '%': '5',
    '^': '6',
    '&': '7',
    '*': '8',
    '(': '9',
    ')': '0',
    '_': '-',
    '+': '=',
    '{': '[',
    '}': ']',
    '<': ',',
    '>': '.',
    '|': '\\',
    '"': '\\',
    '?': '/',
  };

  KeyListener.prototype.overrides = {
    17: 'Control',
    18: 'Alt',
    91: 'Meta',
    16: 'Shift',
    123: 'F12'
  };

  KeyListener.prototype.convertLang = function(key) {
    if (this.langMap.hasOwnProperty(key))
      return this.langMap[key];
    return key;
  };

  KeyListener.prototype.eventToCode = function(event, _super) {
    var key = event.key;
    if (_super.overrides.hasOwnProperty(event.which)) {
      key = _super.overrides[event.which];
    }
    var isSpecial = event.ctrlKey || event.altKey || event.metaKey;
    if (['Control', 'Shift', 'Alt', 'Meta'].indexOf(key) !== -1)
      return key;
    if (isSpecial) {
      var code = '<' + ((event.ctrlKey ? 'C' : '') +
                        (event.shiftKey ? 'S' : '') +
                        (event.altKey  ? 'A' : '') +
                        (event.metaKey ? 'M' : '')).split('').join('-');
      code += '-';
      if (event.shiftKey && _super.lowerCaseMap.hasOwnProperty(key)) {
        code += _super.convertLang(_super.lowerCaseMap[key]);
      } else if (_super.keyMap.hasOwnProperty(key)) {
        code += _super.convertLang(_super.keyMap[key]);
      } else {
        code += key.length > 1 ? key : _super.convertLang(key.toLowerCase());
      }
      return code + '>';
    }

    if (_super.keyMap.hasOwnProperty(key) || key.length > 1) {
      key = _super.convertLang(_super.keyMap[key] || key);
      if (event.shiftKey)
        return '<S-' + key + '>';
      return '<' + key + '>';
    }

    return _super.convertLang(key);
  };

  KeyListener.prototype.createListener = function(type) {
    var _super = this;
    return function(event) {
      if (typeof event.key === 'undefined' || !event.isTrusted)
        return true;
      var code = _super.eventToCode.call(this, event, _super);
      if (_super.isActive) {
        var eventCallbacks = _super.eventCallbacks[type];
        var ret = true;
        for (var i = 0; i < eventCallbacks.length; i++) {
          var retConsider = eventCallbacks[i].apply(this, [code, event]);
          if (retConsider !== undefined && !retConsider)
            ret = false;
        }
        return ret;
      }
      return true;
    };
  };

  KeyListener.prototype.activate = function() {
    this.isActive = true;
  };

  KeyListener.prototype.deactivate = function() {
    this.isActive = false;
  };

  KeyListener.prototype.parseLangMap = function(mapStr) {
    function tokenize(mapStr) {
      var tokens = [];
      for (var i = 0; i < mapStr.length; i++) {
        var ch = mapStr.charAt(i);
        if (ch === '\\' && i + 1 < mapStr.length) {
          var peek = mapStr.charAt(i + 1);
          if (peek === ',' || peek === ';') {
            tokens.push(peek);
            ++i;
          } else {
            tokens.push(ch);
          }
        } else if (ch === ',') {
          tokens.push('PAIR_SEP');
        } else if (ch === ';') {
          tokens.push('SEMI_SEP');
        } else {
          tokens.push(ch);
        }
      }
      return tokens;
    }
    function parseError(error) {
      throw Error('KeyListener langmap error: ' + error);
    }
    function parseObj(tokens, pairs) {
      var len = tokens.length;
      var mid = len >> 1;
      var i, j;
      if (len % 2 === 0) {
        for (i = 0; i < len - 1; i += 2) {
          var a = tokens[i], b = tokens[i + 1];
          if (a.length !== 1) parseError('unexpected token: ' + a);
          if (b.length !== 1) parseError('unexpected token: ' + b);
          pairs[a] = b;
        }
        return;
      }
      if (tokens[mid] !== 'SEMI_SEP')
        parseError('mismatched characters');
      for (i = 0, j = mid + 1; i < mid; i++, j++) {
        if (tokens[i].length !== 1) parseError('unexpected token: ' + tokens[i]);
        if (tokens[j].length !== 1) parseError('unexpected token: ' + tokens[j]);
        pairs[tokens[i]] = tokens[j];
      }
      return;
    }
    function parse(tokens) {
      var stream = [];
      var pairs = {};
      for (var i = 0; i < tokens.length; i++) {
        if (tokens[i] === 'PAIR_SEP') {
          parseObj(stream, pairs);
          stream = [];
        } else {
          stream.push(tokens[i]);
        }
      }
      if (stream.length)
        parseObj(stream, pairs);
      return pairs;
    }
    var tokens = tokenize(mapStr);
    var parsed;
    try {
      parsed = parse(tokens);
    } catch (error) {
      console.error(error.message);
      return {};
    }
    return parsed;
  };

  KeyListener.prototype.setLangMap = function(map) {
    if (typeof map === 'string')
      this.langMap = this.parseLangMap(map);
    else
      this.langMap = map;
  };
} else {

  KeyListener = (function() {
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

    var langMap = {};

    var parseKeyDown = function(event) {
      var key, map;
      var isFKey = false;
      var modifiers = [
        event.ctrlKey  ? 'C' : '',
        event.altKey   ? 'A' : '',
        event.metaKey  ? 'M' : '',
        event.shiftKey ? 'S' : ''
      ].join('').split('');
      var identifier = HAS_EVENT_KEY_SUPPORT ?
        event.key : event.keyIdentifier; // Prepare for deprecation of KeyboardEvent.prototype.keyIdentifier
                                         // https://www.chromestatus.com/features/5316065118650368
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
      } else if (/^F[0-9]+$/.test(identifier)) {
        isFKey = true;
        key = identifier;
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
        if (Visual.visualModeActive || Visual.caretModeActive) {
          event.preventDefault();
        }
        if (type === 'keypress') {
          // ascii representation of keycode
          var key = String.fromCharCode(event.which);
          if (langMap.hasOwnProperty(key))
            key = langMap[key];
          return key;
        } else {
          // Vim-like representation
          return parseKeyDown(event);
        }
      },
      keyup: function(event) {
        window.scrollKeyUp = true;
        if (Hints.active && event.which === 191) {
          setTimeout(function() {
            document.getElementById('cVim-link-container').style.opacity = '1';
          }, 0);
        }
        if (Object.compare(event, KeyEvents.lastHandledEvent,
              ['which', 'ctrlKey', 'shiftKey', 'metaKey', 'altKey'])) {
          KeyEvents.lastHandledEvent = null;
          if (!DOM.isEditable(document.activeElement)) {
            event.stopImmediatePropagation();
          }
        }
      },
      keydown: function(callback, event) {
        var keyString = KeyEvents.keyhandle(event, 'keydown');

        // Alt key hint focus toggle
        if (Hints.active) {
          event.preventDefault();
          if (event.which === 18) {
            Hints.changeFocus();
            return;
          }
        }
        if (Hints.shouldShowLinkInfo &&
            typeof Hints.acceptLink === 'function' &&
            (keyString === '<Enter>' || keyString === '<S-Enter>')) {
          Hints.acceptLink(keyString === '<S-Enter>');
          return;
        }

        // Modifier keys C-A-S-M
        if (~[16, 17, 18, 91, 123].indexOf(event.which))
          return true;

        if (Mappings.keyPassesLeft) {
          Mappings.keyPassesLeft--;
          return true;
        }

        // preventDefault before it becomes too late (keys like <Down> and <F1>)
        if (!insertMode && !commandMode &&
            !DOM.isTextElement(document.activeElement)) {
          var guess = KeyEvents.keyhandle(event, 'keydown');
          if (guess.length > 1 &&
              Mappings.shouldPrevent(KeyEvents.keyhandle(event, 'keydown'))) {
            // only stop guesses that can't be understood by keypress events
            event.preventDefault();
          }
        }

        // Don't let the keypress listener attempt to parse the key event
        // if it contains a modifier (or key that should be parsed by the
        // parseKeyDown function such as { return (13) <BR> } or
        // { space (32) <Space> }
        if ([9, 13, 32].indexOf(event.which) !== -1 || event.ctrlKey ||
            event.metaKey || event.altKey) {
          var code = KeyEvents.keyhandle(event, 'keydown');
          for (var key in Mappings.defaults) {
            if (Mappings.defaults[key].indexOf(code) !== -1) {
              event.stopImmediatePropagation();
              break;
            }
          }
          return callback.call(this, code, event);
        // Ugly, but this NEEDS to be checked before setTimeout is called.
        // Otherwise, non-cVim keyboard listeners will not be stopped.
        // "preventDefault" on the other hand, can be.
        } else if (commandMode ||
            (!insertMode && mappingTrie.find(
               Mappings.splitMapping(Mappings.queue + keyString))) ||
            (keyString[0] >= '0' && keyString[0] <= '9')) {
          if (Command.commandBarFocused() &&
              (event.which === 38 || event.which === 40)) {
            event.preventDefault();
          }
          KeyEvents.lastHandledEvent = event;
          if (!DOM.isEditable(document.activeElement)) {
            event.stopImmediatePropagation();
          }
        }

        // Create a temporary keypress listener to check if a keycode contains an
        // ascii-representable character
        var keypressTriggered = false;
        var boundMethod = KeyEvents.keypress.bind(KeyEvents, function(event) {
          if (!keypressTriggered && event.isTrusted) {
            // found a matching character...
            // use it if the setTimeout function below hasn't already timed out
            if (Hints.active ||
                Visual.caretModeActive ||
                Visual.visualModeActive) {
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
            if (Hints.active ||
                Visual.caretModeActive ||
                Visual.visualModeActive) {
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
    var parseLangMap = (function() {
      function tokenize(mapStr) {
        var tokens = [];
        for (var i = 0; i < mapStr.length; i++) {
          var ch = mapStr.charAt(i);
          if (ch === '\\' && i + 1 < mapStr.length) {
            var peek = mapStr.charAt(i + 1);
            if (peek === ',' || peek === ';') {
              tokens.push(peek);
              ++i;
            } else {
              tokens.push(ch);
            }
          } else if (ch === ',') {
            tokens.push('PAIR_SEP');
          } else if (ch === ';') {
            tokens.push('SEMI_SEP');
          } else {
            tokens.push(ch);
          }
        }
        return tokens;
      }
      function parseError(error) {
        throw Error('cVim langmap error: ' + error);
      }
      function parseObj(tokens, pairs) {
        var len = tokens.length;
        var mid = len >> 1;
        var i, j;
        if (len % 2 === 0) {
          for (i = 0; i < len - 1; i += 2) {
            var a = tokens[i], b = tokens[i + 1];
            if (a.length !== 1) parseError('unexpected token: ' + a);
            if (b.length !== 1) parseError('unexpected token: ' + b);
            pairs[a] = b;
          }
          return;
        }
        if (tokens[mid] !== 'SEMI_SEP')
          parseError('mismatched characters');
        for (i = 0, j = mid + 1; i < mid; i++, j++) {
          if (tokens[i].length !== 1) parseError('unexpected token: ' + tokens[i]);
          if (tokens[j].length !== 1) parseError('unexpected token: ' + tokens[j]);
          pairs[tokens[i]] = tokens[j];
        }
        return;
      }
      function parse(tokens) {
        var stream = [];
        var pairs = {};
        for (var i = 0; i < tokens.length; i++) {
          if (tokens[i] === 'PAIR_SEP') {
            parseObj(stream, pairs);
            stream = [];
          } else {
            stream.push(tokens[i]);
          }
        }
        if (stream.length)
          parseObj(stream, pairs);
        return pairs;
      }
      return function(mapStr) {
        var tokens = tokenize(mapStr);
        var parsed;
        try {
          parsed = parse(tokens);
        } catch (error) {
          console.error(error.message);
          return {};
        }
        return parsed;
      };
    })();
    listenerFn.prototype.setLangMap = function(mapStr) {
      langMap = parseLangMap(mapStr);
    };
    return listenerFn;
  })();

}

var KeyHandler = {
  down: function(key, event) {
    if (HAS_EVENT_KEY_SUPPORT) {
      if (Hints.active) {
        event.preventDefault();
        if (event.which === 18) {
          Hints.changeFocus();
          return;
        }
      }

      if (Visual.visualModeActive || Visual.caretModeActive)
        event.preventDefault();

      if (Mappings.keyPassesLeft) {
        Mappings.keyPassesLeft--;
        return true;
      }
    }

    if (['Control', 'Alt', 'Meta', 'Shift'].indexOf(key) !== -1)
      return false;

    KeyHandler.shiftKey = event.shiftKey;

    // noautofocus workaround for stopimmediatepropagation
    KeyHandler.hasPressedKey = true;

    if (Hints.active) {
      event.stopImmediatePropagation();
      switch (event.which) {
      case 18:   // Alt
        Hints.changeFocus();
        return;
      case 191: // Slash
        event.preventDefault();
        document.getElementById('cVim-link-container').style.opacity = '0';
        return;
      }
    }

    if (Hints.keyDelay) {
      event.stopImmediatePropagation();
      event.preventDefault();
      return;
    }

    if (Cursor.overlay && settings.autohidecursor) {
      Cursor.overlay.style.display = 'block';
      Cursor.wiggleWindow();
    }

    if (Command.commandBarFocused())
      event.stopImmediatePropagation();

    var escapeKey = key === '<Esc>' || key === '<C-[>';

    if (Visual.caretModeActive || Visual.visualModeActive) {
      event.stopImmediatePropagation();
      Visual.selection = document.getSelection();
      if (event.which === 8)
        event.preventDefault();
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
      Visual.action(key.replace(/^<BS>$/, 'h').replace(/^<Space>$/, 'l'));
      return;
    }

    if (escapeKey) {
      Mappings.handleEscapeKey();
      return;
    }

    if (insertMode)
      return;

    var isInput = DOM.isEditable(document.activeElement);

    // When <Tab> or <S-Tab> is pressed in 'gi' mode
    if (!commandMode && Mappings.actions.inputFocused && event.which === 9) {
      var actions = Mappings.actions;
      if (!isInput || !actions.inputElements.length) {
        actions.inputFocused = false;
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();

      actions.inputElementsIndex = Utils.trueModulo(
        actions.inputElementsIndex + (event.shiftKey ? -1 : 1),
        actions.inputElements.length
      );

      actions.inputElements[actions.inputElementsIndex].focus();
      if (actions.inputElements[actions.inputElementsIndex].hasAttribute('readonly'))
        actions.inputElements[actions.inputElementsIndex].select();
      return;
    }

    if (!isInput) {
      if (Mappings.queue.length) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
      if (Mappings.convertToAction(key)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
    }

    if (Command.commandBarFocused()) {
      // If key event ocurred in IME and the key is not regular one,
      // set key vaule empty to avoid action.
      if (event.isComposing && /^<.*>$/.test(key))
        key = '';
      window.setTimeout(function() {
        Command.lastInputValue = Command.input.value;
      }, 0);
      switch (key) {
      case '<Tab>': // Tab navigation/completion
      case '<S-Tab>':
        if (Command.type === 'action') {
          event.preventDefault();
          Mappings.actions[ (key === '<Tab>' ? 'next' : 'previous') +
                            'CompletionResult' ]();
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
        if (!(Command.history[Command.type].length > 0 &&
              Command.history[Command.type].slice(-1)[0] ===
              Command.input.value)) {
          Command.history[Command.type].push(Command.input.value);
          RUNTIME('appendHistory', {
            value: Command.input.value,
            type: Command.type
          });
        }
        if (Command.type === 'action') {
          var inputValue = Command.input.value + (event.ctrlKey ? '&!' : '');
          Command.hide(function() {
            // prevent tab from switching back after
            // the iframe hides if the command triggers a tab change
            setTimeout(function() {
              Command.execute(inputValue, 1);
            }, 10);
          });
          break;
        }
        if (Command.input.value) {
          PORT('callFind', {
            command: 'clear',
            params: []
          });
          PORT('callFind', {
            command: 'highlight',
            params: [{
              base: null,
              mode: Command.modeIdentifier.textContent,
              search: Command.input.value,
              setIndex: true,
              executeSearch: false,
              saveSearch: true
            }]
          });
          PORT('callFind', {
            command: 'setIndex',
            params: []
          });
          PORT('callFind', {
            command: 'search',
            params: [Command.modeIdentifier.textContent, +(Command.modeIdentifier.textContent === '?'), false]
          });
          PORT('updateLastSearch', {value: Command.input.value});
        }
        Command.hide();
        break;
      default:
        if (key === '<BS>' && Command.lastInputValue.length === 0 &&
            Command.input.value.length === 0) {
          event.preventDefault();
          setTimeout(function() {
            Command.hide();
          }, 10);
          break;
        }
        setTimeout(function() {
          Command.history.reset = true;
          if (Command.type === 'action') {
            Command.complete(Command.input.value);
            return;
          }
          if (Command.input.value.length > 2) {
            if (settings.incsearch) {
              PORT('doIncSearch', {
                search: Command.input.value,
                mode: Command.modeIdentifier.textContent,
              });
            }
          }
        }, 0);
        break;
      }
    }
    if (settings && settings.insertmappings && isInput) {
      Mappings.insertCommand(key, function() {
        event.stopImmediatePropagation();
        event.preventDefault();
        if (Command.commandBarFocused() && Command.type !== 'search') {
          window.setTimeout(function() {
            Command.complete(Command.input.value);
          }, 0);
        }
      });
    }
  },
  up: function(key, event) {
    if (Command.commandBarFocused() ||
        (!insertMode && Mappings.queue.length && Mappings.validMatch)) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
    window.scrollKeyUp = true;
    if (Hints.active && event.which === 191)
      document.getElementById('cVim-link-container').style.opacity = '1';
  }
};

if (!HAS_EVENT_KEY_SUPPORT) {
  KeyHandler.listener = new KeyListener(KeyHandler.down);
  (function() {
    var oldKeyUpHandler = KeyHandler.up;
    KeyHandler.up = function(event) {
      if (!event.isTrusted)
        return true;
      return oldKeyUpHandler.call(this, null, event);
    };
  })();

  window.removeListeners = function() {
    KeyHandler.listenersActive = false;
    window.removeEventListener('keyup', KeyHandler.up, true);
    KeyHandler.listener.deactivate();
  };

  window.addListeners = function() {
    if (KeyHandler.listenersActive)
      removeListeners();
    KeyHandler.listenersActive = true;
    window.addEventListener('keyup', KeyHandler.up, true);
    KeyHandler.listener.activate();
  };
} else {
  KeyHandler.listener = new KeyListener(KeyHandler.down, KeyHandler.up);

  window.removeListeners = function() {
    KeyHandler.listenersActive = false;
    KeyHandler.listener.deactivate();
  };

  window.addListeners = function() {
    KeyHandler.listenersActive = true;
    KeyHandler.listener.activate();
  };
}

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
