var Sessions = {};
var tabHistory = {};

Sessions.onChanged = function() {
  chrome.sessions.getRecentlyClosed(function(sessions) {
    this.recentlyClosed = sessions.filter(function(e) {
      return e.tab && e.tab.sessionId;
    }).map(function(e) {
      return e.tab.sessionId;
    });
    this.sessionIndex = 0;
  }.bind(this));
};

Sessions.nativeStepBack = function() {
  if (this.sessionIndex < this.recentlyClosed.length) {
    chrome.sessions.restore(this.recentlyClosed[this.sessionIndex]);
    this.sessionIndex += 1;
  }
};

Sessions.stepBack = function(sender) {
  if (Object.keys(tabHistory).length && tabHistory[sender.tab.windowId] !== undefined && tabHistory[sender.tab.windowId].length > 0) {
    var lastTab = tabHistory[sender.tab.windowId].pop();
    chrome.tabs.create({url: lastTab.url,
                        active: true,
                        index: lastTab.index,
                        pinned: lastTab.pinned,
                        selected: lastTab.selected
    });
  }
};

(function() {
  // Use Chrome's native tab restore if the user
  // is on the dev channel
  if (chrome.hasOwnProperty("sessions")) {
    Sessions.nativeSessions = true;
    chrome.sessions.onChanged.addListener(function() {
      Sessions.onChanged();
    });
    Sessions.onChanged();
  } else {
    Sessions.activeTabs = {};
    chrome.tabs.onRemoved.addListener(function(id) {
      for (var key in Sessions.activeTabs) {
        if (Sessions.activeTabs[key].hasOwnProperty(id)) {
          if (tabHistory[Sessions.activeTabs[key][id].windowId] === undefined) tabHistory[Sessions.activeTabs[key][id].windowId] = [];
          tabHistory[Sessions.activeTabs[key][id].windowId].push(Sessions.activeTabs[key][id]);
          delete Sessions.activeTabs[key][id];
          break;
        }
      }
    });
    chrome.tabs.onUpdated.addListener(function(tab) {
      try {
        chrome.tabs.get(tab, function(updatedTab) {
          if (Sessions.activeTabs[updatedTab.windowId] === undefined)
            Sessions.activeTabs[updatedTab.windowId] = {};
          Sessions.activeTabs[updatedTab.windowId][updatedTab.id] = updatedTab;
        });
      } catch (e) {} // Ignore tabs that have already been removed
    });
  }
})();
