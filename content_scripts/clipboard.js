var Clipboard = {};
Clipboard.store = '';

Clipboard.copy = function(text, store) {
  if (!store) {
    this.store = text;
  } else {
    this.store += (this.store.length ? '\n' : '') + text;
  }
  RUNTIME('copy', {text: this.store});
};

Clipboard.paste = function(tabbed) {
  RUNTIME(tabbed ? 'openPasteTab' : 'openPaste');
};
