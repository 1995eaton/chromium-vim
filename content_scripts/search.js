var Search = {};

Search.urlMatch = new RegExp(

  "^(http|chrome|https|ftp)\://([a-zA-Z0-9\.\-]+(\:[a-zA-Z0-9\.&amp;%\$\-]+)*@)*((25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9])\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9]|0)\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9]|0)\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[0-9])|([a-zA-Z0-9\-]+\.)*[a-zA-Z0-9\-]+\.(com|edu|gov|int|mil|net|org|biz|arpa|info|name|pro|aero|coop|museum|[a-zA-Z]{2}))(\:[0-9]+)*(/($|[a-zA-Z0-9\.\,\?\'\\\+&amp;%\$#\=~_\-]+))*$"

);

Search.index = null;
Search.searchHistory = [];

Search.chromeUrls = ["accessibility", "appcache-internals", "apps", "blob-internals", "bookmarks", "cache", "chrome", "chrome-urls", "components", "crashes", "credits", "devices", "dns", "downloads", "extensions", "flags", "flash", "gcm-internals", "gpu", "help", "histograms", "history", "indexeddb-internals", "inspect", "invalidations", "ipc", "linux-proxy-config", "media-internals", "memory", "memory-internals", "nacl", "net-internals", "newtab", "omnibox", "plugins", "policy", "predictors", "print", "profiler", "quota-internals", "sandbox", "serviceworker-internals", "settings", "signin-internals", "stats", "sync-internals", "system", "terms", "tracing", "translate-internals", "user-actions", "version", "view-http-cache", "webrtc-internals", "webrtc-logs", "crash", "kill", "hang", "shorthang", "gpuclean", "gpucrash", "gpuhang", "ppapiflashcrash", "ppapiflashhang", "quit", "restart"];
Search.chromeMatch = function(string, callback) {
  if (string.trim() === "") return callback(Search.chromeUrls.slice(0, 10).map(function(e){return["chrome",e]}));
  var matches = [];
  callback(this.chromeUrls.filter(function(element) {
    return (string === element.substring(0, string.length));
  }).map(function(e){return["chrome",e]}));
};

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
    var matches = [];
    if (xhr.readyState === 4 && xhr.status === 200) {
      var data = JSON.parse(xhr.responseText)[1];
      for (var i = 0, l = data.length; i < l; ++i) {
        matches.push(["search", data[i]]);
      }
      callback(matches);
      // callback(JSON.parse(xhr.responseText)[1]);
    }
  };
  xhr.send();
};

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
        Command.input.value = Command.typed || "";
        return;
      }
    } else {
      if (this.index === 0) {
        this.index = null;
        Command.input.value = Command.typed || "";
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

  switch (Command.completionResults[this.index][0]) {
    case "chrome":
      Command.input.value = "chrome://" + Command.completionResults[this.index][1];
      break;
    case "bookmark": case "history":
      Command.input.value = Command.input.value.match(/^\S+ /)[0] + Command.completionResults[this.index][2];
      break;
    case "search":
      Command.input.value = Command.input.value.match(/^\S+ /)[0] + Command.completionResults[this.index][1];
      break;
    case "complete":
      if (Command.completionResults[this.index][1] !== undefined) {
        Command.input.value = Command.completionResults[this.index][1];
      }
      break;
  }

};
