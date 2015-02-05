var port = chrome.extension.connect({name: 'main'});

(function() {
  var $ = function(FN) {
    return function(action, args, callback) {
      (args = args || {}).action = action;
      FN(args, typeof callback === 'function' ?
          callback : void 0);
    };
  };
  RUNTIME = $(chrome.runtime.sendMessage.bind(chrome.runtime));
  PORT = $(port.postMessage.bind(port));
  ECHO = function(action, args, callback) {
    args.action = 'echoRequest';
    args.call = action;
    port.postMessage(args, typeof calback === 'function' ?
        callback : void 0);
  };
  // Workaround for regular callbacks from inside asynchronous
  // functions in the background script
  PORTCALLBACK = (function() {
    var registeredCallbacks = [];
    port.onMessage.addListener(function(response) {
      for (var i = 0; i < registeredCallbacks.length; i++) {
        if (registeredCallbacks[i].id === response.id) {
          var FN = registeredCallbacks[i].FN;
          registeredCallbacks.splice(i, 1);
          FN.apply(null, response.arguments);
        }
      }
    });
    return function(action, args, callback) {
      (args = args || {}).action = action;
      var info = {
        FN: callback,
        id: uuid4()
      };
      registeredCallbacks.push(info);
      args.id = info.id;
      port.postMessage(args);
    };
  })();
})();

port.onMessage.addListener(function(response) {
  var key;
  switch (response.type) {
    case 'hello':
      PORT('getSettings');
      PORT('getBookmarks');
      PORT('getQuickMarks');
      PORT('getSessionNames');
      PORT('retrieveAllHistory');
      PORT('sendLastSearch');
      PORT('getTopSites');
      PORT('getLastCommand');
      break;
    case 'updateLastCommand':
      Mappings.lastCommand = JSON.parse(response.data);
      break;
    case 'commandHistory':
      for (key in response.history) {
        Command.history[key] = response.history[key];
      }
      break;
    case 'history':
      var matches = [];
      for (key in response.history) {
        if (response.history[key].url) {
          if (response.history[key].title.trim() === '') {
            matches.push(['Untitled', response.history[key].url]);
          } else {
            matches.push([response.history[key].title, response.history[key].url]);
          }
        }
      }
      if (Command.historyMode) {
        if (Command.active && Command.bar.style.display !== 'none') {
          Command.completions = { history: matches };
          Command.updateCompletions(false);
        }
      } else if (Command.searchMode) {
        Command.searchMode = false;
        if (Command.active && Command.bar.style.display !== 'none') {
          Command.completions.history = matches;
          Command.updateCompletions(true);
        }
      }
      break;
    case 'bookmarks':
      Marks.parse(response.bookmarks);
      break;
    case 'topsites':
      Search.topSites = response.sites;
      break;
    case 'buffers':
      if (Command.bar.style.display !== 'none') {
        var val = Command.input.value.replace(/\S+\s+/, '');
        Command.hideData();
        Command.completions = {
          buffers: (function() {
            if (!val.trim() ||
                Number.isNaN(val) ||
                !response.buffers[+val - 1])
              return searchArray(response.buffers, val, settings.searchlimit,
                  true, function(item) {
                    return item.join(' ');
                  });
            return [ response.buffers[+val - 1] ] || [];
          })()
        };
        Command.updateCompletions();
      }
      break;
    case 'sessions':
      sessions = response.sessions;
      break;
    case 'quickMarks':
      Marks.parseQuickMarks(response.marks);
      break;
    case 'bookmarkPath':
      if (response.path.length) {
        Command.completions = {};
        Command.completions.paths = response.path;
        Command.updateCompletions();
      } else {
        Command.hideData();
      }
      break;
    case 'editWithVim':
      var lastInputElement = Mappings.insertFunctions.__getElement__();
      if (lastInputElement) {
        lastInputElement[lastInputElement.value !== void 0 ? 'value' : 'innerHTML'] =
          response.text.replace(/\n$/, ''); // remove trailing line left by vim
        if (!DOM.isSubmittable(lastInputElement)) {
          lastInputElement.blur();
        }
      }
      break;
    case 'httpRequest':
      httpCallback(response.id, response.text);
      break;
    case 'parseRC':
      if (response.config.MAPPINGS) {
        response.config.MAPPINGS.split('\n').compress().forEach(Mappings.parseLine);
        delete response.config.MAPPINGS;
      }
      Command.updateSettings(response.config);
      break;
    case 'sendSettings':
      Mappings.defaults = Object.clone(Mappings.defaultsClone);
      if (!Command.initialLoadStarted) {
        Command.configureSettings(response.settings);
      } else {
        Mappings.parseCustom(response.settings.MAPPINGS);
        settings = response.settings;
      }
      break;
    case 'updateLastCommand':
      if (request.data) {
        Mappings.lastCommand = JSON.parse(request.data);
      }
      break;
  }
});

chrome.extension.onMessage.addListener(function(request, sender, callback) {
  switch (request.action) {
    case 'hideHud':
      HUD.hide(true);
      break;
    case 'commandHistory':
      for (var key in request.history) {
        Command.history[key] = request.history[key];
      }
      break;
    case 'updateLastSearch':
      Find.lastSearch = request.value;
      break;
    case 'sendSettings':
      Mappings.defaults = Object.clone(Mappings.defaultsClone);
      if (!Command.initialLoadStarted) {
        Command.configureSettings(request.settings);
      } else {
        Mappings.parseCustom(request.settings.MAPPINGS);
        settings = request.settings;
      }
      break;
    case 'cancelAllWebRequests':
      window.stop();
      break;
    case 'updateMarks':
      Marks.parseQuickMarks(request.marks);
      break;
    case 'focusFrame':
      if (request.id === Frames.id) {
        Frames.focus();
      }
      break;
    case 'nextCompletionResult':
      if (settings.cncpcompletion && Command.commandBarFocused() && Command.type === 'action') {
        Search.nextResult();
        break;
      }
      if (window.self === window.top) {
        callback(true);
      }
      break;
    case 'deleteBackWord':
      if (!insertMode && DOM.isEditable(document.activeElement)) {
        Mappings.insertFunctions.deleteWord();
        if (Command.commandBarFocused())
          Command.complete(Command.input.value);
      }
      break;
    case 'toggleEnabled':
      addListeners();
      if (!settings) {
        RUNTIME('getSettings');
      }
      Command.init(!Command.loaded);
      break;
    case 'getBlacklistStatus':
      callback(Command.blacklisted);
      break;
    case 'alert':
      alert(request.message);
      break;
    case 'getSubFrames':
      if (self === top)
        callback(Frames.getSubFrames());
      break;
    case 'showCommandFrame':
      if (Command.frame) {
        Command.frame.style.display = 'block';
        Command.frame.contentWindow.focus();
      }
      if (window.isCommandFrame === true) {
        window.focus();
        Command.show(request.search, request.value, request.complete);
      }
      break;
    case 'hideCommandFrame':
      if (window.wasFocused) {
        window.wasFocused = false;
        window.focus();
        document.activeElement.focus();
        Mappings.handleEscapeKey();
        Mappings.clearQueue();
      }
      if (Command.frame) {
        Command.frame.style.display = 'none';
      }
      break;
    case 'callFind':
      if (window.wasFocused) {
        Find[request.command].apply(Find, request.params);
      }
      break;
    case 'setFindIndex':
      if (window.wasFocused) {
        Find.index = request.index;
      }
      break;
    case 'doIncSearch':
      if (!window.wasFocused)
        break;
      Find.clear();
      Find.highlight({
        base: document.body,
        search: request.search
      });
      Find.index = request.index;
      Find.setIndex();
      Find.search(request.index === 1, 1, true);
      break;
    case 'cancelIncSearch':
      document.body.scrollTop = Command.lastScrollTop;
      if (Find.previousMatches &&
          request.search &&
          Find.lastSearch &&
          Find.lastSearch !== request.search) {
        Find.clear();
        HUD.hide();
        Find.highlight({ base: document.body,
          search: Find.lastSearch,
          setIndex: false,
          executeSearch: false,
          reverse: true,
          saveSearch: true
        });
        Find.index = Find.lastIndex - 1;
        Find.search(false, 1, false);
      } else {
        Find.clear();
        HUD.hide();
      }
      break;
    case 'echoRequest':
      if (!window.isCommandFrame && document.hasFocus()) {
        switch (request.call) {
        case 'callMapFunction':
          Mappings.actions[request.name](1);
          break;
        case 'eval':
          eval(request.code);
          break;
        }
      }
      break;
  }
});
