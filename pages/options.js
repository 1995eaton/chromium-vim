var Settings = {};
var Config = {};
var log;
log = console.log.bind(console);

Array.prototype.compact = function() {
  return this.filter(function(e) {
    return e;
  });
};

Config.validPrefixes = [/^ *let( +[a-zA-Z0-9_]+){1,2} *= */,
                        /^ *set +[a-z]+ *$/];

Config.set = function(value) {
  value = value.split(/ +/).compact().pop();
  this._ret[value.replace(/^no/, "")] = value.indexOf("no") !== 0;
};

Config.let = function(value) {
  var _ret, objVal, assignment;
  value = value.split("=");
  value = [value[0], value.slice(1).join("=")];

  assignment = value[0].split(/ +/).compact().slice(1);
  objVal = assignment.shift();
  if (assignment.length) {
    objVal += "s";
    var key = assignment.pop();
    try {
      value = JSON.parse(value[1]);
    } catch (e) {
      return; // TODO: add error message
    }
    if (this._ret.hasOwnProperty(objVal) && this._ret[objVal].constructor === Object) {
      this._ret[objVal][key] = value;
      return;
    }
    _ret = {};
    _ret[key] = value;
  } else {
    try {
      _ret = JSON.parse(value[1]);
    } catch (e) {
      return; // TODO: same as above
    }
  }
  this._ret[objVal] = _ret;

};

Config.parseLine = function(value) {
  value = value.replace(/(["\]]) *"[^"\]]*$/, "$1");
  for (var i = 0, l = this.validPrefixes.length; i < l; ++i) {
    if (this.validPrefixes[i].test(value)) {
      var prefix = value.match(/[a-zA-Z0-9_]+/)[0];
      this[prefix](value, "string");
    }
  }
};

Config.parse = function() {
  var text = Settings.rcEl.value;
  this._ret = {};
  text = text.split(/\n+/).compact();
  for (var i = 0, l = text.length; i < l; ++i) {
    this.parseLine(text[i]);
  }
  return this._ret;
};

Settings.checkConfig = function(config) {
  var validSettings = Object.keys(Settings.settings).filter(function(e) {
    return e.toLowerCase() === e;
  });
  for (var key in config) {
    if (validSettings.indexOf(key) !== -1 && sameType(config[key], Settings.settings[key])) {
      if (config[key].constructor === Object) {
        Settings.settings[key] = Object.extend(Settings.settings[key], config[key]);
      } else {
        Settings.settings[key] = config[key];
      }
    }
  }
};

Settings.loadrc = function (config) {
  this.rcEl.value = config.MAPPINGS;
  this.rcEl.style.height = this.rcEl.scrollHeight + "px";
  if (this.cssEl) {
    this.cssEl.setValue(config.COMMANDBARCSS);
  }
  this.gistUrl.value = config.GISTURL;
};

Settings.resetSettings = function() {
  this.rcEl.value = this.defaults.MAPPINGS;
  this.cssEl.setValue(this.defaults.COMMANDBARCSS);
  this.gistUrl.value = this.defaults.GISTURL;
  delete this.settings;
  this.settings = Object.clone(this.defaults);
};

Settings.saveSettings = function() {
  this.settings = Object.clone(this.defaults);
  this.checkConfig(Config.parse());
  this.settings.COMMANDBARCSS = this.cssEl.getValue();
  this.settings.GISTURL = this.gistUrl.value;
  this.settings.MAPPINGS = this.rcEl.value;
  this.saveButton.value = "Saved";
  chrome.runtime.sendMessage({action: "saveSettings", settings: Settings.settings, sendSettings: true});
  setTimeout(function () {
    this.saveButton.value = "Save";
  }.bind(this), 3000);
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
  this.rcEl = document.getElementById("mappings");
  this.editModeEl = document.getElementById("edit_mode");

  function autoSize() {
    var stop = document.body.scrollTop;
    this.style.height = "";
    this.style.height = this.scrollHeight + "px";
    document.body.scrollTop = stop;
  }

  this.rcEl.addEventListener("input", autoSize);

  chrome.runtime.sendMessage({action: "updateBlacklistsMappings"});
  chrome.runtime.sendMessage({action: "getDefaults"});

  this.editModeEl.addEventListener("change", this.editMode.bind(this), false);
  this.saveButton.addEventListener("click", this.saveSettings.bind(this), false);
  document.getElementById("reset_button").addEventListener("click", this.resetSettings.bind(this), false);
  document.getElementById("clearHistory").addEventListener("click", function() {
    localStorage.search = "";
    localStorage.url    = "";
    localStorage.action = "";
  });
  this.gistUrl = document.getElementById("gistUrl");
  document.getElementById("gistSync").addEventListener("click", this.syncGist.bind(this));
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
    if (Settings.initialLoad) {
      Settings.cssEl = CodeMirror.fromTextArea(document.getElementById("commandBarCSS"), {lineNumbers: true});
      Settings.initialLoad = false;
      Settings.loadrc(request.settings);
    }
  } else if (request.action === "sendDefaultSettings") {
    Settings.settings = request.settings;
    Settings.defaults = Object.clone(request.settings);
    Settings.checkConfig(Config.parse());
  }
});
