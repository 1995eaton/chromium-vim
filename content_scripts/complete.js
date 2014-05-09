// Search engine completion functions

String.prototype.validURL = function() {
  var url = this.trimLeft().trimRight();
  if (url.length === 0) return "chrome://newtab";
  if (/^\//.test(url)) url = "file://" + url;
  if (/^(chrome|chrome-extension|file):\/\/\S+$/.test(url)) return url;
  var pattern = new RegExp("^((https?|ftp):\\/\\/)?"+
  "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|"+
  "((\\d{1,3}\\.){3}\\d{1,3})|"+
  "localhost)" +
  "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*"+
  "(\\?[;&a-z\\d%_.~+=-]*)?"+
  "(\\#[-a-z\\d_]*)?$","i");
  if (pattern.test(url)) {
    return true;
  }
};

var Complete = {};

Complete.engines = ["google", "wikipedia", "duckduckgo", "yahoo", "bing", "imdb"];

Complete.requestUrls = {
  wikipedia:  "https://en.wikipedia.org/wiki/",
  google:     "https://www.google.com/search?q=",
  duckduckgo: "https://duckduckgo.com/?q=",
  yahoo:      "https://search.yahoo.com/search?p=",
  bing:       "https://www.bing.com/search?q=",
  imdb:       "http://www.imdb.com/find?s=all&q="
};

Complete.parseQuery = {
  wikipedia: function(query) {
    return query.replace(" ", "_");
  },
  bing: function(query) {
    return query + "&FORM=SEEMOR";
  }
};

Complete.apis = {
  wikipedia: "https://en.wikipedia.org/w/api.php?action=opensearch&format=json&search=",
  google:    "https://suggestqueries.google.com/complete/search?client=firefox&q=",
  yahoo:     "https://search.yahoo.com/sugg/gossip/gossip-us-ura/?output=sd1&appid=search.yahoo.com&nresults=10&command=",
  bing:      "http://api.bing.com/osjson.aspx?query=",
  imdb:      "http://sg.media-imdb.com/suggests/"
};

Complete.convertToLink = function(input) {
  var prefix, suffix;
  input = input.split(/\s+/).filter(function(e) { return e; });
  input.shift();
  if (input.length === 0) {
    return "";
  }
  if (Complete.engines.indexOf(input[0]) !== -1 && input.length > 1) {
    prefix = Complete.requestUrls[input[0]];
  } else {
    if (input.join(" ").validURL()) {
      if (!/:\/\//.test(input.join(" "))) {
        return "http://" + input.join(" ");
      }
      return input.join(" ");
    }
    return Complete.requestUrls.google + encodeURIComponent(input.join(" "));
  }
  if (Complete.parseQuery.hasOwnProperty(input[0])) {
    suffix = Complete.parseQuery[input[0]](input.slice(1).join(" "));
  } else {
    suffix = input.slice(1).join(" ");
  }
  return prefix + suffix;
};

Complete.xhr = function(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url);
  xhr.onreadystatechange = function() {
    if (this.readyState === 4 && this.status === 200) {
      callback(JSON.parse(this.responseText));
    }
  };
  xhr.send(url);
};

Complete.wikipedia = function(query, callback) {
  this.xhr(this.apis.wikipedia + query, function(response) {
    callback(response[1].map(function(e) {
      return ["search"].concat(e);
    }));
  });
};

Complete.google = function(query, callback) {
  this.xhr(this.apis.google + query, function(response) {
    callback(response[1].map(function(e) {
      return ["search"].concat(e);
    }));
  });
};

Complete.yahoo = function(query, callback) {
  this.xhr(this.apis.yahoo + query, function(response) {
    var _ret = [];
    for (var key in response.r) {
      if (response.r[key].hasOwnProperty("k")) {
        _ret.push(["search", response.r[key].k]);
      }
    }
    callback(_ret);
  });
};

Complete.bing = function(query, callback) {
  this.xhr(this.apis.bing + query, function(response) {
    callback(response[1].map(function(e) {
      return ["search"].concat(e);
    }));
  });
};

Complete.imdb = function(query, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", this.apis.imdb + query[0][0] + "/" + query.join("_") + ".json");
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4 && xhr.status === 200) {
      var _ret = JSON.parse(xhr.responseText.replace(/^[^\(]+\(|\)$/g, ""));
      callback(_ret.d.map(function(e) {
        var _url = "http://www.imdb.com/" + (/Act(or|ress)/.test(e.s) ? "name" : "title") + "/" + e.id;
        if (e.q) {
          return ["search", e.l + " - " + e.q + ", " + e.s + " (" + e.y + ")", _url];
        }
        return ["search", e.l + " - " + e.s, _url];
      }));
    }
  };
  xhr.send();
};
