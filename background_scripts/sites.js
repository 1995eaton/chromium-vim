var Sites = {};

Sites.getTop = function(callback) {
  chrome.topSites.get(function(e) {
    callback(e.map(function(e) {
      return [e.title, e.url];
    }));
  });
};
