var Updates = {
  displayMessage: false,
  installMessage: "Welcome to cVim! Here's everything you need to know.",
  tabId: null
};

chrome.runtime.onInstalled.addListener(function(details) {
  var currentVersion   = chrome.runtime.getManifest().version;
  var previousVersion  = details.previousVersion;
  if (details.reason === "install") {
    chrome.tabs.create({
      url: chrome.runtime.getURL("pages/mappings.html"),
      active: true
    }, function(tabInfo) {
      Updates.tabId = tabInfo.id;
      Updates.displayMessage = true;
    });
  } else if (details.reason === "update") {
    if (previousVersion !== currentVersion) {
      chrome.tabs.create({
        url: "https://github.com/1995eaton/chromium-vim/blob/master/CHANGELOG.md#" + currentVersion.replace(/\./g, "")
      });
    }
  }
});
