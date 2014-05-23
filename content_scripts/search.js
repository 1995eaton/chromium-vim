var Search = {};

Search.index = null;
Search.topSites = [];

Search.chromeUrls = ["accessibility", "appcache-internals", "apps", "blob-internals", "bookmarks", "cache", "chrome", "chrome-urls", "components", "crashes", "credits", "devices", "dns", "downloads", "extensions", "flags", "flash", "gcm-internals", "gpu", "help", "histograms", "history", "indexeddb-internals", "inspect", "invalidations", "ipc", "linux-proxy-config", "media-internals", "memory", "memory-internals", "nacl", "net-internals", "newtab", "omnibox", "plugins", "policy", "predictors", "print", "profiler", "quota-internals", "sandbox", "serviceworker-internals", "settings", "signin-internals", "stats", "sync-internals", "system", "terms", "tracing", "translate-internals", "user-actions", "version", "view-http-cache", "webrtc-internals", "webrtc-logs", "crash", "kill", "hang", "shorthang", "gpuclean", "gpucrash", "gpuhang", "ppapiflashcrash", "ppapiflashhang", "quit", "restart"];

Search.chromeMatch = function(string, callback) {
  if (string.trim() === "") return callback(Search.chromeUrls.slice(0, settings.searchlimit).map(function(e){return["chrome",e];}));
  callback(this.chromeUrls.filter(function(element) {
    return (string === element.substring(0, string.length));
  }).map(function(e){return["chrome",e];}));
};

Search.settings = ["|numerichints", "|typelinkhints", "|smoothscroll", "scrollstep", "searchlimit", "|regexp", "|ignorecase", "|incsearch", "|smartcase", "hintcharacters", "|linkanimations", "|hud", "|insertmappings"];

Search.settingsMatch = function(string, callback) {
  if (string.trim() === "") return callback(Search.settings.slice(0, settings.searchlimit).map(function(e){return["settings",e.replace(/^\|/, "")];}));
  callback(this.settings.filter(function(element) {
    var isBoolean;
    if (/^\|/.test(element)) {
      isBoolean = true;
    }
    return (string.replace(/^\S+\s+/, "") === element.replace(/^\|/, "").substring(0, string.length) || (isBoolean && string === "no" + element.substring(1, string.length - 1)));
  }).map(function(e){return["settings",e.replace(/^\|/, "")];}));
};

Search.nextResult = function(reverse) {
  var i, l;
  if (!Command.dataElements.length) {
    if (Command.input.value.length) {
      return false;
    }
    return Command.complete("");
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
    spanElements = Command.dataElements[this.index].getElementsByTagName("span");
    for (i = 0, l = spanElements.length; i < l; ++i) {
      spanElements[i].style.color = "";
    }
    if (this.lastStyle) {
      spanElements[0].firstElementChild.style.color = this.lastStyle;
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
  Command.dataElements[this.index].style.color = "#1b1d1e";
  spanElements = Command.dataElements[this.index].getElementsByTagName("span");
  l = spanElements.length;
  if (spanElements[0].childNodes.length === 2) {
    this.lastStyle = spanElements[0].firstElementChild.style.color;
  } else {
    delete this.lastStyle;
  }
  for (i = 0; i < l; ++i) {
    spanElements[i].style.color = "#1b1d1e";
  }

  switch (Command.completionResults[this.index][0]) {
    case "chrome":
      Command.input.value = "chrome://" + Command.completionResults[this.index][1];
      break;
    case "bookmark":
    case "history":
      Command.input.value = Command.input.value.match(/^\S+ /)[0] + Command.completionResults[this.index][2];
      break;
    case "engines":
      Command.input.value = Command.input.value.match(/^\S+ /)[0] + Command.completionResults[this.index][1];
      break;
    case "search":
      var value = Command.input.value.split(/\s+/).filter(function(e) { return e; });
      if (Command.completionResults[this.index].length === 3) {
        Command.input.value = value[0] + " " + Command.completionResults[this.index][2];
      } else {
        Command.input.value = value.slice(0, 2).join(" ") + " " + Command.completionResults[this.index][1];
      }
      break;
    case "session":
      Command.input.value = Command.input.value.match(/^\S+/)[0] + " " + Command.completionResults[this.index][1];
      break;
    case "settings":
      var command = Command.input.value.split(/\s+/);
      Command.input.value = command[0] + " " + (/^no/.test(command[1]) ? "no" : "") + Command.completionResults[this.index][1];
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
