var History = {};

History.historyTypes = ['action', 'url', 'search'];

History.searchResults = null;

History.append = function(value, type) {
  if (!localStorage[type] || localStorage[type] === '') {
    localStorage[type] = value;
  } else {
    localStorage[type] += ',' + value;
  }
};

History.retrieve = function(type) {
  if (!localStorage[type]) {
    localStorage[type] = '';
  }
  return [type, localStorage[type].split(',')];
};

History.historyStore = [];
History.shouldRefresh = false;
History.refreshStore = function() {
  this.shouldRefresh = false;
  chrome.history.search({text: '', maxResults: 10000}, function(results) {
    History.historyStore = results;
  });
};

History.refreshStore();
History.retrieveSearchHistory = function(search, limit, callback) {
  if (History.shouldRefresh) {
    History.refreshStore();
  }
  callback(searchArray(this.historyStore, search, limit, true, function(item) {
    return item.title + item.url;
  }));
};
