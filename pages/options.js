var Settings = {};
var Config = {};
var log;
log = console.log.bind(console);
Settings.ignore = ["commandBarCSS", "mappings", "blacklists", "gisturl"];

function convertOldSetting(s) {
  if (/(\s+)?let/.test(s)) {
    return s;
  }
  if (s.indexOf("qmark") !== -1) {
    s = s.split(/\s+|,|=/).filter(function(e) { return e.trim(); });
    return "let " + s.slice(1, 3).join(" ") + " = " + "[\"" + s.slice(3).join("\", \"") + "\"]";
  }
  if (/=/.test(s)) {
    s = s.replace(/set/, "let");
    if (!/"|'/.test(s) && !/^[0-9]+$/.test(s.replace(/.*= /, "").trim())) {
      s = s.replace(/=(\s+)?([^\s]+)/, "=$1\"$2\"");
  }
  }
  return s;
}

Config.getLines = function(config) {
  return config.split(/(\s+)?\n+(\s+)?/).filter(function(e) {
    return e !== undefined && e.trim();
  });
};

Config.parseLine = function(line) {
  line = line.replace(/, /, ",").replace(/(^[^=]+)=/, "$1 ").split(/\s+/);
  return line;
};

Config.set = function(params) {
  if (params.length !== 1) {
    return false;
  }
  if (/^no/.test(params)) {
    this._ret[params[0].replace(/^no/, "")] = false;
  } else {
    this._ret[params[0]] = true;
  }
};

Config.let = function(params) {
  if (params.length === 2) {
    if (!/^[a-zA-Z_]+$/.test(params[0])) {
      return false;
    }
    this._ret[params[0]] = params[1].replace(/^"|"$/g, "");
  } else if (params.length === 3) {
    this._ret[params[0]] = {};
    if (params[2][0] === "[") {
      this._ret[params[0]][params[1]] = JSON.parse(params[2]);
    } else if (/'|"/.test(params[2][0])) {
      this._ret[params[0]][params[1]] = params[2];
    }
  }
};

Config.parse = function(config) {
  var lines = this.getLines(config);
  this._ret = {};
  for (var i = 0, l = lines.length; i < l; ++i) {
    var line = convertOldSetting(lines[i]); // Used in transition from set <x> = <y> to let <x> = <y>
    line = this.parseLine(line);
    var arg = line.shift();
    if (!Array.isArray(line)) {
      continue;
    }
    if (this.hasOwnProperty(arg)) {
      this[arg](line);
    }
  }
  return this._ret;
};

Settings.applyConfig = function(config, callback) {
  var key;
  for (key in this.defaultSettings) {
    this.settings[key] = this.defaultSettings[key];
  }
  for (key in config) {
    if (this.ignore.indexOf(key) === -1 && this.defaultSettings.hasOwnProperty(key) !== -1) {
      if (typeof config[key] === "object") {
        if (!Array.isArray(config[key]) && /^(qmark|searchengine)$/.test(key)) {
          this.settings[key + "s"] = {};
          for (var key2 in config[key]) {
            if (typeof config[key][key2] === "string") {
              config[key][key2] = config[key][key2].replace(/^["']|["']$/g, "");
            }
            this.settings[key + "s"][key2] = config[key][key2];
          }
        }
      } else {
        this.settings[key] = config[key];
      }
    }
  }
  if (callback) {
    callback();
  }
};

Settings.loadrc = function () {
  Settings.rcEl.value = this.settings.mappings;
  if (Settings.cssEl) {
    Settings.cssEl.setValue(this.settings.commandBarCSS);
  }
  document.getElementById("blacklists").value = this.settings.blacklists;
  this.gistUrl.value = this.settings.gisturl;
};

Settings.resetRelease = function() {
  if (this.resetClicked) {
    chrome.runtime.sendMessage({action: "getSettings", reset: true});
  }
};

Settings.saveRelease = function() {
  if (this.saveClicked) {
    this.applyConfig(Config.parse(this.rcEl.value), function() {
      this.settings.commandBarCSS = this.cssEl.getValue();
      this.settings.blacklists = document.getElementById("blacklists").value;
      this.settings.gisturl = this.gistUrl.value;
      this.settings.mappings = Settings.rcEl.value;
      this.saveButton.value = "Saved";
      chrome.runtime.sendMessage({action: "saveSettings", settings: Settings.settings, sendSettings: true});
      setTimeout(function () {
        this.saveButton.value = "Save";
      }.bind(this), 3000);
    }.bind(this));
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
    case "gistSync":
      this.syncGist();
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

Settings.syncGist = function() {
  var url = this.gistUrl.value;
  if (url.trim() === "") {
    return false;
  }
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url + (url.indexOf("raw") === -1 ? "/raw" : ""));
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4 && xhr.status === 200) {
      document.getElementById("mappings").value = xhr.responseText;
    }
  };
  xhr.send();
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
  this.gistUrl = document.getElementById("gistUrl");
  this.gistPlaceHolder = "https://gist.github.com/1995eaton/9e68803bf1f1e7524340";
  this.gistUrl.addEventListener("focus", function() {
    this.setAttribute("placeholder", "");
  });
  this.gistUrl.addEventListener("blur", function() {
    this.setAttribute("placeholder", Settings.gistPlaceHolder);
  });

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
