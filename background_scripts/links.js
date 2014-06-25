var Links = {};

Links.multiOpen = function(links) {
  links.forEach(function(item) {
    chrome.tabs.create({url: item, active: false});
  });
};
