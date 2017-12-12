var Quickmarks = {};

Actions = (function() {

  var lastCommand = null;

  var openTab = function(options, times) {
    times = +times || 1;
    var doOpen = function() {
      for (var i = 0; i < times; ++i)
        chrome.tabs.create(options);
    };
    if (options.active)
      setTimeout(doOpen, 80);
    else
      doOpen();
  };

  var _ = {};

  _.updateLastCommand = function(o) {
    lastCommand = o.request.data;
    if (!lastCommand) {
      return;
    }
    activePorts.forEach(function(port) {
      port.postMessage({
        type: 'updateLastCommand',
        data: o.request.data
      });
    });
  };

  _.getRootUrl = function(o) {
    o.callback(o.sender.tab.url);
  };

  _.viewSource = function(o) {
    o.url = 'view-source:' + o.sender.tab.url;
    _.openLink(o);
  };

  _.openLink = function(o) {
    var i;
    if (o.request.tab.newWindow) {
      for (i = 0; i < o.request.repeats; ++i) {
        chrome.windows.create({
          url: o.url,
          focused: o.request.tab.active,
          incognito: o.request.tab.incognito,
        });
      }
    } else if (o.request.tab.tabbed) {
      openTab({
        url: o.url,
        active: o.request.tab.active,
        pinned: o.request.tab.pinned,
        index: getTabOrderIndex(o.sender.tab)
      }, o.request.repeats);
    } else {
      chrome.tabs.update({
        url: o.url,
        pinned: o.request.tab.pinned || o.sender.tab.pinned
      });
    }
  };

  _.openLinkTab = function(o) {
    if (!o.sender.tab) {
      chrome.tabs.query({active: true, currentWindow: true}, function(tab) {
        openTab({
          url: o.url,
          active: o.request.active,
          pinned: o.request.pinned,
          index: getTabOrderIndex(tab[0])
        }, o.request.repeats);
      });
    } else {
      openTab({
        url: o.url,
        active: o.request.active,
        pinned: o.request.pinned,
        index: getTabOrderIndex(o.sender.tab)
      }, o.request.repeats);
    }
  };

  _.addFrame = function(o) {
    Frames.add(o.sender.tab.id, o.port, o.request.isCommandFrame);
  };

  _.portCallback = (function() {
    var callbacks = {};

    var retval = function(o) {
      callbacks[o.request.id](Object.clone(o.request));
      delete callbacks[o.request.id];
    };

    retval.addCallback = function(callback) {
      var id = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
      callbacks[id] = callback;
      return id;
    };

    return retval;
  })();

  _.focusFrame = function(o) {
    if (o.request.isRoot) {
      var frame = Frames.get(o.sender.tab.id);
      if (frame)
        frame.focus(0);
    } else {
      Frames.get(o.sender.tab.id).focusNext();
    }
  };

  _.syncSettings = function(o) {
    if (o.request.settings.hud === false && settings.hud === true) {
      chrome.tabs.query({}, function(tabs) {
        tabs.forEach(function(tab) {
          chrome.tabs.sendMessage(tab.id, {action: 'hideHud'});
        });
      });
    }
    for (var key in o.request.settings) {
      settings[key] = o.request.settings[key];
    }
    Options.sendSettings();
  };

  _.openLinksWindow = function(o) {
    var urls = o.request.urls;
    if (!o.request.noconvert) {
      urls = urls.map(function(e) { return Utils.toSearchURL(e); });
    }
    for (var i = 0; i < o.request.repeats; i++) {
      chrome.windows.create({
        url: urls[0],
        focused: o.request.focused,
        incognito: o.request.incognito
      }, function(win) {
        for (var i = 1; i < urls.length; i++) {
          chrome.tabs.create({
            url: urls[i],
            windowId: win.id
          });
        }
      });
    }
  };

  _.openLinkWindow = function(o) {
    for (var i = 0; i < o.request.repeats; ++i) {
      chrome.windows.create({
        url: o.url,
        focused: o.request.focused,
        incognito: o.request.incognito
      });
    }
  };

  _.closeTab = function(o) {
    chrome.tabs.query({currentWindow: true}, function(tabs) {
      var sortedIds = tabs.map(function(e) { return e.id; });
      var base = o.sender.tab.index;
      if (o.request.repeats > sortedIds.length - base) {
        base -= o.request.repeats - (sortedIds.length - base);
      }
      if (base < 0) {
        base = 0;
      }
      chrome.tabs.remove(sortedIds.slice(base, base + o.request.repeats));
    });
  };

  (function() {
    var closeTab = function(o, n) {
      chrome.tabs.query({currentWindow: true}, function(tabs) {
        tabs = tabs.map(function(e) { return e.id; });
        chrome.tabs.remove(tabs.slice(o.sender.tab.index + (n < 0 ? n : 1),
                           o.sender.tab.index + (n < 0 ? 0 : 1 + n)));
      });
    };
    _.closeTabLeft  = function(o) { closeTab(o, -o.request.repeats); };
    _.closeTabRight = function(o) { closeTab(o, o.request.repeats); };
    _.closeTabsToLeft = function(o) { closeTab(o, -o.sender.tab.index); };
    _.closeTabsToRight = function(o) {
      chrome.tabs.query({currentWindow: true},
          function(tabs) { closeTab(o, tabs.length - o.sender.tab.index); });
    };
  })();

  _.getWindows = function(o) {
    var _ret = {};
    chrome.windows.getAll(function(info) {
      info = info.filter(function(e) {
        return e.type === 'normal' && e.id !== o.sender.tab.windowId;
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
        o.callback(_ret);
      });
    });
    return true;
  };

  _.moveTab = function(o) {
    if (o.request.windowId === o.sender.tab.windowId) {
      return;
    }
    chrome.windows.getAll(function(info) {
      info = info.filter(function(e) {
        return e.type === 'normal';
      }).map(function(e) {
        return e.id;
      });
      var repin = function() {
        chrome.tabs.update(o.sender.tab.id, {
          pinned: o.sender.tab.pinned,
          active: true
        }, function(tab) {
          chrome.windows.update(tab.windowId, {
            focused: true
          });
        });
      };
      if (info.indexOf(parseInt(o.request.windowId)) !== -1) {
        chrome.tabs.move(o.sender.tab.id, {
          windowId: parseInt(o.request.windowId),
          index: -1
        }, repin);
      } else {
        chrome.tabs.query({currentWindow: true}, function(tabs) {
          if (tabs.length > 1) {
            chrome.windows.create({
              tabId: o.sender.tab.id,
              incognito: o.sender.tab.incognito,
              focused: true
            }, repin);
          }
        });
      }
    });
  };

  _.closeWindow = function(o) {
    chrome.windows.remove(o.sender.tab.windowId);
  };

  _.openLastLinkInTab = function(o) {
    if (TabHistory[o.sender.tab.id] === void 0) {
      return;
    }
    var hist = TabHistory[o.sender.tab.id];
    if (hist.links[hist.state - o.request.repeats] !== void 0) {
      openTab({url: hist.links[hist.state - o.request.repeats]});
    }
  };

  _.openNextLinkInTab = function(o) {
    if (TabHistory[o.sender.tab.id] === void 0) {
      return;
    }
    var hist = TabHistory[o.sender.tab.id];
    if (hist.links[hist.state + o.request.repeats] !== void 0) {
      openTab({url: hist.links[hist.state + o.request.repeats]});
    }
  };

  _.getHistoryStates = function(o) {
    if (TabHistory[o.sender.tab.id] === void 0) {
      return o.callback({links: []});
    }
    o.callback(TabHistory[o.sender.tab.id]);
  };

  _.reloadTab = function(o) {
    chrome.tabs.reload({
      bypassCache: o.request.nocache
    });
  };

  _.reloadAllTabs = function(o) {
    chrome.tabs.query({}, function(tabs) {
      tabs.forEach(function(tab) {
        if (!/^chrome:\/\//.test(tab.url) && !(!o.request.current && tab.id === o.sender.tab.id && tab.windowId === o.sender.tab.windowId)) {
          chrome.tabs.reload(tab.id);
        }
      });
    });
  };

  _.nextTab = function(o) {
    getTab(o.sender.tab, false, o.request.repeats, false, false);
  };

  _.previousTab = function(o) {
    getTab(o.sender.tab, true, o.request.repeats, false, false);
  };

  _.firstTab = function(o) {
    getTab(o.sender.tab, false, false, true, false);
  };

  _.lastTab = function(o) {
    getTab(o.sender.tab, false, false, false, true);
  };

  _.clearHistory = function() {
    History.clear();
    History.saveCommandHistory();
    History.sendToTabs();
  };

  _.appendHistory = function(o) {
    if (o.sender.tab.incognito === false) {
      History.append(o.request.value, o.request.type);
      History.sendToTabs();
    }
  };

  _.pinTab = function(o) {
    chrome.tabs.update(o.sender.tab.id, {
      pinned: o.request.pinned !== void 0 ? o.request.pinned : !o.sender.tab.pinned
    });
  };

  _.copy = function(o) {
    Clipboard.copy(o.request.text);
  };

  _.goToTab = function(o) {
    var id = o.request.id, index = o.request.index;
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
    var move = function(o, by) {
      chrome.tabs.query({currentWindow: true}, function(tabs) {
        var ptabs = tabs.filter(function(e) { return e.pinned; });
        chrome.tabs.move(o.sender.tab.id, {
          index: Math.min(o.sender.tab.pinned ? ptabs.length - 1 : ptabs.length + tabs.length - 1,
                          Math.max(o.sender.tab.pinned ? 0 : ptabs.length, o.sender.tab.index + by))
        });
      });
    };
    _.moveTabRight = function(o) { move(o, o.request.repeats); };
    _.moveTabLeft  = function(o) { move(o, -o.request.repeats); };
  })();

  _.openPasteTab = function(o) {
    var paste = Clipboard.paste();
    if (!paste) {
      return;
    }
    paste = paste.split('\n').filter(function(e) { return e.trim(); });
    for (var i = 0; i < o.request.repeats; ++i) {
      for (var j = 0, l = paste.length; j < l; ++j) {
        openTab({
          url: Utils.toSearchURL(paste[j], o.request.engineUrl),
          index: getTabOrderIndex(o.sender.tab)
        });
      }
    }
  };

  _.openPaste = function(o) {
    var paste = Clipboard.paste();
    if (!paste) {
      return;
    }
    paste = paste.split('\n')[0];
    chrome.tabs.update({
      url: Utils.toSearchURL(paste, o.request.engineUrl)
    });
  };

  _.getPaste = function(o) {
    o.callback(Clipboard.paste());
  };

  _.createSession = function(o) {
    sessions[o.request.name] = {};
    chrome.tabs.query({
      currentWindow: true
    }, function(tabs) {
      tabs.forEach(function(tab) {
        if (tab && tab.index !== void 0) {
          sessions[o.request.name][tab.index] = tab;
        }
      });
      chrome.storage.local.set({sessions: sessions});
      o.callback(Object.keys(sessions).map(function(e) {
        return [e, Object.keys(sessions[e]).length.toString() +
          ' tab' + (Object.keys(sessions[e]).length === 1 ? '' : 's')];
      }));
    });
    return true;
  };

  _.openBookmarkFolder = function(o) {
    Bookmarks.getFolderLinks(o.request.path, Links.multiOpen);
  };

  _.deleteSession = function(o) {
    delete sessions[o.request.name];
    chrome.storage.local.set({
      sessions: sessions
    });
  };

  _.lastActiveTab = function(o) {
    if (ActiveTabs[o.sender.tab.windowId] !== void 0) {
      chrome.tabs.update(ActiveTabs[o.sender.tab.windowId].shift(), {active: true});
    }
  };

  _.openSession = function(o) {
    if (sessions.hasOwnProperty(o.request.name)) {
      var tabs = Object.keys(sessions[o.request.name]).sort().map(function(e) {
        return sessions[o.request.name][e];
      });
      if (!o.request.sameWindow) {
        chrome.windows.create({
          url: 'chrome://newtab',
        }, function(tabInfo) {
          chrome.tabs.update(tabInfo.tabs[0].id,
            {url: tabs[0].url, pinned: tabs[0].pinned}
          );
          tabs.slice(1).forEach(function(tab) {
            openTab({
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
            openTab({
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

  _.openLast = function(o) {
    var stepBackFN = Sessions.nativeSessions ?
      chrome.sessions.restore.bind(chrome.sessions) :
      Sessions.stepBack.bind(Sessions, o.sender);
    for (var i = 0; i < o.request.repeats; i++) {
      stepBackFN();
    }
  };

  _.isNewInstall = function(o) {
    if (o.sender.tab.id === Updates.tabId && Updates.displayMessage) {
      Updates.displayMessage = false;
      Updates.tabId = null;
      o.callback(Updates.installMessage);
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

  _.updateMarks = function(o) {
    Quickmarks = o.request.marks;
    chrome.tabs.query({currentWindow: true}, function(tabs) {
      for (var i = 0, l = tabs.length; i < l; ++i) {
        if (tabs[i].id !== o.sender.tab.id) {
          chrome.tabs.sendMessage(tabs[i].id, {action: 'updateMarks', marks: o.request.marks});
        }
      }
    });
  };

  _.getChromeSessions = function(o) {
    o.callback(Sessions.recentlyClosed);
  };

  _.restoreChromeSession = function(o) {
    var sessionIds = Sessions.recentlyClosed.map(function(e) {
      return e.id;
    });
    if (sessionIds.indexOf(o.request.sessionId) !== -1) {
      chrome.sessions.restore(o.request.sessionId);
    }
  };

  // chrome.tabs.zoom features: Chrome >= 38 (beta + dev)
  (function() {

    var zoom = function(o, scale, override, repeats) {
      if (chrome.tabs.getZoom === void 0) {
        return o.callback(false);
      }
      chrome.tabs.getZoom(o.sender.tab.id, function(zoomFactor) {
        chrome.tabs.setZoomSettings(o.sender.tab.id, {
          scope: 'per-tab',
        }, function() {
          chrome.tabs.setZoom(o.sender.tab.id, override || zoomFactor + scale * repeats);
        });
      });
    };

    _.zoomIn = function(o) {
      zoom(o, settings.zoomfactor, null, o.request.repeats);
    };

    _.zoomOut = function(o) {
      zoom(o, -settings.zoomfactor, null, o.request.repeats);
    };

    _.zoomOrig = function(o) { zoom(o, null, 1.0, 1); };

  })();

  _.duplicateTab = function(o) {
    for (var i = 0; i < o.request.repeats; i++) {
      chrome.tabs.duplicate(o.sender.tab.id);
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

  _.runScript = function(o) {
    chrome.tabs.executeScript(o.sender.tab.id, {
      code: o.request.code,
      runAt: 'document_start',
    }, function() {
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

  _.updateLastSearch = function(o) {
    if (!o.request.value)
      return;
    _.lastSearch = o.request.value;
    _.sendLastSearch();
  };

  _.injectCSS = function(o) {
    chrome.tabs.insertCSS(o.sender.tab.id, {code: o.request.css}, function() {
      // prevent the background script from throwing exceptions
      // when trying to insert CSS into unsupported URLs (chrome://*, etc)
      if (!chrome.runtime.lastError) {
        return true;
      }
    });
  };

  _.getBookmarks = function(o) {
    Bookmarks.getMarks(function(marks) {
      o.callback({type: 'bookmarks', bookmarks: marks});
    });
  };

  _.searchHistory = function(o) {
    History.retrieveSearchHistory(o.request.search, o.request.limit || 4, function(results) {
      o.callback({type: 'history', history: results});
    });
  };

  _.getTopSites = function(o) {
    Sites.getTop(function(results) {
      o.callback({type: 'topsites', sites: results});
    });
  };

  _.getQuickMarks = function(o) {
    o.callback({type: 'quickMarks', marks: Quickmarks});
  };

  _.getBuffers = function(o) {
    chrome.tabs.query({}, function(tabs) {
      var otherWindows = [];
      tabs = tabs.filter(function(e) {
        if (e.windowId === o.sender.tab.windowId)
          return true;
        otherWindows.push(e);
        return false;
      });
      tabs = tabs.concat(otherWindows);

      var buffers = tabs.map(function(e, i) {
        var title = e.title;
        if (settings.showtabindices) {
          title = title.replace(new RegExp('^' + (e.index + 1) + ' '), '');
        }
        return [(i + 1) + ': ' + title, e.url, e.id];
      });

      o.callback({
        type: 'buffers',
        buffers: buffers
      });
    });
  };

  _.getSessionNames = function(o) {
    o.callback({
      type: 'sessions',
      sessions: Object.keys(sessions).map(function(e) {
        return [e, Object.keys(sessions[e]).length.toString() + ' tab' +
                   (Object.keys(sessions[e]).length === 1 ? '' : 's')];
      })
    });
  };

  _.retrieveAllHistory = function(o) {
    o.callback({type: 'commandHistory', history: History.commandHistory});
  };

  _.getBookmarkPath = function(o) {
    chrome.bookmarks.getTree(function(marks) {
      Bookmarks.getPath(marks[0].children, o.request.path, function(e) {
        o.callback({type: 'bookmarkPath', path: e});
      });
    });
  };

  _.getLastCommand = function(o) {
    if (lastCommand) {
      o.callback({type: 'updateLastCommand', data: lastCommand});
    }
  };

  _.getSettings = function(o) {
    Options.refreshSettings(function() {
      o.callback({
        type: 'sendSettings',
        settings: o.request.reset ? defaultSettings : settings
      });
    });
  };

  _.setIconEnabled = function(o) {
    chrome.browserAction.setIcon({
      path: 'icons/38.png',
      tabId: o.sender.tab.id
    }, function() {
      return chrome.runtime.lastError;
    });
  };

  _.getFilePath = function(o) {
    Files.getPath(o.request.path, function(data) {
      o.callback(data);
    });
    return true;
  };

  _.getBlacklisted = function(o) {
    Popup.getBlacklisted(function() {
      o.callback(true);
    });
  };


  _.editWithVim = function(o) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://127.0.0.1:' + settings.vimport);
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        o.callback({type: 'editWithVim', text: xhr.responseText});
      }
    };
    xhr.send(JSON.stringify({
      data: '' + (o.request.text || '')
    }));
  };

  _.httpRequest = function(o) {
    httpRequest(o.request.request).then(function(res) {
      o.callback({type: 'httpRequest', id: o.request.id, text: res});
    });
  };

  _.createBookmark = function(o) {
    var url = o.request.url, title = o.request.title;
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

  _.parseRC = function(o) {
    o.callback({type: 'parseRC', config: RCParser.parse(o.request.config)});
  };

  _.showCommandFrame = function(o) {
    Frames.get(o.sender.tab.id).focusedId = o.request.frameId;
    chrome.tabs.sendMessage(o.sender.tab.id, {
      action: o.request.action,
      search: o.request.search,
      value: o.request.value,
      complete: o.request.complete
    });
  };

  _.markActiveFrame = function(o) {
    var frame = Frames.get(o.sender.tab.id);
    if (frame) {
      frame.focusedId = o.request.frameId;
    }
  };

  _.hideCommandFrame = function(o) {
    chrome.tabs.sendMessage(o.sender.tab.id, {
      action: o.request.action
    }, function() {
      var frame = Frames.get(o.sender.tab.id);
      if (frame) {
        frame.focus(frame.focusedId, true);
      }
    });
  };

  _.callFind = function(o) {
    chrome.tabs.sendMessage(o.sender.tab.id, {
      action: o.request.action,
      command: o.request.command,
      params: o.request.params
    });
  };

  _.setFindIndex = function(o) {
    chrome.tabs.sendMessage(o.sender.tab.id, {
      action: o.request.action,
      index: o.request.index
    });
  };

  _.yankWindowUrls = function(o) {
    chrome.tabs.query({ currentWindow: true }, function(tabs) {
      Clipboard.copy(tabs.map(function(tab) {
        return tab.url;
      }).join('\n'));
      o.callback(tabs.length);
    });
  };

  _.doIncSearch = function(o) {
    chrome.tabs.sendMessage(o.sender.tab.id, o.request);
  };

  _.cancelIncSearch = function(o) {
    chrome.tabs.sendMessage(o.sender.tab.id, o.request);
  };

  _.echoRequest = function(o) {
    chrome.tabs.sendMessage(o.sender.tab.id, o.request);
  };

  _.loadLocalConfig = function(o) {
    var path = o.request.path || 'file://' + settings.configpath
      .split('~').join(settings.homedirectory || '~');
    httpRequest({ url: path }).then(function(data) {
      var added = window.parseConfig(data);
      if (added.error) {
        console.error('parse error on line %d of cVimrc: %s',
            added.error.lineno, added.error.message);
        o.callback({
          code: -2,
          error: added.error,
          config: settings
        });
        return;
      }
      added = added.value;
      added.localconfig = added.localconfig || false;
      var oldSettings = Object.clone(settings);
      var settingsClone = Object.clone(defaultSettings);
      added.localconfig = oldSettings.localconfig;
      Object.merge(settingsClone, added);
      if (oldSettings.localconfig) {
        Options.saveSettings({
          settings: Object.clone(settingsClone),
          sendSettings: false
        });
        Object.merge(settings, oldSettings);
        Object.merge(settings, added);
        Options.sendSettings();
      } else {
        Object.merge(settings, added);
        settings.RC = oldSettings.RC;
        Options.sendSettings();
      }
      o.callback({
        code: 0,
        error: null,
        config: settings
      });
    }, function() {
      o.callback({
        code: -1,
        error: null,
        config: settings
      });
    });
    return true;
  };

  _.muteTab = function(o) {
    chrome.tabs.update(o.sender.tab.id, {muted: !o.sender.tab.mutedInfo.muted});
  };

  return function(_request, _sender, _callback, _port) {
    var action = _request.action;
    if (!_.hasOwnProperty(action) || typeof _[action] !== 'function')
      return;

    var o = {
      request:  _request,
      sender:   _sender,
      callback: _callback,
      port:     _port,
    };
    o.request.repeats = Math.max(~~o.request.repeats, 1);

    if (o.request.url && !o.request.noconvert) {
      o.url = Utils.toSearchURL(o.request.url);
    } else if (o.request.url) {
      o.url = o.request.url;
    } else {
      o.url = settings.defaultnewtabpage ?
        'chrome://newtab' : '../pages/blank.html';
    }

    if (!o.sender.tab && action !== 'openLinkTab')
      return;

    return _[action](o);
  };

})();
