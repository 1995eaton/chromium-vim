// Parses command-line values on execution

var Parse = {};

Parse.matches = {
  nohl: /^nohl$/,
  duplicate: /^duplicate$/,
  settings: /^settings$/,
  help: /^help$/,
  closetab: /^(cl)?osetab$/,
  chrome: /^chrome:\/\/\S+$/,
  bookmarks: /^bookmarks +/,
  history: /^history +/,
  winopen: /^(wo|winopen)/,
  tabopen: /^(to|tabopen)$/,
  open: /^o?pen$/,
  buffers: /^buffers +[0-9]+ *$/,
  execute: /^execute +/
};

Parse.nohl = function() {
  Find.clear();
  HUD.hide();
};

Parse.duplicate = function() {
  chrome.runtime.sendMessage({action: "openLinkTab",
    active: this.activeTab,
    url: document.URL,
    repeats: this.repeats});
};

Parse.settings = function() {
  chrome.runtime.sendMessage({action: "openLinkTab",
    active: this.activeTab,
    url: chrome.extension.getURL("/pages/options.html"),
    repeats: this.repeats});
};

Parse.help = function() {
  chrome.runtime.sendMessage({action: "openLinkTab",
    active: this.activeTab,
    url: chrome.extension.getURL("/pages/mappings.html")});
};

Parse.closetab = function() {
  chrome.runtime.sendMessage({action: "closeTab",
    repeats: this.repeats});
};

Parse.chrome = function() {
  chrome.runtime.sendMessage({action: "openLinkTab",
    active: this.activeTab,
    url: this.value,
    noconvert: true});
};

Parse.bookmarks = function() {
  if (/^\S+\s+\//.test(this.value)) {
    return chrome.runtime.sendMessage({action: "openBookmarkFolder",
      active: this.activeTab,
      path: this.value.replace(/\S+\s+/, ""),
      noconvert: true});
  }
  chrome.runtime.sendMessage({action: "openLinkTab",
    active: this.activeTab,
    url: this.value.replace(/^b(ook)?marks(\s+)?/, ""),
    noconvert: true});
};

Parse.history = function() {
  chrome.runtime.sendMessage({action: "openLinkTab",
    active: this.activeTab,
    url: Complete.convertToLink(this.value),
    noconvert: true});
};

Parse.parse = function(value, activeTab, repeats) {
  this.value = value;
  this.activeTab = activeTab;
  this.repeats = repeats;
  for (var key in this.matches) {
    if (this.matches[key].test(value)) {
      return this[key]();
    }
  }
};
