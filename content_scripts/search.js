var Search = {};

Search.index = null;

Search.chromeUrls = ["accessibility", "appcache-internals", "apps", "blob-internals", "bookmarks", "cache", "chrome", "chrome-urls", "components", "crashes", "credits", "devices", "dns", "downloads", "extensions", "flags", "flash", "gcm-internals", "gpu", "help", "histograms", "history", "indexeddb-internals", "inspect", "invalidations", "ipc", "linux-proxy-config", "media-internals", "memory", "memory-internals", "nacl", "net-internals", "newtab", "omnibox", "plugins", "policy", "predictors", "print", "profiler", "quota-internals", "sandbox", "serviceworker-internals", "settings", "signin-internals", "stats", "sync-internals", "system", "terms", "tracing", "translate-internals", "user-actions", "version", "view-http-cache", "webrtc-internals", "webrtc-logs", "crash", "kill", "hang", "shorthang", "gpuclean", "gpucrash", "gpuhang", "ppapiflashcrash", "ppapiflashhang", "quit", "restart"];

Search.chromeMatch = function(string, callback) {
  if (string.trim() === "") return callback(Search.chromeUrls.slice(0, settings.searchLimit).map(function(e){return["chrome",e];}));
  callback(this.chromeUrls.filter(function(element) {
    return (string === element.substring(0, string.length));
  }).map(function(e){return["chrome",e];}));
};

Search.settings = ["smoothscroll", "scrollstep", "searchlimit", "regexsearch", "ignorecase", "hintcharacters", "showhud"];

Search.settingsMatch = function(string, callback) {
  if (string.trim() === "") return callback(Search.settings.slice(0, settings.searchLimit).map(function(e){return["settings",e];}));
  callback(this.settings.filter(function(element) {
    return (string === element.substring(0, string.length));
  }).map(function(e){return["settings",e];}));
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
  }, 50);
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
    case "bookmark":
    case "history":
      Command.input.value = Command.input.value.match(/^\S+ /)[0] + Command.completionResults[this.index][2];
      break;
    case "search":
    case "settings":
    case "session":
      Command.input.value = Command.input.value.match(/^\S+/)[0] + " " + Command.completionResults[this.index][1];
      break;
    case "path":
      if (Command.completionResults[this.index][2] !== "folder") {
        Command.input.value = "bookmarks " + Command.completionResults[this.index][2];
      } else {
        Command.input.value = "bookmarks " + Command.completionResults[this.index][3] + Command.completionResults[this.index][1];
      }
      break;
    case "buffer":
      Command.input.value = Command.input.value.match(/^\S+/)[0] + " " + Command.completionResults[this.index][1][0];
      break;
    case "complete":
      if (Command.completionResults[this.index][1] !== undefined) {
        Command.input.value = Command.completionResults[this.index][1];
      }
      break;
  }

};
