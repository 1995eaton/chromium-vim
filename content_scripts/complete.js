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

Object.create(Complete.Engine, {
  name: {value: "wikipedia"},
  baseUrl: {value: function() {
    return "https://" + localeLangCode(Complete.newLocale) + ".wikipedia.org";
  }},
  requestUrl: {value: function() {
    return "https://" + localeLangCode(Complete.newLocale) + ".wikipedia.org/wiki/";
  }},
  embedQueryForRequest: {value: function(q) {
      return this._embedOrAppend(this.requestUrl(), q.replace(' ', '_'));
  }},
  search: {value: function(query, callback) {
    var api = "https://" + localeLangCode(Complete.newLocale) + ".wikipedia.org/w/api.php?action=opensearch&format=json&search=";
    httpRequest({
      url: this._embedOrAppend(api, query),
      json: true
    }, function(response) {
      callback(response[1]);
    });
  }},
}).registerEngine();

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


// old structures

Complete.engines = ['google', 'wikipedia', 'youtube', 'imdb', 'amazon', 'google-maps', 'wolframalpha', 'google-image', 'ebay', 'webster', 'wictionary', 'urbandictionary', 'duckduckgo', 'answers', 'google-trends', 'google-finance', 'yahoo', 'bing'];

Complete.requestUrls = {
  wikipedia:      'https://en.wikipedia.org/wiki/',
  google:         'https://www.google.com/search?q=',
  'google-image': 'https://www.google.com/search?site=imghp&tbm=isch&source=hp&q=',
  'google-maps':  'https://www.google.com/maps/search/',
  duckduckgo:     'https://duckduckgo.com/?q=',
  yahoo:          'https://search.yahoo.com/search?p=',
  answers:        'https://answers.yahoo.com/search/search_result?p=',
  bing:           'https://www.bing.com/search?q=',
  imdb:           'http://www.imdb.com/find?s=all&q=',
  amazon:         'http://www.amazon.com/s/?field-keywords=',
  wolframalpha:   'https://www.wolframalpha.com/input/?i=',
  ebay:           'https://www.ebay.com/sch/i.html?_sacat=0&_from=R40&_nkw=',
  urbandictionary: 'http://www.urbandictionary.com/define.php?term=',
  'google-trends': 'http://www.google.com/trends/explore#q=',
  'google-finance': 'https://www.google.com/finance?q=',
  webster:          'http://www.merriam-webster.com/dictionary/',
  youtube:          'https://www.youtube.com/results?search_query=',
  wictionary:       'http://en.wiktionary.org/wiki/'
};

Complete.baseUrls = {
  wikipedia:      'https://en.wikipedia.org/wiki/Main_Page',
  google:         'https://www.google.com',
  'google-image': 'http://www.google.com/imghp',
  'google-maps':  'https://www.google.com/maps/preview',
  duckduckgo:     'https://duckduckgo.com',
  yahoo:          'https://search.yahoo.com',
  answers:        'https://answers.yahoo.com',
  bing:           'https://www.bing.com',
  imdb:           'http://www.imdb.com',
  amazon:         'http://www.amazon.com',
  wolframalpha:   'https://www.wolframalpha.com',
  ebay:           'http://www.ebay.com',
  urbandictionary: 'http://www.urbandictionary.com',
  'google-trends': 'http://www.google.com/trends/',
  'google-finance': 'https://www.google.com/finance',
  webster:          'http://www.merriam-webster.com',
  youtube:          'https://www.youtube.com',
  wictionary:       'https://en.wiktionary.org/wiki/Wiktionary:Main_Page'
};

Complete.parseQuery = {
  wikipedia: function(query) {
    return query.replace(' ', '_');
  },
  bing: function(query) {
    return query + '&FORM=SEEMOR';
  },
  wolframalpha: function(query) {
    return encodeURIComponent(query);
  },
  imdb: function(query) {
    return encodeURIComponent(query);
  },
  'google-finance': function(query) {
    return encodeURIComponent(query);
  },
  wictionary: function(query) {
    return query.replace(' ', '_');
  }
};

Complete.apis = {
  wikipedia:      'https://en.wikipedia.org/w/api.php?action=opensearch&format=json&search=%s',
  google:         'https://www.google.com/complete/search?client=chrome-omni&gs_ri=chrome-ext&oit=1&cp=1&pgcl=7&q=%s',
  'google-image': 'http://www.google.com/complete/search?client=img&hl=en&gs_rn=43&gs_ri=img&ds=i&cp=1&gs_id=8&q=%s',
  yahoo:          'https://search.yahoo.com/sugg/gossip/gossip-us-ura/?output=sd1&appid=search.yahoo.com&nresults=20&command=%s',
  answers:        'https://search.yahoo.com/sugg/ss/gossip-us_ss-vertical_ss/?output=sd1&pubid=1307&appid=yanswer&command=%s&nresults=20',
  bing:           'http://api.bing.com/osjson.aspx?query=%s',
  imdb:           'http://sg.media-imdb.com/suggests/',
  amazon:         'https://completion.amazon.com/search/complete?method=completion&search-alias=aps&client=amazon-search-ui&mkt=1&q=%s',
  wolframalpha:   'https://www.wolframalpha.com/input/autocomplete.jsp?qr=0&i=%s',
  ebay:           'https://autosug.ebay.com/autosug?kwd=%s',
  urbandictionary: 'http://api.urbandictionary.com/v0/autocomplete?term=%s',
  'google-maps':   'https://www.google.com/s?tbm=map&fp=1&gs_ri=maps&source=hp&suggest=p&authuser=0&hl=en&pf=p&tch=1&ech=2&q=%s',
  'google-trends': 'http://www.google.com/trends/entitiesQuery?tn=10&q=%s',
  'google-finance': 'https://www.google.com/finance/match?matchtype=matchall&q=%s',
  webster:          'http://www.merriam-webster.com/autocomplete?query=%s',
  youtube:          'https://clients1.google.com/complete/search?client=youtube&hl=en&gl=us&gs_rn=23&gs_ri=youtube&ds=yt&cp=2&gs_id=d&q=%s',
  wictionary:       'http://en.wiktionary.org/w/api.php?action=opensearch&limit=15&format=json&search=%s',
  duckduckgo:       'https://duckduckgo.com/ac/?q=%s'
};

Complete.locales = {
  uk: {
    tld: 'co.uk',
    requestUrls: ['google'],
    baseUrls: ['google'],
    apis: ['google']
  },
  jp: {
    tld: 'co.jp',
    requestUrls: ['google'],
    baseUrls: ['google'],
    apis: ['google']
  },
  aus: {
    tld: 'com.au',
    requestUrls: ['google'],
    baseUrls: ['google'],
    apis: ['google']
  }
};

Complete.wikipedia = function(query, callback) {
  httpRequest({
    url: this.apis.wikipedia.embedString(query),
    json: true
  }, function(response) {
    callback(response[1]);
  });
};

Complete.google = function(query, callback) {
  httpRequest({
    url: this.apis.google.embedString(query),
    json: true
  }, function(response) {
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
};

Complete['google-maps'] = function(query, callback) {
  httpRequest({
    url: this.apis['google-maps'].embedString(query),
    json: false
  }, function(response) {
    var data = JSON.parse(JSON.parse(JSON.stringify(response.replace(/\/\*[^\*]+\*\//g, '')))).d;
    data = data.replace(/^[^,]+,/, '')
               .replace(/\n\][^\]]+\][^\]]+$/, '')
               .replace(/,+/g, ',')
               .replace(/\n/g, '')
               .replace(/\[,/g, '[');
    data = JSON.parse(data);
    data = data.map(function(e) {
      return e[0][0][0];
    });
    callback(data);
  });
};

Complete['google-image'] = function(query, callback) {
  httpRequest({
    url: this.apis['google-image'].embedString(query),
    json: false
  }, function(response) {
    callback(JSON.parse(response.replace(/^[^\(]+\(|\)$/g, ''))[1].map(function(e) {
      return e[0].replace(/<[^>]+>/g, '');
    }));
  });
};

Complete['google-trends'] = function(query, callback) {
  httpRequest({
    url: this.apis['google-trends'].embedString(encodeURIComponent(query)),
    json: true
  }, function(response) {
    callback(response.entityList.map(function(e) {
      return [e.title + ' - ' + e.type, Complete.requestUrls['google-trends'] + encodeURIComponent(e.mid)];
    }));
  });
};

Complete['google-finance'] = function(query, callback) {
  httpRequest({
    url: this.apis['google-finance'].embedString(encodeURIComponent(query)),
    json: true
  }, function(response) {
    callback(response.matches.map(function(e) {
      return [e.t + ' - ' + e.n + ' - ' + e.e, Complete.requestUrls['google-finance'] + e.e + ':' + e.t];
    }));
  });
};

Complete.amazon = function(query, callback) {
  httpRequest({
    url: this.apis.amazon.embedString(encodeURIComponent(query)),
    json: true
  }, function(response) {
    callback(response[1]);
  });
};

Complete.yahoo = function(query, callback) {
  httpRequest({
    url: this.apis.yahoo.embedString(encodeURIComponent(query)),
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
};

Complete.answers = function(query, callback) {
  httpRequest({
    url: this.apis.answers.embedString(encodeURIComponent(query)),
    json: true
  }, function(response) {
    callback(response.r.map(function(e) {
     return [e.k, 'https://answers.yahoo.com/question/index?qid=' + e.d.replace(/^\{qid:|,.*/g, '')];
    }));
  });
};

Complete.bing = function(query, callback) {
  httpRequest({
    url: this.apis.bing.embedString(query),
    json: true
  }, function(response) {
    callback(response[1].map(function(e) {
      return e;
    }));
  });
};

Complete.ebay = function(query, callback) {
  httpRequest({
    url: this.apis.ebay.embedString(encodeURIComponent(query)),
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
};

Complete.youtube = function(query, callback) {
  httpRequest({
    url: this.apis.youtube.embedString(query),
    json: false
  }, function(response) {
    var _ret = JSON.parse(response.replace(/^[^\(]+\(|\)$/g, ''));
    callback(_ret[1].map(function(e) {
      return e[0];
    }));
  });
};

Complete.wolframalpha = function(query, callback) {
  httpRequest({
    url: this.apis.wolframalpha.embedString(encodeURIComponent(query)),
    json: true
  }, function(response) {
    callback(response.results.map(function(e) {
      return e.input;
    }));
  });
};

Complete.webster = function(query, callback) {
  httpRequest({
    url: this.apis.webster.embedString(encodeURIComponent(query)),
    json: true
  }, function(response) {
    callback(response.suggestions.map(function(e) {
      return e;
    }));
  });
};

Complete.wictionary = function(query, callback) {
  httpRequest({
    url: this.apis.wictionary.embedString(encodeURIComponent(query)),
    json: true
  }, function(response) {
    callback(response[1].map(function(e) {
      return e;
    }));
  });
};

Complete.duckduckgo = function(query, callback) {
  httpRequest({
    url: this.apis.duckduckgo.embedString(encodeURIComponent(query)),
    json: true
  }, function(response) {
    callback(response.map(function(e) {
      return e.phrase;
    }).compress());
  });
};

Complete.urbandictionary = function(query, callback) {
  httpRequest({
    url: this.apis.urbandictionary.embedString(encodeURIComponent(query)),
    json: true
  }, function(response) {
    callback(response.slice(1).map(function(e) {
      return e;
    }));
  });
};

Complete.imdb = function(query, callback) {
  httpRequest({
    url: this.apis.imdb + query[0] + '/' + query.replace(/ /g, '_') + '.json',
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
};
