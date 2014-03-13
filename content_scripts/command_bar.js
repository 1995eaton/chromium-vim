var Command = {};
var bar, barInput, barMode, barData, dataNode, dataNodeContainer;
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
var lastElement;
var lastMatch;

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
  Command.actionType = "";
  if (barData) {
    barData.firstChild.innerHTML = "";
    Search.index = null;
  }
};


Command.descriptions = [
  ["tabopen", "t(ab)o(pen)\tOpen a link in a new tab"]
];

Command.match = function(input) {
  completionMatches = [];
  input = new RegExp(input);
  for (var i = 0; i < Command.descriptions.length; i++) {
    if (input.test(Command.descriptions[i][0])) {
      completionMatches.push(Command.descriptions[i]);
    }
  }
};

Command.complete = function(input, reverse, doSearch) {
  input = input.replace(/ \+$/, "");
  Command.match(input);
  if (doSearch && dataElements.length && completionMatches.length) {
    Search.nextResult(reverse);
  } else {
    Command.actionType = "complete";
    Command.typed = input;
    var descriptions = [];
    if (completionMatches.length) {
      for (var i = 0; i < completionMatches.length; i++) {
        descriptions.push(completionMatches[i][1]);
      }
      Command.appendResults(descriptions);
    } else {
      Command.hideData();
    }
  }
};

Command.parse = function() {
  if (/^(t(ab)?)?o(pen)?(\s+)/.test(barInput.value)) {
    var search = barInput.value.replace(/^(t(ab)?)?o(pen)?(\s+)/, "");
    if (!search) return Command.hideData();
    Search.fetchQuery(search, function(response) {
      Command.typed = barInput.value;
      Command.actionType = "query";
      Command.appendResults(response);
    });
  } else {
    Command.complete(barInput.value, false, false);
  }
}

Command.show = function(search) {
  Command.lastElement = document.activeElement;
  if (search) {
    Command.type = "search";
    barMode.innerHTML = "/";
  } else {
    Command.type = "action";
    barMode.innerHTML = ":";
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
  Command.actionType = "";
  Command.type = "";
  dataElements = [];
  if (barData) barData.style.display = "none";
  Command.lastElement.focus();
};
