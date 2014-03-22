var Search = {};

Search.urlMatch = /^chrome:\/\/|(http(s)?:\/\/)?(\S+)\.(com|org|mil|ru|ca|jp|ch|io|net|biz|edu|gov|me)(([\/]+)?([\/\S]+)?)?/i;
Search.index = null;
Search.completionResults = [];
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
    Search.searchHistory = [];
    for (var key in response.history) {
      if (response.history[key].url) {
        Command.actionType = "query";
        Search.searchHistory.push([response.history[key].title, response.history[key].url]);
      }
    }
    Command.appendResults([]);
  } else if (response.bookmarks) {
    Marks.bookmarks = [];
    getAllMarks(response.bookmarks);
  }
});

Search.apis = [
  ["google", "https://suggestqueries.google.com/complete/search?client=firefox&q=", "https://google.com/search?q="],
  ["wikipedia", "https://en.wikipedia.org/w/api.php?format=json&action=opensearch&search=", "https://en.wikipedia.org/wiki/"]
];

Search.parse = function() {
  var parsed = barInput.value.split(/\s+/);
  var data = [];
  this.noComplete = false;
  if (!parsed || parsed.length === 1) {
    return false;
  }
  if (parsed[0] === "to" || parsed[0] === "tabopen") {
    data.push("tabopen");
  } else if (parsed[0] === "o" || parsed[0] === "open") {
    data.push("open");
  } else {
    return false;
  }
  parsed.shift();
  for (var i = 0, l = this.apis.length; i < l; i++) {
    if (parsed[0] === this.apis[i][0]) {
      data.push(i);
      parsed.shift();
      if (parsed.length) {
        data.push(parsed.join(" "));
      }
      return data;
    }
  }
  if (data.length === 1 && parsed.length === 1 && Search.urlMatch.test(parsed[0])) {
    data.push("url");
    data.push(parsed[0]);
    return data;
  }
  data.push(0);
  data.push(parsed.join(" "));
  this.noComplete = true;
  return data;
};

Search.fetchQuery = function(query, callback, api) {
  this.data = this.parse();
  if (!this.data || this.noComplete || this.data[1] === "url" || this.data.length === 2) return;
  if (this.data[2].trim() === "") {
    return;
  }
  var xhr = new XMLHttpRequest();
  xhr.open("GET", this.apis[this.data[1]][1] + this.data[2]);
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4 && xhr.status === 200) {
      callback(JSON.parse(xhr.responseText)[1]);
    } else {
      callback(NaN);
    }
  };
  xhr.send();
};

Search.go = function(repeats) {
  if (!this.data) return;
  this.data = this.parse();
  if (this.data[1] !== "url") {
  chrome.runtime.sendMessage({action: (this.data[0] === "tabopen") ? "openLinkTab" : "openLink", url: this.apis[this.data[1]][2] + this.data[2], repeats: repeats});
  } else {
    if (!/:\/\//.test(this.data[2])) {
      this.data[2] = "http://" + this.data[2];
  }
    chrome.runtime.sendMessage({action: (this.data[0] === "tabopen") ? "openLinkTab" : "openLink", url: this.data[2], repeats: repeats});
  }
  Command.hide();
  return this.data = [];
};

Search.appendFromHistory = function(data, items) {
  port.postMessage({action: "searchHistory", search: data, items: items});
}

Search.getBookmarks = function() {
  port.postMessage({action: "getBookmarks"});
}

Search.nextResult = function(reverse) {
  if (!dataElements.length) return;
  if (this.index === null) {
    if (!reverse) {
      this.index = 0;
    } else {
      this.index = dataElements.length - 1;
    }
  } else {
    dataElements[this.index].style.backgroundColor = "";
    dataElements[this.index].style.color = "";
    if (dataElements[this.index].children.length > 1) {
      dataElements[this.index].children[0].style.color = "";
      dataElements[this.index].children[1].style.color = "";
    }
    if (!reverse) {
      if (this.index + 1 < dataElements.length) {
        this.index++;
      } else {
        this.index = null;
        barInput.value = Command.typed;
        return;
      }
    } else {
      if (this.index === 0) {
        this.index = null;
        barInput.value = Command.typed;
        return;
      } else {
        this.index--;
      }
    }
  }
  dataElements[this.index].style.backgroundColor = "#fefefe";
  if (dataElements[this.index].children.length > 1) {
    dataElements[this.index].children[0].style.color = "#1b1d1e";
    dataElements[this.index].children[1].style.color = "#1b1d1e";
  } else {
    dataElements[this.index].style.color = "#1b1d1e";
  }
  if (Command.actionType === "bookmarks") {
    barInput.value = barInput.value.match(/^(bmarks|bookmarks) /)[0] + Marks.currentBookmarks[this.index];
  } else if (/^(to|tabopen|open|o) /.test(barInput.value) && dataElements[this.index].children.length > 1) {
    var m = barInput.value.match(/^(to|tabopen|open|o) /);
    if (!m || barInput.value.replace(m[0], "").trim() === "") return;
    barInput.value = m[0] + " " + Search.searchHistory[this.index - (dataElements.length - Search.searchHistory.length)][1];
  } else if (Command.actionType === "complete") {
    barInput.value = completionMatches[this.index][0];
  } else {
    if (this.data.length) {
      barInput.value = barInput.value.match(/^(to|tabopen|open|o) /)[0] + this.apis[this.data[1]][0] + " " + dataElements[this.index].innerText;
    }
  }
};
