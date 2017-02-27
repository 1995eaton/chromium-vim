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

var Complete = {

  locales: {
    uk: {
      tld: 'co.uk',
      requestUrl: ['google', 'youtube'],
      baseUrl: ['google', 'youtube'],
      apiUrl: ['google', 'youtube']
    },
    jp: {
      tld: 'co.jp',
      requestUrl: ['google', 'youtube'],
      baseUrl: ['google', 'youtube'],
      apiUrl: ['google', 'youtube']
    },
    aus: {
      tld: 'com.au',
      requestUrl: ['google', 'youtube'],
      baseUrl: ['google', 'youtube'],
      apiUrl: ['google', 'youtube']
    }
  },

  aliases: {
    g: 'google'
  },

  activeEngines: [],

  convertToLink: function(input, isURL, isLink) {
    input = input.replace(/@%/g, document.URL).split(/\s+/);
    input = Utils.compressArray(input).slice(1);

    if (input.length === 0)
      return '';

    input[0] = this.getAlias(input[0]) || input[0];
    if (!this.hasEngine(input[0])) {
      if (!isLink && (isURL || Utils.isValidURL(input.join(' ')))) {
        input = input.join(' ');
        return (!/^[a-zA-Z\-]+:/.test(input) ? 'http://' : '') +
          input;
      }
      var defaultEngine = this.getEngine(settings.defaultengine);
      return (defaultEngine ? defaultEngine.requestUrl :
                              this.getEngine('google').requestUrl) +
        encodeURIComponent(input.join(' '));
    }

    var engine = this.getEngine(input[0]);
    if (input.length <= 1)
      return engine.baseUrl;

    var prefix = engine.requestUrl;
    var suffix = engine.hasOwnProperty('formatRequest') ?
      engine.formatRequest(input.slice(1).join(' ')) :
      encodeURIComponent(input.slice(1).join(' '));

    if (Utils.isValidURL(suffix))
      return Utils.toSearchURL(suffix);
    return Utils.format(prefix, suffix);
  },

  setLocale: function(locale) {
    if (!this.locales.hasOwnProperty(locale))
      return;
    locale = this.locales[locale];
    var self = this;
    ['baseUrl', 'apiUrl', 'requestUrl'].forEach(function(prop) {
      locale[prop].forEach(function(engineName) {
        var engine = self.getEngine(engineName);
        engine[prop] = engine[prop].replace(/\.com/, '.' + locale.tld);
      });
    });
  },

  addEngine: function(name, props) {
    if (typeof props === 'string') {
      this.engines[name] = {
        requestUrl: props
      };
    } else {
      this.engines[name] = props;
    }
    if (!this.engineEnabled(name))
      this.activeEngines.push(name);
  },
  getEngine: function(name) {
    return this.engines[name] || null;
  },
  queryEngine: function(name, query, callback) {
    var engine = this.engines[name];
    if (!engine.hasOwnProperty('queryApi'))
      callback([]);
    else
      engine.queryApi(query, callback);
  },
  getMatchingEngines: function(prefix) {
    return this.activeEngines.filter(function(name) {
      return name.indexOf(prefix) === 0;
    });
  },
  addAlias: function(alias, value) {
    this.aliases[alias] = value;
  },
  hasAlias: function(alias) {
    return this.aliases.hasOwnProperty(alias);
  },
  getAlias: function(alias) {
    return this.aliases[alias];
  },
  hasEngine: function(name) {
    return this.engines.hasOwnProperty(name);
  },
  enableEngine: function(name) {
    if (this.hasEngine(name))
      this.activeEngines.push(name);
  },
  engineEnabled: function(name) {
    return this.activeEngines.indexOf(name) !== -1;
  }
};

Complete.engines = {
  google: {
    baseUrl: 'https://www.google.com',
    requestUrl: 'https://www.google.com/search?q=',
    apiUrl: 'https://www.google.com/complete/search?client=chrome-omni&gs_ri=chrome-ext&oit=1&cp=1&pgcl=7&q=%s',
    queryApi: function(query, callback) {
      httpRequest({
        url: Utils.format(this.apiUrl, query),
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
    }
  },

  wikipedia: {
    baseUrl: 'https://en.wikipedia.org/wiki/Main_Page',
    requestUrl: 'https://en.wikipedia.org/w/index.php?search=%s&title=Special:Search',
    apiUrl: 'https://en.wikipedia.org/w/api.php?action=opensearch&format=json&search=%s',
    formatRequest: function(query) {
      return encodeURIComponent(query).split('%20').join('+');
    },
    queryApi: function(query, callback) {
      httpRequest({
        url: Utils.format(this.apiUrl, query),
        json: true
      }, function(response) {
        callback(response[1]);
      });
    }
  },

  'google-maps': {
    baseUrl: 'https://www.google.com/maps/preview',
    requestUrl: 'https://www.google.com/maps/search/',
    apiUrl: 'https://www.google.com/s?tbm=map&fp=1&gs_ri=maps&source=hp&suggest=p&authuser=0&hl=en&pf=p&tch=1&ech=2&q=%s',
    queryApi: function(query, callback) {
      httpRequest({
        url: Utils.format(this.apiUrl, query),
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
    }
  },

  'google-image': {
    baseUrl: 'http://www.google.com/imghp',
    requestUrl: 'https://www.google.com/search?site=imghp&tbm=isch&source=hp&q=',
    apiUrl: 'http://www.google.com/complete/search?client=img&hl=en&gs_rn=43&gs_ri=img&ds=i&cp=1&gs_id=8&q=%s',
    queryApi: function(query, callback) {
      httpRequest({
        url: Utils.format(this.apiUrl, query),
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
    }
  },

  'google-trends': {
    baseUrl: 'http://www.google.com/trends/',
    requestUrl: 'http://www.google.com/trends/explore#q=',
    apiUrl: 'http://www.google.com/trends/entitiesQuery?tn=10&q=%s',
    queryApi: function(query, callback) {
      httpRequest({
        url: Utils.format(this.apiUrl, encodeURIComponent(query)),
        json: true
      }, function(response) {
        callback(response.entityList.map(function(e) {
          return [e.title + ' - ' + e.type, this.requestUrl + encodeURIComponent(e.mid)];
        }.bind(this)));
      }.bind(this));
    }
  },

  'google-finance': {
    baseUrl: 'https://www.google.com/finance',
    requestUrl: 'https://www.google.com/finance?q=',
    apiUrl: 'https://www.google.com/finance/match?matchtype=matchall&q=%s',
    queryApi: function(query, callback) {
      httpRequest({
        url: Utils.format(this.apiUrl, encodeURIComponent(query)),
        json: true
      }, function(response) {
        callback(response.matches.map(function(e) {
          return [e.t + ' - ' + e.n + ' - ' + e.e, this.requestUrl + e.e + ':' + e.t];
        }.bind(this)));
      }.bind(this));
    }
  },

  amazon: {
    baseUrl: 'http://www.amazon.com',
    requestUrl: 'http://www.amazon.com/s/?field-keywords=',
    apiUrl: 'https://completion.amazon.com/search/complete?method=completion&search-alias=aps&client=amazon-search-ui&mkt=1&q=%s',
    queryApi: function(query, callback) {
      httpRequest({
        url: Utils.format(this.apiUrl, encodeURIComponent(query)),
        json: true
      }, function(response) {
        callback(response[1]);
      });
    }
  },

  yahoo: {
    baseUrl: 'https://search.yahoo.com',
    requestUrl: 'https://search.yahoo.com/search?p=',
    apiUrl: 'https://search.yahoo.com/sugg/gossip/gossip-us-ura/?output=sd1&appid=search.yahoo.com&nresults=20&command=%s',
    queryApi: function(query, callback) {
      httpRequest({
        url: Utils.format(this.apiUrl, encodeURIComponent(query)),
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
    }
  },

  answers: {
    baseUrl: 'https://answers.yahoo.com',
    requestUrl: 'https://answers.yahoo.com/search/search_result?p=',
    apiUrl: 'https://search.yahoo.com/sugg/ss/gossip-us_ss-vertical_ss/?output=sd1&pubid=1307&appid=yanswer&command=%s&nresults=20',
    queryApi: function(query, callback) {
      httpRequest({
        url: Utils.format(this.apiUrl, encodeURIComponent(query)),
        json: true
      }, function(response) {
        callback(response.r.map(function(e) {
          return [e.k, 'https://answers.yahoo.com/question/index?qid=' + e.d.replace(/^\{qid:|,.*/g, '')];
        }));
      });
    }
  },

  bing: {
    baseUrl: 'https://www.bing.com',
    requestUrl: 'https://www.bing.com/search?q=',
    apiUrl: 'http://api.bing.com/osjson.aspx?query=%s',
    formatRequest: function(query) {
      return encodeURIComponent(query) + '&FORM=SEEMOR';
    },
    queryApi: function(query, callback) {
      httpRequest({
        url: Utils.format(this.apiUrl, query),
        json: true
      }, function(response) {
        callback(response[1].map(function(e) {
          return e;
        }));
      });
    }
  },

  ebay: {
    baseUrl: 'http://www.ebay.com',
    requestUrl: 'https://www.ebay.com/sch/i.html?_sacat=0&_from=R40&_nkw=',
    apiUrl: 'https://autosug.ebay.com/autosug?kwd=%s',
    queryApi: function(query, callback) {
      httpRequest({
        url: Utils.format(this.apiUrl, encodeURIComponent(query)),
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
    }
  },

  youtube: {
    baseUrl: 'https://www.youtube.com',
    requestUrl: 'https://www.youtube.com/results?search_query=',
    apiUrl: 'https://clients1.google.com/complete/search?client=youtube&hl=en&gl=us&gs_rn=23&gs_ri=youtube&ds=yt&cp=2&gs_id=d&q=%s',
    queryApi: function(query, callback) {
      httpRequest({
        url: Utils.format(this.apiUrl, query),
        json: false
      }, function(response) {
        var _ret = JSON.parse(response.replace(/^[^\(]+\(|\)$/g, ''));
        callback(_ret[1].map(function(e) {
          return e[0];
        }));
      });
    }
  },

  wolframalpha: {
    baseUrl: 'https://www.wolframalpha.com',
    requestUrl: 'https://www.wolframalpha.com/input/?i=',
    apiUrl: 'https://www.wolframalpha.com/input/autocomplete.jsp?qr=0&i=%s',
    formatRequest: function(query) {
      return encodeURIComponent(query).split('%20').join('+');
    },
    queryApi: function(query, callback) {
      httpRequest({
        url: Utils.format(this.apiUrl, encodeURIComponent(query)),
        json: true
      }, function(response) {
        callback(response.results.map(function(e) {
          return e.input;
        }));
      });
    }
  },

  webster: {
    baseUrl: 'http://www.merriam-webster.com',
    requestUrl: 'http://www.merriam-webster.com/dictionary/',
    apiUrl: 'http://www.merriam-webster.com/autocomplete?query=%s',
    queryApi: function(query, callback) {
      httpRequest({
        url: Utils.format(this.apiUrl, encodeURIComponent(query)),
        json: true
      }, function(response) {
        callback(response.suggestions.map(function(e) {
          return e;
        }));
      });
    }
  },

  wiktionary: {
    baseUrl: 'https://en.wiktionary.org/wiki/Wiktionary:Main_Page',
    requestUrl: 'http://en.wiktionary.org/wiki/',
    apiUrl: 'http://en.wiktionary.org/w/api.php?action=opensearch&limit=15&format=json&search=%s',
    formatRequest: function(query) {
      return encodeURIComponent(query).split('%20').join('_');
    },
    queryApi: function(query, callback) {
      httpRequest({
        url: Utils.format(this.apiUrl, encodeURIComponent(query)),
        json: true
      }, function(response) {
        callback(response[1].map(function(e) {
          return e;
        }));
      });
    }
  },

  duckduckgo: {
    baseUrl: 'https://duckduckgo.com',
    requestUrl: 'https://duckduckgo.com/?q=',
    apiUrl: 'https://duckduckgo.com/ac/?q=%s',
    queryApi: function(query, callback) {
      httpRequest({
        url: Utils.format(this.apiUrl, encodeURIComponent(query)),
        json: true
      }, function(response) {
        response = response.map(function(e) { return e.phrase; });
        callback(Utils.compressArray(response));
      });
    }
  },

  urbandictionary: {
    baseUrl: 'http://www.urbandictionary.com',
    requestUrl: 'http://www.urbandictionary.com/define.php?term=',
    apiUrl: 'http://api.urbandictionary.com/v0/autocomplete?term=%s',
    queryApi: function(query, callback) {
      httpRequest({
        url: Utils.format(this.apiUrl, encodeURIComponent(query)),
        json: true
      }, function(response) {
        callback(response.slice(1).map(function(e) {
          return e;
        }));
      });
    }
  },

  imdb: {
    baseUrl: 'http://www.imdb.com',
    requestUrl: 'http://www.imdb.com/find?s=all&q=',
    apiUrl: 'http://sg.media-imdb.com/suggests/',
    queryApi: function(query, callback) {
      httpRequest({
        url: this.apiUrl + query[0] + '/' + query.replace(/ /g, '_') + '.json',
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
    }
  },

  themoviedb: {
    baseUrl: 'https://www.themoviedb.org',
    requestUrl: 'https://www.themoviedb.org/search?query=',
    apiUrl: 'https://www.themoviedb.org/search/remote/multi?query=%s&language=en',
    queryApi: function(query, callback) {
      httpRequest({
        url: Utils.format(this.apiUrl, encodeURIComponent(query)),
        json: true,
      }, function(response) {
        callback(response.map(function(e) {
          var prettyType = (function() {
            switch (e.media_type) {
            case 'tv': return 'TV Series';
            case 'movie': return 'Movie';
            default: return e.media_type;
            }
          })();
          var title = e.name + ' - ' + prettyType;
          if (e.media_type === 'movie' || e.media_type === 'tv') {
            var year, date = e.first_air_date || e.release_date;
            if (typeof date === 'string' && (year = date.replace(/-.*/, '')))
              title += ' (' + year + ')';
          }
          return [title, this.baseUrl.themoviedb +
                         '/' + e.media_type + '/' + e.id];
        }));
      }.bind(this));
    }
  },

  baidu: {
    baseUrl: 'https://www.baidu.com/',
    requestUrl: 'https://www.baidu.com/s?wd=',
    apiUrl: 'http://suggestion.baidu.com/su?json=1&cb=&wd=',
    queryApi: function(query, callback) {
      httpRequest({
        url: Utils.format(this.apiUrl, encodeURIComponent(query)),
      }, function(response) {
        response = JSON.parse(response.slice(1, -2));
        callback(response.s);
      });
    }
  },
};
