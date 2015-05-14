var Settings = {};

Settings.loadrc = function(config) {
  this.rcEl.value = config.RC;
  this.rcEl.style.height = this.rcEl.scrollHeight + 'px';
  if (this.cssEl) {
    this.cssEl.setValue(config.COMMANDBARCSS);
  }
  this.gistUrl.value = config.GISTURL;
};

Settings.resetSettings = function() {
  this.rcEl.value = this.defaults.RC;
  this.cssEl.setValue(this.defaults.COMMANDBARCSS);
  this.gistUrl.value = this.defaults.GISTURL;
  delete this.settings;
  this.settings = Object.clone(this.defaults);
};

Settings.saveSettings = function() {
  this.settings = Object.clone(this.defaults);
  var res = window.parseConfig(Settings.rcEl.value);
  if (res.error !== null) {
    console.error('Line ' + res.error.lineno + ': ' + res.error.message);
    Status.setMessage('Error in cVimrc (line ' + res.error.lineno + ')', 2, 'error');
  } else {
    Object.merge(this.settings, res.value);
  }
  this.settings.COMMANDBARCSS = this.cssEl.getValue();
  this.settings.GISTURL = this.gistUrl.value;
  this.settings.RC = this.rcEl.value;
  this.settings.mapleader = this.settings.mapleader.replace(/ /g, '<Space>');
  this.saveButton.value = 'Saved';
  chrome.runtime.sendMessage({
    action: 'saveSettings',
    settings: this.settings,
    sendSettings: true
  });
  setTimeout(function() {
    this.saveButton.value = 'Save';
  }.bind(this), 3000);
};

Settings.editMode = function(e) {
  if (this.cssEl) {
    this.cssEl.setOption('keyMap',
        e.target.value === 'Vim' ? 'vim' : 'default');
  }
};

Settings.syncGist = function() {
  var url = new URL(this.gistUrl.value.trimAround());
  if (url.hostname === 'gist.github.com') {
    url.hostname = 'gist.githubusercontent.com';
    url.pathname += '/raw';
  } else if (url.hostname === 'github.com') {
    url.hostname = 'raw.githubusercontent.com';
    var path = url.pathname.split('/').compress();
    if (path[2] === 'blob')
      path.splice(2, 1);
    url.pathname = path.join('/');
  }
  httpRequest({url: url.toString()}, function(res) {
    this.rcEl.value = res;
  }.bind(this));
};

function addVersionInfo() {
  var el = document.getElementById('version-number');
  var version = chrome.runtime.getManifest().version;
  if (version) {
    el.textContent = '(' + version + ')';
  }
}

Settings.init = function() {

  addVersionInfo();
  document.body.spellcheck = false;
  this.initialLoad = true;

  this.saveButton = document.getElementById('save_button');
  this.rcEl = document.getElementById('mappings');
  this.editModeEl = document.getElementById('edit_mode');

  function autoSize() {
    var stop = document.body.scrollTop;
    this.style.height = '';
    this.style.height = this.scrollHeight + 'px';
    document.body.scrollTop = stop;
  }

  this.rcEl.addEventListener('input', autoSize);

  chrome.runtime.sendMessage({
    action: 'getDefaults'
  }, function(e) {
    Settings.settings = e;
    Settings.defaults = Object.clone(e);
    Settings.parseLines(Settings.rcEl.value);
  });

  this.editModeEl.addEventListener('change', this.editMode.bind(this), false);
  this.saveButton.addEventListener('click', this.saveSettings.bind(this), false);
  document.getElementById('reset_button').addEventListener('click', this.resetSettings.bind(this), false);
  document.getElementById('clearHistory').addEventListener('click', function() {
    localStorage.search = '';
    localStorage.url    = '';
    localStorage.action = '';
  });
  this.gistUrl = document.getElementById('gistUrl');
  document.getElementById('gistSync').addEventListener('click', this.syncGist.bind(this));
  this.gistPlaceHolder = 'https://gist.github.com/1995eaton/9e68803bf1f1e7524340';
  this.gistUrl.addEventListener('focus', function() {
    this.setAttribute('placeholder', '');
  });
  this.gistUrl.addEventListener('blur', function() {
    this.setAttribute('placeholder', Settings.gistPlaceHolder);
  });

};

document.addEventListener('DOMContentLoaded', Settings.init.bind(Settings));

port.onMessage.addListener(function(response) {
  if (response.type === 'sendSettings') {
    if (Settings.initialLoad) {
      Settings.cssEl = CodeMirror.fromTextArea(document.getElementById('commandBarCSS'), {lineNumbers: true});
      Settings.initialLoad = false;
      Settings.loadrc(response.settings);
    }
  }
});

chrome.extension.onMessage.addListener(function(request) {
  if (request.action === 'sendDefaultSettings') {
    Settings.settings = request.settings;
    Settings.defaults = Object.clone(request.settings);
    Settings.parseLines(Settings.rcEl.value);
  }
});
