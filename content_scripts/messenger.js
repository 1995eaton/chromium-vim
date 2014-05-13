var port = chrome.extension.connect({name: "main"});

port.onMessage.addListener(function(response) {
  switch (response.type) {
    case "commandHistory":
      Command.history[response.historyType[0]] = response.historyType[1];
      break;
    case "history":
      var matches = [];
      for (var key in response.history) {
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
        if (matches.length > 0) {
          Command.appendResults(matches, false, "History", "cyan");
        }
      }
      Marks.history = matches;
      break;
    case "bookmarks":
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
      Marks.quickMarks = response.marks;
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
    case "nextCompletionResult":
      if (settings.cncpcompletion && Command.type === "action" && commandMode && document.activeElement.id === "cVim-command-bar-input") {
        Search.nextResult();
        break;
      }
      if (window.self === window.top) {
        callback(true);
      }
      break;
  }
});
