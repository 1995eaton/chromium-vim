// Search engine completion functions

String.prototype.validURL = function() {
  var url = this.trimLeft().trimRight();
  if (url.length === 0) {
    return "chrome://newtab";
  }
  if (/^\//.test(url)) {
    url = "file://" + url;
  }
  if (/^(chrome|chrome-extension|file):\/\/\S+$/.test(url)) {
    return url;
  }
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

String.prototype.embedString = function(string) {
  return this.replace("%s", string);
};

var Complete = {};

Complete.engines = ["google", "wikipedia", "youtube", "imdb", "amazon", "wolframalpha", "google-image", "ebay", "webster", "wictionary", "urbandictionary", "duckduckgo", "google-trends", "google-finance", "yahoo", "bing"];

Complete.aliases = {
  g: "google"
};

Complete.hasAlias = function(alias) {
  return this.aliases.hasOwnProperty(alias);
};

Complete.getAlias = function(alias) {
  return this.aliases[alias] || "";
};

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

Complete.baseUrls = {
  wikipedia:      "https://en.wikipedia.org/wiki/Main_Page",
  google:         "https://www.google.com",
  "google-image": "http://www.google.com/imghp",
  duckduckgo:     "https://duckduckgo.com",
  yahoo:          "https://search.yahoo.com",
  bing:           "https://www.bing.com",
  imdb:           "http://www.imdb.com",
  amazon:         "http://www.amazon.com",
  wolframalpha:   "https://www.wolframalpha.com",
  ebay:           "http://www.ebay.com",
  urbandictionary: "http://www.urbandictionary.com",
  "google-trends": "http://www.google.com/trends/",
  "google-finance": "https://www.google.com/finance",
  webster:          "http://www.merriam-webster.com",
  youtube:          "https://www.youtube.com",
  wictionary:       "https://en.wiktionary.org/wiki/Wiktionary:Main_Page"
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
  wikipedia:      "https://en.wikipedia.org/w/api.php?action=opensearch&format=json&search=%s",
  google:         "https://www.google.com/complete/search?client=firefox&hl=en&q=%s",
  "google-image": "http://www.google.com/complete/search?client=img&hl=en&gs_rn=43&gs_ri=img&ds=i&cp=1&gs_id=8&q=%s",
  yahoo:          "https://search.yahoo.com/sugg/gossip/gossip-us-ura/?output=sd1&appid=search.yahoo.com&nresults=10&command=%s",
  bing:           "http://api.bing.com/osjson.aspx?query=%s",
  imdb:           "http://sg.media-imdb.com/suggests/",
  amazon:         "http://completion.amazon.com/search/complete?method=completion&search-alias=aps&client=amazon-search-ui&mkt=1&q=%s",
  wolframalpha:   "https://www.wolframalpha.com/input/autocomplete.jsp?qr=0&i=%s",
  ebay:           "https://autosug.ebay.com/autosug?kwd=%s",
  urbandictionary: "http://api.urbandictionary.com/v0/autocomplete?term=%s",
  "google-trends": "http://www.google.com/trends/entitiesQuery?tn=10&q=%s",
  "google-finance": "https://www.google.com/finance/match?matchtype=matchall&q=%s",
  webster:          "http://www.merriam-webster.com/autocomplete?query=%s",
  youtube:          "https://clients1.google.com/complete/search?client=youtube&hl=en&gl=us&gs_rn=23&gs_ri=youtube&ds=yt&cp=2&gs_id=d&q=%s",
  wictionary:       "http://en.wiktionary.org/w/api.php?action=opensearch&limit=15&format=json&search=%s",
  duckduckgo:       "https://duckduckgo.com/ac/?q=%s"
};

Complete.locales = {
  uk: {
    tld: "co.uk",
    requestUrls: ["google"],
    baseUrls: ["google"],
    apis: ["google"]
  },
  jp: {
    tld: "co.jp",
    requestUrls: ["google"],
    baseUrls: ["google"],
    apis: ["google"]
  }
};

Complete.setLocale = function(locale) {
  if (this.locales.hasOwnProperty(locale)) {
    locale = this.locales[locale];
  } else {
    return;
  }
  for (var key in locale) {
    if (key !== "tld") {
      for (var i = 0; i < locale[key].length; i++) {
        this[key][locale[key][i]] = this[key][locale[key][i]].replace(/\.com/, "." + locale.tld);
      }
    }
  }
};

Complete.convertToLink = function(input) {
  var prefix, suffix;
  input = input.replace(/@%/g, document.URL);
  input = input.split(/\s+/).compress();
  input.shift();
  if (input.length === 0) {
    return "";
  }
  input[0] = this.getAlias(input[0]) || input[0];
  if (Complete.engines.indexOf(input[0]) !== -1) {
    if (input.length > 1) {
      prefix = Complete.requestUrls[input[0]];
    } else {
      return Complete.baseUrls[input[0]];
    }
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
  return (prefix.indexOf("%s") !== -1 ?
      prefix.embedString(suffix) :
      prefix + suffix);
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
  this.xhr(this.apis.wikipedia.embedString(query), function(response) {
    callback(response[1].map(function(e) {
      return e;
    }));
  });
};

Complete.google = function(query, callback) {
  this.xhr(this.apis.google.embedString(query), function(response) {
    callback(response[1].map(function(e) {
      return e;
    }));
  });
};

Complete["google-image"] = function(query, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", this.apis["google-image"].embedString(query));
  xhr.onreadystatechange = function() {
    if (this.readyState === 4 && this.status === 200 && document.activeElement.id === "cVim-command-bar-input" && commandMode) {
      callback(JSON.parse(this.responseText.replace(/^[^\(]+\(|\)$/g, ""))[1].map(function(e) {
        return e[0].replace(/<[^>]+>/g, "");
      }));
    }
  };
  xhr.send();
};

Complete["google-trends"] = function(query, callback) {
  this.xhr(this.apis["google-trends"].embedString(encodeURIComponent(query)), function(response) {
    callback(response.entityList.map(function(e) {
      return [e.title + " - " + e.type, Complete.requestUrls["google-trends"] + encodeURIComponent(e.mid)];
    }));
  });
};

Complete["google-finance"] = function(query, callback) {
  this.xhr(this.apis["google-finance"].embedString(encodeURIComponent(query)), function(response) {
    callback(response.matches.map(function(e) {
      return [e.t + " - " + e.n + " - " + e.e, Complete.requestUrls["google-finance"] + e.e + ":" + e.t];
    }));
  });
};

Complete.amazon = function(query, callback) {
  this.xhr(this.apis.amazon.embedString(encodeURIComponent(query)), function(response) {
    callback(response[1].map(function(e) {
      return e;
    }));
  });
};

Complete.yahoo = function(query, callback) {
  this.xhr(this.apis.yahoo.embedString(encodeURIComponent(query)), function(response) {
    var _ret = [];
    for (var key in response.r) {
      if (response.r[key].hasOwnProperty("k")) {
        _ret.push(response.r[key].k);
      }
    }
    callback(_ret);
  });
};

Complete.bing = function(query, callback) {
  this.xhr(this.apis.bing.embedString(query), function(response) {
    callback(response[1].map(function(e) {
      return e;
    }));
  });
};

Complete.ebay = function(query, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", this.apis.ebay.embedString(encodeURIComponent(query)));
  xhr.onreadystatechange = function() {
    if (this.readyState === 4 && this.status === 200 && document.activeElement.id === "cVim-command-bar-input" && commandMode) {
      var _ret = JSON.parse(xhr.responseText.replace(/^[^\(]+\(|\)$/g, ""));
      if (!_ret.res) {
        return false;
      }
      callback(_ret.res.sug.map(function(e) {
        return e;
      }));
    }
  };
  xhr.send();
};

Complete.youtube = function(query, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", this.apis.youtube.embedString(query));
  xhr.onreadystatechange = function() {
    if (this.readyState === 4 && this.status === 200 && document.activeElement.id === "cVim-command-bar-input" && commandMode) {
      var _ret = JSON.parse(xhr.responseText.replace(/^[^\(]+\(|\)$/g, ""));
      callback(_ret[1].map(function(e) {
        return e[0];
      }));
    }
  };
  xhr.send();
};

Complete.wolframalpha = function(query, callback) {
  this.xhr(this.apis.wolframalpha.embedString(encodeURIComponent(query)), function(response) {
    callback(response.results.map(function(e) {
      return e.input;
    }));
  });
};

Complete.webster = function(query, callback) {
  this.xhr(this.apis.webster.embedString(encodeURIComponent(query)), function(response) {
    callback(response.suggestions.map(function(e) {
      return e;
    }));
  });
};

Complete.wictionary = function(query, callback) {
  this.xhr(this.apis.wictionary.embedString(encodeURIComponent(query)), function(response) {
    callback(response[1].map(function(e) {
      return e;
    }));
  });
};

Complete.duckduckgo = function(query, callback) {
  this.xhr(this.apis.duckduckgo.embedString(encodeURIComponent(query)), function(response) {
    callback(response.map(function(e) {
      return e.phrase;
    }).compress());
  });
};

Complete.urbandictionary = function(query, callback) {
  this.xhr(this.apis.urbandictionary.embedString(encodeURIComponent(query)), function(response) {
    callback(response.slice(1).map(function(e) {
      return e;
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
          return [e.l, e.id];
        }
        var _url = "http://www.imdb.com/" + (e.id.indexOf("nm") === 0 ? "name" : "title") + "/" + e.id;
        if (e.q) {
          return [e.l + " - " + e.q + ", " + e.s + " (" + e.y + ")", _url];
        }
        return [e.l + " - " + e.s, _url];
      }));
    }
  };
  xhr.send();
};
