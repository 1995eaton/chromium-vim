var Settings;
var Popup = {};
var blacklists = "";
Popup.active = true;

(function() {
  chrome.storage.sync.get("settings", function(s) {
    Settings = s.settings;
    if (Settings === undefined) return chrome.storage.sync.set({settings: settingsDefault});
    for (var key in settingsDefault) {
      if (Settings[key] === undefined) {
        Settings[key] = settingsDefault[key];
      }
    }
    chrome.storage.sync.set({settings: Settings});
    blacklists = Settings.blacklists.split("\n");
    if (!Settings || !Settings.blacklists) {
      Popup.isBlacklisted = false;
    } else {
      blacklists = Settings.blacklists.split("\n");
    }
  });
})();

function parseDomain(url) {
  return url.replace(/(\.([^\.]+))\/.*$/, "$1");
}

Popup.getAllTabs = function(callback) {
  chrome.tabs.query({}, function(tabs) {
    callback(tabs);
  });
};

Popup.getBlacklisted = function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (!tabs || !tabs.length) return false;
    var url = parseDomain(tabs[0].url);
    for (var i = 0; i < blacklists.length; i++) {
      if (blacklists[i] === url) {
        return this.isBlacklisted = true;
      }
    }
    this.isBlacklisted = false;
  }.bind(this));
};

Popup.getBlacklistedResponse = function(callback) {
  callback(this.isBlacklisted);
};

Popup.getActiveTab = function(callback) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tab) {
    callback(tab[0]);
  });
};

Popup.setIconDisabled = function() {
  this.getActiveTab(function(tab) {
    chrome.browserAction.setIcon({path: "icons/disabled.png", tabId: tab.id});
  });
};

Popup.setIconEnabled = function() {
  this.getActiveTab(function(tab) {
    chrome.browserAction.setIcon({path: "icons/38.png", tabId: tab.id});
  });
};

Popup.getActiveState = function(callback) {
  callback(this.active);
};

Popup.toggleEnabled = function(callback, request) {
  if (request.singleTab) {
    this.getActiveTab(function(tab) {
      chrome.tabs.sendMessage(tab.id, {action: "toggleEnabled", state: !request.blacklisted});
    });
    if (request.blacklisted) {
      return this.setIconDisabled();
    }
    return this.setIconEnabled();
  }
  this.getAllTabs(function(tabs) {
    this.active = !this.active;
    if (!request.blacklisted) {
      tabs.map(function(tab) { return tab.id; }).forEach(function(id) {
        chrome.tabs.sendMessage(id, {action: "toggleEnabled", state: this.active});
        if (this.active) {
          chrome.browserAction.setIcon({path: "icons/38.png", tabId: id});
        } else {
          chrome.browserAction.setIcon({path: "icons/disabled.png", tabId: id});
        }
      }.bind(this));
    }
  }.bind(this));
};

Popup.toggleBlacklisted = function() {
  this.getActiveTab(function(tab) {
    var url = parseDomain(tab.url);
    var foundMatch;
    for (var i = 0; i < blacklists.length; ++i) {
      if (blacklists[i].trim() === "") {
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
    Settings.blacklists = blacklists.join("\n");
    chrome.storage.sync.set({settings: Settings});
    this.isBlacklisted = !this.isBlacklisted;
  }.bind(this));
};

chrome.runtime.onMessage.addListener(function(request, sender, callback) {
  if (Popup.hasOwnProperty(request.action)) {
    Popup[request.action](function(response) {
      callback(response);
    }, request);
  }
});
