var Command = {};
var settings;

Command.setup = function() {
  this.bar = document.createElement("div");
  this.bar.id = "command_bar";
  this.bar.cVim = true;
  if (this.onBotton) {
    this.bar.style.bottom = "0";
  } else {
    this.bar.style.top = "0";
  }
  this.input = document.createElement("input");
  this.input.type = "text";
  this.input.id = "command_input";
  this.input.cVim = true;
  this.modeIdentifier = document.createElement("div");
  this.modeIdentifier.id = "command_bar_mode";
  this.modeIdentifier.cVim = true;
  this.bar.appendChild(this.modeIdentifier);
  this.bar.appendChild(this.input);
  this.bar.spellcheck = false;
  this.findMatches = document.createElement("div");
  this.findMatches.id = "cVim-findmatches";
  this.bar.appendChild(this.findMatches);
  try {
    document.lastChild.appendChild(this.bar);
  } catch(e) {
    document.body.appendChild(this.bar);
  }
};

var historyStates = ["action", "url", "search"];
for (var i = 0; i < historyStates.length; i++) {
  chrome.runtime.sendMessage({action: "retrieveHistory", type: historyStates[i]}, function(result) {
    Command.history[result[0]] = result[1];
  });
}

Command.history = {
  index: {},
  cycle: function(type, reverse, search) {
    Command.hideData();
    if (Command.history.reset) {
      Command.history.reset = false;
      Command.history.index = {};
    }
    if (this.index[type] === undefined) {
      Command.typed = Command.input.value;
      this.index[type] = this[type].length;
    }
    if (Command.input.value === "") {
      if (reverse) {
        if (this.index[type] - 1 < 0) return false;
        this.index[type]--;
        return Command.input.value = this[type][this.index[type]];
      } else {
        if (this.index[type] + 1 === this[type].length) return Command.input.value = Command.typed;
        this.index[type]++;
        return Command.input.value = this[type][this.index[type]];
      }
    } else {
      if (reverse) {
        while (this.index[type] > 0) {
          this.index[type]--;
          if (this[type][this.index[type]].substring(0, Command.typed.length) === Command.typed) {
            return Command.input.value = this[type][this.index[type]];
          }
        }
      } else {
        while (this.index[type] + 1 < this[type].length) {
          this.index[type]++;
          if (this[type][this.index[type]].substring(0, Command.typed.length) === Command.typed) {
            return Command.input.value = this[type][this.index[type]];
          }
        }
        return Command.input.value = Command.typed;
      }
    }
  }
};

Command.appendResults = function(data, bookmarks, search, completion) {
  this.dataElements = [];
  var temp, rxp;
  if (!this.data) {
    this.data = document.createElement("div");
    this.data.id = "command_search_results";
    this.data.cVim = true;
    if (this.onBotton) {
      this.data.style.bottom = "20px";
    } else {
      this.data.style.top = "20px";
    }
    try {
      document.lastChild.appendChild(this.data);
    } catch(e) {
      document.body.appendChild(this.data);
    }
  }
  this.data.innerHTML = "";
  if (bookmarks) {
    var c = 0;
    Marks.currentBookmarks = [];
    for (var i = 0, length = Marks.bookmarks.length; i < length; i++) {
      try {
        rxp = new RegExp(search, "i");
      } catch(e) {
        continue;
      }
      if (!rxp.test(Marks.bookmarks[i][0] + Marks.bookmarks[i][1])) {
        continue;
      }
      c++;
      if (c > settings.searchLimit) {
        break;
      }
      Marks.currentBookmarks.push(Marks.bookmarks[i][1]);
      temp = document.createElement("div");
      temp.cVim = true;
      temp.className = "completion-item";
      temp.innerHTML = '<span class="left">' + Marks.bookmarks[i][0] + '</span>' + '<span class="right">' + Marks.bookmarks[i][1] + '</span>';
      this.dataElements.push(temp);
      this.data.appendChild(temp);
    }
  } else {
    for (var i = 0; i < Search.searchHistory.length; i++) {
      temp = document.createElement("div");
      temp.cVim = true;
      temp.className = "completion-item";
      temp.innerHTML = '<span class="left">' + '<span style="color:#00BED3">History</span>: ' + Search.searchHistory[i][0] + '</span>' + '<span class="right">' + Search.searchHistory[i][1] + '</span>';
      this.dataElements.push(temp);
      this.data.appendChild(temp);
    }
    if (Command.actionType !== "history") {
      if (completion) {
        for (var i = 0; i < data.length; i++) {
          temp = document.createElement("div");
          temp.cVim = true;
          temp.className = "completion-item";
          temp.innerHTML = data[i];
          this.dataElements.push(temp);
          this.data.appendChild(temp);
        }
      } else {
        for (var i = 0; i < data.length; i++) {
          temp = document.createElement("div");
          temp.cVim = true;
          temp.className = "completion-item";
          temp.innerHTML = '<span class="full">' + data[i] + '</span>';
          this.dataElements.push(temp);
          this.data.appendChild(temp);
        }
      }
    }
  }
  this.data.style.display = "block";
};

Command.hideData = function() {
  if (this.data) {
    this.data.innerHTML = "";
    Search.index = null;
  }
};

Command.descriptions = [
  ["tabopen ", "t(ab)o(pen)", "Open a link in a new tab"],
  ["closetab", "cl(osetab)", "Close the current tab"],
  ["open ", "o(pen)", "Open a link in the current tab"],
  ["nohl", "nohl", "Clears the search highlight"],
  ["bookmarks ", "b(ook)marks", "Search through your bookmarks"],
  ["history ", "hist(ory)", "Search through your browser history"],
  ["extensions", "ex(tensions)", "Opens the chrome://extensions page"],
  ["flags", "fl(ags)", "Opens the chrome://flags page"]
];

Command.match = function(input) {
  this.matches = [];
  for (var i = 0; i < Command.descriptions.length; i++) {
    if (!input || input === Command.descriptions[i][0].substring(0, input.length)) {
      this.matches.push(Command.descriptions[i]);
    }
  }
};

Command.complete = function(input, reverse, doSearch) {
  if (doSearch && this.dataElements.length && this.matches.length) {
    Search.nextResult(reverse);
  } else {
    Command.match(input);
    Command.actionType = "complete";
    Command.typed = input;
    var descriptions = [];
    if (this.matches.length) {
      for (var i = 0; i < this.matches.length; i++) {
        descriptions.push('<span class="left">' + this.matches[i][1] + '</span>' + '<span class="right">' + this.matches[i][2] + '</span>');
      }
      Command.appendResults(descriptions, false, false, true);
    } else {
      Command.hideData();
    }
  }
};

Command.parse = function(value, pseudoReturn, repeats) {
  Command.typed = this.input.value;
  Command.history.index = {};
  if (pseudoReturn || Command.enterHit) {
    Command.hideData();
    if (/^ex(tensions)?(\s+)?$/.test(value)) {
      chrome.runtime.sendMessage({action: "openLinkTab", url: "chrome://extensions"});
    } else if (/^fl(ags)?(\s+)?$/.test(value)) {
      chrome.runtime.sendMessage({action: "openLinkTab", url: "chrome://flags", repeats: repeats});
    } else if (/^(tabnew|t(ab)?o(pen)?)(\s+)?$/.test(value)) {
      chrome.runtime.sendMessage({action: "openLinkTab", url: "chrome://newtab", repeats: repeats});
    } else if (/^nohl(\s+)?$/.test(value)) {
      Find.clear();
    } else if (/^cl(osetab)?(\s+)?$/.test(value)) {
      chrome.runtime.sendMessage({action: "closeTab", repeats: repeats});
    } else if (/^b(ook)?marks(\s+)?/.test(value)) {
      if (this.input.value.replace(/^b(ook)?marks(\s+)?/, "").length !== 0) {
        chrome.runtime.sendMessage({action: "openLinkTab", url: this.input.value.replace(/^b(ook)?marks(\s+)?/, "")});
      }
    } else if (pseudoReturn) {
      Search.go(repeats);
    }
    Command.hide();
  } else if (!Command.enterHit) {
    Search.searchHistory = [];
    var search;
    if (/^(t(ab)?)?o(pen)?(\s+)/.test(this.input.value)) {
      Search.index = null;
      search = this.input.value.replace(/^(t(ab)?)?o(pen)?(\s+)/, "");
      if (!search) return Command.hideData();
      if (!/^(\s+)?$/.test(search)) {
        Search.appendFromHistory(search);
      } else {
        return Command.hideData();
      }
      Search.fetchQuery(search, function(response) {
        if (Command.bar.style.display === "block") {
          Command.typed = Command.input.value;
          Command.actionType = "query";
          Command.appendResults(response);
        } else {
          Command.hideData();
        }
      });
    } else if (/^hist(ory)?(\s+)/.test(this.input.value)) {
      search = this.input.value.replace(/^hist(ory)?(\s+)/, "");
      Search.index = null;
      Command.actionType = "history";
      if (!/^(\s+)?$/.test(search)) {
        return Search.appendFromHistory(search, settings.searchLimit);
      }
      Command.hideData();
    } else if (/^b(ook)?marks(\s+)/.test(this.input.value)) {
      search = this.input.value.replace(/^b(ook)?marks(\s+)/, "");
      Search.index = null;
      Command.actionType = "bookmarks";
      Command.appendResults(null, true, search);
    } else {
      Command.actionType = "";
      Command.complete(this.input.value, false, false);
    }
  }
};

Command.show = function(search, value) {
  Command.type = "";
  if (search) {
    Command.type = "search";
    this.modeIdentifier.innerHTML = search;
  } else {
    Command.type = "action";
    this.modeIdentifier.innerHTML = ":";
  }
  if (value) {
    this.input.value = value;
    Command.typed = value;
  }
  this.bar.style.display = "block";
  setTimeout(function() {
    document.activeElement.blur();
    window.blur();
    window.focus();
    document.body.focus();
    document.body.blur();
    this.input.focus();
    this.input.click();
  }.bind(this), 0);
};

Command.hide = function() {
  document.activeElement.blur();
  Command.hideData();
  this.bar.style.display = "none";
  this.input.value = "";
  this.findMatches.innerText = "";
  Search.index = null;
  Search.searchHistory = [];
  Command.enterHit = false;
  Command.actionType = "";
  Command.history.index = {};
  Command.typed = "";
  this.dataElements = [];
  if (this.data) this.data.style.display = "none";
};

Command.init = function(enabled) {
  if (enabled) {
    Mappings.parseCustom(settings.mappings);
    Command.css = document.createElement("style");
    Command.css.innerText = settings.commandBarCSS;
    document.getElementsByTagName("head")[0].appendChild(Command.css);
    Command.onBottom = (settings.commandBarOnBottom === "true") ? true : false;
    Scroll.smooth = (settings.smoothScroll === "true") ? true : false;
    if (settings.linkHintCharacters.split("").unique().length > 1) {
      Hints.hintCharacters = settings.linkHintCharacters.split("").unique().join("");
    }
    Search.getBookmarks();
    Command.setup();
    addListeners();
  } else {
    Command.css.parentNode.removeChild(Command.css);
    var links = document.getElementById("link_hints");
    Command.bar.parentNode.removeChild(Command.bar);
    if (links) {
      links.parentNode.removeChild(links);
    }
    removeListeners();
  }
}

chrome.runtime.sendMessage({getSettings: true}, function (s) {
  settings = s;
  settings.searchLimit = parseInt(settings.searchLimit);
  function checkBlacklist(callback) {
    var blacklists = settings.blacklists.split("\n");
    for (var i = 0, l = blacklists.length; i < l; i++) {
      if (blacklists[i].trim() === "") continue;
      if (document.URL.substring(0, blacklists[i].length) === blacklists[i] || blacklists[i].substring(0, document.URL.length) === document.URL) {
        Command.blacklisted = true;
        return callback(true);
      }
    }
    Command.blacklisted = false;
    return callback(false);
  }
  function loadMain() {
    chrome.runtime.sendMessage({action: "setIconEnabled"});
    Command.init(true);
  }
  checkBlacklist(function(isBlacklisted) {
    if (isBlacklisted) return false;
    chrome.runtime.sendMessage({action: "getEnabledCallback"}, function(response) {
      if (!response) return false;
      if (document.readyState === "complete" || document.readyState === "interactive") {
        return loadMain();
      }
      document.addEventListener("DOMContentLoaded", loadMain, false);
    });
  });
});
