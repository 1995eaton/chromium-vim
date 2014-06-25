var Clipboard = {};
Clipboard.store = '';

Clipboard.copy = function(text, store) {
  if (!store) {
    this.store = text;
  } else {
    this.store += (this.store.length ? '\n' : '') + text;
  }
  chrome.runtime.sendMessage({action: 'copy', text: this.store});
};

Clipboard.paste = function(tabbed) {
  return chrome.runtime.sendMessage({action: (tabbed ? 'openPasteTab' : 'openPaste')});
};
