var History = {

  historyTypes: ['action', 'url', 'search'],
  searchResults: null,
  historyStore: [],
  shouldRefresh: false,

  append: function(value, type) {
    if (!localStorage[type] || localStorage[type] === '') {
      localStorage[type] = value;
    } else {
      localStorage[type] += ',' + value;
    }
  },

  retrieve: function(type) {
    if (!localStorage[type]) {
      localStorage[type] = '';
    }
    return [type, localStorage[type].split(',')];
  },

  refreshStore: function() {
    this.shouldRefresh = false;
    chrome.history.search({text: '', maxResults: 10000}, function(results) {
      History.historyStore = results;
    });
  },

  retrieveSearchHistory: function(search, limit, callback) {
    if (History.shouldRefresh) {
      History.refreshStore();
    }
    callback(searchArray(this.historyStore, search, limit, true, function(item) {
      return item.title + item.url;
    }));
  }

};

History.refreshStore();
