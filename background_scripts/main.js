function getTab(sender, reverse) {
  chrome.tabs.query({windowId: sender.tab.windowId}, function(tabs) {
    for (var i = 0; i < tabs.length; i++) {
      if (tabs[i].index === sender.tab.index) {
        if (!reverse) {
          return chrome.tabs.update((sender.tab.index + 1 === tabs.length) ? tabs[0].id : tabs[i + 1].id, {active: true});
        }
        return chrome.tabs.update((sender.tab.index === 0) ? tabs[tabs.length - 1].id : tabs[i - 1].id, {active: true});
      }
    }
  });
}

chrome.runtime.onMessage.addListener(function(request, sender, callback) {
  switch (request.action) {
    case "openLink":
      chrome.tabs.update({url: request.url});
      break;
    case "openLinkTab":
      chrome.tabs.create({url: request.url, index: sender.tab.index + 1});
      break;
    case "closeTab":
      chrome.tabs.remove(sender.tab.id);
      break;
    case "newTab":
      chrome.tabs.create({url: "https://google.com", index: sender.tab.index + 1});
      break;
    case "nextTab":
      getTab(sender, false);
      break;
    case "previousTab":
      getTab(sender, true);
      break;
    default:
      break;
  }
  if (callback) return callback();
});
