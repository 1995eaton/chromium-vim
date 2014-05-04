var Status = {};
Status.defaultTimeout = 3;

Status.setMessage = function(message, timeout) {
  window.clearTimeout(this.delay);
  this.hide();
  if (timeout === undefined) {
    timeout = this.defaultTimeout;
  }
  this.active = true;
  Command.statusBar.innerText = message;
  Command.statusBar.style.display = "inline-block";
  this.delay = window.setTimeout(function() {
    if (Status.active === true) {
      Command.statusBar.style.display = "none";
      Status.active = false;
    }
  }, timeout * 1000);
};

Status.hide = function() {
  Command.statusBar.style.display = "none";
  this.active = false;
};
