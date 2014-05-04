var isEnabled = true;
var isBlacklisted;
var settings;
var blacklists = "";

function getSettings() {
  chrome.storage.sync.get("settings", function(s) {
    settings = s.settings;
    if (settings === undefined) return chrome.storage.sync.set({settings: settingsDefault});
    for (var key in settingsDefault) {
      if (settings[key] === undefined) {
        settings[key] = settingsDefault[key];
      }
    }
    chrome.storage.sync.set({settings: settings});
    blacklists = settings.blacklists.split("\n");
  });
}

function parseDomain(url) {
  return url.replace(/(\.([^\.]+))\/.*$/, "$1");
}
getSettings();
if (!settings || !settings.blacklists) isBlacklisted = false;
else {
  blacklists = settings.blacklists.split("\n");
}

chrome.runtime.onMessage.addListener(function(request, sender, callback) {
  if (request.action === "getBlacklisted") {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (!tabs || !tabs.length) return false;
      var url = parseDomain(tabs[0].url);
      for (var i = 0; i < blacklists.length; i++) {
        if (blacklists[i] === url) {
          return isBlacklisted = true;
        }
      }
      isBlacklisted = false;
    });
  } else if (request.action === "getBlacklistedResponse") {
    callback(isBlacklisted);
  } else if (request.action === "setIconDisabled") {
    chrome.browserAction.setIcon({path: "icons/disabled.png", tabId: sender.tab.id});
  } else if (request.action === "setIconEnabled") {
    chrome.browserAction.setIcon({path: "icons/38.png", tabId: sender.tab.id});
  } else if (request.action === "getEnabled") {
    chrome.tabs.sendMessage(tabs[0].id, {action: "toggleEnabled", state: isEnabled});
  } else if (request.action === "getEnabledCallback") {
    callback(isEnabled);
  } else if (request.action === "toggleEnabled") {
    if (request.singleTab) {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (!tabs || !tabs.length) return false;
        chrome.tabs.sendMessage(tabs[0].id, {action: "toggleEnabled", state: !request.blacklisted});
        if (!request.blacklisted) {
          chrome.browserAction.setIcon({path: "icons/38.png", tabId: tabs[0].id});
        } else {
          chrome.browserAction.setIcon({path: "icons/disabled.png", tabId: tabs[0].id});
        }
      });
    } else {
      chrome.tabs.query({}, function(tabs) {
        if (!tabs || !tabs.length) return false;
        isEnabled = !isEnabled;
        if (!request.blacklisted) {
          for (var i = 0; i < tabs.length; i++) {
            chrome.tabs.sendMessage(tabs[i].id, {action: "toggleEnabled", state: isEnabled});
            if (isEnabled) {
              chrome.browserAction.setIcon({path: "icons/38.png", tabId: tabs[i].id});
            } else {
              chrome.browserAction.setIcon({path: "icons/disabled.png", tabId: tabs[i].id});
            }
          }
        }
      });
    }
  } else if (request.action === "toggleBlacklisted") {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (!tabs || !tabs.length) return false;
      var url;
      url = parseDomain(tabs[0].url);
      var foundMatch;
      for (var i = 0; i < blacklists.length; i++) {
        if (blacklists[i] === "") {
          blacklists.splice(i, 1);
          continue;
        }
        if (blacklists[i] === url) {
          blacklists.splice(i, 1);
          foundMatch = true;
        }
      }
      if (!foundMatch) {
        blacklists.push(url);
      }
      settings.blacklists = blacklists.join("\n");
      chrome.storage.sync.set({settings: settings});
      isBlacklisted = !isBlacklisted;
    });
  }
});
