var Command = {};
var bar, barInput, barMode, barData, barHistory, dataNode, dataNodeContainer;
var dataElements = [];
var completionMatches = [];

Command.setup = function() {
  bar = document.createElement("div");
  bar.id = "command_bar";
  barInput = document.createElement("input");
  barInput.type = "text";
  barInput.id = "command_input";
  barMode = document.createElement("div");
  barMode.id = "command_bar_mode";
  bar.appendChild(barMode);
  bar.appendChild(barInput);
  bar.spellcheck = false;
  document.lastChild.appendChild(bar);
};
var lastMatch;
var historyStates = ["action", "url", "search"];

Command.history = {
  index: {},
  cycle: function(type, reverse, search) {
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
    if (!reverse && !this[type][this.index[type]]) return;
    if (!search && Command.typed !== "") {
      return this.cycle(type, reverse, true);
    }
    this.index[type] += (reverse) ? -1 : 1;
    if (search && !new RegExp("^" + Command.typed).test(this[type][this.index[type]])) {
      return this.cycle(type, reverse, true);
    }
    if (/^(tabopen|open) /.test(this[type][this.index[type]])) {
      Command.actionType = "query";
    }
    barInput.value = this[type][this.index[type]];
  }
};

for (var i = 0; i < historyStates.length; i++) {
    chrome.runtime.sendMessage({action: "retrieveHistory", type: historyStates[i]}, function(result) {
    Command.history[result[0]] = result[1];
  });
}

Command.search = function(reverse, looseFocus) {
  var selection;
  if (Command.enterHit) {
    var i = barInput.value;
    barInput.value = "";
    window.find(i, false, reverse, true, false, true, false);
    barInput.value = i;
  } else {
    window.find(barInput.value, false, reverse, true, false, true, false);
  }
  if (/command/.test(document.getSelection().baseNode.id)) {
    document.getElementById("command_bar").focus();
  }
};

Command.appendResults = function(data) {
  dataElements = [];
  if (!barData) {
    barData = document.createElement("div");
    barData.id = "command_search_results";
    dataNodeContainer = document.createElement("ul");
    barData.appendChild(dataNodeContainer);
    document.lastChild.appendChild(barData);
  }
  dataNodeContainer.innerHTML = "";
  for (var i = 0; i < Search.searchHistory.length; i++) {
    var temp = document.createElement("li");
    temp.className = "command-history-data-node";
    temp.tabIndex = "1";
    var tempText = document.createElement("div");
    tempText.innerHTML = "History: " + Search.searchHistory[i][0] + '<span class="completion-descriptions">' + Search.searchHistory[i][1] + '</span>';
    temp.appendChild(tempText);
    dataElements.push(tempText);
    dataNodeContainer.appendChild(temp);
  }
  for (var i = 0; i < data.length; i++) {
    var temp = document.createElement("li");
    temp.className = "command-data-node";
    temp.tabIndex = "1";
    var tempText = document.createElement("div");
    tempText.innerHTML = data[i];
    temp.appendChild(tempText);
    dataElements.push(tempText);
    dataNodeContainer.appendChild(temp);
  }
  barData.style.display = "block";
};

Command.hideData = function() {
  if (barData) {
    barData.firstChild.innerHTML = "";
    Search.index = null;
  }
};


Command.descriptions = [
  ["tabopen", "t(ab)o(pen)", "Open a link in a new tab"],
  ["open", "o(pen)", "Open a link in the current tab"],
  ["help", "help", "displays the help page in a new tab"]
];

Command.match = function(input) {
  completionMatches = [];
  input = new RegExp("^" + input);
  for (var i = 0; i < Command.descriptions.length; i++) {
    if (!input || input.test(Command.descriptions[i][0])) {
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
        descriptions.push(completionMatches[i][1] + '<span class="completion-descriptions">' + completionMatches[i][2] + '</span>');
      }
      Command.appendResults(descriptions);
    } else {
      Command.hideData();
    }
  }
};

Command.historyCompletion = function(search) {
  Search.searchHistory = [];
  var descriptions = [];
  Search.appendFromHistory(search, function() {
    for (var i = 0, length = Search.searchHistory.length; i < length; i++) {
      log(Search.searchHistory[i]);
    }
  });
}

Command.parse = function() {
  if (/^(t(ab)?)?o(pen)?(\s+)/.test(barInput.value)) {
    Search.index = null;
    var search = barInput.value.replace(/^(t(ab)?)?o(pen)?(\s+)/, "");
    if (!search) return Command.hideData();
    if (!/^(\s+)?$/.test(search)) {
      Command.historyCompletion(search);
    }
    Search.fetchQuery(search, function(response) {
      Command.typed = barInput.value;
      Command.actionType = "query";
      Command.appendResults(response);
    });
  } else {
    Command.complete(barInput.value, false, false);
  }
}

Command.show = function(search, value) {
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
  bar.style.display = "none";
  barInput.value = "";
  Search.index = null;
  Search.searchHistory = [];
  Command.actionType = "";
  Command.type = "";
  Command.history.index = {};
  Command.typed = "";
  dataElements = [];
  if (barData) barData.style.display = "none";
};
