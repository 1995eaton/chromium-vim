var Status = {};
Status.defaultTimeout = 3;

Status.setMessage = function(message, timeout, type) {
  window.clearTimeout(this.delay);
  this.hide();
  if (timeout === void 0) {
    timeout = this.defaultTimeout;
  }
  this.active = true;
  Command.statusBar.textContent = '';
  if (type === 'error') {
    var error = document.createElement('span');
    error.style.color = 'red';
    error.textContent = 'Error';
    error.className = 'cVim-error';
    Command.statusBar.appendChild(error);
    Command.statusBar.appendChild(document.createTextNode(': '));
  }
  Command.statusBar.appendChild(document.createTextNode(message));
  Command.statusBar.normalize();
  Command.statusBar.style.display = 'inline-block';
  this.delay = window.setTimeout(function() {
    if (Status.active === true) {
      Command.statusBar.style.display = 'none';
      Status.active = false;
    }
  }, timeout * 1000);
};

Status.hide = function() {
  Command.statusBar.style.display = 'none';
  this.active = false;
};
