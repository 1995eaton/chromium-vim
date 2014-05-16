var actions = {},
request, sender, callback, url;

function isAction(action) {
  return actions.hasOwnProperty(action);
}

function callAction(action, config) {
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
    url = "../pages/blank.html";
  }
  actions[action]();
}

function isRepeat(request) {
  return request.action === "focusMainWindow" || (request.repeats && /[0-9]([0-9]+)?/.test(request.repeats.toString()));
}

// Normal extension connections

actions.openLink = function() {
  chrome.tabs.update({
    url: url
  });
};

actions.openLinkTab = function() {
  if (!sender.tab) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tab) {
      for (var i = 0; i < request.repeats; ++i) {
        chrome.tabs.create({url: url, active: request.active, index: tab[0].index + 1});
      }
    });
  } else {
    for (var i = 0; i < request.repeats; ++i) {
      chrome.tabs.create({
        url: url,
        active: request.active,
        index: sender.tab.index + 1
      });
    }
  }
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
    if (base < 0) base = 0;
    chrome.tabs.remove(sortedIds.slice(base, base + request.repeats));
  });
};

actions.reloadTab = function() {
  chrome.tabs.reload({
    bypassCache: request.nocache
  });
};

actions.newTab = function() {
  chrome.tabs.create({
    url: "https://google.com",
    index: sender.tab.index + 1
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
  History.append(request.value, request.type);
};

actions.retrieveHistory = function() {
  callback(History.retrieve(request.type));
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
    if (request.index < tabs.length) {
      chrome.tabs.update(tabs[request.index].id, {active: true});
    } else {
      chrome.tabs.update(tabs.slice(-1)[0].id, {active: true});
    }
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

actions.focusMainWindow = function() {
  chrome.tabs.query({
    active: true,
    currentWindow: true
  }, function(tab) {
    chrome.tabs.sendMessage(tab[0].id, {
      action: "focus",
      repeats: request.repeats
    });
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
    chrome.storage.local.set({
      sessions: sessions
    });
    chrome.tabs.sendMessage(sender.tab.id, {action: "sessions", sessions: Object.keys(sessions).map(function(e) { return [e, Object.keys(sessions[e]).length.toString() + " tab" + (Object.keys(sessions[e]).length === 1 ? "" : "s")]; } )});
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
  chrome.storage.sync.set({
    sessions: sessions
  });
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

actions.selectTab = function() {
  chrome.tabs.query({
    windowId: sender.tab.windowId
  }, function(tabs) {
    if (request.tabIndex < tabs.length)
      chrome.tabs.query({
        windowId: sender.tab.windowId,
        index: parseInt(request.tabIndex)
      }, function(tab) {
        chrome.tabs.update(tab[0].id, {
          active: true
        });
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

// Port actions

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

actions.getBookmarkPath = function() {
  chrome.bookmarks.getTree(function(marks) {
    Bookmarks.getPath(marks[0].children, request.path, function(e) {
      callback({type: "bookmarkPath", path: e});
    });
  });
};

actions.getBlacklisted = function() {
  Popup.getBlacklisted(function() {
    callback({});
  });
};
