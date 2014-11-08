var History = {

  historyTypes: ['action', 'url', 'search'],
  searchResults: null,
  historyStore: [],
  commandHistory: {},
  shouldRefresh: false,

  saveCommandHistory: function() {
    Object.keys(this.commandHistory).forEach(function(e) {
      localStorage[e] = JSON.stringify(this.commandHistory[e]);
    }.bind(this));
  },

  append: function(value, type) {
    if (~this.historyTypes.indexOf(type)) {
      this.commandHistory[type].push('' + value);
      this.commandHistory[type] =
        this.commandHistory[type].splice(-500);
      this.saveCommandHistory();
    }
  },

  retrieve: function(type) {
    return [type, this.commandHistory[type]];
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

(function() {
  History.historyTypes.forEach(function(type) {
    var data = localStorage[type];
    try {
      data = JSON.parse(data);
    } catch (e) {
      data = typeof data === 'string' ? data.split(',') : [];
    }
    History.commandHistory[type] = data;
  });
})();

History.refreshStore();
