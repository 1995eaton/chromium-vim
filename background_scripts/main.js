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
    var t = document.createElement("textarea");
    t.style.position = "absolute";
    t.style.left = "-100%";
    return t;
  },
  copy: function(text) {
    var t = this.createTextArea();
    t.value = text;
    document.body.appendChild(t);
    t.select();
    document.execCommand("Copy");
    document.body.removeChild(t);
  },
  paste: function(text) {
    var t = this.createTextArea();
    document.body.appendChild(t);
    t.focus();
    document.execCommand("Paste");
    var text = t.value;
    document.body.removeChild(t);
    return text;
  }
};

var history = {
  searchResults: null,
  append: function(value, type) {
    if (!localStorage[type] || localStorage[type] === "") {
      localStorage[type] = value;
    } else {
      if (!/^(\s+)?$/.test(value)) {
        localStorage[type] += "," + value;
      }
    }
  },
  retrieve: function(type) {
    if (!localStorage[type]) {
      localStorage[type] = "";
    }
    return [type, localStorage[type].split(",")];
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

chrome.extension.onConnect.addListener(function(port) {
  console.assert(port.name == "main");
  port.onMessage.addListener(function(request, data) {
    if (request.action == "getBookmarks") {
      getMarks(function(marks) {
        port.postMessage({bookmarks: marks});
      });
    } else if (request.action == "searchHistory") {
      history.retrieveSearchHistory(request.search, request.limit || 4, function(results) {
        port.postMessage({history: results});
      });
    }
  });
});

chrome.runtime.onMessage.addListener(function(request, sender, callback) {
  if (request.action !== "focusMainWindow" && (!request.repeats || !/[0-9]([0-9]+)?/.test(request.repeats.toString()))) request.repeats = 1;
  switch (request.action) {
    case "openLink":
      chrome.tabs.update({url: request.url});
      break;
    case "openLinkTab":
      for (var i = 0; i < request.repeats; i++) {
      chrome.tabs.create({url: request.url, active: request.active, index: sender.tab.index + 1});
      }
      break;
    case "closeTab":
      chrome.tabs.remove(sender.tab.id);
      break;
    case "reloadTab":
      chrome.tabs.reload({});
      break;
    case "newTab":
      for (var i = 0; i < request.repeats; i++) {
        chrome.tabs.create({url: "https://google.com", index: sender.tab.index + 1});
      }
      break;
    case "nextTab":
      getTab(sender, false, request.repeats, false, false);
      break;
    case "previousTab":
      getTab(sender, true, request.repeats, false, false);
      break;
    case "firstTab":
      getTab(sender, false, false, true, false);
      break;
    case "lastTab":
      getTab(sender, false, false, false, true);
      break;
    case "appendHistory":
      history.append(request.value, request.type);
      break;
    case "retrieveHistory":
      callback(history.retrieve(request.type));
      break;
    case "pinTab":
      chrome.tabs.update({pinned: !sender.tab.pinned});
      break;
    case "copy":
      Clipboard.copy(request.text);
      break;
    case "moveTabRight":
      chrome.tabs.move(sender.tab.id, {index: sender.tab.index + request.repeats});
      break;
    case "moveTabLeft":
      chrome.tabs.move(sender.tab.id, {index: (sender.tab.index - request.repeats <= -1) ? 0 : sender.tab.index - request.repeats});
      break;
    case "openPasteTab":
      var paste = Clipboard.paste();
      if (!paste) return;
      chrome.tabs.create({url: paste, index: sender.tab.index + 1});
      break;
    case "openPaste":
      var paste = Clipboard.paste();
      if (!paste) return;
      chrome.tabs.update({url: paste});
      break;
    case "focusMainWindow":
      chrome.tabs.getSelected(null, function(tab) {
        chrome.tabs.sendMessage(tab.id, {action: "focus", repeats: request.repeats});
      });
      break;
    default:
      break;
  }
});
