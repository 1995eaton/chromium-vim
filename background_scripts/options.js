var storageMethod = "local",
    Settings = {},
    Options = {};

var defaultSettings = {
  searchlimit: 20,
  scrollstep: 75,
  typelinkhintsdelay: 500,
  qmarks: {},
  searchengines: {},
  hud: true,
  regexp: true,
  linkanimations: false,
  ignorecase: true,
  ignorediacritics: true,
  numerichints: false,
  cncpcompletion: false,
  smartcase: true,
  incsearch: true,
  autohidecursor: false,
  typelinkhints: false,
  autofocus: true,
  insertmappings: true,
  smoothscroll: true,
  scrollduration: 20,
  hintcharacters: "asdfgqwertzxcvb",
  activehighlight: "#ff9632",
  highlight: "#ffff00",
  completionengines: [],
  nextmatchpattern: "((?!first)(next|more|>|›|»|forward| )+)",
  previousmatchpattern: "((?!last)(prev(ious)?|back|«|less|<|‹| )+)",
  barposition: "top",
  blacklists: [],
  MAPPINGS: "",
  GISTURL: "",
  COMMANDBARCSS: "#cVim-link-container, .cVim-link-hint, #cVim-command-bar, #cVim-command-bar-mode, #cVim-command-bar-input, #cVim-command-bar-search-results, .cVim-completion-item, .cVim-completion-item .cVim-full, .cVim-completion-item .cVim-left, .cVim-completion-item .cVim-right, #cVim-hud, #cVim-status-bar {\n  font-family: Helvetica, Helvetica Neue, Neue, sans-serif, monospace, Arial;\n  font-size: 10pt !important;\n  -webkit-font-smoothing: antialiased !important;\n}\n\n#cVim-link-container {\n  position: absolute;\n  pointer-events: none;\n  width: 100%; left: 0;\n  height: 100%; top: 0;\n  z-index: 2147483647;\n}\n\n.cVim-link-hint {\n  border-radius: 2px;\n  color: #ddd;\n  padding: 2px !important;\n  font-size: 11pt !important;\n  font-weight: 100 !important;\n  display: inline-block !important;\n  border: 1px solid #ccc;\n  vertical-align: middle !important;\n  text-align: center !important;\n  box-shadow: 2px 2px 1px rgba(0,0,0,0.25) !important;\n  position: absolute !important;\n  background: linear-gradient(to bottom, #636363 0%,#3f3f3f 39%,#3f3f3f 39%,#000000 100%);\n}\n\n.cVim-link-hint_match {\n  color: #888;\n}\n\n#cVim-command-bar {\n  position: fixed !important;\n  z-index: 2147483646 !important;\n  background-color: #1b1d1e !important;\n  color: #bbb !important;\n  display: none;\n  box-sizing: content-box !important;\n  box-shadow: 0 3px 3px rgba(0,0,0,0.4);\n  left: 0 !important;\n  width: 100% !important;\n  height: 20px !important;\n}\n\n#cVim-command-bar-mode {\n  display: inline-block;\n  vertical-align: middle;\n  box-sizing: border-box !important;\n  padding-left: 2px !important;\n  height: 100% !important;\n  width: 10px !important;\n  padding-top: 2px !important;\n  color: #888 !important;\n}\n\n#cVim-command-bar-input {\n  background-color: #1b1d1e !important;\n  color: #bbb !important;\n  height: 100% !important;\n  right: 0 !important;\n  top: 0 !important;\n  width: calc(100% - 10px) !important;\n  position: absolute !important;\n}\n\n#cVim-command-bar-search-results {\n  position: fixed;\n  width: 100% !important;\n  overflow: hidden;\n  z-index: 2147483647 !important;\n  left: 0;\n  box-shadow: 0 3px 3px rgba(0,0,0,0.4);\n  background-color: rgba(44, 44, 44, 1);\n}\n\n.cVim-completion-item, .cVim-completion-item .cVim-full, .cVim-completion-item .cVim-left, .cVim-completion-item .cVim-right {\n  text-overflow: ellipsis;\n  padding: 1px;\n  display: inline-block;\n  box-sizing: border-box;\n  vertical-align: middle;\n  overflow: hidden;\n  white-space: nowrap;\n}\n\n.cVim-completion-item:nth-child(even) {\n  background-color: #282828;\n}\n\n.cVim-completion-item {\n  width: 100%; left: 0;\n  color: #fff;\n}\n\n.cVim-completion-item .cVim-left {\n  color: #fff;\n  width: 37%;\n}\n\n.cVim-completion-item .cVim-right {\n  font-style: italic;\n  color: #888;\n  width: 57%;\n}\n\n#cVim-hud {\n  background-color: rgba(28,28,28,0.9);\n  position: fixed !important;\n  transition: right 0.2s ease-out;\n  z-index: 24724289;\n}\n\n#cVim-hud span {\n  padding: 2px;\n  padding-left: 4px;\n  padding-right: 4px;\n  color: #8f8f8f;\n  font-size: 10pt;\n}"
};

chrome.storage.onChanged.addListener(function(changes) {
  Settings = changes.settings ? changes.settings.newValue : defaultSettings;
});

Options.refreshSettings = function(callback) {
  for (var key in defaultSettings) {
    if (Settings[key] === undefined) {
      Settings[key] = defaultSettings[key];
    }
  }
  if (callback) {
    callback();
  }
};

Options.saveSettings = function(request) {
  Settings = request.settings;
  for (var key in Settings.qmarks) {
    Quickmarks[key] = Settings.qmarks[key];
  }
  this.refreshSettings(function() {
    chrome.storage[storageMethod].set({settings: Settings});
    if (request.sendSettings) {
      Options.sendSettings();
    }
  });
};

Options.sendSettings = function() {
  chrome.tabs.query({}, function(tabs) {
    for (var i = 0; i < tabs.length; ++i) {
      chrome.tabs.sendMessage(tabs[i].id, {action: "sendSettings", settings: Settings});
    }
  });
};

Options.getSettings = function(request, sender) {
  this.refreshSettings(function() {
    chrome.tabs.sendMessage(sender.tab.id, {action: "sendSettings", settings: (request.reset ? Options.compressedDefaults : Settings)});
  });
};

Options.setDefaults = function() {
  Settings = defaultSettings;
  this.saveSettings(Settings);
};

Options.getDefaults = function(request, sender) {
  chrome.tabs.sendMessage(sender.tab.id, {action: "sendDefaultSettings", settings: defaultSettings});
};

Options.oldMappings = ["options", "mappings", "blacklists", "gisturl", "commandbarcss"];
Options.convertOldSettings = function() {
  for (var i = 0; i < this.oldMappings.length; ++i) {
    if (Settings[this.oldMappings[i]]) {
      Settings[this.oldMappings[i].toUpperCase()] = Settings[this.oldMappings[i]];
      delete Settings[this.oldMappings[i]];
    }
  }
};

Options.updateBlacklistsMappings = function() {
  console.log(Settings.blacklists);
  var mappings = Settings.MAPPINGS,
      configBlacklists = mappings.match(/\n *let +blacklists *= *\[.*\]/),
      i;
  mappings = mappings.split(/\n+/);
  if (Settings.BLACKLISTS) {
    configBlacklists = "let blacklists = " + configBlacklists[0].replace(/[^=]+= */, "");
    mappings.push(configBlacklists);
    delete Settings.BLACKLISTS;
  }
  if (configBlacklists) {
    for (i = 0; i < mappings.length; ++i) {
      if (/ *let *blacklists *= */.test(mappings[i])) {
        var bl = JSON.parse(mappings.splice(i, 1)[0].replace(/[^=]*= */, ""));
        for (j = 0; j < bl.length; j++) {
          if (Settings.blacklists.indexOf(bl[j]) === -1) {
            Settings.blacklists.push(bl[j]);
          }
        }
      }
    }
    var blacklists = [];
    for (i = 0; i < Settings.blacklists.length; i++) {
      if (blacklists.indexOf(Settings.blacklists[i]) === -1) {
        blacklists.push("\"" + Settings.blacklists[i] + "\"");
      }
    }
    configBlacklists = "let blacklists = [" + blacklists.join(", ") + "]";
    mappings.push(configBlacklists);
  }
  Settings.MAPPINGS = mappings.join("\n");
  Options.saveSettings({settings: Settings});
};

(function() {
  chrome.storage[storageMethod].get("settings", function(data) {
    if (data.settings) {
      Settings = data.settings;
      Options.convertOldSettings();
      Quickmarks = Settings.qmarks;
    }
    Options.refreshSettings();
    Options.updateBlacklistsMappings();
  });
})();

chrome.runtime.onMessage.addListener(function (request, sender) {
  if (Options.hasOwnProperty(request.action)) {
    Options[request.action](request, sender);
  }
});
