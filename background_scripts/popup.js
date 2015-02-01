var Popup = {
  active: true
};

Popup.getBlacklisted = function(callback) {
  var blacklists = Settings.blacklists.compress();
  this.getActiveTab(function(tab) {
    var url = tab.url;
    for (var i = 0, l = blacklists.length; i < l; ++i) {
      if (matchLocation(url, blacklists[i])) {
        callback(true);
      }
    }
  });
};

Popup.getActiveTab = function(callback) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tab) {
    callback(tab[0]);
  });
};

Popup.setIconDisabled = function() {
  this.getActiveTab(function(tab) {
    chrome.browserAction.setIcon({path: 'icons/disabled.png', tabId: tab.id});
  });
};

Popup.setIconEnabled = function(obj) {
  if (obj.sender) {
    return chrome.browserAction.setIcon({path: 'icons/38.png', tabId: obj.sender.tab.id});
  }
  this.getActiveTab(function(tab) {
    chrome.browserAction.setIcon({path: 'icons/38.png', tabId: tab.id});
  });
};

Popup.getActiveState = function(obj) {
  obj.callback(this.active);
};

Popup.toggleEnabled = function(obj) {
  var request = obj.request;
  if (request && request.singleTab) {
    this.getActiveTab(function(tab) {
      chrome.tabs.sendMessage(tab.id, {action: 'toggleEnabled'});
    });
    if (request.blacklisted) {
      return this.setIconDisabled({});
    }
    return this.setIconEnabled({});
  }
  chrome.tabs.query({}, function(tabs) {
    this.active = !this.active;
    if (!request || (request && !request.blacklisted)) {
      tabs.map(function(tab) { return tab.id; }).forEach(function(id) {
        chrome.tabs.sendMessage(id, {action: 'toggleEnabled'});
        if (this.active) {
          chrome.browserAction.setIcon({path: 'icons/38.png', tabId: id});
        } else {
          chrome.browserAction.setIcon({path: 'icons/disabled.png', tabId: id});
        }
      }.bind(this));
    }
  }.bind(this));
};

Popup.toggleBlacklisted = function() {
  var blacklists = Settings.blacklists.compress();
  this.getActiveTab(function(tab) {
    var url = tab.url;
    var foundMatch = false;
    for (var i = 0, l = blacklists.length; i < l; ++i) {
      if (matchLocation(url, blacklists[i])) {
        blacklists.splice(i, 1);
        foundMatch = true;
      }
    }
    if (!foundMatch) {
      url = new URL(url);
      blacklists.push(url.protocol + '//' + url.hostname + '/*');
    }
    Settings.blacklists = blacklists;
    Options.saveSettings({settings: Settings});
    Options.updateBlacklistsMappings();
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
