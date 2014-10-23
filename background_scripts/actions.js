var Actions = {},
    Quickmarks = {},
    lastCommand = null,
    request, sender, callback, url;

callAction = function(action, config) {
  request = config.request;
  sender = config.sender;
  callback = config.callback;
  request.repeats = Math.max(~~request.repeats, 1);
  if (request.url && !request.noconvert) {
    url = request.url.convertLink();
  } else if (request.url) {
    url = request.url;
  } else {
    url = Settings.defaultnewtabpage ?
      'chrome://newtab' : '../pages/blank.html';
  }
  Actions[action]();
};

// Normal extension connections

Actions.updateLastCommand = function() {
  lastCommand = request.data;
  chrome.tabs.query({currentWindow: true}, function(tabs) {
    tabs.forEach(function(tab) {
      chrome.tabs.sendMessage(tab.id, {
        action: 'updateLastCommand',
        data: request.data
      });
    });
  });
};

Actions.openLink = function() {
  if (request.tab.tabbed) {
    for (var i = 0; i < request.repeats; ++i) {
      chrome.tabs.create({
        url: url,
        active: request.tab.active,
        pinned: request.tab.pinned,
        index: sender.tab.index + 1
      });
    }
  } else {
    chrome.tabs.update({
      url: url,
      pinned: request.tab.pinned || sender.tab.pinned
    });
  }
};

Actions.openLinkTab = function() {
  if (!sender.tab) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tab) {
      for (var i = 0; i < request.repeats; ++i) {
        chrome.tabs.create({
          url: url,
          active: request.active,
          pinned: request.pinned,
          index: tab[0].index + 1
        });
      }
    });
  } else {
    for (var i = 0; i < request.repeats; ++i) {
      chrome.tabs.create({
        url: url,
        active: request.active,
        pinned: request.pinned,
        index: sender.tab.index + 1
      });
    }
  }
};

Actions.addFrame = function() {
  if (Frames[sender.tab.id] === void 0 || request.isRoot) {
    Frames[sender.tab.id] = {length: 1, index: 0};
  } else {
    Frames[sender.tab.id].length += 1;
  }
  callback(Frames[sender.tab.id].length - 1);
};

Actions.syncSettings = function() {
  for (var key in request.settings) {
    Settings[key] = request.settings[key];
  }
  Options.sendSettings();
};

Actions.focusFrame = function() {
  Frames[sender.tab.id].index = request.isRoot ? 0 :
    (Frames[sender.tab.id].index + request.repeats)
      .mod(Frames[sender.tab.id].length);
  chrome.tabs.sendMessage(sender.tab.id, {
    action: 'focusFrame',
    index: Frames[sender.tab.id].index
  });
};

Actions.openLinkWindow = function() {
  for (var i = 0; i < request.repeats; ++i) {
    chrome.windows.create({
      url: url,
      focused: request.tab.active
    });
  }
};

Actions.closeTab = function() {
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
  Actions.closeTabLeft  = function() { closeTab(-request.repeats); };
  Actions.closeTabRight = function() { closeTab( request.repeats); };
  Actions.closeTabsToLeft = function() { closeTab(-sender.tab.index); };
  Actions.closeTabsToRight = function() {
    chrome.tabs.query({currentWindow: true},
        function(tabs) { closeTab(tabs.length - sender.tab.index); });
  };
})();

Actions.getWindows = function() {
  var _ret = {};
  chrome.windows.getAll(function(info) {
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
      chrome.tabs.sendMessage(sender.tab.id, {action: 'getWindows', windows: _ret});
    });
  });
};

Actions.moveTab = function() {
  chrome.windows.getAll(function(info) {
    info = info.filter(function(e) {
      return e.type === 'normal' && e.id !== sender.tab.windowId;
    }).map(function(e) {
      return e.id;
    });
    var wasPinned = sender.tab.pinned;
    if (info.indexOf(parseInt(request.windowId)) !== -1) {
      chrome.tabs.move(sender.tab.id, {
        windowId: parseInt(request.windowId),
        index: -1
      }, function(tab) {
        chrome.tabs.update(tab.id, {
          pinned: wasPinned
        });
      });
    }
  });
};

Actions.closeWindow = function() {
  chrome.windows.remove(sender.tab.windowId);
};

Actions.openLastLinkInTab = function() {
  if (TabHistory[sender.tab.id] === void 0) {
    return;
  }
  var hist = TabHistory[sender.tab.id];
  if (hist.links[hist.state - request.repeats] !== void 0) {
    chrome.tabs.create({url: hist.links[hist.state - request.repeats]});
  }
};

Actions.openNextLinkInTab = function() {
  if (TabHistory[sender.tab.id] === void 0) {
    return;
  }
  var hist = TabHistory[sender.tab.id];
  if (hist.links[hist.state + request.repeats] !== void 0) {
    chrome.tabs.create({url: hist.links[hist.state + request.repeats]});
  }
};

Actions.getHistoryStates = function() {
  if (TabHistory[sender.tab.id] === void 0) {
    return callback({links: []});
  }
  callback(TabHistory[sender.tab.id]);
};

Actions.reloadTab = function() {
  chrome.tabs.reload({
    bypassCache: request.nocache
  });
};

Actions.reloadAllTabs = function() {
  chrome.tabs.query({}, function(tabs) {
    tabs.forEach(function(tab) {
      if (!/^chrome:\/\//.test(tab.url) && !(!request.current && tab.id === sender.tab.id && tab.windowId === sender.tab.windowId)) {
        chrome.tabs.reload(tab.id);
      }
    });
  });
};

Actions.nextTab = function() {
  getTab(sender, false, request.repeats, false, false);
};

Actions.previousTab = function() {
  getTab(sender, true, request.repeats, false, false);
};

Actions.firstTab = function() {
  getTab(sender, false, false, true, false);
};

Actions.lastTab = function() {
  getTab(sender, false, false, false, true);
};

Actions.appendHistory = function() {
  if (sender.tab.incognito === false) {
    History.append(request.value, request.type);
    chrome.tabs.query({}, function(tabs) {
      var hist = {};
      for (var i = 0; i < History.historyTypes.length; ++i) {
        hist[History.historyTypes[i]] = localStorage[History.historyTypes[i]].split(',');
      }
      tabs.forEach(function(tab) {
        chrome.tabs.sendMessage(tab.id, {action: 'commandHistory', history: hist});
      });
    });
  }
};

Actions.pinTab = function() {
  chrome.tabs.update({
    pinned: !sender.tab.pinned
  });
};

Actions.copy = function() {
  Clipboard.copy(request.text);
};

Actions.goToTab = function() {
  chrome.tabs.query({}, function(tabs) {
    if (request.id) {
      return chrome.tabs.get(request.id, function(tabInfo) {
        chrome.windows.update(tabInfo.windowId, {focused: true}, function() {
          chrome.tabs.update(request.id, {active: true, highlighted: true});
        });
      });
    } else if (request.index) {
      chrome.tabs.update((request.index < tabs.length ? tabs[request.index].id :
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
  Actions.moveTabRight = function() { move( request.repeats); };
  Actions.moveTabLeft  = function() { move(-request.repeats); };
})();

Actions.openPasteTab = function() {
  var paste = Clipboard.paste();
  if (!paste) {
    return;
  }
  paste = paste.split('\n').filter(function(e) { return e.trim(); });
  if (paste.length && paste[0].convertLink() !== paste[0]) {
    paste = encodeURIComponent(paste.join('\n'));
    return chrome.tabs.create({
      url: paste.convertLink(),
      index: sender.tab.index + 1
    });
  }
  for (var i = 0; i < request.repeats; ++i) {
    for (var j = 0, l = paste.length; j < l; ++j) {
      chrome.tabs.create({
        url: paste[j].convertLink(),
        index: sender.tab.index + 1
      });
    }
  }
};

Actions.openPaste = function() {
  var paste = Clipboard.paste();
  if (!paste) {
    return;
  }
  paste = paste.split('\n')[0];
  chrome.tabs.update({
    url: paste.convertLink()
  });
};

Actions.createSession = function() {
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
    chrome.tabs.sendMessage(sender.tab.id, {
      action: 'sessions',
      sessions: Object.keys(sessions).map(function(e) {
        return [e, Object.keys(sessions[e]).length.toString() +
        ' tab' + (Object.keys(sessions[e]).length === 1 ? '' : 's')];
      })
    });
  });
};

Actions.openBookmarkFolder = function() {
  Bookmarks.getFolderLinks(request.path, Links.multiOpen);
};

Actions.deleteSession = function() {
  delete sessions[request.name];
  chrome.storage.local.set({
    sessions: sessions
  });
};

Actions.lastActiveTab = function() {
  if (ActiveTabs[sender.tab.windowId] !== void 0) {
    chrome.tabs.update(ActiveTabs[sender.tab.windowId].shift(), {active: true});
  }
};

Actions.openSession = function() {
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

Actions.openLast = function() {
  if (Sessions.nativeSessions) {
    Sessions.nativeStepBack();
  } else {
    Sessions.stepBack(sender);
  }
};

Actions.isNewInstall = function() {
  if (sender.tab.id === Updates.tabId && Updates.displayMessage) {
    Updates.displayMessage = false;
    Updates.tabId = null;
    callback(Updates.installMessage);
  }
};

Actions.cancelAllWebRequests = function() {
  chrome.tabs.query({currentWindow: true}, function(tabs) {
    tabs.forEach(function(tab) {
      chrome.tabs.sendMessage(tab.id, {action: 'cancelAllWebRequests'});
    });
  });
};

Actions.hideDownloadsShelf = function() {
  chrome.downloads.setShelfEnabled(false);
  chrome.downloads.setShelfEnabled(true);
};

Actions.updateMarks = function() {
  Quickmarks = request.marks;
  chrome.tabs.query({currentWindow: true}, function(tabs) {
    for (var i = 0, l = tabs.length; i < l; ++i) {
      if (tabs[i].id !== sender.tab.id) {
        chrome.tabs.sendMessage(tabs[i].id, {action: 'updateMarks', marks: request.marks});
      }
    }
  });
};

Actions.getChromeSessions = function() {
  callback(Sessions.recentlyClosed);
};

Actions.restoreChromeSession = function() {
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

  Actions.zoomIn = function() {
    zoom(Settings.zoomfactor, null, request.repeats);
  };

  Actions.zoomOut = function() {
    zoom(-Settings.zoomfactor, null, request.repeats);
  };

  Actions.zoomOrig = function() { zoom(null, 1.0, 1); };

})();

Actions.duplicateTab = function() {
  for (var i = 0; i < request.repeats; i++) {
    chrome.tabs.duplicate(sender.tab.id);
  }
};

Actions.lastUsedTab = function() {
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


// Port actions

Actions.sendLastSearch = function() {
  if (!this.lastSearch) {
    return;
  }
  chrome.tabs.query({}, function(tabs) {
    tabs.forEach(function(tab) {
      chrome.tabs.sendMessage(tab.id, {action: 'updateLastSearch', value: Actions.lastSearch});
    });
  });
};

Actions.updateLastSearch = function() {
  var search = request.value;
  if (!search) {
    return;
  }
  this.lastSearch = request.value;
  this.sendLastSearch();
};

Actions.injectCSS = function() {
  chrome.tabs.insertCSS(sender.tab.id, {code: request.css});
};

Actions.urlToBase64 = function() {
  var img = new Image();
  img.onload = function() {
    var canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;
    var context = canvas.getContext('2d');
    context.drawImage(this, 0, 0);
    var data = canvas.toDataURL('image/png');
    chrome.tabs.sendMessage(sender.tab.id, {action: 'base64Image', data: data});
  };
  img.src = request.url;
};

Actions.getBookmarks = function() {
  Bookmarks.getMarks(function(marks) {
    callback({type: 'bookmarks', bookmarks: marks});
  });
};

Actions.searchHistory = function() {
  History.retrieveSearchHistory(request.search, request.limit || 4, function(results) {
    callback({type: 'history', history: results});
  });
};

Actions.getTopSites = function() {
  Sites.getTop(function(results) {
    callback({type: 'topsites', sites: results});
  });
};

Actions.getQuickMarks = function() {
  callback({type: 'quickMarks', marks: Quickmarks});
};

Actions.getBuffers = function() {
  chrome.tabs.query({}, function(tabs) {
    callback({
      type: 'buffers',
      buffers: tabs.map(function(e, i) {
        return [i + ': ' + e.title, e.url, e.id];
      })
    });
  });
};

Actions.getSessionNames = function() {
  callback({type: 'sessions', sessions: Object.keys(sessions).map(function(e) { return [e, Object.keys(sessions[e]).length.toString() + ' tab' + (Object.keys(sessions[e]).length === 1 ? '' : 's')]; } )});
};

Actions.retrieveAllHistory = function() {
  var hist = {};
  for (var i = 0; i < History.historyTypes.length; ++i) {
    if (localStorage[History.historyTypes[i]] === void 0) {
      localStorage[History.historyTypes[i]] = '';
    }
    hist[History.historyTypes[i]] = localStorage[History.historyTypes[i]].split(',');
  }
  callback({type: 'commandHistory', history: hist});
};

Actions.getBookmarkPath = function() {
  chrome.bookmarks.getTree(function(marks) {
    Bookmarks.getPath(marks[0].children, request.path, function(e) {
      callback({type: 'bookmarkPath', path: e});
    });
  });
};

Actions.getLastCommand = function() {
  if (lastCommand) {
    callback({type: 'updateLastCommand', data: lastCommand});
  }
};

Actions.getFilePath = function() {
  Files.getPath(request.path, function(data) {
    chrome.tabs.sendMessage(sender.tab.id, {action: 'getFilePath', data: data});
  });
};

Actions.getBlacklisted = function() {
  Popup.getBlacklisted(function() {
    callback(true);
  });
};

Actions.editWithVim = function() {
  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'http://127.0.0.1:8001');
  xhr.addEventListener('readystatechange', function() {
    if (xhr.readyState === 4 && xhr.status === 200) {
      callback({type: 'editWithVim', text: xhr.responseText});
    }
  });
  xhr.send('' + request.text);
};
