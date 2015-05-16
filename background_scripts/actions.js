var Quickmarks = {};

Actions = (function() {

  var request, sender, callback, url, port, lastCommand = null;

  var _ = {};

  _.updateLastCommand = function() {
    lastCommand = request.data;
    if (!lastCommand) {
      return;
    }
    activePorts.forEach(function(port) {
      port.postMessage({
        type: 'updateLastCommand',
        data: request.data
      });
    });
  };

  _.getRootUrl = function() {
    callback(sender.tab.url);
  };

  _.viewSource = function() {
    url = 'view-source:' + sender.tab.url;
    _.openLink();
  };

  _.openLink = function() {
    if (request.tab.tabbed) {
      for (var i = 0; i < request.repeats; ++i) {
        chrome.tabs.create({
          url: url,
          active: request.tab.active,
          pinned: request.tab.pinned,
          index: getTabOrderIndex(sender.tab)
        });
      }
    } else {
      chrome.tabs.update({
        url: url,
        pinned: request.tab.pinned || sender.tab.pinned
      });
    }
  };

  _.openLinkTab = function() {
    if (!sender.tab) {
      chrome.tabs.query({active: true, currentWindow: true}, function(tab) {
        for (var i = 0; i < request.repeats; ++i) {
          chrome.tabs.create({
            url: url,
            active: request.active,
            pinned: request.pinned,
            index: getTabOrderIndex(tab[0])
          });
        }
      });
    } else {
      for (var i = 0; i < request.repeats; ++i) {
        chrome.tabs.create({
          url: url,
          active: request.active,
          pinned: request.pinned,
          index: getTabOrderIndex(sender.tab)
        });
      }
    }
  };

  _.addFrame = function() {
    var frame = Frames[sender.tab.id];
    if (frame === void 0 || request.isRoot) {
      Frames[sender.tab.id] = {
        index: 0,
        ids: [request.url]
      };
    } else {
      frame.ids.push(request.url);
    }
    callback(request.url);
  };

  _.focusFrame = function() {
    var _request = Object.clone(request);
    chrome.tabs.sendMessage(sender.tab.id, {
      action: 'getSubFrames'
    }, function(visibleFrames) {
      var frame = Frames[sender.tab.id];
      if (frame === void 0)
        return;
      var index = 0;
      if (!_request.isRoot) {
        index = (frame.index + _request.repeats)
          .mod(visibleFrames.length);
      }
      frame.index = index;
      chrome.tabs.sendMessage(sender.tab.id, {
        action: 'focusFrame',
        id: visibleFrames[index]
      });
    });
  };

  _.syncSettings = function() {
    for (var key in request.settings) {
      Settings[key] = request.settings[key];
    }
    Options.sendSettings();
  };

  _.openLinkWindow = function() {
    for (var i = 0; i < request.repeats; ++i) {
      chrome.windows.create({
        url: url,
        focused: request.tab.active
      });
    }
  };

  _.closeTab = function() {
    chrome.tabs.query({currentWindow: true}, function(tabs) {
      var sortedIds = tabs.map(function(e) { return e.id; });
      var base = sender.tab.index;
      if (request.repeats > sortedIds.length - base) {
        base -= request.repeats - (sortedIds.length - base);
      }
      if (base < 0) {
        base = 0;
      }
      chrome.tabs.remove(sortedIds.slice(base, base + request.repeats));
    });
  };

  (function() {
    var closeTab = function(n) {
      chrome.tabs.query({currentWindow: true}, function(tabs) {
        tabs = tabs.map(function(e) { return e.id; });
        chrome.tabs.remove(tabs.slice(sender.tab.index + (n < 0 ? n : 1),
                           sender.tab.index + (n < 0 ? 0 : 1 + n)));
      });
    };
    _.closeTabLeft  = function() { closeTab(-request.repeats); };
    _.closeTabRight = function() { closeTab( request.repeats); };
    _.closeTabsToLeft = function() { closeTab(-sender.tab.index); };
    _.closeTabsToRight = function() {
      chrome.tabs.query({currentWindow: true},
          function(tabs) { closeTab(tabs.length - sender.tab.index); });
    };
  })();

  _.getWindows = function() {
    var _ret = {};
    chrome.windows.getAll(function(info) {
      var _callback = callback;
      info = info.filter(function(e) {
        return e.type === 'normal' && e.id !== sender.tab.windowId;
      }).map(function(e) {
        _ret[e.id] = [];
        return e.id;
      });
      chrome.tabs.query({}, function(tabs) {
        tabs = tabs.filter(function(e) {
          return info.indexOf(e.windowId) !== -1;
        });
        for (var i = 0; i < tabs.length; i++) {
          if (_ret.hasOwnProperty(tabs[i].windowId)) {
            _ret[tabs[i].windowId].push(tabs[i].title);
          }
        }
        _callback(_ret);
      });
    });
    return true;
  };

  _.moveTab = function() {
    if (request.windowId === sender.tab.windowId) {
      return;
    }
    chrome.windows.getAll(function(info) {
      info = info.filter(function(e) {
        return e.type === 'normal';
      }).map(function(e) {
        return e.id;
      });
      var repin = function() {
        chrome.tabs.update(sender.tab.id, {
          pinned: sender.tab.pinned,
          active: true
        }, function(tab) {
          chrome.windows.update(tab.windowId, {
            focused: true
          });
        });
      };
      if (info.indexOf(parseInt(request.windowId)) !== -1) {
        chrome.tabs.move(sender.tab.id, {
          windowId: parseInt(request.windowId),
          index: -1
        }, repin);
      } else {
        chrome.tabs.query({currentWindow: true}, function(tabs) {
          if (tabs.length > 1) {
            chrome.windows.create({
              tabId: sender.tab.id,
              incognito: sender.tab.incognito,
              focused: true
            }, repin);
          }
        });
      }
    });
  };

  _.closeWindow = function() {
    chrome.windows.remove(sender.tab.windowId);
  };

  _.openLastLinkInTab = function() {
    if (TabHistory[sender.tab.id] === void 0) {
      return;
    }
    var hist = TabHistory[sender.tab.id];
    if (hist.links[hist.state - request.repeats] !== void 0) {
      chrome.tabs.create({url: hist.links[hist.state - request.repeats]});
    }
  };

  _.openNextLinkInTab = function() {
    if (TabHistory[sender.tab.id] === void 0) {
      return;
    }
    var hist = TabHistory[sender.tab.id];
    if (hist.links[hist.state + request.repeats] !== void 0) {
      chrome.tabs.create({url: hist.links[hist.state + request.repeats]});
    }
  };

  _.getHistoryStates = function() {
    if (TabHistory[sender.tab.id] === void 0) {
      return callback({links: []});
    }
    callback(TabHistory[sender.tab.id]);
  };

  _.reloadTab = function() {
    chrome.tabs.reload({
      bypassCache: request.nocache
    });
  };

  _.reloadAllTabs = function() {
    chrome.tabs.query({}, function(tabs) {
      tabs.forEach(function(tab) {
        if (!/^chrome:\/\//.test(tab.url) && !(!request.current && tab.id === sender.tab.id && tab.windowId === sender.tab.windowId)) {
          chrome.tabs.reload(tab.id);
        }
      });
    });
  };

  _.nextTab = function() {
    getTab(sender.tab, false, request.repeats, false, false);
  };

  _.previousTab = function() {
    getTab(sender.tab, true, request.repeats, false, false);
  };

  _.firstTab = function() {
    getTab(sender.tab, false, false, true, false);
  };

  _.lastTab = function() {
    getTab(sender.tab, false, false, false, true);
  };

  _.appendHistory = function() {
    if (sender.tab.incognito === false) {
      History.append(request.value, request.type);
      chrome.tabs.query({}, function(tabs) {
        tabs.forEach(function(tab) {
          chrome.tabs.sendMessage(tab.id, {
            action: 'commandHistory',
            history: History.commandHistory
          });
        });
      });
    }
  };

  _.pinTab = function() {
    chrome.tabs.update({
      pinned: request.pinned !== void 0 ? request.pinned : !sender.tab.pinned
    });
  };

  _.copy = function() {
    Clipboard.copy(request.text);
  };

  _.goToTab = function() {
    var id = request.id, index = request.index;
    chrome.tabs.query({currentWindow: true}, function(tabs) {
      if (id) {
        return chrome.tabs.get(id, function(tabInfo) {
          chrome.windows.update(tabInfo.windowId, {focused: true}, function() {
            chrome.tabs.update(id, {active: true, highlighted: true});
          });
        });
      } else if (index !== void 0) {
        chrome.tabs.update((index < tabs.length ? tabs[index].id :
            tabs.slice(-1)[0].id), {active: true});
      }
    });
  };

  (function() {
    var move = function(by) {
      chrome.tabs.query({currentWindow: true}, function(tabs) {
        var ptabs = tabs.filter(function(e) { return e.pinned; });
        chrome.tabs.move(sender.tab.id, {
          index: Math.min( sender.tab.pinned ? ptabs.length - 1 : ptabs.length + tabs.length - 1,
                           Math.max(sender.tab.pinned ? 0 : ptabs.length, sender.tab.index + by) )
        });
      });
    };
    _.moveTabRight = function() { move( request.repeats); };
    _.moveTabLeft  = function() { move(-request.repeats); };
  })();

  _.openPasteTab = function() {
    var paste = Clipboard.paste();
    if (!paste) {
      return;
    }
    paste = paste.split('\n').filter(function(e) { return e.trim(); });
    if (paste.length && paste[0].convertLink() !== paste[0]) {
      paste = paste.join('\n');
      return chrome.tabs.create({
        url: paste.convertLink(),
        index: getTabOrderIndex(sender.tab)
      });
    }
    for (var i = 0; i < request.repeats; ++i) {
      for (var j = 0, l = paste.length; j < l; ++j) {
        chrome.tabs.create({
          url: paste[j].convertLink(),
          index: getTabOrderIndex(sender.tab)
        });
      }
    }
  };

  _.openPaste = function() {
    var paste = Clipboard.paste();
    if (!paste) {
      return;
    }
    paste = paste.split('\n')[0];
    chrome.tabs.update({
      url: paste.convertLink()
    });
  };

  _.createSession = function() {
    var _callback = callback;
    sessions[request.name] = {};
    chrome.tabs.query({
      currentWindow: true
    }, function(tabs) {
      tabs.forEach(function(tab) {
        if (tab && tab.index !== void 0) {
          sessions[request.name][tab.index] = tab;
        }
      });
      chrome.storage.local.set({sessions: sessions});
      _callback(Object.keys(sessions).map(function(e) {
        return [e, Object.keys(sessions[e]).length.toString() +
          ' tab' + (Object.keys(sessions[e]).length === 1 ? '' : 's')];
      }));
    });
    return true;
  };

  _.openBookmarkFolder = function() {
    Bookmarks.getFolderLinks(request.path, Links.multiOpen);
  };

  _.deleteSession = function() {
    delete sessions[request.name];
    chrome.storage.local.set({
      sessions: sessions
    });
  };

  _.lastActiveTab = function() {
    if (ActiveTabs[sender.tab.windowId] !== void 0) {
      chrome.tabs.update(ActiveTabs[sender.tab.windowId].shift(), {active: true});
    }
  };

  _.openSession = function() {
    if (sessions.hasOwnProperty(request.name)) {
      var tabs = Object.keys(sessions[request.name]).sort().map(function(e) {
        return sessions[request.name][e];
      });
      if (!request.sameWindow) {
        chrome.windows.create({
          url: 'chrome://newtab',
        }, function(tabInfo) {
          chrome.tabs.update(tabInfo.tabs[0].id,
            {url: tabs[0].url, pinned: tabs[0].pinned}
          );
          tabs.slice(1).forEach(function(tab) {
            chrome.tabs.create({
              url: tab.url,
              pinned: tab.pinned,
              windowId: tabInfo.tabs[0].windowId,
              index: tab.index
            });
          });
        });
      } else {
        chrome.tabs.query({currentWindow: true}, function(tabInfo) {
          var windowLength = tabInfo.length;
          tabs.forEach(function(tab) {
            chrome.tabs.create({
              url: tab.url,
              pinned: tab.pinned,
              active: false,
              index: windowLength + tab.index
            });
          });
        });
      }
    }
  };

  _.openLast = function() {
    var stepBackFN = Sessions.nativeSessions ?
      chrome.sessions.restore.bind(chrome.sessions) :
      Sessions.stepBack.bind(Sessions, sender);
    for (var i = 0; i < request.repeats; i++) {
      stepBackFN();
    }
  };

  _.isNewInstall = function() {
    if (sender.tab.id === Updates.tabId && Updates.displayMessage) {
      Updates.displayMessage = false;
      Updates.tabId = null;
      callback(Updates.installMessage);
    }
  };

  _.cancelAllWebRequests = function() {
    chrome.tabs.query({currentWindow: true}, function(tabs) {
      tabs.forEach(function(tab) {
        chrome.tabs.sendMessage(tab.id, {action: 'cancelAllWebRequests'});
      });
    });
  };

  _.hideDownloadsShelf = function() {
    chrome.downloads.setShelfEnabled(false);
    chrome.downloads.setShelfEnabled(true);
  };

  _.updateMarks = function() {
    Quickmarks = request.marks;
    chrome.tabs.query({currentWindow: true}, function(tabs) {
      for (var i = 0, l = tabs.length; i < l; ++i) {
        if (tabs[i].id !== sender.tab.id) {
          chrome.tabs.sendMessage(tabs[i].id, {action: 'updateMarks', marks: request.marks});
        }
      }
    });
  };

  _.getChromeSessions = function() {
    callback(Sessions.recentlyClosed);
  };

  _.restoreChromeSession = function() {
    var sessionIds = Sessions.recentlyClosed.map(function(e) {
      return e.id;
    });
    if (sessionIds.indexOf(request.sessionId) !== -1) {
      chrome.sessions.restore(request.sessionId);
    }
  };

  // chrome.tabs.zoom features: Chrome >= 38 (beta + dev)
  (function() {

    var zoom = function(scale, override, repeats) {
      if (chrome.tabs.getZoom === void 0) {
        return callback(false);
      }
      chrome.tabs.getZoom(sender.tab.id, function(zoomFactor) {
        chrome.tabs.setZoom(sender.tab.id, override || zoomFactor + scale * repeats);
      });
    };

    _.zoomIn = function() {
      zoom(Settings.zoomfactor, null, request.repeats);
    };

    _.zoomOut = function() {
      zoom(-Settings.zoomfactor, null, request.repeats);
    };

    _.zoomOrig = function() { zoom(null, 1.0, 1); };

  })();

  _.duplicateTab = function() {
    for (var i = 0; i < request.repeats; i++) {
      chrome.tabs.duplicate(sender.tab.id);
    }
  };

  _.lastUsedTab = function() {
    if (LastUsedTabs.length === 2) {
      chrome.tabs.query({}, function(tabs) {
        for (var i = 0; i < tabs.length; i++) {
          if (LastUsedTabs[0] === tabs[i].id) {
            chrome.tabs.update(LastUsedTabs[0], {active: true});
            break;
          }
        }
      });
    }
  };

  _.runScript = function() {
    chrome.tabs.executeScript(sender.tab.id, {code: request.code}, function() {
      if (!chrome.runtime.lastError) {
        return true;
      }
    });
  };

  // Port actions

  _.sendLastSearch = function() {
    if (!_.lastSearch) {
      return;
    }
    chrome.tabs.query({}, function(tabs) {
      tabs.forEach(function(tab) {
        chrome.tabs.sendMessage(tab.id, {action: 'updateLastSearch', value: _.lastSearch});
      });
    });
  };

  _.updateLastSearch = function() {
    var search = request.value;
    if (!search) {
      return;
    }
    _.lastSearch = request.value;
    _.sendLastSearch();
  };

  _.injectCSS = function() {
    chrome.tabs.insertCSS(sender.tab.id, {code: request.css}, function() {
      // prevent the background script from throwing exceptions
      // when trying to insert CSS into unsupported URLs (chrome://*, etc)
      if (!chrome.runtime.lastError) {
        return true;
      }
    });
  };

  _.urlToBase64 = function() {
    var _callback = callback;
    var img = new Image();
    img.onload = function() {
      var canvas = document.createElement('canvas');
      canvas.width = this.width;
      canvas.height = this.height;
      var context = canvas.getContext('2d');
      context.drawImage(this, 0, 0);
      var data = canvas.toDataURL('image/png');
      _callback(data);
    };
    img.src = request.url;
    return true;
  };

  _.getBookmarks = function() {
    Bookmarks.getMarks(function(marks) {
      callback({type: 'bookmarks', bookmarks: marks});
    });
  };

  _.searchHistory = function() {
    History.retrieveSearchHistory(request.search, request.limit || 4, function(results) {
      callback({type: 'history', history: results});
    });
  };

  _.getTopSites = function() {
    Sites.getTop(function(results) {
      callback({type: 'topsites', sites: results});
    });
  };

  _.getQuickMarks = function() {
    callback({type: 'quickMarks', marks: Quickmarks});
  };

  _.getBuffers = function() {
    chrome.tabs.query({}, function(tabs) {
      callback({
        type: 'buffers',
        buffers: tabs.map(function(e, i) {
          var title = e.title;
          if (Settings.showtabindices) {
            title = title.replace(new RegExp('^' + (e.index + 1) + ' '), '');
          }
          return [(i + 1) + ': ' + title, e.url, e.id];
        })
      });
    });
  };

  _.getSessionNames = function() {
    callback({type: 'sessions', sessions: Object.keys(sessions).map(function(e) { return [e, Object.keys(sessions[e]).length.toString() + ' tab' + (Object.keys(sessions[e]).length === 1 ? '' : 's')]; } )});
  };

  _.retrieveAllHistory = function() {
    callback({type: 'commandHistory', history: History.commandHistory});
  };

  _.getBookmarkPath = function() {
    chrome.bookmarks.getTree(function(marks) {
      Bookmarks.getPath(marks[0].children, request.path, function(e) {
        callback({type: 'bookmarkPath', path: e});
      });
    });
  };

  _.getLastCommand = function() {
    if (lastCommand) {
      callback({type: 'updateLastCommand', data: lastCommand});
    }
  };

  _.getSettings = function() {
    Options.refreshSettings(function() {
      callback({
        type: 'sendSettings',
        settings: request.reset ? defaultSettings : Settings
      });
    });
  };

  _.setIconEnabled = function() {
    chrome.browserAction.setIcon({
      path: 'icons/38.png',
      tabId: sender.tab.id
    }, function() {
      return chrome.runtime.lastError;
    });
  };

  _.getFilePath = function() {
    var _callback = callback;
    Files.getPath(request.path, function(data) {
      _callback(data);
    });
    return true;
  };

  _.getBlacklisted = function() {
    Popup.getBlacklisted(function() {
      callback(true);
    });
  };


  _.editWithVim = function() {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://127.0.0.1:' + Settings.vimport);
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        callback({type: 'editWithVim', text: xhr.responseText});
      }
    };
    xhr.send(JSON.stringify({
      command: Settings.vimcommand,
      data: '' + (request.text || '')
    }));
  };

  _.httpRequest = function() {
    httpRequest(request.request).then(function(res) {
      callback({type: 'httpRequest', id: request.id, text: res});
    });
  };

  _.createBookmark = function() {
    var url = request.url, title = request.title;
    chrome.bookmarks.search({url: url}, function(results) {
      if (!results.length) {
        chrome.bookmarks.create({url: url, title: title});
      } else if (results[0].parentId === '2') {
        chrome.bookmarks.remove(results[0].id);
      }
    });
  };

  _.quitChrome = function() {
    chrome.windows.getAll({populate: false}, function(windowList) {
      windowList.forEach(function(e) {
        chrome.windows.remove(e.id);
      });
    });
  };

  _.parseRC = function() {
    callback({type: 'parseRC', config: RCParser.parse(request.config)});
  };

  _.commandFrameLoaded = function() {
    chrome.tabs.sendMessage(sender.tab.id, {
      action: request.action
    });
  };

  _.showCommandFrame = function() {
    chrome.tabs.sendMessage(sender.tab.id, {
      action: request.action,
      search: request.search,
      value: request.value,
      complete: request.complete
    });
  };

  _.hideCommandFrame = function() {
    chrome.tabs.sendMessage(sender.tab.id, {
      action: request.action
    });
  };

  _.callFind = function() {
    chrome.tabs.sendMessage(sender.tab.id, {
      action: request.action,
      command: request.command,
      params: request.params
    });
  };

  _.setFindIndex = function() {
    chrome.tabs.sendMessage(sender.tab.id, {
      action: request.action,
      index: request.index
    });
  };

  _.yankWindowUrls = function() {
    chrome.tabs.query({ currentWindow: true }, function(tabs) {
      Clipboard.copy(tabs.map(function(tab) {
        return tab.url;
      }).join('\n'));
      callback(tabs.length);
    });
  };

  _.doIncSearch = function() {
    chrome.tabs.sendMessage(sender.tab.id, request);
  };

  _.cancelIncSearch = function() {
    chrome.tabs.sendMessage(sender.tab.id, request);
  };

  _.echoRequest = function() {
    chrome.tabs.sendMessage(sender.tab.id, request);
  };

  _.loadLocalConfig = function() {
    var _callback = callback;
    var path = request.path || 'file://' + Settings.configpath
      .split('~').join(Settings.homedirectory || '~');
    httpRequest({ url: path }).then(function(data) {
      var added = window.parseConfig(data);
      if (added.error) {
        console.error('parse error on line %d of cVimrc: %s',
            added.error.lineno, added.error.message);
        _callback({
          code: -2,
          error: added.error,
          config: Settings
        });
        return;
      }
      added = added.value;
      added.localconfig = added.localconfig || false;
      var oldSettings = Object.clone(Settings);
      var settings = Object.clone(defaultSettings);
      added.localconfig = oldSettings.localconfig;
      Object.merge(settings, added);
      if (oldSettings.localconfig) {
        Options.saveSettings({
          settings: Object.clone(settings),
          sendSettings: false
        });
        Object.merge(Settings, oldSettings);
        Object.merge(Settings, added);
        Options.sendSettings();
      } else {
        Object.merge(Settings, added);
        Settings.RC = oldSettings.RC;
        Options.sendSettings();
      }
      _callback({
        code: 0,
        error: null,
        config: Settings
      });
    }, function(xhr) { if (xhr);
      _callback({
        code: -1,
        error: null,
        config: Settings
      });
    });
    return true;
  };

  return function(_request, _sender, _callback, _port) {
    port = _port;
    var action = _request.action;
    if (!_[action]) {
      return;
    }
    request = _request;
    sender = _sender;
    callback = _callback;
    request.repeats = Math.max(~~request.repeats, 1);
    if (request.url && !request.noconvert) {
      url = request.url.convertLink();
    } else if (request.url) {
      url = request.url;
    } else {
      url = Settings.defaultnewtabpage ?
        'chrome://newtab' : '../pages/blank.html';
    }
    if (!sender.tab && action !== 'openLinkTab')
      return;
    return _[action]();
  };

})();
