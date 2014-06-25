var History = {}

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

History.retrieveSearchHistory = function(search, limit, callback) {
  chrome.history.search({text: search, maxResults: limit}, function(results) {
    callback(results);
  });
};
