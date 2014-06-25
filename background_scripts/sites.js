var Sites = {};

Sites.querySites = function(callback) {
  chrome.topSites.get(function(e) {
    var urls = [],
        c = 0,
        l = e.length;
    e.map(function(d) {
      chrome.history.getVisits({url: d.url}, function(f) {
        urls.push([d.title, d.url, f.length]);
        if (++c === l) {
          callback(urls);
        }
      });
    });
  });
};

Sites.getTop = function(callback) {
  this.querySites(function(data) {
    callback(data.sort(function(a, b) {
      return b[2] - a[2];
    }));
  });
};
