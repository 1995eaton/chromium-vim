var Command = {};
var bar, barInput;
Command.show = function(search) {
  Command.lastElement = document.activeElement;
  if (search) {
    bar.innerText = "/";
  } else {
    bar.innerText = ":";
  }
  bar.style.display = "block";
  bar.focus();
};

Command.hide = function() {
  bar.style.display = "none";
  Command.lastElement.focus();
};
document.addEventListener("DOMContentLoaded", function() {
  bar = document.createElement("div");
  bar.id = "command_bar";
  barInput = document.createElement("input");
  barInput.type = "text";
  barInput.id = "command_input";
  bar.appendChild(barInput);
  document.body.appendChild(bar);
});
