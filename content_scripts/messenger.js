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
  }
});

chrome.extension.onMessage.addListener(function(request, sender, callback) {
  switch (request.action) {
    case 'updateLastCommand':
      if (request.data) {
        Mappings.lastCommand = JSON.parse(request.data);
      }
      break;
    case 'getWindows':
      if (Command.active === true) {
        Command.completions = {
          windows: Object.keys(request.windows).map(function(e, i) {
            var tlen = request.windows[e].length.toString();
            return [(i+1).toString() + ' (' + tlen + (tlen === '1' ? ' Tab)' : ' Tabs)'),  request.windows[e].join(', '), e];
          })
        };
        Command.completions.windows.unshift(['0 (New window)', '']);
        Command.updateCompletions();
      }
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
    case 'base64Image':
      RUNTIME('openLinkTab', {
        active: false,
        url: 'data:text/html;charset=utf-8;base64,' +
          window.btoa(reverseImagePost(request.data, null)),
        noconvert: true
      });
      break;
    case 'focusFrame':
      if (request.id === Frames.id) {
        Frames.focus();
      }
      break;
    case 'sessions':
      sessions = request.sessions;
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
      if (!insertMode && document.activeElement.isInput()) {
        Mappings.insertFunctions.deleteWord();
        if (Command.commandBarFocused())
          Command.complete(Command.input.value);
      }
      break;
    case 'getFilePath':
      Marks.filePath(request.data);
      break;
    case 'toggleEnabled':
      addListeners();
      if (!settings) {
        RUNTIME('getSettings');
      }
      Command.init(request.state);
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
  }
});
