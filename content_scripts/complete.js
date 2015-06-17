var Complete = {};

(function() {
  var CALLBACKS = {};

  window.httpCallback = function(id, response) {
    if (typeof CALLBACKS[id] === 'function') {
      CALLBACKS[id](response);
    }
    delete CALLBACKS[id];
  };

  window.httpRequest = function(request, callback) {
    var id = Math.random().toString().slice(2);
    CALLBACKS[id] = callback;
    PORT('httpRequest', {request: request, id: id});
  };

})();


Complete.defaultEngine = "google";
Complete.aliases = {
  g: 'google'
};

Complete.hasAlias = function(alias) {
  return this.aliases.hasOwnProperty(alias);
};

Complete.getAlias = function(alias) {
  return this.aliases[alias] || '';
};

Complete.setDefaultEngine = function(newDefault) {
  this.defaultEngine = newDefault;
}

Complete.usingEngine = function(key) {
  return ~this.engines.indexOf(key);
}

Complete.setUsedEngines = function (keysToUse) {
  this.engines = this.engines.filter(function(e) {
    return ~keysToUse.indexOf(e);
  });
}

Complete.matchingEngines = function(partialKey, cb) {
  var engines = [];
  for (var i = 0; i < this.engines.length; i++) {
    if (!partialKey || !this.engines[i].indexOf(partialKey)) {
      cb(Complete.engines[i],
        Complete.engineMap[Complete.engines[i]].requestUrl());
    }
  }
}

Complete.completeWithEngine = function(key, query, cb)
{
  var e = this.engineMap[key];

  if (this.usingEngine(key) &&
      e !== undefined &&
      e.hasOwnProperty("search")) {
    return e.search(query, cb);
  }
}

Complete.addBasicEngine = function(key, requestUrl) {
  Object.create(Complete.Engine, {
    name: {value: key},
    requestUrl: {value: function() {
      return requestUrl;
    }},
  }).registerEngine();
}

var localeDomain = function(l) {
  return {
    uk: "uk",
    jp: "jp",
    aus: "au",
  }[l];
}

var localeTld = function(l) {
  var d = localeDomain(l);
  return {
    uk: 'co.' + d,
    jp: 'co.' + d,
    aus: 'com.' + d,
  }[l] || "com";
};

var localeLangCode = function(l) {
  return {
    uk: 'en',
    jp: 'jp',
    aus: 'en',
  }[l] || 'en';
}


Complete.setLocale = function(locale) {
  this.newLocale = locale;
};

Complete.convertToLink = function(input, isURL, isLink) {
  var prefix, suffix;
  input = input.replace(/@%/g, document.URL)
               .split(/\s+/)
               .compress()
               .slice(1);
  if (input.length === 0)
    return '';
  input[0] = this.getAlias(input[0]) || input[0];

  var e = Complete.engineMap[input[0]];

  if (e !== undefined) {
    if (input.length > 1) {
      prefix = e.requestUrl();
    } else {
      return e.baseUrl();
    }
    suffix = input.slice(1).join(' ');
  } else {
    suffix = input.join(' ');
    if (!isLink && (isURL || suffix.validURL())) {
      return (!/^[a-zA-Z\-]+:/.test(suffix) ? 'http://' : '') +
        suffix;
    }
    e = Complete.engineMap[Complete.defaultEngine];
  }

  if (suffix.validURL()) {
    return suffix.convertLink();
  }

  return e.embedQueryForRequest.call(e, suffix);
};

Complete.engines = [];
Complete.engineMap = {};

Complete.Engine = {

  //handy internal function
  _embedOrAppend: function(template, q) {
    return ~template.indexOf('%s') ?
      template.embedString(q) :
      template + q;
  },

  _queryEmbedders: {
    'encodeuri': function(url, q) {
      return Complete.Engine._embedOrAppend(url, encodeURIComponent(q));
    },
  },

  _callbacks: {
    'newlinesplit': function(cb) { return function(response) {
      cb(response.split('\n').map(function(e) {
        return e;
      }));
    }},
  },

  _localeTld: function(url) {
    return url.replace(/\.com/, '.' + localeTld(Complete.newLocale));
  },
  _localeDomain: function() {
    return localeDomain(Complete.newLocale);
  },

  registerEngine: function() {
    Complete.engines.push(this.name);
    Complete.engineMap[this.name] = this;
  },

  // normally these are just URI encoded, even if the API is not
  embedQueryForRequest: function(q) {
    return this._queryEmbedders.encodeuri(this.requestUrl(), q);
  },

};

Object.create(Complete.Engine, {
  name: {value: "octopart"},
  baseUrl: {value: function() {
    return "https://octopart.com";
  }},
  requestUrl: {value: function() {
    return "https://octopart.com/search?q=";
  }},

  search: {value: function(query, callback) {
    var api = "https://octopart.com/suggest?q=";
    httpRequest({
      url: this._queryEmbedders.encodeuri(api, query),
      json: false
    },
    this._callbacks.newlinesplit(callback)
    );
  }},
}).registerEngine();

Object.create(Complete.Engine, {
  name: {value: "google"},
  baseUrl: {value: function() {
    return Complete.Engine._localeTld("https://www.google.com");
  }},
  requestUrl: {value: function() {
    return Complete.Engine._localeTld("https://www.google.com/search?q=");
  }},

  search: {value: function(query, callback) {
    var api = this._localeTld("https://www.google.com/complete/search?client=chrome-omni&gs_ri=chrome-ext&oit=1&cp=1&pgcl=7&q=");
    httpRequest({
      url: this._embedOrAppend(api, query),
      json: true
    },
    function(response) {
      var data = response[1].map(function(e, i) {
        return {
          type: response[4]['google:suggesttype'][i],
          text: e
        };
      });
      callback(data.sort(function(a) {
        return a.type !== 'NAVIGATION';
      }).map(function(e) { return e.text; }));
    });
  }},
}).registerEngine();

Object.create(Complete.Engine, {
  name: {value: 'google-maps'},

  baseUrl: {value: function() {
    return Complete.Engine._localeTld("https://www.google.com/maps");
  }},
  requestUrl: {value: function() {
    return Complete.Engine._localeTld("https://www.google.com/maps/search/");
  }},

  search: {value: function(query, callback) {
    var api = this._localeTld("http://www.google.com") + "/s?tbm=map&fp=1&gs_ri=maps&source=hp&suggest=p&authuser=0&hl=en&pf=p&tch=1&ech=2&q=";
    httpRequest({
      url: api + query,
      json: false
    }, function(response) {
      var data = JSON.parse(response.replace(/\/\*[^\*]+\*\//g, '')).d;
      data = data.substring(data.indexOf("["));
      data = JSON.parse(data)[0][1];

      data = data.map(function(e) {
        return e[e.length-1][0][0];
      });
      callback(data);
    });
  }},
}).registerEngine();

Object.create(Complete.Engine, {
  name: {value: 'google-image'},
  baseUrl: {value: function() {
    return this._localeTld("https://www.google.com") + "/imghp";
  }},
  requestUrl: {value: function() {
    return this._localeTld("https://www.google.com") + "/search?tbm=isch&q=";
  }},
  search: {value: function(query, callback) {
    var api = this._localeTld("https://www.google.com") + "/complete/search?client=img&hl=en&gs_rn=43&gs_ri=img&ds=i&cp=1&gs_id=8&q=";
    httpRequest({
      url: api + query,
      json: false
    }, function(response) {
      callback(JSON.parse(response.replace(/^[^\(]+\(|\)$/g, ''))[1].map(function(e) {
        return e[0].replace(/<[^>]+>/g, '');
      }));
    });
  }},
}).registerEngine();

Object.create(Complete.Engine, {
  name: {value: 'google-trends'},
  baseUrl: {value: function() {
    return this._localeTld("https://www.google.com") + "/trends";
  }},
  requestUrl: {value: function() {
    return this.baseUrl() + "/explore#q=";
  }},
  search: {value: function(query, callback) {
    var api = this.baseUrl() + "/entitiesQuery?tn=10&q="
    var me = this;
    httpRequest({
      url: api + encodeURIComponent(query),
      json: true
    }, function(response) {
      callback(response.entityList.map(function(e) {
        return [e.title + ' - ' + e.type, me.requestUrl() + encodeURIComponent(e.mid)];
      }));
    });
  }},
}).registerEngine();

Object.create(Complete.Engine, {
  name: {value: 'google-finance'},
  baseUrl: {value: function() {
    return this._localeTld("https://www.google.com") + "/finance";
  }},
  requestUrl: {value: function() {
    return this.baseUrl() + "?q=";
  }},
  search: {value: function(query, callback) {
    var api = this.baseUrl() + "/match?matchtype=matchall&q="
    var me = this;
    httpRequest({
      url: api + encodeURIComponent(query),
      json: true
    }, function(response) {
      callback(response.matches.map(function(e) {
        return [e.t + ' - ' + e.n + ' - ' + e.e, me.requestUrl() + e.e + ':' + e.t];
      }));
    });
  }},
}).registerEngine();

var wikiEngine = function(wiki, hasLangDomains) {
  return Object.create(Complete.Engine, {
    name: {value: wiki.split(".")[0]},
    baseUrl: {value: function() {
      var dom = (hasLangDomains ? (localeLangCode(Complete.newLocale) + ".") : "");
      console.log(dom);
      return "http://" + dom + wiki;
    }},
    requestUrl: {value: function() {
      return this.baseUrl() + "/wiki/";
    }},
    embedQueryForRequest: {value: function(q) {
        return this._embedOrAppend(this.requestUrl(), q.replace(' ', '_'));
    }},
    search: {value: function(query, callback) {
      var api = this.baseUrl() + "/w/api.php?action=opensearch&format=json&search=";
      httpRequest({
        url: this._embedOrAppend(api, query),
        json: true
      }, function(response) {
        callback(response[1]);
      });
    }},
})};

wikiEngine("wikipedia.org", true).registerEngine();
wikiEngine("wiktionary.org", true).registerEngine();
wikiEngine("wikispecies.org", false).registerEngine();
wikiEngine("wikisource.org", true).registerEngine();
wikiEngine("wikiquote.org", false).registerEngine();
wikiEngine("wikibooks.org", true).registerEngine();
wikiEngine("commons.wikimedia.org", false).registerEngine();
wikiEngine("wikinews.org", true).registerEngine();
wikiEngine("wikiversity.org", true).registerEngine();
wikiEngine("wikivoyage.org", true).registerEngine();

Object.create(Complete.Engine, {
  name: {value: "amazon"},
  baseUrl: {value: function() {
    return "https://" + this._localeTld("amazon.com");
  }},
  requestUrl: {value: function() {
    return this.baseUrl() + "/s/?field-keywords="
  }},
  search: {value: function(query, callback) {
    var mkt = {
      uk : 3
    }[Complete.newLocale] || 1;

    var api = "https://completion." + this._localeTld("amazon.com") + "/search/complete?method=completion&search-alias=aps&client=amazon-search-ui&mkt=" + mkt + "&q="
    httpRequest({
      url: api + encodeURIComponent(query),
      json: true
    }, function(response) {
      callback(response[1]);
    });
  }},
}).registerEngine();

Object.create(Complete.Engine, {
  name: {value: "yahoo"},
  baseUrl: {value: function() {
    return "https://" + this._localeDomain() + ".search.yahoo.com";
  }},
  requestUrl: {value: function() {
    return this.baseUrl() + "/search?p="
  }},
  search: {value: function(query, callback) {
    var api = this.baseUrl() + "/sugg/gossip/gossip-" + this._localeDomain()
      + "-ura/?output=sd1&appid=search.yahoo.com&nresults=20&command=";
    httpRequest({
      url: api + encodeURIComponent(query),
      json: true
    }, function(response) {
      var _ret = [];
      for (var key in response.r) {
        if (response.r[key].hasOwnProperty('k')) {
          _ret.push(response.r[key].k);
        }
      }
      callback(_ret);
    });
  }},
}).registerEngine();

Object.create(Complete.Engine, {
  name: {value: "answers"},
  baseUrl: {value: function() {
    return "https://answers.yahoo.com";
  }},
  requestUrl: {value: function() {
    return this.baseUrl() + "/search/search_result?p="
  }},
  search: {value: function(query, callback) {
    var api = "https://search.yahoo.com/sugg/ss/gossip-" +  "us" //this._localeDomain()
      + "_ss-vertical_ss/?output=sd1&pubid=1307&appid=yanswer&command=%s&nresults=20";
    httpRequest({
      url: api.embedString(encodeURIComponent(query)),
      json: true
    }, function(response) {
      callback(response.r.map(function(e) {
       return [e.k, 'https://answers.yahoo.com/question/index?qid=' + e.d.replace(/^\{qid:|,.*/g, '')];
      }));
    });
  }}
}).registerEngine();

Object.create(Complete.Engine, {
  name: {value: "bing"},
  baseUrl: {value: function() {
    return "https://" + this._localeTld("www.bing.com");
  }},
  requestUrl: {value: function() {
    return "https://www.bing.com/search?q=%s&cc=" + this._localeDomain();
  }},
  search: {value: function(query, callback) {
    var api = "https://www.bing.com/osjson.aspx?query=%s&cc=" + this._localeDomain();
    httpRequest({
      url: api.embedString(query),
      json: true
    }, function(response) {
      callback(response[1].map(function(e) {
        return e;
      }));
    });
  }}
}).registerEngine();

Object.create(Complete.Engine, {
  name: {value: "ebay"},
  baseUrl: {value: function() {
    return "https://" + this._localeTld("ebay.com");
  }},
  requestUrl: {value: function() {
    return this.baseUrl() + "/sch/i.html?_nkw="
  }},
  search: {value: function(query, callback) {
    var sid = {
      uk: 3,
      fr: 71,
    }[Complete.newLocale] || 0;
    var api = "http://autosug.ebaystatic.com/autosug?kwd=%s&sId=" + sid;
    httpRequest({
      url: api.embedString(encodeURIComponent(query)),
      json: false
    }, function(response) {
      var _ret = JSON.parse(response.replace(/^[^\(]+\(|\)$/g, ''));
      if (!_ret.res) {
        return false;
      }
      callback(_ret.res.sug.map(function(e) {
        return e;
      }));
    });
  }}
}).registerEngine();


Object.create(Complete.Engine, {
  name: {value: "youtube"},
  baseUrl: {value: function() {
    return "https://youtube.com";
  }},
  requestUrl: {value: function() {
    return this.baseUrl() + "/results?search_query="
  }},
  search: {value: function(query, callback) {
    var api = "https://clients1.google.com/complete/search?client=youtube&hl=en&gl=us&gs_rn=23&gs_ri=youtube&ds=yt&cp=2&gs_id=d&q=%s";
    httpRequest({
      url: api.embedString(query),
      json: false
    }, function(response) {
      var _ret = JSON.parse(response.replace(/^[^\(]+\(|\)$/g, ''));
      callback(_ret[1].map(function(e) {
        return e[0];
      }));
    });
  }}
}).registerEngine();

Object.create(Complete.Engine, {
  name: {value: "wolframalpha"},
  baseUrl: {value: function() {
    return "https://www.wolframalpha.com";
  }},
  requestUrl: {value: function() {
    return this.baseUrl() + "/input/?i="
  }},
  search: {value: function(query, callback) {
    var api = this.baseUrl() + "/input/autocomplete.jsp?qr=0&i="
    httpRequest({
      url: api + encodeURIComponent(query),
      json: true
    }, function(response) {
      callback(response.results.map(function(e) {
        return e.input;
      }));
    });
  }}
}).registerEngine();

Object.create(Complete.Engine, {
  name: {value: "webster"},
  baseUrl: {value: function() {
    return "http://www.merriam-webster.com";
  }},
  requestUrl: {value: function() {
    return this.baseUrl() + "/dictionary/"
  }},
  search: {value: function(query, callback) {
    var api = this.baseUrl() + "/autocomplete?query="
    httpRequest({
      url: api + encodeURIComponent(query),
      json: true
    }, function(response) {
      callback(response.suggestions.map(function(e) {
        return e;
      }));
    });
  }}
}).registerEngine();

Object.create(Complete.Engine, {
  name: {value: "duckduckgo"},
  baseUrl: {value: function() {
    return "https://duckduckgo.com";
  }},
  requestUrl: {value: function() {
    return this.baseUrl() + "/?q="
  }},
  search: {value: function(query, callback) {
    httpRequest({
      url: this.baseUrl() + "/ac/?q=" + encodeURIComponent(query),
      json: true
    }, function(response) {
      callback(response.map(function(e) {
        return e.phrase;
      }).compress());
    });
  }}
}).registerEngine();

Object.create(Complete.Engine, {
  name: {value: "urbandictionary"},
  baseUrl: {value: function() {
    return "http://www.urbandictionary.com";
  }},
  requestUrl: {value: function() {
    return this.baseUrl() + "/define.php?term="
  }},
  search: {value: function(query, callback) {
    var api = "http://api.urbandictionary.com/v0/autocomplete?term=";
    httpRequest({
      url: api + encodeURIComponent(query),
      json: true
    }, function(response) {
      callback(response.slice(1).map(function(e) {
        return e;
      }));
    });
  }}
}).registerEngine();


Object.create(Complete.Engine, {
  name: {value: "imdb"},
  baseUrl: {value: function() {
    return "http://www.imdb.com";
  }},
  requestUrl: {value: function() {
    return this.baseUrl() + "/find?s=all&q="
  }},
  search: {value: function(query, callback) {
    var api = "http://sg.media-imdb.com/suggests/";
    httpRequest({
      url: api + query[0] + '/' + query.replace(/ /g, '_') + '.json',
      json: false
    }, function(response) {
      var _ret = JSON.parse(response.replace(/^[^\(]+\(|\)$/g, ''));
      callback(_ret.d.map(function(e) {
        if (/:\/\//.test(e.id)) {
          return [e.l, e.id];
        }
        var _url = 'http://www.imdb.com/' + (e.id.indexOf('nm') === 0 ? 'name' : 'title') + '/' + e.id;
        if (e.q) {
          return [e.l + ' - ' + e.q + ', ' + e.s + ' (' + e.y + ')', _url];
        }
        return [e.l + ' - ' + e.s, _url];
      }));
    });
  }}
}).registerEngine();
