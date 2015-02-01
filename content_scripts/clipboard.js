var Clipboard = {
  store: '',
  copy: function(text, store) {
    if (!store) {
      this.store = text;
    } else {
      this.store += (this.store.length ? '\n' : '') + text;
    }
    RUNTIME('copy', {text: this.store});
  },
  paste: function(tabbed) {
    RUNTIME(tabbed ? 'openPasteTab' : 'openPaste');
  }
};
