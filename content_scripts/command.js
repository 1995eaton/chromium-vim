var Command = {};
var bar, barInput, barMode, barData, barOnBottom, barHistory, dataNode, dataNodeContainer;
var dataElements = [];
var completionMatches = [];

Command.setup = function() {
  bar = document.createElement("div");
  bar.id = "command_bar";
  bar.cVim = true;
  if (barOnBottom) {
    bar.style.bottom = "0";
  } else {
    bar.style.top = "0";
  }
  barInput = document.createElement("input");
  barInput.type = "text";
  barInput.id = "command_input";
  barInput.cVim = true;
  barMode = document.createElement("div");
  barMode.id = "command_bar_mode";
  barMode.cVim = true;
  bar.appendChild(barMode);
  bar.appendChild(barInput);
  bar.spellcheck = false;
  // document.lastChild.appendChild(bar);
  document.body.appendChild(bar);
};
var lastMatch;
var historyStates = ["action", "url", "search"];

Command.history = {
  index: {},
  cycle: function(type, reverse, search) {
    if (Command.history.reset) {
      Command.history.reset = false;
      Command.history.index = {};
    }
    var previousCommand;
    Command.actionType = "";
    if (!this[type]) return;
    if (!this.index[type] && this.index[type] !== 0) {
      Command.typed = barInput.value;
      this.index[type] = this[type].length;
    }
    if (reverse && this.index[type] === 0) return;
    if (!reverse && this.index[type] + 1 === this[type].length) {
      this.index[type] = this[type].length
      barInput.value = Command.typed;
      return;
    }
    previousCommand = this[type][this.index[type]];
    if (!reverse && !previousCommand) return;
    if (!search && Command.typed !== "") {
      return this.cycle(type, reverse, true);
    }
    this.index[type] += (reverse) ? -1 : 1;
    if (!previousCommand || (search && Command.typed !== previousCommand.substring(0, Command.typed.length))) {
      return this.cycle(type, reverse, true);
    }
    if (/^(to|tabopen) /.test(previousCommand)) {
      Command.actionType = "query";
    }
    barInput.value = previousCommand;
  }
};

for (var i = 0; i < historyStates.length; i++) {
    chrome.runtime.sendMessage({action: "retrieveHistory", type: historyStates[i]}, function(result) {
    Command.history[result[0]] = result[1];
  });
}

Command.appendResults = function(data, bookmarks, search, completion) {
  dataElements = [];
  if (!barData) {
    barData = document.createElement("div");
    barData.id = "command_search_results";
    barData.cVim = true;
    if (barOnBottom) {
      barData.style.bottom = "20px";
    } else {
      barData.style.top = "20px";
    }
    // document.lastChild.appendChild(barData);
    document.body.appendChild(barData);
  }
  barData.innerHTML = "";
  if (bookmarks) {
    var c = 0;
    Marks.currentBookmarks = [];
    for (var i = 0, length = Marks.bookmarks.length; i < length; i++) {
      try { var rxp = new RegExp(search, "i"); }
      catch(e) { continue; }
      if (!rxp.test(Marks.bookmarks[i][0] + Marks.bookmarks[i][1])) continue;
      c++;
      if (c > 20) break;
      Marks.currentBookmarks.push(Marks.bookmarks[i][1]);
      var temp = document.createElement("div");
      temp.cVim = true;
      temp.className = "completion-item";
      temp.innerHTML = '<span class="left">' + Marks.bookmarks[i][0] + '</span>' + '<span class="right">' + Marks.bookmarks[i][1] + '</span>';
      dataElements.push(temp);
      barData.appendChild(temp);
    }
  } else {
    for (var i = 0; i < Search.searchHistory.length; i++) {
      var temp = document.createElement("div");
      temp.cVim = true;
      temp.className = "completion-item";
      temp.innerHTML = '<span class="left">' + '<span style="color:#00BED3">History</span>: ' + Search.searchHistory[i][0] + '</span>' + '<span class="right">' + Search.searchHistory[i][1] + '</span>';
      dataElements.push(temp);
      barData.appendChild(temp);
    }
    if (completion) {
      for (var i = 0; i < data.length; i++) {
        var temp = document.createElement("div");
        temp.cVim = true;
        temp.className = "completion-item";
        temp.innerHTML = data[i];
        dataElements.push(temp);
        barData.appendChild(temp);
      }
    } else {
      for (var i = 0; i < data.length; i++) {
        var temp = document.createElement("div");
        temp.cVim = true;
        temp.className = "completion-item";
        temp.innerHTML = '<span class="full">' + data[i] + '</span>';
        dataElements.push(temp);
        barData.appendChild(temp);
      }
    }
  }
  barData.style.display = "block";
};

Command.hideData = function() {
  if (barData) {
    barData.innerHTML = "";
    Search.index = null;
  }
};


Command.descriptions = [
  ["tabopen ", "t(ab)o(pen)", "Open a link in a new tab"],
  ["closetab", "cl(osetab)", "Close the current tab"],
  ["open ", "o(pen)", "Open a link in the current tab"],
  ["nohl", "nohl", "Clears the search highlight"],
  ["bookmarks ", "b(ook)marks", "Search through your bookmarks"],
  ["help", "help", "Displays the help page in a new tab"], // TODO
  ["extensions", "ex(tensions)", "Opens the chrome://extensions page"],
  ["flags", "fl(ags)", "Opens the chrome://flags page"]
];

Command.match = function(input) {
  completionMatches = [];
  for (var i = 0; i < Command.descriptions.length; i++) {
    if (!input || input === Command.descriptions[i][0].substring(0, input.length)) {
      completionMatches.push(Command.descriptions[i]);
    }
  }
};

Command.complete = function(input, reverse, doSearch) {
  if (doSearch && dataElements.length && completionMatches.length) {
    Search.nextResult(reverse);
  } else {
    Command.match(input);
    Command.actionType = "complete";
    Command.typed = input;
    var descriptions = [];
    if (completionMatches.length) {
      for (var i = 0; i < completionMatches.length; i++) {
        descriptions.push('<span class="left">' + completionMatches[i][1] + '</span>' + '<span class="right">' + completionMatches[i][2] + '</span>');
      }
      Command.appendResults(descriptions, false, false, true);
    } else {
      Command.hideData();
    }
  }
};

Command.parse = function(value, pseudoReturn, repeats) {
  Command.typed = barInput.value;
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
      if (barInput.value.replace(/^b(ook)?marks(\s+)?/, "").length !== 0) {
        chrome.runtime.sendMessage({action: "openLinkTab", url: barInput.value.replace(/^b(ook)?marks(\s+)?/, "")});
      }
    } else if (pseudoReturn) {
      Search.go(repeats);
    }
    Command.hide();
  } else if (!Command.enterHit) {
    Search.searchHistory = [];
    if (/^(t(ab)?)?o(pen)?(\s+)/.test(barInput.value)) {
      Search.index = null;
      var search = barInput.value.replace(/^(t(ab)?)?o(pen)?(\s+)/, "");
      if (!search) return Command.hideData();
      if (!/^(\s+)?$/.test(search)) {
        Search.appendFromHistory(search);
      }
      Search.fetchQuery(search, function(response) {
        Command.typed = barInput.value;
        Command.actionType = "query";
        Command.appendResults(response);
      });
    } else if (/^b(ook)?marks(\s+)/.test(barInput.value)) {
      var search = barInput.value.replace(/^b(ook)?marks(\s+)/, "");
      Search.index = null;
      Command.actionType = "bookmarks";
      Command.appendResults(null, true, search);
    } else {
      Command.actionType = "";
      Command.complete(barInput.value, false, false);
    }
  }
}

Command.show = function(search, value) {
  Command.type = "";
  if (search) {
    Command.type = "search";
    barMode.innerHTML = "/";
  } else {
    Command.type = "action";
    barMode.innerHTML = ":";
  }
  if (value) {
    barInput.value = value;
    Command.typed = value;
  }
  bar.style.display = "block";
  setTimeout(function() {
    barInput.focus();
  }, 0);
};

Command.hide = function() {
  document.activeElement.blur();
  Command.hideData();
  bar.style.display = "none";
  barInput.value = "";
  Search.index = null;
  Search.searchHistory = [];
  Command.enterHit = false;
  Command.actionType = "";
  Command.history.index = {};
  Command.typed = "";
  dataElements = [];
  if (barData) barData.style.display = "none";
};

document.addEventListener("DOMContentLoaded", function() {
  Search.getBookmarks();
  Command.setup();
});

chrome.runtime.sendMessage({getSettings: true}, function (s) {
  settings = s;
  Mappings.parseCustom(settings.mappings);
  var cssStyle = document.createElement("style");
  cssStyle.innerText = settings.commandBarCSS;
  document.getElementsByTagName("head")[0].appendChild(cssStyle);
  barOnBottom = (settings.commandBarOnBottom === "true") ? true : false;
  Scroll.smooth = (settings.smoothScroll === "true") ? true : false;
  if (settings.linkHintCharacters.split("").unique().length > 1) {
    Hints.hintCharacters = settings.linkHintCharacters.split("").unique().join("");
  }
});
