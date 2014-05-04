var Command = {};
var settings, sessions;

Command.dataElements = [];
Command.matches = [];

var historyStates = ["action", "url", "search"];
for (var i = 0; i < historyStates.length; i++) {
  chrome.runtime.sendMessage({action: "retrieveHistory", type: historyStates[i]}, function(result) {
    Command.history[result[0]] = result[1];
  });
}

Command.setup = function() {
  this.bar = document.createElement("div");
  this.bar.id = "cVim-command-bar";
  this.bar.cVim = true;
  this.bar.style[(this.onBottom) ? "bottom" : "top"] = "0";
  this.input = document.createElement("input");
  this.input.type = "text";
  this.input.id = "cVim-command-bar-input";
  this.input.cVim = true;
  this.statusBar = document.createElement("div");
  this.statusBar.id = "cVim-status-bar";
  this.statusBar.style[(this.onBottom) ? "bottom" : "top"] = "0";
  this.modeIdentifier = document.createElement("span");
  this.modeIdentifier.id = "cVim-command-bar-mode";
  this.modeIdentifier.cVim = true;
  this.bar.appendChild(this.modeIdentifier);
  this.bar.appendChild(this.input);
  this.bar.spellcheck = false;
  try {
    document.lastChild.appendChild(this.bar);
    document.lastChild.appendChild(this.statusBar);
  } catch(e) {
    document.body.appendChild(this.bar);
    document.body.appendChild(this.statusBar);
  }
  if (!this.data) {
    this.data = document.createElement("div");
    this.data.id = "cVim-command-bar-search-results";
    this.data.cVim = true;
    this.data.style[(this.onBottom) ? "bottom" : "top"] = "20px";
    try {
      document.lastChild.appendChild(this.data);
    } catch(e) {
      document.body.appendChild(this.data);
    }
  }
};

Command.history = {
  index: {},
  search: [],
  url: [],
  action: [],
  cycle: function(type, reverse) {
    if (this[type].length === 0) return false;
    if (this.index[type] === this[type].length - 1 && !reverse) {
      return Command.input.value = Command.typed || "";
    } else if (reverse && this.index[type] === this[type].length - 1 && Command.input.value === "") {
      this.index[type] = this[type].length;
    }
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

Command.appendResults = function(data, extend, identifier, color) {
  if (!data.length) return false;
  if (!extend || !Array.isArray(this.completionResults)) {
    this.dataElements = [];
    this.completionResults = data;
    this.data.innerHTML = "";
  } else this.completionResults = this.completionResults.concat(data);
  var arrCount = data[0].length;
  for (var i = 0, l = data.length; i < l; ++i) {
    var temp = document.createElement("div");
    temp.cVim = true;
    temp.className = "completion-item";
    if (arrCount >= 3) {
      temp.innerHTML = ((identifier ? identifier.span({"color": color}) + ":&nbsp;" : "") + data[i][1]).span({}, "left") + data[i][2].span({}, "right");
    } else {
      temp.innerHTML = (identifier ? identifier.span({"color": color}) + "&nbsp;" : "") + data[i][1].span({}, "full");
    }
    this.dataElements.push(temp);
    this.data.appendChild(temp);
  }
  this.data.style.display = "block";
};

Command.hideData = function() {
  this.dataElements.length = 0;
  if (this.data) {
    this.data.innerHTML = "";
    Search.index = null;
  }
};

Command.descriptions = [
  ["tabopen",   "Open a link in a new tab"],
  ["winopen",   "Open a link in a new window"],
  ["buffers",   "Select from a list of current tabs"],
  ["closetab",   "Close the current tab"],
  ["open",      "Open a link in the current tab"],
  ["nohl",       "Clears the search highlight"],
  ["set",       "Configure Settings"],
  ["mksession", "Create a saved session of current tabs"],
  ["delsession", "Delete sessions"],
  ["session",    "Open a saved session in a new window"],
  ["bookmarks", "Search through your bookmarks"],
  ["history",   "Search through your browser history"],
  ["duplicate",  "Clone the current tab"],
  ["chrome://",  "Opens Chrome urls"],
  ["settings",   "Open the options page for this extension"]
];

Command.complete = function(string, callback) {
  if (string === "")
    return Command.appendResults(this.descriptions.slice(0, settings.searchLimit).map(function(e){return["complete"].concat(e);}));
  callback(this.descriptions.filter(function(element) {
    return string === element[0].slice(0, string.length);
  }).map(function(e){return["complete"].concat(e);}));
};

Command.parse = function(value, pseudoReturn, repeats) {

  var activeTab = true;
  if (value) {
    value = value.replace(/&$/, function() {
      activeTab = false;
      return "";
    });
  }

  this.typed = this.input.value;
  this.history.index = {};

  if (pseudoReturn || this.enterHit) {
    value = value.trimAround();
    switch (value) {
      case "nohl":
        Find.clear();
        HUD.hide();
        break;
      case "duplicate":
        chrome.runtime.sendMessage({action: "openLinkTab", active: activeTab, url: document.URL, repeats: repeats});
        break;
      case "settings":
        chrome.runtime.sendMessage({action: "openLinkTab", active: activeTab, url: chrome.extension.getURL("/pages/options.html"), repeats: repeats});
        break;
      case "cl": case "closetab":
        chrome.runtime.sendMessage({action: "closeTab", repeats: repeats});
        break;
      default:
        if (/^chrome:\/\/\S+$/.test(value))
          chrome.runtime.sendMessage({action: "openLinkTab", active: activeTab, url: value, noconvert: true});
        else if (/^bookmarks +/.test(value) && value !== "bookmarks") {
          if (/^\S+\s+\//.test(value)) {
            chrome.runtime.sendMessage({action: "openBookmarkFolder", active: activeTab, path: value.replace(/\S+\s+/, ""), noconvert: true});
          } else {
            chrome.runtime.sendMessage({action: "openLinkTab", active: activeTab, url: value.replace(/^b(ook)?marks(\s+)?/, ""), noconvert: true});
          }
        } else if (/^history +/.test(value))
          chrome.runtime.sendMessage({action: "openLinkTab", active: activeTab, url: value.replace(/^history +?/, ""), noconvert: true});
        else if (/^(winopen|wo)$/.test(value.replace(/ .*/, "")))
          chrome.runtime.sendMessage({action: "openLinkWindow", focused: activeTab, url: value.replace(/^\S+( +)?/, "")});
        else if (/^(to|tabopen)$/.test(value.replace(/ .*/, "")))
          chrome.runtime.sendMessage({action: "openLinkTab", active: activeTab, url: value.replace(/^\S+( +)?/, "")});
        else if (/^(o|open)$/.test(value.replace(/ .*/, "")))
          chrome.runtime.sendMessage({action: "openLink", active: activeTab, url: value.replace(/^\S+( +)?/, "")});
        else if (/^buffers +[0-9]+(\s+)?$/.test(value))
          chrome.runtime.sendMessage({action: "selectTab", tabIndex: value.replace(/^.*([0-9]+).*$/, "$1")});
        else if (/^delsession/.test(value)) {
          value = value.replace(/^\S+(\s+)?/, "").trimAround();
          if (value === "") {
            Status.setMessage("Error: argument required", 1);
            break;
          }
          if (sessions.indexOf(value) !== -1) sessions.splice(sessions.indexOf(value), 1);
          value.split(" ").forEach(function(v) {
            chrome.runtime.sendMessage({action: "deleteSession", name: v});
          });
          port.postMessage({action: "getSessionNames"});
        } else if (/^mksession/.test(value)) {
          value = value.replace(/^\S+(\s+)?/, "").trimAround();
          if (value === "") {
            Status.setMessage("Error: session name required", 1);
            break;
          } else if (/[^a-zA-Z0-9_-]/.test(value)) {
            Status.setMessage("Error: only alphanumeric characters, dashes, and underscores are allowed", 1);
            break;
          }
          if (sessions.indexOf(value) === -1) sessions.push(value);
          chrome.runtime.sendMessage({action: "createSession", name: value});
          port.postMessage({action: "getSessionNames"});
        } else if (/^session/.test(value)) {
          value = value.replace(/^\S+(\s+)?/, "").trimAround();
          if (value === "") {
            Status.setMessage("Error: session name required", 1);
            break;
          }
          chrome.runtime.sendMessage({action: "openSession", name: value}, function() {
            Status.setMessage("Error: session does not exist", 1);
          });
        } else if (/^set +/.test(value) && value !== "set") {
          var matchFound = false;
          value = value.replace(/^set +/, "").split(" ");
          if (value.length !== 2) Status.setMessage("Two arguments required", 1);
          for (var i = 0, l = Search.settings.length; i < l; ++i) {
            if (Search.settings[i] === value[0].trim()) {
              matchFound = true;
              break;
            }
          }
          if (!matchFound) { Status.setMessage("Invalid option: " + value[0], 1); break; }
          var isSet = /[Tt]rue|1/.test(value[1]);
          switch (value[0]) {
            case "regexsearch":
              if (value[1] === undefined) { Status.setMessage("regexsearch: " + settings.useRegex, 1); break; }
              if (value[1].isBoolean()) Status.setMessage("Invalid value: " + value[1], 1);
              else settings.useRegex = isSet;
              break;
            case "ignorecase":
              if (value[1] === undefined) { Status.setMessage("ignorecase: " + settings.ignoreSearchCase, 1); break; }
              if (value[1].isBoolean()) Status.setMessage("Invalid value: " + value[1], 1);
              else settings.ignoreSearchCase = isSet;
              break;
            case "smoothscroll":
              if (value[1] === undefined) { Status.setMessage("smoothscroll: " + Scroll.smoothScroll, 1); break; }
              if (value[1].isBoolean()) Status.setMessage("Invalid value: " + value[1], 1);
              else Scroll.smoothScroll = isSet;
              break;
            case "scrollstep":
              if (value[1] === undefined) { Status.setMessage("scrollstep: " + Scroll.stepSize, 1); break; }
              if (parseInt(value[1]) != value[1]) Status.setMessage("Invalid integer: " + value[1], 1);
              else Scroll.stepSize = parseInt(value[1]);
              break;
            case "searchlimit":
              if (value[1] === undefined) { Status.setMessage("searchlimit: " + settings.searchLimit, 1); break; }
              if (parseInt(value[1]) != value[1]) Status.setMessage("Invalid integer: " + value[1], 1);
              else settings.searchLimit = parseInt(value[1]);
              break;
            case "showhud":
              if (value[1] === undefined) { Status.setMessage("showhud: " + !settings.disableHUD, 1); break; }
              if (value[1].isBoolean()) Status.setMessage("Invalid value: " + value[1], 1);
              else settings.disableHUD = !isSet;
              break;
            case "hintcharacters":
              if (value[1] === undefined) { Status.setMessage("hintcharacters: " + Hints.hintCharacters, 1); break; }
              value = value[1].split("").unique().join("");
              if (value.length <= 1) Status.setMessage("Two unique hint characters are required", 1);
              else Hints.hintCharacters = value;
              break;
          }
        }
        break;
    }
    this.hideData();
    this.hide();
  } else if (!this.enterHit) {

    Search.searchHistory = [];
    Search.index = null;
    var search = this.input.value.replace(/^\S+ +/, "");

    if (/^(tabopen|to|open|o|wo|winopen)(\s+)/.test(this.input.value)) {
      if (search.trim() === "") return this.hideData();
      port.postMessage({action: "searchHistory", search: search, limit: 4});
      Search.fetchQuery(search, function(response) {
        if (this.bar.style.display === "inline-block") {
          this.typed = this.input.value;
          this.hideData();
          this.appendResults(response, false);
          if (Marks.history) this.appendResults(Marks.history, true, "History", "#0080d6");
        }
      }.bind(this));
      return;
    }

    if (/^chrome:\/\//.test(this.input.value)) {
      search = this.input.value.slice(9);
      Search.chromeMatch(search, function(matches) {
        if (matches.length) {
          this.appendResults(matches);
        } else this.hideData();
      }.bind(this));
      return;
    }

    if (/^buffers(\s+)/.test(this.input.value)) {
      search = this.input.value.replace(/^\S+\s+/, "");
      port.postMessage({action: "getBuffers"});
      return;
    }

    if (/^(del)?session(\s+)/.test(this.input.value)) {
      search = this.input.value.replace(/^\S+\s+/, "");
      var _res = sessions.filter(function(e) {
        var regexp;
        var isValidRegex = true;
        try {
          regexp = new RegExp(search, "i");
        } catch (ex) {
          isValidRegex = false;
        }
        if (isValidRegex) {
          return regexp.test(e[0]);
        }
        return e[0].substring(0, search.length) === search;
      }).map(function(e) { return ["session"].concat(e); });
      this.hideData();
      if (_res.length > 0) {
        this.appendResults(_res);
      }
      return;
    }

    if (/^set(\s+)/.test(this.input.value)) {
      search = this.input.value.slice(9);
      var input = this.input.value.split(" ")[1];
      Search.settingsMatch(input, function(matches) {
        if (matches.length) {
          this.appendResults(matches);
        } else this.hideData();
      }.bind(this));
      return;
    }

    if (/^hist(ory)?(\s+)/.test(this.input.value)) {
      if (search.trim() === "") return this.hideData();
      this.historyMode = true;
      port.postMessage({action: "searchHistory", search: search, limit: settings.searchLimit});
      return;
    }

    if (/^b(ook)?marks(\s+)/.test(this.input.value)) {
      search = this.input.value.replace(/\S+(\s+)?/, "");
      if (search[0] === "/") {
        return Marks.matchPath(search);
      }
      Marks.match(search, function(response) {
        if (response.length > 0) {
          this.appendResults(response);
        } else {
          this.hideData();
        }
      }.bind(this));
      return;
    }

    this.complete(this.input.value, function(data) {
      if (data.length) {
        this.appendResults(data);
      } else this.hideData();
    }.bind(this));

  }
};

Command.show = function(search, value) {
  this.type = "";
  if (search) {
    this.type = "search";
    this.modeIdentifier.innerHTML = search;
  } else {
    this.type = "action";
    this.modeIdentifier.innerHTML = ":";
  }
  if (value) {
    this.input.value = value;
    this.typed = value;
  }
  if (Status.active) Status.hide();
  this.bar.style.display = "inline-block";
  setTimeout(function() {
    this.input.focus();
  }.bind(this), 0);
};

Command.hide = function() {
  if (!commandMode) return false;
  document.activeElement.blur();
  this.hideData();
  this.bar.style.display = "none";
  this.input.value = "";
  this.historyMode = false;
  commandMode = false;
  Search.index = null;
  Search.searchHistory = [];
  this.enterHit = false;
  this.history.index = {};
  this.typed = "";
  this.dataElements = [];
  if (this.data) this.data.style.display = "none";
};

Command.init = function(enabled) {
  if (enabled) {
    Mappings.parseCustom(settings.mappings);
    this.css = document.createElement("style");
    this.css.innerText = settings.commandBarCSS;
    document.getElementsByTagName("head")[0].appendChild(this.css);
    this.onBottom = settings.commandBarOnBottom;
    if (this.data !== undefined) {
      this.data.style[(!this.onBottom) ? "bottom" : "top"] = "";
      this.data.style[(this.onBottom) ? "bottom" : "top"] = "20px";
    }
    if (settings.disableAutofocus) {
      if (!commandMode) document.activeElement.blur();
      var wait = window.setInterval(function() {
        if (!commandMode) document.activeElement.blur();
        if (document.readyState === "complete") { // Kind of hackish, but seems necessary in some cases
          window.setTimeout(function() {
            if (!commandMode) document.activeElement.blur();
          }, 25);
          window.clearInterval(wait);
        }
      }, 5);
    }
    Scroll.smoothScroll = settings.smoothScroll;
    Scroll.stepSize = parseInt(settings.scrollStepSize);
    if (settings.linkHintCharacters.split("").unique().length > 1) {
      Hints.hintCharacters = settings.linkHintCharacters.split("").unique().join("");
    }
    this.setup();
    addListeners();
  } else {
    this.loaded = false;
    this.css.parentNode.removeChild(this.css);
    var links = document.getElementById("cVim-link-container");
    this.bar.parentNode.removeChild(this.bar);
    if (links) {
      links.parentNode.removeChild(links);
    }
    removeListeners();
  }
};

Command.configureSettings = function(fetchOnly, s) {
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
    Command.loaded = true;
    chrome.runtime.sendMessage({action: "setIconEnabled"});
    Command.init(true);
  }
  if (this.loaded) this.init(false);
  if (fetchOnly) {
    chrome.runtime.sendMessage({getSettings: true});
  } else {
    settings = s;
    settings.searchLimit = parseInt(settings.searchLimit);
    checkBlacklist(function(isBlacklisted) {
      if (isBlacklisted) return false;
      chrome.runtime.sendMessage({action: "getActiveState"}, function(response) {
        if (!response) return false;
        return loadMain();
      });
    });
  }
};

document.addEventListener("DOMContentLoaded", function() {
  port.postMessage({action: "getBookmarks"});
  port.postMessage({action: "getSessionNames"});
  chrome.extension.onMessage.addListener(function(request, sender, callback) {
    if (request.action === "refreshSettings") {
      Command.configureSettings(true);
    } else if (request.action === "sendSettings") {
      Command.configureSettings(false, request.settings);
    } else if (request.action === "confirm") {
      var c = confirm(request.message);
      callback(c);
    }
  });
  return Command.configureSettings(true);
}, false);
