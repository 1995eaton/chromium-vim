var Search = {};

Search.urlMatch = /^chrome:\/\/|(http(s)?:\/\/)?(\S+)\.(com|org|mil|ru|ca|jp|ch|io|net|biz|edu|gov|me)(([\/]+)?([\/\S]+)?)?/i;
Search.index = null;
Search.searchHistory = [];

var port = chrome.extension.connect({name: "main"});

var getAllMarks = function(marks) {
  marks.forEach(function(bookmark) {
    if (bookmark.url) {
      Marks.bookmarks.push([bookmark.title, bookmark.url]);
    }
    if (bookmark.children) {
      getAllMarks(bookmark.children);
    }
  });
};

port.onMessage.addListener(function(response) {
  if (response.history) {
    log(response.history);
    Search.searchHistory = [];
    for (var key in response.history) {
      if (response.history[key].url) {
        if (response.history[key].title.trim() === "") {
          Search.searchHistory.push(["Untitled", response.history[key].url]);
        } else {
          Search.searchHistory.push([response.history[key].title, response.history[key].url]);
        }
      }
    }
    if (Command.actionType === "history") {
      Command.appendResults(Search.searchHistory);
    }
  } else if (response.bookmarks) {
    Marks.bookmarks = [];
    getAllMarks(response.bookmarks);
  }
});

Search.fetchQuery = function(query, callback) {
  Search.current = query;
  if (Search.delay) return false;
  Search.delay = true;
  var api = "https://suggestqueries.google.com/complete/search?client=firefox&q=";
  var lastQuery = query;
  setTimeout(function() {
    Search.delay = false;
    if (lastQuery !== Search.current) {
      Search.fetchQuery(query, callback);
    }
  }, 150);
  var xhr = new XMLHttpRequest();
  xhr.open("GET", api + query);
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4 && xhr.status === 200) {
      callback(JSON.parse(xhr.responseText)[1]);
    }
  };
  xhr.send();
};

Search.go = function(repeats) {
  var search = Command.input.value.replace(/^(to|tabopen|o|open|hist(ory)?)(\s+)/, "");
  if (!Search.urlMatch.test(search)) {
    search = "https://google.com/search?q=" + search;
  } else if (!/^chrome:\/\//.test(search) && !/^http(s)?/.test(search)) {
    search = "http://" + search;
  }
  if (/^(to|tabopen|hist(ory)?) /.test(Command.input.value)) {
    chrome.runtime.sendMessage({action: "openLinkTab", active: false, url: search, repeats: repeats});
  } else {
    chrome.runtime.sendMessage({action: "openLink", url: search, repeats: repeats});
  }
  Command.hide();
};

Search.appendFromHistory = function(data, limit) {
  port.postMessage({action: "searchHistory", search: data, limit: limit});
}

Search.getBookmarks = function() {
  port.postMessage({action: "getBookmarks"});
}

Search.nextResult = function(reverse) {

  if (!Command.dataElements.length) {
    return;
  }

  if (this.index === null) {
    if (!reverse) {
      this.index = 0;
    } else {
      this.index = Command.dataElements.length - 1;
    }
  } else {
    Command.dataElements[this.index].style.backgroundColor = "";
    Command.dataElements[this.index].style.color = "";
    if (Command.dataElements[this.index].children.length > 1) {
      Command.dataElements[this.index].children[0].style.color = "";
      Command.dataElements[this.index].children[1].style.color = "";
    }
    if (!reverse) {
      if (this.index + 1 < Command.dataElements.length) {
        this.index++;
      } else {
        this.index = null;
        Command.input.value = Command.typed;
        return;
      }
    } else {
      if (this.index === 0) {
        this.index = null;
        Command.input.value = Command.typed;
        return;
      } else {
        this.index--;
      }
    }
  }

  Command.dataElements[this.index].style.backgroundColor = "#fefefe";
  if (Command.dataElements[this.index].children.length > 1) {
    Command.dataElements[this.index].children[0].style.color = "#1b1d1e";
    Command.dataElements[this.index].children[1].style.color = "#1b1d1e";
  } else {
    Command.dataElements[this.index].style.color = "#1b1d1e";
  }
  if (Command.actionType === "bookmarks") {
    Command.input.value = Command.input.value.match(/^(bmarks|bookmarks) /)[0] + Marks.currentBookmarks[this.index];
  } else if (Command.actionType === "complete") {
    Command.input.value = Command.matches[this.index][0];
  } else if (Search.searchHistory[this.index]) {
    Command.input.value = Command.input.value.match(/^(to|tabopen|open|o|hist(ory)?) /)[0] + Search.searchHistory[this.index][1];
  } else {
    Command.input.value = Command.input.value.match(/^(to|tabopen|open|o) /)[0] + Command.dataElements[this.index].innerText;
  }

};
