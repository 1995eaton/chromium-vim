var Clipboard,
    History,
    Links,
    TabHistory,
    Sites;

var sessions = {},
    Frames = {},
    Quickmarks = {},
    ActiveTabs = {};

TabHistory = {
};

chrome.tabs.onUpdated.addListener(function(id, changeInfo) {
  if (changeInfo.hasOwnProperty('url')) {
    if (TabHistory.hasOwnProperty(id)) {
      if (TabHistory[id].links.indexOf(changeInfo.url) === -1) {
        if (TabHistory.state !== void 0 && TabHistory[id].state + 1 !== TabHistory[id].length) {
          TabHistory[id].links.splice(TabHistory[id].state);
        }
        TabHistory[id].links.push(changeInfo.url);
        TabHistory[id].state = TabHistory[id].state + 1;
      } else {
        TabHistory[id].state = TabHistory[id].links.indexOf(changeInfo.url);
      }
    } else {
      TabHistory[id] = {};
      TabHistory[id].links = [changeInfo.url];
      TabHistory[id].state = 0;
    }
  }
});

chrome.tabs.onActivated.addListener(function(tab) {
  if (ActiveTabs[tab.windowId] === void 0) {
    ActiveTabs[tab.windowId] = [];
  }
  ActiveTabs[tab.windowId].push(tab.tabId);
  if (ActiveTabs[tab.windowId].length > 2) {
    ActiveTabs[tab.windowId].shift();
  }
});

chrome.windows.onRemoved.addListener(function(windowId) {
  delete ActiveTabs[windowId];
});

Sites = {
  querySites: function(callback) {
    chrome.topSites.get(function(e) {
      var urls = [],
          c = 0,
          l = e.length;
      e.map(function(d) {
        chrome.history.getVisits({url: d.url}, function(f) {
          urls.push([d.title, d.url, f.length]);
          if (++c === l) {
            callback(urls);
          }
        });
      });
    });
  },
  getTop: function(callback) {
    this.querySites(function(data) {
      callback(data.sort(function(a, b) {
        return b[2] - a[2];
      }));
    });
  }
};

chrome.storage.local.get('sessions', function(s) {
  if (s.sessions === void 0) {
    chrome.storage.local.set({
      sessions: {}
    });
  } else {
    sessions = s.sessions;
  }
});

Clipboard = {
  createTextArea: function() {
    var t = document.createElement('textarea');
    t.style.position = 'absolute';
    t.style.left = '-100%';
    return t;
  },
  copy: function(text) {
    var t = this.createTextArea();
    t.value = text;
    document.body.appendChild(t);
    t.select();
    document.execCommand('Copy');
    document.body.removeChild(t);
  },
  paste: function(text) {
    var t = this.createTextArea();
    document.body.appendChild(t);
    t.focus();
    document.execCommand('Paste');
    text = t.value;
    document.body.removeChild(t);
    return text;
  }
};

History = {
  historyTypes: ['action', 'url', 'search'],
  searchResults: null,
  append: function(value, type) {
    if (!localStorage[type] || localStorage[type] === '') {
      localStorage[type] = value;
    } else {
      localStorage[type] += ',' + value;
    }
  },
  retrieve: function(type) {
    if (!localStorage[type]) {
      localStorage[type] = '';
    }
    return [type, localStorage[type].split(',')];
  },
  retrieveSearchHistory: function(search, limit, callback) {
    chrome.history.search({text: search, maxResults: limit}, function(results) {
      callback(results);
    });
  }
};

function getTab(sender, reverse, count, first, last) {
  chrome.tabs.query({windowId: sender.tab.windowId}, function(tabs) {
    if (first) {
      return chrome.tabs.update(tabs[0].id, {active: true});
    } else if (last) {
      return chrome.tabs.update(tabs[tabs.length - 1].id, {active: true});
    } else {
      return chrome.tabs.update(tabs[((((reverse ? -count : count) + sender.tab.index) % tabs.length) + tabs.length) % tabs.length].id, {active: true});
    }
  });
}

Links = {
  multiOpen: function(links) {
    links.forEach(function(item) {
      chrome.tabs.create({url: item, active: false});
    });
  }
};

Files = {
  sendRequest: function(path, callback) {
    var xhr;
    xhr = new XMLHttpRequest();
    xhr.open('GET', 'file://' + path);
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        callback(xhr.responseText);
      }
    };
    xhr.send();
  },

  parseHTML: function(data) {
    var matches = data.match(/addRow\('[^)]+'\)/g);
    var results = [];
    if (matches) {
      for (var i = 0, l = matches.length; i < l; ++i) {
        var m = JSON.parse(matches[i].replace(/[^(]+\(/, '[').slice(0, -1) + ']');
        results.push([m[0], (m[2] ? 'Directory' : 'File (' + m[3] + ')')]);
      }
    }
    return results;
  },

  getPath: function(path, callback) {
    path = path.replace(/[^\/]*$/, '');
    if (!path) {
      return;
    }
    this.sendRequest(path, function(data) {
      data = Files.parseHTML(data);
      callback(data);
    });
  }
};

function requestAction(type, request, sender, callback) {
  if (isAction(request.action)) {
    callAction(request.action, {
      request : request,
      sender : sender,
      callback : callback
    });
  }
}

chrome.extension.onConnect.addListener(function(_port) {
  var port = _port;
  console.assert(port.name === 'main');
  port.postMessage({type: 'hello'});
  port.onMessage.addListener(function(request) {
    requestAction('port', request, null, function(message) {
      port.postMessage(message);
    });
  });
  port.onDisconnect.addListener(function() {
    port = null;
  });
});

chrome.commands.onCommand.addListener(function(command) {
  switch (command) {
    case 'nextTab':
    case 'previousTab':
      chrome.tabs.query({active: true, currentWindow: true}, function(e) {
        return getTab({tab: e[0]}, false, (command === 'nextTab' ? 1 : -1), false, false);
      });
      break;
    case 'nextCompletionResult':
      chrome.tabs.query({active: true, currentWindow: true}, function(tab) {
        chrome.tabs.sendMessage(tab[0].id, {action: 'nextCompletionResult'}, function() {
          chrome.windows.create({url: 'chrome://newtab'});
        });
      });
      break;
    case 'deleteBackWord':
      chrome.tabs.query({active: true, currentWindow: true}, function(tab) {
        chrome.tabs.sendMessage(tab[0].id, {action: 'deleteBackWord'});
      });
      break;
    case 'closeTab':
      chrome.tabs.query({active: true, currentWindow: true}, function(tab) {
        chrome.tabs.remove(tab[0].id);
      });
      break;
    case 'reloadTab':
      chrome.tabs.query({active: true, currentWindow: true}, function(tab) {
        chrome.tabs.reload(tab[0].id);
      });
      break;
    case 'newTab':
      chrome.tabs.create({url: chrome.runtime.getURL('pages/blank.html')});
      break;
    default:
      break;
  }
});

chrome.runtime.onMessage.addListener(function(request, sender, callback) {
  requestAction('extension', request, sender, callback);
});

chrome.tabs.onRemoved.addListener(function(id, removeInfo) {
  if (ActiveTabs[removeInfo.windowId] !== void 0) {
    ActiveTabs[removeInfo.windowId] = ActiveTabs[removeInfo.windowId].filter(function(e) {
      return e !== id;
    });
  }
  if (TabHistory[id] !== void 0) {
    delete TabHistory[id];
  }
  delete Frames[id];
});
