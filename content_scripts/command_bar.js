var Command = {};
var bar, barInput, barMode, barData;

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
    if (/command/.test(document.getSelection().baseNode.id)) {
      document.getElementById("command_bar").focus();
    }
  }
};

Command.appendResults = function(data) {
  console.log(data);
  if (!barData) {
    barData = document.createElement("div");
    barData.id = "search_results";
    document.lastChild.appendChild(barData);
  }
  log(data.join("<br>"));
  barData.innerHTML = data.join("<br>");
  barData.style.display = "block";
};

Command.parse = function() {
  if (/^s |search /.test(barInput.value)) {
    var search = barInput.value.replace(/^s(earch)?(\s+)/, "");
    if (!search) return;
    Search.fetchQuery(search, function(response) {
      Command.appendResults(response);
    });
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
  if (barData) barData.style.display = "none";
  Command.lastElement.focus();
};
