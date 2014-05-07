var Popup = {};
Popup.active = true;

function parseDomain(url) {
  return url.replace(/(\.([^\.]+))\/.*$/, "$1");
}

Popup.getAllTabs = function(callback) {
  chrome.tabs.query({}, function(tabs) {
    callback(tabs);
  });
};

Popup.getBlacklisted = function(callback) {
  var blacklists = Settings.blacklists.split("\n").filter(function(e) {
    return e;
  });
  this.getActiveTab(function(tab) {
    var url = parseDomain(tab.url);
    for (var i = 0, l = blacklists.length; i < l; ++i) {
      if (blacklists[i].substring(0, url.length) === url) {
        callback(true);
      }
    }
  });
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

Popup.setIconEnabled = function(obj) {
  if (obj.sender) {
    return chrome.browserAction.setIcon({path: "icons/38.png", tabId: obj.sender.tab.id});
  }
  this.getActiveTab(function(tab) {
    chrome.browserAction.setIcon({path: "icons/38.png", tabId: tab.id});
  });
};

Popup.getActiveState = function(obj) {
  obj.callback(this.active);
};

Popup.toggleEnabled = function(obj) {
  var request = obj.request;
  if (request.singleTab) {
    this.getActiveTab(function(tab) {
      chrome.tabs.sendMessage(tab.id, {action: "toggleEnabled", state: !request.blacklisted});
    });
    if (request.blacklisted) {
      return this.setIconDisabled({});
    }
    return this.setIconEnabled({});
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
  var blacklists = Settings.blacklists.split("\n").filter(function(e) {
    return e;
  });
  this.getActiveTab(function(tab) {
    var url = parseDomain(tab.url);
    var foundMatch = false;
    for (var i = 0, l = blacklists.length; i < l; ++i) {
      if (blacklists[i].substring(0, url.length) === url) {
        blacklists.splice(i, 1);
        foundMatch = true;
      }
    }
    if (!foundMatch) {
      blacklists.push(url);
    }
    Settings.blacklists = blacklists.join("\n");
    Options.saveSettings(Settings);
  });
};

chrome.runtime.onMessage.addListener(function(request, sender, callback) {
  if (Popup.hasOwnProperty(request.action)) {
    Popup[request.action]({
      callback: function(response) {
        callback(response);
      },
      request: request,
      sender: sender
    });
  }
});
