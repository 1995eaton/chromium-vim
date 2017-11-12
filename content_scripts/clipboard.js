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
  copyHtmlFormatted: function(html, store) {
    if (!store) {
      this.store = html;
    } else {
      this.store += (this.store.length ? '\n' : '') + html;
    }
    RUNTIME('copyHtmlFormatted', {html: this.store});
  },
  paste: function(tabbed) {
    var engineUrl = Complete.getEngine(settings.defaultengine);
    engineUrl = engineUrl ? engineUrl.requestUrl :
      Complete.getEngine('google').requestUrl;
    RUNTIME(tabbed ? 'openPasteTab' : 'openPaste', {
      engineUrl: engineUrl
    });
  }
};
