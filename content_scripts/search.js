var Search = {};
var port = chrome.extension.connect({name: "main"});

var getAllMarks = function(marks, callback) {
  marks.forEach(function(bookmark) {
    if (bookmark.url) {
      Marks.bookmarks.push([bookmark.title, bookmark.url]);
    }
    if (bookmark.children) {
      getAllMarks(bookmark.children);
    }
  });
  if (callback) {
    callback();
  }
};

port.onMessage.addListener(function(response) {
  if (response.history) {
    Search.searchHistory = [];
    for (var key in response.history) {
      if (response.history[key].url) {
        Search.searchHistory.push([response.history[key].title, response.history[key].url]);
      }
    }
  } else if (response.bookmarks) {
    Marks.bookmarks = [];
    getAllMarks(response.bookmarks, function() {
      //Command.appendResults(null, true);
    });
  }
});

Search.urlMatch = /(http(s)?:\/\/)?(\S+)\.(com|org|mil|ru|ca|jp|ch|io|net|biz|edu|gov|me)(([\/]+)?([\/\S]+)?)?/i;

Search.index = null;
Search.searchHistory = [];

Search.fetchQuery = function(query, callback) {
  var api = "https://suggestqueries.google.com/complete/search?client=firefox&q=";
  //var api = "http://toolbarqueries.google.com/complete/search?output=toolbar&hl=en&q="
  //var api = "https://clients1.google.com/complete/search?client=hp&hl=en&gs_rn=37&gs_ri=hp&tok=ZrCrC4RUUHoLw7nw3h5B7Q&cp=1&gs_id=7&gs_gbg=99XWStbq0&q=";
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
  var search = barInput.value.replace(/^(t|tab)?o(pen)?(\s+)/, "");
  if (!Search.urlMatch.test(search)) {
    search = "https://google.com/search?q=" + search;
  } else if (!/^http(s)?/.test(search)) {
    search = "http://" + search;
  }
  if (/^(to|tabopen) /.test(barInput.value)) {
    chrome.runtime.sendMessage({action: "openLinkTab", url: search, repeats: repeats});
  } else {
    chrome.runtime.sendMessage({action: "openLink", url: search, repeats: repeats});
  }
};

Search.appendFromHistory = function(data) {
  port.postMessage({action: "searchHistory", search: data});
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
        if (Command.actionType === "bookmarks") {
          if (/^b(ook)?marks(\s+)?/.test(Command.typed)) {
            barInput.value = barInput.value.match(/^b(ook)?marks(\s+)?/)[0];
          } else {
            barInput.value = "bookmarks ";
          }
        } else {
          barInput.value = Command.typed;
        }
        return;
      }
    } else {
      if (this.index === 0) {
        this.index = null;
        barInput.value = Command.typed;
        if (Command.actionType === "bookmarks") {
          if (/^b(ook)?marks /.test(Command.typed)) {
            barInput.value = barInput.value.match(/^b(ook)?marks /)[0];
          } else {
            barInput.value = "bookmarks ";
          }
        }
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
    barInput.value = barInput.value.match(/^b(ook)?marks /)[0] + Marks.currentBookmarks[this.index];
  } else if (Command.actionType === "complete") {
    barInput.value = completionMatches[this.index][0];
  } else if (Search.searchHistory[this.index]) {
    barInput.value = barInput.value.match(/^(t(ab)?)?o(pen)? /)[0] + Search.searchHistory[this.index][1];
  } else {
    barInput.value = barInput.value.match(/^(t(ab)?)?o(pen)? /)[0] + dataElements[this.index].innerText;
  }
};
