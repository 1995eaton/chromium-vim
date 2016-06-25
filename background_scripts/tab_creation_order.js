var getTabOrderIndex = (function() {

  var tabCreationOrder = {},
      lastActiveTabId = null;

  chrome.tabs.onActivated.addListener(function(activeInfo) {
    lastActiveTabId = activeInfo.tabId;
  });

  chrome.tabs.onCreated.addListener(function(tab) {
    tabCreationOrder[tab.id] = [];
    if (lastActiveTabId !== null) {
      if (tabCreationOrder[lastActiveTabId] === void 0)
        tabCreationOrder[lastActiveTabId] = [];
      tabCreationOrder[lastActiveTabId].push(tab.id);
    }
  });

  chrome.tabs.onRemoved.addListener(function(tabId) {
    if (tabCreationOrder[tabId] !== void 0) {
      Object.keys(tabCreationOrder).forEach(function(tab) {
        var index = tabCreationOrder[tab].indexOf(tabId);
        if (index !== -1)
          tabCreationOrder[tab].splice(index, 1);
      });
      delete tabCreationOrder[tabId];
    }
  });

  return function(tab) {
    if (settings.nativelinkorder && tabCreationOrder[tab.id]) {
      return tab.index + tabCreationOrder[tab.id].length + 1;
    }
    return tab.index + 1;
  };

})();
