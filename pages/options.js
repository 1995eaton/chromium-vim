var log;
var Settings = {};
log = console.log.bind(console);

String.prototype.trimAround = function() {
  return this.replace(/^(\s+)?(.*\S)?(\s+)?$/g, "$2");
};

Settings.getrc = function() {
  var a = this.rcEl.value.split(/\n|;/).filter(function(e) {
    return e.trim() && /^(\s+)?set\s+\S.*$/.test(e);
  }).map(function(e) {
    return e.trimAround().replace(/(\s+)?".*/, "").replace(/(\s+)?=(\s+)?/, "=").split(/\s+/).slice(1);
  });
  return a;
};

Settings.ignore = ["commandBarCSS", "mappings", "blacklists"];

Settings.parseQmark = function(string) { // TODO: Modularize this and the parserc function
  if (string.indexOf("=") === -1) {
    return false;
  }
  var values = string.split("=");
  if (values.length !== 2 || values[0].length !== 1) {
    return false;
  }
  values[1] = values[1].split(",");
  if (!this.settings.qmarks) {
    this.settings.qmarks = {};
  }
  this.settings.qmarks[values[0]] = values[1];
};

Settings.parserc = function(values) {
  var config, isEnabled;
  var sValues = Object.keys(this.settings).map(function(e) { return e.toLowerCase(); }).filter(function(e) {
    return Settings.ignore.indexOf(e) === -1;
  });
  this.settings.qmarks = {};
  for (var key in this.defaultSettings) {
    if (this.ignore.indexOf(key) === -1) {
      this.settings[key] = this.defaultSettings[key];
    }
  }
  for (var i = 0, l = values.length; i < l; ++i) {
    config = values[i];
    if (config.length !== 1) {
      if (config.length === 2 && config[0] === "qmark") {
        this.parseQmark(config[1]);
      }
      continue;
    }
    config = config[0];
    if (!/=/.test(config)) {
      isEnabled = true;
      if (sValues.indexOf(config) === -1) {
        config = config.replace(/^no/, "");
        isEnabled = false;
        if (sValues.indexOf(config) === -1) {
          continue;
        }
      }
      this.settings[config] = isEnabled;
    } else if (/=/.test(config)) {
      config = config.split("=");
      if (config.length === 2) {
        if (sValues.indexOf(config[0]) === -1) {
          continue;
        }
        this.settings[config[0]] = config[1];
      }
    }
  }
};

Settings.loadrc = function () {
  Settings.rcEl.value = this.settings.mappings;
  if (Settings.cssEl) {
    Settings.cssEl.setValue(this.settings.commandBarCSS);
  }
  document.getElementById("blacklists").value = this.settings.blacklists;
  Settings.parserc(Settings.getrc());
};

Settings.resetRelease = function() {
  if (this.resetClicked) {
    chrome.runtime.sendMessage({action: "getSettings", reset: true});
  }
};

Settings.saveRelease = function() {
  if (this.saveClicked) {
    this.settings.commandBarCSS = this.cssEl.getValue();
    this.settings.blacklists = document.getElementById("blacklists").value;
    this.settings.mappings = Settings.rcEl.value;
    this.saveButton.value = "Saved";
    Settings.parserc(Settings.getrc());
    chrome.runtime.sendMessage({action: "saveSettings", settings: Settings.settings, sendSettings: true});
    setTimeout(function () {
      this.saveButton.value = "Save";
    }.bind(this), 3000);
  }
};

Settings.onMouseDown = function(ev) {
  this.saveClicked = false;
  this.resetClicked = false;
  switch (ev.target.id) {
    case "save_button":
      this.saveClicked = true;
      break;
    case "reset_button":
      this.resetClicked = true;
      break;
    case "clearHistory":
      localStorage.search = "";
      localStorage.url    = "";
      localStorage.action = "";
      break;
  }
  this.saveButton.value = "Save";
};

Settings.editMode = function (e) {
  if (this.cssEl) {
    if (e.target.value === "Vim") {
      this.cssEl.setOption("keyMap", "vim");
    } else {
      this.cssEl.setOption("keyMap", "default");
    }
  }
};

Settings.init = function() {

  document.body.spellcheck = false;
  this.initialLoad = true;

  this.saveButton = document.getElementById("save_button");
  this.resetButton = document.getElementById("reset_button");
  this.rcEl = document.getElementById("mappings");
  this.editModeEl = document.getElementById("edit_mode");

  chrome.runtime.sendMessage({action: "getSettings"});
  chrome.runtime.sendMessage({action: "getDefaults"});

  document.addEventListener("mousedown", this.onMouseDown.bind(this), false);
  this.editModeEl.addEventListener("change", this.editMode.bind(this), false);
  this.saveButton.addEventListener("mouseup", this.saveRelease.bind(this), false);
  this.resetButton.addEventListener("mouseup", this.resetRelease.bind(this), false);

};

document.addEventListener("DOMContentLoaded", Settings.init.bind(Settings));

chrome.extension.onMessage.addListener(function(request) {
  if (request.action === "sendSettings") {
    Settings.settings = request.settings;
    if (Settings.initialLoad) {
      Settings.cssEl = CodeMirror.fromTextArea(document.getElementById("commandBarCSS"), {lineNumbers: true});
      Settings.initialLoad = false;
    }
    Settings.loadrc();
  } else if (request.action === "sendDefaultSettings") {
    Settings.defaultSettings = request.settings;
  }
});
