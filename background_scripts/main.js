function getTab(sender, reverse) {
  chrome.tabs.query({windowId: sender.tab.windowId}, function(tabs) {
    for (var i = 0; i < tabs.length; i++) {
      if (tabs[i].index === sender.tab.index) {
        if (!reverse) {
          return chrome.tabs.update((sender.tab.index + 1 === tabs.length) ? tabs[0].id : tabs[i + 1].id, {active: true});
        }
        return chrome.tabs.update((sender.tab.index === 0) ? tabs[tabs.length - 1].id : tabs[i - 1].id, {active: true});
      }
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

  retrieveSearchHistory: function(search, callback) {
    chrome.history.search({text: search, maxResults: 4}, function(results) {
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
      history.retrieveSearchHistory(request.search, function(results) {
        port.postMessage({history: results});
      });
    }
  });
});

chrome.runtime.onMessage.addListener(function(request, sender, callback) {
  switch (request.action) {
    case "openLink":
      chrome.tabs.update({url: request.url});
      break;
    case "openLinkTab":
      chrome.tabs.create({url: request.url, index: sender.tab.index + 1});
      break;
    case "closeTab":
      chrome.tabs.remove(sender.tab.id);
      break;
    case "getBookmarks":
      getMarks();
      callback(marks);
      break;
    case "reloadTab":
      chrome.tabs.reload({});
      break;
    case "newTab":
      chrome.tabs.create({url: "https://google.com", index: sender.tab.index + 1});
      break;
    case "nextTab":
      getTab(sender, false);
      break;
    case "previousTab":
      getTab(sender, true);
      break;
    case "appendHistory":
      history.append(request.value, request.type);
      break;
    case "retrieveHistory":
      callback(history.retrieve(request.type));
      break;
    case "searchHistory":
      history.retrieveSearchHistory(request.search);
      console.log(history.searchResults);
      callback(history.searchResults);
      break;
    case "copy":
      Clipboard.copy(request.text);
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
    default:
      break;
  }
});
