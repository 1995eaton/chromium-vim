var Sessions = {},
    tabHistory = {};

Sessions.onChanged = function() {
  chrome.sessions.getRecentlyClosed(function(sessions) {
    this.recentlyClosed = sessions.filter(function(e) {
      return e.tab && e.tab.sessionId;
    }).map(function(e) {
      return {
        id: e.tab.sessionId,
        title: e.tab.title,
        url: e.tab.url
      };
    });
    this.sessionIndex = 0;
  }.bind(this));
};

Sessions.nativeStepBack = function() {
  if (this.sessionIndex < this.recentlyClosed.length) {
    chrome.sessions.restore(this.recentlyClosed[this.sessionIndex++].id);
  }
};

Sessions.stepBack = function(sender) {
  if (Object.keys(tabHistory).length && tabHistory[sender.tab.windowId] !== void 0 && tabHistory[sender.tab.windowId].length > 0) {
    var lastTab = tabHistory[sender.tab.windowId].pop();
    chrome.tabs.create({
      active: true,
      index: lastTab.index,
      pinned: lastTab.pinned,
      active: lastTab.active,
      url: lastTab.url
    });
  }
};

(function() {
  if (chrome.hasOwnProperty('sessions')) {
    Sessions.nativeSessions = true;
    if (chrome.sessions.hasOwnProperty('onchanged')) { // Chromium version 35 doesn't have this listener, but supports chrome.sessions
      chrome.sessions.onChanged.addListener(function() {
        Sessions.onChanged();
      });
    } else {
      chrome.tabs.onRemoved.addListener(function() {
        Sessions.onChanged();
      });
    }
    Sessions.onChanged();
  } else {
    Sessions.activeTabs = {};
    chrome.tabs.onRemoved.addListener(function(id) {
      for (var key in Sessions.activeTabs) {
        if (Sessions.activeTabs[key].hasOwnProperty(id)) {
          if (tabHistory[Sessions.activeTabs[key][id].windowId] === void 0) {
            tabHistory[Sessions.activeTabs[key][id].windowId] = [];
          }
          tabHistory[Sessions.activeTabs[key][id].windowId].push(Sessions.activeTabs[key][id]);
          delete Sessions.activeTabs[key][id];
          break;
        }
      }
    });
    chrome.tabs.onUpdated.addListener(function(tab) {
      try {
        chrome.tabs.get(tab, function(updatedTab) {
          if (Sessions.activeTabs[updatedTab.windowId] === void 0) {
            Sessions.activeTabs[updatedTab.windowId] = {};
          }
          Sessions.activeTabs[updatedTab.windowId][updatedTab.id] = updatedTab;
        });
      } catch (e) { } // Ignore tabs that have already been removed
    });
  }
})();
