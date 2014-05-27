var port = chrome.extension.connect({name: "main"});

port.onMessage.addListener(function(response) {
  var key;
  switch (response.type) {
    case "hello":
      port.postMessage({action: "getBookmarks"});
      port.postMessage({action: "getQuickMarks"});
      port.postMessage({action: "getSessionNames"});
      port.postMessage({action: "getTopSites"});
      port.postMessage({action: "retrieveAllHistory"});
      break;
    case "commandHistory":
      for (key in response.history) {
        Command.history[key] = response.history[key];
      }
      break;
    case "history":
      var matches = [];
      for (key in response.history) {
        if (response.history[key].url) {
          if (response.history[key].title.trim() === "") {
            matches.push(["history", "Untitled", response.history[key].url]);
          } else {
            matches.push(["history", response.history[key].title, response.history[key].url]);
          }
        }
      }
      matches = matches.sort(function(a, b) {
        return a[2].length - b[2].length;
      });
      if (Command.historyMode) {
        if (Command.active && Command.bar.style.display !== "none" && matches.length > 0) {
          Command.appendResults(matches, false);
        }
      } else if (Command.searchMode) {
        Command.searchMode = false;
        Command.hideData();
        if (Command.active && Command.bar.style.display !== "none") {
          Command.appendResults(Command.engineMatches, false);
          Command.appendResults(Command.topSiteMatches, true, "Top Sites", "darkcyan");
          if (matches.length > 0) {
            Command.appendResults(matches, true, "History", "cyan");
          }
        }
      }
      Marks.history = matches;
      break;
    case "bookmarks":
      Marks.bookmarks = [];
      Marks.parse(response.bookmarks);
      break;
    case "topsites":
      Search.topSites = response.sites;
      break;
    case "buffers":
      if (Command.bar.style.display !== "none") {
        var regexp;
        var val = Command.input.value.replace(/\S+\s+/, ""),
            useRegex = true;
        Command.hideData();
        Command.appendResults(response.buffers.map(function(e) { return ["buffer"].concat(e); }).filter(function(s) {
          try {
            regexp = new RegExp(val, "i");
          } catch (e) {
            useRegex = false;
          }
          if (useRegex) return regexp.test(s[1]);
          return s[1].substring(0, val.length) === val;
        }));
      }
      break;
    case "sessions":
      sessions = response.sessions;
      break;
    case "quickMarks":
      Marks.quickMarks = {};
      for (key in response.marks) {
        if (Array.isArray(response.marks[key])) {
          Marks.quickMarks[key] = response.marks[key];
        } else if (typeof response.marks[key] === "string") {
          Marks.quickMarks[key] = [response.marks[key]];
        }
      }
      break;
    case "bookmarkPath":
      var _ret = response.path.map(function(e) { return ["path"].concat(e); });
      if (_ret.length) {
        Command.appendResults(_ret);
      } else Command.hideData();
      break;
  }
});

chrome.extension.onMessage.addListener(function(request, sender, callback) {
  switch (request.action) {
    case "commandHistory":
      for (var key in request.history) {
        Command.history[key] = request.history[key];
      }
      break;
    case "updateLastSearch":
      Find.lastSearch = request.value;
      break;
    case "sendSettings":
      Command.configureSettings(request.settings);
      break;
    case "confirm":
      callback(confirm(request.message));
      break;
    case "cancelAllWebRequests":
      window.stop();
      break;
    case "updateMarks":
      Marks.quickMarks = request.marks;
      break;
    case "focusFrame":
      if (request.index === Frames.index) {
        Frames.focus();
      }
      break;
    case "sessions":
      sessions = request.sessions;
      break;
    case "nextCompletionResult":
      if (settings.cncpcompletion && Command.type === "action" && commandMode && document.activeElement.id === "cVim-command-bar-input") {
        Search.nextResult();
        break;
      }
      if (window.self === window.top) {
        callback(true);
      }
      break;
    case "toggleEnabled":
      Command.init(request.state);
      break;
    case "getBlacklistStatus":
      callback(Command.blacklisted);
      break;
    case "alert":
      alert(request.message);
      break;
  }
});
