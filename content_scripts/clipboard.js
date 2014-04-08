var Clipboard = {

  copy: function(text) {
    chrome.runtime.sendMessage({action: "copy", text: text});
  },
  paste: function(tabbed) {
    if (tabbed) return chrome.runtime.sendMessage({action: "openPasteTab"});
    return chrome.runtime.sendMessage({action: "openPaste"});
  }

};
