var tabHistory = {};
var activeTabs = {};
var sessions   = {};

chrome.storage.sync.get('sessions', function(s) {
  if (s.sessions === undefined) {
    chrome.storage.sync.set({sessions: {}});
  } else {
    sessions = s.sessions;
  }
});

String.prototype.convertLink = function() {
  var url = this.trimLeft().trimRight();
  if (url.length === 0) {
    return 'chrome://newtab';
  }
  if (/^(chrome|chrome-extension|file):\/\/\S+$/.test(url)) {
    return url;
  }
  var pattern = new RegExp('^((https?|ftp):\\/\\/)?'+
  '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+
  '((\\d{1,3}\\.){3}\\d{1,3})|'+
  'localhost)' +
  '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+
  '(\\?[;&a-z\\d%_.~+=-]*)?'+
  '(\\#[-a-z\\d_]*)?$','i');
  if (pattern.test(url)) {
    return (/:\/\//.test(url) ? '' : 'http://') + url;
  }
  return 'https://www.google.com/search?q=' + url;
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

var Clipboard = {
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

var History = {
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

function getMarks(callback) {
  chrome.bookmarks.getTree(function(tree) {
    callback(tree[0].children);
  });
}

function containsFolder(path, dir) {
  dir = dir.children;
  for (var i = 0, l = dir.length; i < l; ++i) {
    if (path === dir[i].title) {
      return dir[i];
    }
  }
}

function multiOpen(links) {
  links.forEach(function(item) {
    chrome.tabs.create({url: item, active: false});
  });
}

function getFolderLinks(path, callback) {
  path = path.split('/').filter(function(e) { return e; });
  chrome.bookmarks.getTree(function(tree) {
    var dir = tree[0];
    while (dir = containsFolder(path[0], dir)) {
      path = path.slice(1);
      if (!path || !path.length) {
        callback(dir.children.filter(function(e) {
          return e.url;
        }).map(function(e) {
          return e.url;
        }));
      }
    }
  });
}

function getPath(m, p, callback, initialPath) { // Browse bookmark folders
  var _ret = [],
      folder = null,
      matchFound = false;
  if (!initialPath) initialPath = p.replace(/\/[^\/]+$/, '/').replace(/\/+/g, '/');
  if (typeof p !== 'string' || p[0] !== '/') return false;
  p = p.split(/\//).filter(function(e) { return e; });
  m.forEach(function(item) {
    if (item.title === p[0]) {
      folder = item;
    }
    if (p[0] && item.title.substring(0, p[0].length).toLowerCase() === p[0].toLowerCase()) {
      _ret.push([item.title, (item.url || 'folder'), initialPath]);
    }
    if (p.length === 0) {
      if (!matchFound) _ret = [];
      matchFound = true;
      _ret.push([item.title, (item.url || 'folder'), initialPath]);
    }
  });
  if (p.length === 0 || !folder) return callback(_ret);
  p = p.slice(1);
  getPath(folder.children, '/' + p.join('/'), callback, initialPath);
}

chrome.extension.onConnect.addListener(function(port) {
  console.assert(port.name === 'main');
  port.onMessage.addListener(function(request, data) {
    if (request.action === 'getBookmarks') {
      getMarks(function(marks) {
        port.postMessage({bookmarks: marks});
      });
    } else if (request.action === 'searchHistory') {
      History.retrieveSearchHistory(request.search, request.limit || 4, function(results) {
        port.postMessage({history: results});
      });
    } else if (request.action === 'getBuffers') {
      chrome.tabs.query({active: true, currentWindow: true}, function(initial) {
        initial = initial[0];
        var windowId = initial.windowId;
        chrome.tabs.query({windowId: windowId}, function(tabs) {
          var t = [];
          for (var i = 0, l = tabs.length; i < l; ++i) {
            t.push([i + ': ' + tabs[i].title, tabs[i].url]);
          }
          port.postMessage({buffers: t});
        });
      });
    } else if (request.action === 'getSessionNames') {
      port.postMessage({sessions: Object.keys(sessions).map(function(e) { return [e, sessions[e].length.toString() + ' tab' + (sessions[e].length === 1 ? '' : 's')]; } )});
    } else if (request.action ===  'getBookmarkPath') {
      chrome.bookmarks.getTree(function(marks) {
        getPath(marks[0].children, request.path, function(e) {
          port.postMessage({path: e});
        });
      });
    }
  });
});

chrome.commands.onCommand.addListener(function(command) {
  if (/^(next|previous)Tab$/.test(command)) {
    chrome.tabs.query({active: true, currentWindow: true}, function(e) {
      return getTab({tab: e[0]}, false, (command === 'nextTab' ? 1 : -1), false, false);
    });
  }
});

chrome.tabs.onRemoved.addListener(function(id) {
  for (var key in activeTabs) {
    if (activeTabs[key].hasOwnProperty(id)) {
      if (tabHistory[activeTabs[key][id].windowId] === undefined) tabHistory[activeTabs[key][id].windowId] = [];
      tabHistory[activeTabs[key][id].windowId].push(activeTabs[key][id]);
      delete activeTabs[key][id];
      break;
    }
  }
});

chrome.tabs.onUpdated.addListener(function(tab) {
  try {
    chrome.tabs.get(tab, function(updatedTab) {
      if (activeTabs[updatedTab.windowId] === undefined)
        activeTabs[updatedTab.windowId] = {};
      activeTabs[updatedTab.windowId][updatedTab.id] = updatedTab;
    });
  } catch (e) {} // Ignore tabs that have already been removed
});

chrome.runtime.onMessage.addListener(function(request, sender, callback) {
  var url = request.url;
  if (request.action !== 'focusMainWindow' && (!request.repeats || !/[0-9]([0-9]+)?/.test(request.repeats.toString()))) request.repeats = 1;
  switch (request.action) {
    case 'openLink':
      if (!request.noconvert) url = url.convertLink();
      chrome.tabs.update({url: url});
      break;
    case 'openLinkTab':
      if (!request.noconvert) url = url.convertLink();
      for (var i = 0; i < request.repeats; i++) {
        chrome.tabs.create({url: url, active: request.active, index: sender.tab.index + 1});
      }
      break;
    case 'openLinkWindow':
      if (!request.noconvert) url = url.convertLink();
      for (var i = 0; i < request.repeats; i++) {
        chrome.windows.create({url: url, focused: request.active});
      }
      break;
    case 'closeTab':
      chrome.tabs.remove(sender.tab.id);
      break;
    case 'reloadTab':
      chrome.tabs.reload({bypassCache: request.nocache});
      break;
    case 'newTab':
      for (var i = 0; i < request.repeats; i++) {
        chrome.tabs.create({url: 'https://google.com', index: sender.tab.index + 1});
      }
      break;
    case 'nextTab':
      getTab(sender, false, request.repeats, false, false);
      break;
    case 'previousTab':
      getTab(sender, true, request.repeats, false, false);
      break;
    case 'firstTab':
      getTab(sender, false, false, true, false);
      break;
    case 'lastTab':
      getTab(sender, false, false, false, true);
      break;
    case 'appendHistory':
      History.append(request.value, request.type);
      break;
    case 'retrieveHistory':
      callback(History.retrieve(request.type));
      break;
    case 'pinTab':
      chrome.tabs.update({pinned: !sender.tab.pinned});
      break;
    case 'copy':
      Clipboard.copy(request.text);
      break;
    case 'moveTabRight':
      chrome.tabs.move(sender.tab.id, {index: sender.tab.index + request.repeats});
      break;
    case 'moveTabLeft':
      chrome.tabs.move(sender.tab.id, {index: (sender.tab.index - request.repeats <= -1) ? 0 : sender.tab.index - request.repeats});
      break;
    case 'openPasteTab':
      var paste = Clipboard.paste();
      if (!paste) return;
      chrome.tabs.create({url: paste.convertLink(), index: sender.tab.index + 1});
      break;
    case 'openPaste':
      var paste = Clipboard.paste();
      if (!paste) return;
      chrome.tabs.update({url: paste.convertLink()});
      break;
    case 'focusMainWindow':
      chrome.tabs.query({active: true, currentWindow: true}, function(tab) {
        chrome.tabs.sendMessage(tab[0].id, {action: 'focus', repeats: request.repeats});
      });
      break;
    case 'createSession':
      sessions[request.name] = [];
      chrome.tabs.query({windowId: sender.tab.windowId}, function(tabs) {
        tabs.forEach(function(tab) {
          sessions[request.name].push([tab.index, tab.url]);
        });
        chrome.storage.sync.set({sessions: sessions});
      });
      break;
    case 'openBookmarkFolder':
      getFolderLinks(request.path, function(e) {
        if (e.length > 5) {
          chrome.tabs.sendMessage(sender.tab.id, {action: 'confirm', message: 'Open ' + e.length + ' tabs?'}, function(response) {
            if (response) multiOpen(e);
          });
        } else multiOpen(e);
      });
      break;
    case 'deleteSession':
      delete sessions[request.name];
      chrome.storage.sync.set({sessions: sessions});
      break;
    case 'openSession':
      if (sessions.hasOwnProperty(request.name)) {
        var tabs = sessions[request.name];
        var firstTab = tabs.slice(0, 1)[0];
        chrome.windows.create({url: firstTab[1]}, function(tabInfo) {
          tabs.slice(1).forEach(function(tab) {
            chrome.tabs.create({url: tab[1], windowId: tabInfo.tabs[0].windowId, index: tab[0]});
          });
        });
      }
      break;
    case 'openLast':
      if (Object.keys(tabHistory).length && tabHistory[sender.tab.windowId] !== undefined && tabHistory[sender.tab.windowId].length > 0) {
        var lastTab = tabHistory[sender.tab.windowId].pop();
        chrome.tabs.create({url: lastTab.url,
                            active: true,
                            index: lastTab.index,
                            pinned: lastTab.pinned,
                            selected: lastTab.selected,
                          });
      }
      break;
    case 'getBuffers':
      chrome.tabs.query({windowId: sender.tab.windowId}, function(tabs) {
        var t = [];
        for (var i = 0, l = tabs.length; i < l; ++i) {
          t.push([i + ': ' + tabs[i].title, tabs[i].url]);
        }
        chrome.tabs.sendMessage(sender.tab.id, {action: 'showBuffers', buffers: t});
      });
      break;
    case 'selectTab':
      chrome.tabs.query({windowId: sender.tab.windowId}, function(tabs) {
        if (request.tabIndex < tabs.length)
          chrome.tabs.query({windowId: sender.tab.windowId, index: parseInt(request.tabIndex)}, function(tab) {
            chrome.tabs.update(tab[0].id, {active: true});
          });
      });
      break;
    case 'hideDownloadsShelf':
      chrome.downloads.setShelfEnabled(false);
      chrome.downloads.setShelfEnabled(true);
      break;
    default:
      break;
  }
});
