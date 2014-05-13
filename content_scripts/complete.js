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
  "(\\?[;:&a-z\\d%_.~+=-]*)?"+
  "(\\#[#:-a-z\\d_]*)?$","i");
  if (pattern.test(url)) {
    return true;
  }
};

var Complete = {};

Complete.engines = ["google", "wikipedia", "youtube", "imdb", "amazon", "wolframalpha", "google-image", "ebay", "webster", "wictionary", "urbandictionary", "duckduckgo", "google-trends", "google-finance", "yahoo", "bing"];

Complete.requestUrls = {
  wikipedia:      "https://en.wikipedia.org/wiki/",
  google:         "https://www.google.com/search?q=",
  "google-image": "https://www.google.com/search?site=imghp&tbm=isch&source=hp&q=",
  duckduckgo:     "https://duckduckgo.com/?q=",
  yahoo:          "https://search.yahoo.com/search?p=",
  bing:           "https://www.bing.com/search?q=",
  imdb:           "http://www.imdb.com/find?s=all&q=",
  amazon:         "http://www.amazon.com/s/?field-keywords=",
  wolframalpha:   "https://www.wolframalpha.com/input/?i=",
  ebay:           "https://www.ebay.com/sch/i.html?_sacat=0&_from=R40&_nkw=",
  urbandictionary: "http://www.urbandictionary.com/define.php?term=",
  "google-trends": "http://www.google.com/trends/explore#q=",
  "google-finance": "https://www.google.com/finance?q=",
  webster:          "http://www.merriam-webster.com/dictionary/",
  youtube:          "https://www.youtube.com/results?search_query=",
  wictionary:       "http://en.wiktionary.org/wiki/"
};

Complete.parseQuery = {
  wikipedia: function(query) {
    return query.replace(" ", "_");
  },
  bing: function(query) {
    return query + "&FORM=SEEMOR";
  },
  wolframalpha: function(query) {
    return encodeURIComponent(query);
  },
  imdb: function(query) {
    return encodeURIComponent(query);
  },
  "google-finance": function(query) {
    return encodeURIComponent(query);
  },
  wictionary: function(query) {
    return query.replace(" ", "_");
  }
};

Complete.apis = {
  wikipedia:      "https://en.wikipedia.org/w/api.php?action=opensearch&format=json&search=",
  google:         "https://www.google.com/complete/search?client=firefox&hl=en&q=",
  "google-image": "http://www.google.com/complete/search?client=img&hl=en&gs_rn=43&gs_ri=img&ds=i&cp=1&gs_id=8&q=",
  yahoo:          "https://search.yahoo.com/sugg/gossip/gossip-us-ura/?output=sd1&appid=search.yahoo.com&nresults=10&command=",
  bing:           "http://api.bing.com/osjson.aspx?query=",
  imdb:           "http://sg.media-imdb.com/suggests/",
  amazon:         "http://completion.amazon.com/search/complete?method=completion&search-alias=aps&client=amazon-search-ui&mkt=1&q=",
  wolframalpha:   "https://www.wolframalpha.com/input/autocomplete.jsp?qr=0&i=",
  ebay:           "https://autosug.ebay.com/autosug?kwd=",
  urbandictionary: "http://api.urbandictionary.com/v0/autocomplete?term=",
  "google-trends": "http://www.google.com/trends/entitiesQuery?tn=10&q=",
  "google-finance": "https://www.google.com/finance/match?matchtype=matchall&q=",
  webster:          "http://www.merriam-webster.com/autocomplete?query=",
  youtube:          "https://clients1.google.com/complete/search?client=youtube&hl=en&gl=us&gs_rn=23&gs_ri=youtube&ds=yt&cp=2&gs_id=d&q=",
  wictionary:       "http://en.wiktionary.org/w/api.php?action=opensearch&limit=15&format=json&search="
};

Complete.convertToLink = function(input) {
  var prefix, suffix;
  input = input.replace(/@%/g, document.URL);
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
    if (this.readyState === 4 && this.status === 200 && document.activeElement.id === "cVim-command-bar-input" && commandMode) {
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

Complete["google-image"] = function(query, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", this.apis["google-image"] + query);
  xhr.onreadystatechange = function() {
    if (this.readyState === 4 && this.status === 200 && document.activeElement.id === "cVim-command-bar-input" && commandMode) {
      callback(JSON.parse(this.responseText.replace(/^[^\(]+\(|\)$/g, ""))[1].map(function(e) {
        return ["search", e[0].replace(/<[^>]+>/g, "")];
      }));
    }
  };
  xhr.send();
};

Complete["google-trends"] = function(query, callback) {
  this.xhr(this.apis["google-trends"] + encodeURIComponent(query), function(response) {
    callback(response.entityList.map(function(e) {
      return ["search", e.title + " - " + e.type, Complete.requestUrls["google-trends"] + encodeURIComponent(e.mid)];
    }));
  });
};

Complete["google-finance"] = function(query, callback) {
  this.xhr(this.apis["google-finance"] + encodeURIComponent(query), function(response) {
    callback(response.matches.map(function(e) {
      return ["search", e.t + " - " + e.n + " - " + e.e, Complete.requestUrls["google-finance"] + e.e + ":" + e.t];
    }));
  });
}

Complete.amazon = function(query, callback) {
  this.xhr(this.apis.amazon + encodeURIComponent(query), function(response) {
    callback(response[1].map(function(e) {
      return ["search"].concat(e);
    }));
  });
};

Complete.yahoo = function(query, callback) {
  this.xhr(this.apis.yahoo + encodeURIComponent(query), function(response) {
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

Complete.ebay = function(query, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", this.apis.ebay + encodeURIComponent(query));
  xhr.onreadystatechange = function() {
    if (this.readyState === 4 && this.status === 200 && document.activeElement.id === "cVim-command-bar-input" && commandMode) {
      var _ret = JSON.parse(xhr.responseText.replace(/^[^\(]+\(|\)$/g, ""));
      if (!_ret.res) {
        return false;
      }
      callback(_ret.res.sug.map(function(e) {
        return ["search", e];
      }));
    }
  };
  xhr.send();
};

Complete.youtube = function(query, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", this.apis.youtube + query);
  xhr.onreadystatechange = function() {
    if (this.readyState === 4 && this.status === 200 && document.activeElement.id === "cVim-command-bar-input" && commandMode) {
      var _ret = JSON.parse(xhr.responseText.replace(/^[^\(]+\(|\)$/g, ""));
      callback(_ret[1].map(function(e) {
        return ["search", e[0]];
      }));
    }
  };
  xhr.send();
};

Complete.wolframalpha = function(query, callback) {
  this.xhr(this.apis.wolframalpha + encodeURIComponent(query), function(response) {
    callback(response.results.map(function(e) {
      return ["search", e.input];
    }));
  });
};

Complete.webster = function(query, callback) {
  this.xhr(this.apis.webster + encodeURIComponent(query), function(response) {
    callback(response.suggestions.map(function(e) {
      return ["search", e];
    }));
  });
};

Complete.wictionary = function(query, callback) {
  this.xhr(this.apis.wictionary + encodeURIComponent(query), function(response) {
    callback(response[1].map(function(e) {
      return ["search", e];
    }));
  });
};

Complete.urbandictionary = function(query, callback) {
  this.xhr(this.apis.urbandictionary + encodeURIComponent(query), function(response) {
    callback(response.slice(1).map(function(e) {
      return ["search", e];
    }));
  });
};

Complete.imdb = function(query, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", this.apis.imdb + query[0] + "/" + query.replace(" ", "_") + ".json");
  xhr.onreadystatechange = function() {
    if (this.readyState === 4 && this.status === 200 && document.activeElement.id === "cVim-command-bar-input" && commandMode) {
      var _ret = JSON.parse(xhr.responseText.replace(/^[^\(]+\(|\)$/g, ""));
      callback(_ret.d.map(function(e) {
        if (/:\/\//.test(e.id)) {
          return ["search", e.l, e.id];
        }
        var _url = "http://www.imdb.com/" + (e.id.indexOf("nm") === 0 ? "name" : "title") + "/" + e.id;
        if (e.q) {
          return ["search", e.l + " - " + e.q + ", " + e.s + " (" + e.y + ")", _url];
        }
        return ["search", e.l + " - " + e.s, _url];
      }));
    }
  };
  xhr.send();
};
