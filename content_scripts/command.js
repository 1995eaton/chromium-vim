var Command = {};
var settings;

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
  this.bar.id = "command_bar";
  this.bar.cVim = true;
  this.bar.style[(this.onBottom) ? 'bottom' : 'top'] = "0";
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
  try {
    document.lastChild.appendChild(this.bar);
  } catch(e) {
    document.body.appendChild(this.bar);
  }
  if (!this.data) {
    this.data = document.createElement("div");
    this.data.id = "command_search_results";
    this.data.cVim = true;
    this.data.style[(this.onBottom) ? 'bottom' : 'top'] = "20px";
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
  cycle: function(type, reverse, search) {
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
    if (arrCount === 3) {
      temp.innerHTML = '<span class="left">' + (identifier ? '<span style="color:' + color + '">' + identifier + '</span>:&nbsp;' : "") + data[i][1] + '</span>' + '<span class="right">' + data[i][2] + '</span>';
    } else {
      temp.innerHTML = (identifier ? '<span style="color:' + color + '">' + identifier + '</span>:&nbsp;' : "") +'<span class="full">' + data[i][1] + '</span>';
    }
    this.dataElements.push(temp);
    this.data.appendChild(temp);
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
  ["tabopen ", "Open a link in a new tab"],
  ["closetab", "Close the current tab"],
  ["open ", "Open a link in the current tab"],
  ["nohl", "Clears the search highlight"],
  ["set ", "Configure Settings"],
  ["bookmarks ", "Search through your bookmarks"],
  ["history ", "Search through your browser history"],
  ["duplicate", "Clone the current tab"],
  ["chrome://", "Opens Chrome urls"],
  ["settings", "Open the options page for this extension"]
];

Command.complete = function(string, callback) {
  var matches = [];
  if (string === "")
    return Command.appendResults(this.descriptions.slice(0, settings.searchLimit).map(function(e){return["complete"].concat(e)}));
  callback(this.descriptions.filter(function(element) {
    return string === element[0].slice(0, string.length);
  }).map(function(e){return["complete"].concat(e)}));
};

Command.parse = function(value, pseudoReturn, repeats) {

  var activeTab = true;
  if (value) value = value.replace(/&$/, function(e) { activeTab = false; return ""; });
  this.typed = this.input.value;
  this.history.index = {};

  if (pseudoReturn || this.enterHit) {
    value = value.trimLeft().trimRight();
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
          chrome.runtime.sendMessage({action: "openLinkTab", active: activeTab, url: value});
        else if (/^bookmarks/.test(value) && value !== "bookmarks")
          chrome.runtime.sendMessage({action: "openLinkTab", active: activeTab, url: value.replace(/^b(ook)?marks(\s+)?/, "")});
        else if (/^(to|tabopen|o|open)$/.test(value.replace(/ .*/, "")))
          chrome.runtime.sendMessage({action: ((/^t[oa]/.test(value.substring(0, 2))) ? "openLinkTab" : "openLink"), active: activeTab, url: value.replace(/^\S+( +)?/, "")});
        else if (/^set(\s+)?/.test(value) && value !== "set") {
          var matchFound = false;
          value = value.replace(/^set( +)?/, "").split(" ");
          if (value.length !== 2) HUD.display("Two arguments required", 1);
          for (var i = 0, l = Search.settings.length; i < l; ++i) {
            if (Search.settings[i] === value[0].trim()) {
              matchFound = true;
              break;
            }
          }
          if (!matchFound) { HUD.display("Invalid option: " + value[0], 1); break; }
          function validBoolean(b) { return (/^([Tt]rue|[Ff]alse|0|1)$/.test(b)) }
          var isSet = /[Tt]rue|1/.test(value[1]);
          switch (value[0]) {
            case "regexsearch":
              if (value[1] === undefined) { HUD.display("regexsearch: " + settings.useRegex, 3); break; }
              if (!validBoolean(value[1])) HUD.display("Invalid value: " + value[1], 1);
              else settings.useRegex = isSet;
              break;
            case "ignorecase":
              if (value[1] === undefined) { HUD.display("ignorecase: " + settings.ignoreSearchCase, 3); break; }
              if (!validBoolean(value[1])) HUD.display("Invalid value: " + value[1], 1);
              else settings.ignoreSearchCase = isSet;
              break;
            case "smoothscroll":
              if (value[1] === undefined) { HUD.display("smoothscroll: " + Scroll.smoothScroll, 3); break; }
              if (!validBoolean(value[1])) HUD.display("Invalid value: " + value[1], 1);
              else Scroll.smoothScroll = isSet;
              break;
            case "scrollstep":
              if (value[1] === undefined) { HUD.display("scrollstep: " + Scroll.stepSize, 3); break; }
              if (parseInt(value[1]) != value[1]) HUD.display("Invalid integer: " + value[1], 1);
              else Scroll.stepSize = parseInt(value[1]);
              break;
            case "searchlimit":
              if (value[1] === undefined) { HUD.display("searchlimit: " + settings.searchLimit, 3); break; }
              if (parseInt(value[1]) != value[1]) HUD.display("Invalid integer: " + value[1], 1);
              else settings.searchLimit = parseInt(value[1]);
              break;
            case "hintcharacters":
              if (value[1] === undefined) { HUD.display("hintcharacters: " + Hints.hintCharacters, 3); break; }
              value = value[1].split("").unique().join("");
              if (value.length <= 1) HUD.display("Two unique hint characters are required", 1);
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

    if (/^(t(ab)?)?o(pen)?(\s+)/.test(this.input.value)) {
      if (search.trim() === "") return this.hideData();
      port.postMessage({action: "searchHistory", search: search, limit: 4});
      Search.fetchQuery(search, function(response) {
        if (this.bar.style.display === "block") {
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
      Marks.match(this.input.value.replace(/^\w+(\s+)?/, ""), function(response) {
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
  this.bar.style.display = "block";
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
      this.data.style[(!this.onBottom) ? 'bottom' : 'top'] = "";
      this.data.style[(this.onBottom) ? 'bottom' : 'top'] = "20px";
    }
    Scroll.smoothScroll = settings.smoothScroll;
    Scroll.stepSize = parseInt(settings.scrollStepSize);
    if (settings.linkHintCharacters.split("").unique().length > 1) {
      Hints.hintCharacters = settings.linkHintCharacters.split("").unique().join("");
    }
    port.postMessage({action: "getBookmarks"});
    this.setup();
    addListeners();
  } else {
    this.loaded = false;
    this.css.parentNode.removeChild(this.css);
    var links = document.getElementById("link_hints");
    this.bar.parentNode.removeChild(this.bar);
    if (links) {
      links.parentNode.removeChild(links);
    }
    removeListeners();
  }
};

Command.configureSettings = function(fetchOnly, s) {
  if (this.loaded) this.init(false);
  if (fetchOnly) {
    chrome.runtime.sendMessage({getSettings: true});
  } else {
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
      Command.loaded = true;
      chrome.runtime.sendMessage({action: "setIconEnabled"});
      Command.init(true);
    }
    checkBlacklist(function(isBlacklisted) {
      if (isBlacklisted) return false;
      chrome.runtime.sendMessage({action: "getEnabledCallback"}, function(response) {
        if (!response) return false;
        return loadMain();
      });
    });
  }
};

document.addEventListener("DOMContentLoaded", function() {
  chrome.extension.onMessage.addListener(function(request) {
    if (request.action === "refreshSettings") {
      Command.configureSettings(true);
    } else if (request.action === "sendSettings") {
      Command.configureSettings(false, request.settings);
    }
  });
  return Command.configureSettings(true);
}, false);
