var actions = {},
isAction, callAction, request, sender, callback, url;

isAction = function(action) {
  return actions.hasOwnProperty(action);
};

callAction = function(action, config) {
  request = config.request;
  sender = config.sender;
  callback = config.callback;
  if (!isRepeat(request)) {
    request.repeats = 1;
  }
  if (request.url && !request.noconvert) {
    url = request.url.convertLink();
  } else if (request.url) {
    url = request.url;
  } else {
    url = "chrome://newtab";
  }
  actions[action]();
};

function isRepeat(request) {
  return request.repeats && /[0-9]([0-9]+)?/.test(request.repeats.toString());
}

// Normal extension connections

actions.openLink = function() {
  chrome.tabs.update({
    url: url,
    pinned: request.pinned
  });
};

actions.openLinkTab = function() {
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

actions.addFrame = function() {
  if (Frames[sender.tab.id] === undefined) {
    Frames[sender.tab.id] = {
      length: 1,
      index: 0
    };
  } else {
    Frames[sender.tab.id].length += 1;
  }
  callback(Frames[sender.tab.id].length - 1);
};

actions.focusFrame = function() {
  if (request.isRoot) {
    Frames[sender.tab.id].index = 0;
  } else {
    Frames[sender.tab.id].index = (Frames[sender.tab.id].index + request.repeats).mod(Frames[sender.tab.id].length);
  }
  chrome.tabs.sendMessage(sender.tab.id, {action: "focusFrame", index: Frames[sender.tab.id].index});
};

actions.openLinkWindow = function() {
  for (var i = 0; i < request.repeats; ++i) {
    chrome.windows.create({
      url: url,
      focused: request.active
    });
  }
};

actions.closeTab = function() {
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

actions.closeWindow = function() {
  chrome.windows.remove(sender.tab.windowId);
};

actions.openLastLinkInTab = function() {
  if (TabHistory[sender.tab.id] === void 0) {
    return;
  }
  var hist = TabHistory[sender.tab.id];
  if (hist.links[hist.state - request.repeats] !== void 0) {
    chrome.tabs.create({url: hist.links[hist.state - request.repeats]});
  }
};

actions.openNextLinkInTab = function() {
  if (TabHistory[sender.tab.id] === void 0) {
    return;
  }
  var hist = TabHistory[sender.tab.id];
  if (hist.links[hist.state + request.repeats] !== void 0) {
    chrome.tabs.create({url: hist.links[hist.state + request.repeats]});
  }
};

actions.getHistoryStates = function() {
  if (TabHistory[sender.tab.id] === void 0) {
    return callback({links: []});
  }
  callback(TabHistory[sender.tab.id]);
};

actions.reloadTab = function() {
  chrome.tabs.reload({
    bypassCache: request.nocache
  });
};

actions.reloadAllTabs = function() {
  chrome.tabs.query({}, function(tabs) {
    tabs.forEach(function(tab) {
      if (!/^chrome:\/\//.test(tab.url) && !(!request.current && tab.id === sender.tab.id && tab.windowId === sender.tab.windowId)) {
        chrome.tabs.reload(tab.id);
      }
    });
  });
};

actions.nextTab = function() {
  getTab(sender, false, request.repeats, false, false);
};

actions.previousTab = function() {
  getTab(sender, true, request.repeats, false, false);
};

actions.firstTab = function() {
  getTab(sender, false, false, true, false);
};

actions.lastTab = function() {
  getTab(sender, false, false, false, true);
};

actions.appendHistory = function() {
  if (sender.tab.incognito === false) {
    History.append(request.value, request.type);
    chrome.tabs.query({}, function(tabs) {
      var hist = {};
      for (var i = 0; i < History.historyTypes.length; ++i) {
        hist[History.historyTypes[i]] = localStorage[History.historyTypes[i]].split(",");
      }
      tabs.forEach(function(tab) {
        chrome.tabs.sendMessage(tab.id, {action: "commandHistory", history: hist});
      });
    });
  }
};

actions.pinTab = function() {
  chrome.tabs.update({
    pinned: !sender.tab.pinned
  });
};

actions.copy = function() {
  Clipboard.copy(request.text);
};

actions.goToTab = function() {
  chrome.tabs.query({currentWindow: true}, function(tabs) {
    chrome.tabs.update((request.index < tabs.length ? tabs[request.index].id :
        tabs.slice(-1)[0].id), {active: true});
  });
};

actions.moveTabRight = function() {
  chrome.tabs.move(sender.tab.id, {
    index: sender.tab.index + request.repeats
  });
};

actions.moveTabLeft = function() {
  chrome.tabs.move(sender.tab.id, {
    index: (sender.tab.index - request.repeats <= -1) ? 0 : sender.tab.index - request.repeats
  });
};

actions.openPasteTab = function() {
  var paste = Clipboard.paste();
  if (!paste) return;
  paste = paste.split("\n").filter(function(e) { return e.trim(); });
  if (paste.length && paste[0].convertLink() !== paste[0]) {
    paste = encodeURIComponent(paste.join("\n"));
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

actions.openPaste = function() {
  var paste = Clipboard.paste();
  if (!paste) return;
  paste = paste.split("\n")[0];
  chrome.tabs.update({
    url: paste.convertLink()
  });
};

actions.createSession = function() {
  sessions[request.name] = {};
  chrome.tabs.query({
    currentWindow: true
  }, function(tabs) {
    tabs.forEach(function(tab) {
      if (tab && tab.index !== undefined) {
        sessions[request.name][tab.index] = tab;
      }
    });
    chrome.storage.local.set({sessions: sessions});
    chrome.tabs.sendMessage(sender.tab.id, {
      action: "sessions",
      sessions: Object.keys(sessions).map(function(e) {
        return [e, Object.keys(sessions[e]).length.toString() +
          " tab" + (Object.keys(sessions[e]).length === 1 ? "" : "s")];
      })
    });
  });
};

actions.openBookmarkFolder = function() {
  Bookmarks.getFolderLinks(request.path, function(e) {
    if (e.length > 5) {
      chrome.tabs.sendMessage(sender.tab.id, {
        action: "confirm",
        message: "Open " + e.length + " tabs?"
      }, function(response) {
        if (response) Links.multiOpen(e);
      });
    } else Links.multiOpen(e);
  });
};

actions.deleteSession = function() {
  delete sessions[request.name];
  chrome.storage.local.set({
    sessions: sessions
  });
};

actions.lastActiveTab = function() {
  if (ActiveTabs[sender.tab.windowId] !== void 0) {
    chrome.tabs.update(ActiveTabs[sender.tab.windowId].shift(), {active: true});
  }
};

actions.openSession = function() {
  if (sessions.hasOwnProperty(request.name)) {
    var tabs = Object.keys(sessions[request.name]).sort().map(function(e) {
      return sessions[request.name][e];
    });
    if (!request.sameWindow) {
      chrome.windows.create({
        url: "chrome://newtab",
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

actions.openLast = function() {
  if (Sessions.nativeSessions) {
    Sessions.nativeStepBack();
  } else {
    Sessions.stepBack(sender);
  }
};

actions.getBuffers = function() {
  chrome.tabs.query({
    windowId: sender.tab.windowId
  }, function(tabs) {
    var t = [];
    for (var i = 0, l = tabs.length; i < l; ++i) {
      t.push([i + ": " + tabs[i].title, tabs[i].url]);
    }
    chrome.tabs.sendMessage(sender.tab.id, {
      action: "showBuffers",
      buffers: t
    });
  });
};

actions.isNewInstall = function() {
  if (sender.tab.id === Updates.tabId && Updates.displayMessage) {
    Updates.displayMessage = false;
    Updates.tabId = null;
    callback(Updates.installMessage);
  }
};

actions.cancelAllWebRequests = function() {
  chrome.tabs.query({currentWindow: true}, function(tabs) {
    tabs.forEach(function(tab) {
      chrome.tabs.sendMessage(tab.id, {action: "cancelAllWebRequests"});
    });
  });
};

actions.hideDownloadsShelf = function() {
  chrome.downloads.setShelfEnabled(false);
  chrome.downloads.setShelfEnabled(true);
};

actions.updateMarks = function() {
  Quickmarks = request.marks;
  chrome.tabs.query({currentWindow: true}, function(tabs) {
    for (var i = 0, l = tabs.length; i < l; ++i) {
      if (tabs[i].id !== sender.tab.id) {
        chrome.tabs.sendMessage(tabs[i].id, {action: "updateMarks", marks: request.marks});
      }
    }
  });
};

actions.updateLastSearch = function() {
  var search = request.value;
  if (!search) {
    return false;
  }
  chrome.tabs.query({}, function(tabs) {
    tabs.forEach(function(tab) {
      chrome.tabs.sendMessage(tab.id, {action: "updateLastSearch", value: search});
    });
  });
};


// Port actions

actions.injectCSS = function() {
  chrome.tabs.insertCSS(sender.tab.id, {code: request.css});
};

actions.urlToBase64 = function() {
  var img = new Image();
  img.onload = function () {
    var canvas = document.createElement("canvas");
    canvas.width = this.width;
    canvas.height = this.height;
    var context = canvas.getContext("2d");
    context.drawImage(this, 0, 0);
    var data = canvas.toDataURL("image/png");
    chrome.tabs.sendMessage(sender.tab.id, {action: "base64Image", data: data});
  };
  img.src = request.url;
};

actions.getBookmarks = function() {
  Bookmarks.getMarks(function(marks) {
    callback({type: "bookmarks", bookmarks: marks});
  });
};

actions.searchHistory = function() {
  History.retrieveSearchHistory(request.search, request.limit || 4, function(results) {
    callback({type: "history", history: results});
  });
};

actions.getTopSites = function() {
  Sites.getTop(function(results) {
    callback({type: "topsites", sites: results});
  });
};

actions.getQuickMarks = function() {
  callback({type: "quickMarks", marks: Quickmarks});
};

actions.getBuffers = function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(initial) {
    initial = initial[0];
    var windowId = initial.windowId;
    chrome.tabs.query({windowId: windowId}, function(tabs) {
      var t = [];
      for (var i = 0, l = tabs.length; i < l; ++i) {
        t.push([i + ": " + tabs[i].title, tabs[i].url]);
      }
      callback({type: "buffers", buffers: t});
    });
  });
};

actions.getSessionNames = function() {
  callback({type: "sessions", sessions: Object.keys(sessions).map(function(e) { return [e, Object.keys(sessions[e]).length.toString() + " tab" + (Object.keys(sessions[e]).length === 1 ? "" : "s")]; } )});
};

actions.retrieveAllHistory = function() {
  var hist = {};
  for (var i = 0; i < History.historyTypes.length; ++i) {
    if (localStorage[History.historyTypes[i]] === undefined) {
      localStorage[History.historyTypes[i]] = "";
    }
    hist[History.historyTypes[i]] = localStorage[History.historyTypes[i]].split(",");
  }
  callback({type: "commandHistory", history: hist});
};

actions.getBookmarkPath = function() {
  chrome.bookmarks.getTree(function(marks) {
    Bookmarks.getPath(marks[0].children, request.path, function(e) {
      callback({type: "bookmarkPath", path: e});
    });
  });
};

actions.getFilePath = function() {
  Files.getPath(request.path, function(data) {
    chrome.tabs.sendMessage(sender.tab.id, {action: "getFilePath", data: data});
  });
};

actions.getBlacklisted = function() {
  Popup.getBlacklisted(function() {
    callback(true);
  });
};
