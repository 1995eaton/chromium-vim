var actions = {},
request, sender, callback, url;

function isAction(action) {
  return actions[action] ? true : false;
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
    url = "chrome://newtab";
  }
  for (var i = 0; i < request.repeats; i++) {
    actions[action]();
  }
}

function isRepeat(request) {
  return request.action === "focusMainWindow" || (request.repeats && /[0-9]([0-9]+)?/.test(request.repeats.toString()));
}

actions.openLink = function() {
  chrome.tabs.update({
    url: url
  });
};

actions.openLinkTab = function() {
  chrome.tabs.create({
    url: url,
    active: request.active,
    index: sender.tab.index + 1
  });
};

actions.openLinkWindow = function() {
  chrome.windows.create({
    url: url,
    focused: request.active
  });
};

actions.closeTab = function() {
  chrome.tabs.remove(sender.tab.id);
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
  chrome.tabs.create({
    url: paste.convertLink(),
    index: sender.tab.index + 1
  });
};

actions.openPaste = function() {
  var paste = Clipboard.paste();
  if (!paste) return;
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
    windowId: sender.tab.windowId
  }, function(tabs) {
    tabs.forEach(function(tab) {
      sessions[request.name][tab.index] = tab;
    });
    chrome.storage.sync.set({
      sessions: sessions
    });
  });
};

actions.openBookmarkFolder = function() {
  getFolderLinks(request.path, function(e) {
    if (e.length > 5) {
      chrome.tabs.sendMessage(sender.tab.id, {
        action: "confirm",
        message: "Open " + e.length + " tabs?"
      }, function(response) {
        if (response) multiOpen(e);
      });
    } else multiOpen(e);
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

actions.hideDownloadsShelf = function() {
  chrome.downloads.setShelfEnabled(false);
  chrome.downloads.setShelfEnabled(true);
};
