var Settings = {
  initialLoad: true
};

Settings.loadrc = function(config) {
  this.rcEl.value = config.RC;
  this.rcEl.style.height = this.rcEl.scrollHeight + 'px';
  if (this.cssEl) {
    this.cssEl.setValue(config.COMMANDBARCSS);
  }
  this.gistUrl.value = config.GISTURL;
};

Settings.resetSettings = function() {
  if (confirm('Reset all configuration and CSS settings to their default values?')) {
    RUNTIME('getDefaults', function(defaults) {
      this.rcEl.value = defaults.RC;
      this.cssEl.setValue(defaults.COMMANDBARCSS);
      this.gistUrl.value = defaults.GISTURL;
      delete this.settings;
      this.settings = Object.clone(defaults);
    }.bind(this));
  }
};

Settings.saveSettings = function() {
  RUNTIME('getDefaults', function(defaults) {
    var hadLocalConfigSet = !!this.settings.localconfig;
    var lastConfigPath = this.settings.configpath;
    this.settings = defaults;
    var res = window.parseConfig(Settings.rcEl.value);
    if (res.error !== null) {
      console.error('Line %d: %s', res.error.lineno, res.error.message);
      alert('parse error on line ' + res.error.lineno +
            ' of config (see console for more info)');
      // TODO:
      Status.setMessage('Error in cVimrc (line ' + res.error.lineno + ')', 2, 'error');
    } else {
      Object.merge(this.settings, res.value);
    }
    this.settings.COMMANDBARCSS = this.cssEl.getValue();
    this.settings.GISTURL = this.gistUrl.value;
    this.settings.mapleader = this.settings.mapleader.replace(/ /g, '<Space>');
    if (hadLocalConfigSet && this.settings.localconfig && this.settings.configpath &&
        lastConfigPath === this.settings.configpath) {
      alert('cVim Error: unset the localconfig before saving from here');
    }
    this.saveButton.value = 'Saved';
    chrome.runtime.sendMessage({
      action: 'saveSettings',
      settings: this.settings,
      sendSettings: true
    });
    setTimeout(function() {
      this.saveButton.value = 'Save';
    }.bind(this), 3000);
  }.bind(this));
};

Settings.editMode = function(e) {
  if (this.cssEl) {
    this.cssEl.setOption('keyMap',
        e.target.value === 'Vim' ? 'vim' : 'default');
  }
};

Settings.syncGist = function() {
  var url = new URL(Utils.trim(this.gistUrl.value));
  if (url.hostname === 'gist.github.com') {
    url.hostname = 'gist.githubusercontent.com';
    url.pathname += '/raw';
  } else if (url.hostname === 'github.com') {
    url.hostname = 'raw.githubusercontent.com';
    var path = Utils.split(url.pathname, '/');
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

  this.saveButton = document.getElementById('save_button');
  this.rcEl = document.getElementById('mappings');
  this.editModeEl = document.getElementById('edit_mode');

  function autoSize() {
    var stop = document.scrollingElement.scrollTop;
    this.style.height = '';
    this.style.height = this.scrollHeight + 'px';
    document.scrollingElement.scrollTop = stop;
  }

  this.rcEl.addEventListener('input', autoSize);

  this.editModeEl.addEventListener('change', this.editMode.bind(this), false);
  this.saveButton.addEventListener('click', this.saveSettings.bind(this), false);
  document.getElementById('reset_button').addEventListener('click', this.resetSettings.bind(this), false);
  document.getElementById('clearHistory').addEventListener('click', function() {
    RUNTIME('clearHistory');
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

port.onMessage.addListener(function(response) {
  if (response.type === 'sendSettings') {
    waitForLoad(function() {
      if (Settings.initialLoad) {
        Settings.cssEl = CodeMirror.fromTextArea(document.getElementById('commandBarCSS'), {lineNumbers: true});
        Settings.initialLoad = false;
        Settings.settings = response.settings;
        Settings.init();
        if (response.settings.localconfig &&
            response.settings.configpath) {
          var path = 'file://' + response.settings.configpath
              .split('~').join(response.settings.homedirectory || '~');
          RUNTIME('loadLocalConfig', { path: path }, function(e) {
            Settings.loadrc(e.config);
            switch (e.code) {
            case -1:
              alert('error loading configpath: "' + path + '"');
              break;
            case -2:
              console.error('Line %d: %s', e.error.lineno, e.error.message);
              alert('parse error on line ' + e.error.lineno +
                    ' of config (see console for more info)');
            }
          });
        } else {
          Settings.loadrc(response.settings);
        }
      }
    });
  }
});

PORT('getSettings');
