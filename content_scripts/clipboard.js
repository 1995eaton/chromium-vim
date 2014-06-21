var Clipboard = {
  lastYank: "",
  store: "",
  copy: function(text, store) {
    if (!store) {
      this.store = text;
    } else {
      this.store += (this.store.length ? "\n" : "") + text;
    }
    this.lastYank = text;
    chrome.runtime.sendMessage({action: "copy", text: this.store});
  },
  paste: function(tabbed) {
    return chrome.runtime.sendMessage({action: (tabbed ? "openPasteTab" : "openPaste")});
  }

};
