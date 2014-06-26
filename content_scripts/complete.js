var GitHub, Complete = {};

String.prototype.validURL = function() {
  var url = this.trimLeft().trimRight();
  if (url.length === 0) {
    return 'chrome://newtab';
  }
  if (/^\//.test(url)) {
    url = 'file://' + url;
  }
  if (/^(chrome|chrome-extension|file):\/\/\S+$/.test(url)) {
    return url;
  }
  var pattern = new RegExp('^((https?|ftp):\\/\\/)?'+
  '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+
  '((\\d{1,3}\\.){3}\\d{1,3})|'+
  'localhost)' +
  '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+
  '(\\?[;:&a-z\\d%_.~+=-]*)?'+
  '(\\#[#:-a-z\\d_]*)?$','i');
  if (pattern.test(url)) {
    return true;
  }
};

String.prototype.embedString = function(string) {
  return this.replace('%s', string);
};

Complete.engines = ['google', 'wikipedia', 'youtube', 'imdb', 'amazon', 'google-maps', 'github', 'wolframalpha', 'google-image', 'ebay', 'webster', 'wictionary', 'urbandictionary', 'duckduckgo', 'answers', 'google-trends', 'google-finance', 'yahoo', 'bing'];

Complete.aliases = {
  g: 'google'
};

Complete.hasAlias = function(alias) {
  return this.aliases.hasOwnProperty(alias);
};

Complete.getAlias = function(alias) {
  return this.aliases[alias] || '';
};

Complete.requestUrls = {
  wikipedia:      'https://en.wikipedia.org/wiki/',
  google:         'https://www.google.com/search?q=',
  github:         'https://github.com/search?q=',
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
  github:         'https://github.com/',
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
  google:         'https://www.google.com/complete/search?client=firefox&hl=en&q=%s',
  github:         '',
  'google-image': 'http://www.google.com/complete/search?client=img&hl=en&gs_rn=43&gs_ri=img&ds=i&cp=1&gs_id=8&q=%s',
  yahoo:          'https://search.yahoo.com/sugg/gossip/gossip-us-ura/?output=sd1&appid=search.yahoo.com&nresults=20&command=%s',
  answers:        'https://search.yahoo.com/sugg/ss/gossip-us_ss-vertical_ss/?output=sd1&pubid=1307&appid=yanswer&command=%s&nresults=20',
  bing:           'http://api.bing.com/osjson.aspx?query=%s',
  imdb:           'http://sg.media-imdb.com/suggests/',
  amazon:         'http://completion.amazon.com/search/complete?method=completion&search-alias=aps&client=amazon-search-ui&mkt=1&q=%s',
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
  }
};

Complete.setLocale = function(locale) {
  if (this.locales.hasOwnProperty(locale)) {
    locale = this.locales[locale];
  } else {
    return;
  }
  for (var key in locale) {
    if (key !== 'tld') {
      for (var i = 0; i < locale[key].length; i++) {
        this[key][locale[key][i]] = this[key][locale[key][i]].replace(/\.com/, '.' + locale.tld);
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
    return '';
  }
  input[0] = this.getAlias(input[0]) || input[0];
  if (Complete.engines.indexOf(input[0]) !== -1) {
    if (input[0] === 'github') {
      return GitHub.parseInput(input.slice(1));
    }
    if (input.length > 1) {
      prefix = Complete.requestUrls[input[0]];
    } else {
      return Complete.baseUrls[input[0]];
    }
  } else {
    if (input.join(' ').validURL()) {
      if (!/:\/\//.test(input.join(' '))) {
        return 'http://' + input.join(' ');
      }
      return input.join(' ');
    }
    return (Complete.requestUrls[settings.defaultengine] ||
      Complete.requestUrls.google) + encodeURIComponent(input.join(' '));
  }
  if (Complete.parseQuery.hasOwnProperty(input[0])) {
    suffix = Complete.parseQuery[input[0]](input.slice(1).join(' '));
  } else {
    suffix = input.slice(1).join(' ');
  }
  return (prefix.indexOf('%s') !== -1 ?
            prefix.embedString(suffix) :
            prefix + suffix);
};

Complete.wikipedia = function(query, callback) {
  httpRequest({
    url: this.apis.wikipedia.embedString(query),
    json: true
  }).then(function(response) {
    callback(response[1]);
  }, cVimError);
};

Complete.google = function(query, callback) {
  httpRequest({
    url: this.apis.google.embedString(query),
    json: true
  }).then(function(response) {
    callback(response[1]);
  }, cVimError);
};

Complete['google-maps'] = function(query, callback) {
  httpRequest({
    url: this.apis['google-maps'].embedString(query),
    json: false
  }).then(function(response) {
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
  }, cVimError);
};

Complete['google-image'] = function(query, callback) {
  httpRequest({
    url: this.apis['google-image'].embedString(query),
    json: false
  }).then(function(response) {
    callback(JSON.parse(response.replace(/^[^\(]+\(|\)$/g, ''))[1].map(function(e) {
      return e[0].replace(/<[^>]+>/g, '');
    }));
  }, cVimError);
};

Complete['google-trends'] = function(query, callback) {
  httpRequest({
    url: this.apis['google-trends'].embedString(encodeURIComponent(query)),
    json: true
  }).then(function(response) {
    callback(response.entityList.map(function(e) {
      return [e.title + ' - ' + e.type, Complete.requestUrls['google-trends'] + encodeURIComponent(e.mid)];
    }));
  }, cVimError);
};

Complete['google-finance'] = function(query, callback) {
  httpRequest({
    url: this.apis['google-finance'].embedString(encodeURIComponent(query)),
    json: true
  }).then(function(response) {
    callback(response.matches.map(function(e) {
      return [e.t + ' - ' + e.n + ' - ' + e.e, Complete.requestUrls['google-finance'] + e.e + ':' + e.t];
    }));
  }, cVimError);
};

Complete.amazon = function(query, callback) {
  httpRequest({
    url: this.apis.amazon.embedString(encodeURIComponent(query)),
    json: true
  }).then(function(response) {
    callback(response[1]);
  }, cVimError);
};

Complete.yahoo = function(query, callback) {
  httpRequest({
    url: this.apis.yahoo.embedString(encodeURIComponent(query)),
    json: true
  }).then(function(response) {
    var _ret = [];
    for (var key in response.r) {
      if (response.r[key].hasOwnProperty('k')) {
        _ret.push(response.r[key].k);
      }
    }
    callback(_ret);
  }, cVimError);
};

Complete.answers = function(query, callback) {
  httpRequest({
    url: this.apis.answers.embedString(encodeURIComponent(query)),
    json: true
  }).then(function(response) {
    callback(response.r.map(function(e) {
      return [e.k, 'https://answers.yahoo.com/question/index?qid=' + e.d.replace(/^\{qid:|,.*/g, '')];
    }));
  }, cVimError);
};

Complete.bing = function(query, callback) {
  httpRequest({
    url: this.apis.bing.embedString(query),
    json: true
  }).then(function(response) {
    callback(response[1].map(function(e) {
      return e;
    }));
  }, cVimError);
};

Complete.ebay = function(query, callback) {
  httpRequest({
    url: this.apis.ebay.embedString(encodeURIComponent(query)),
    json: false
  }).then(function(response) {
    var _ret = JSON.parse(response.replace(/^[^\(]+\(|\)$/g, ''));
    if (!_ret.res) {
      return false;
    }
    callback(_ret.res.sug.map(function(e) {
      return e;
    }));
  }, cVimError);
};

Complete.youtube = function(query, callback) {
  httpRequest({
    url: this.apis.youtube.embedString(query),
    json: false
  }).then(function(response) {
    var _ret = JSON.parse(response.replace(/^[^\(]+\(|\)$/g, ''));
    callback(_ret[1].map(function(e) {
      return e[0];
    }));
  }, cVimError);
};

Complete.wolframalpha = function(query, callback) {
  httpRequest({
    url: this.apis.wolframalpha.embedString(encodeURIComponent(query)),
    json: true
  }).then(function(response) {
    callback(response.results.map(function(e) {
      return e.input;
    }));
  }, cVimError);
};

Complete.webster = function(query, callback) {
  httpRequest({
    url: this.apis.webster.embedString(encodeURIComponent(query)),
    json: true
  }).then(function(response) {
    callback(response.suggestions.map(function(e) {
      return e;
    }));
  }, cVimError);
};

Complete.wictionary = function(query, callback) {
  httpRequest({
    url: this.apis.wictionary.embedString(encodeURIComponent(query)),
    json: true
  }).then(function(response) {
    callback(response[1].map(function(e) {
      return e;
    }));
  }, cVimError);
};

Complete.duckduckgo = function(query, callback) {
  httpRequest({
    url: this.apis.duckduckgo.embedString(encodeURIComponent(query)),
    json: true
  }).then(function(response) {
    callback(response.map(function(e) {
      return e.phrase;
    }).compress());
  }, cVimError);
};

Complete.urbandictionary = function(query, callback) {
  httpRequest({
    url: this.apis.urbandictionary.embedString(encodeURIComponent(query)),
    json: true
  }).then(function(response) {
    callback(response.slice(1).map(function(e) {
      return e;
    }));
  }, cVimError);
};

Complete.imdb = function(query, callback) {
  httpRequest({
    url: this.apis.imdb + query[0] + '/' + query.replace(/ /g, '_') + '.json',
    json: false
  }).then(function(response) {
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
  }, cVimError);
};

var GitHubCache = {};
GitHub = {
  parseInput: function(input) {
    if (input.length === 1) {
      return 'https://github.com/' + input[0].slice(1);
    }
    return Complete.requestUrls.github + encodeURIComponent(input.join(' '));
  }
};

Complete.github = function(query, callback) {
  var users = 'https://github.com/command_bar/users?q=%s',
      repos = 'https://github.com/command_bar/repos_for/%s';
  // paths = 'https://github.com/command_bar/%user/%repository/paths/%branchname?sha=1&q=';
  if (query.length <= 1) {
    return callback([['@&lt;USER&gt;/&lt;REPOSITORY&gt;', 'github @']]);
  }
  if (/^@[a-zA-Z_\-0-9]+$/.test(query)) {
    httpRequest({
      url: users.embedString(encodeURIComponent(query.slice(1))),
      json: true
    }).then(function(response) {
      return callback(response.results.map(function(e) {
        return [e.command];
      }));
    }, cVimError);
  } else if (/^@[a-zA-Z_\-0-9]+\/[^ ]*$/.test(query)) {

    var slashPosition = query.indexOf('/');

    if (GitHubCache[query.slice(1, slashPosition)] === void 0) {
      httpRequest({
        url: repos.embedString(encodeURIComponent(query.slice(1, -1))),
        json: true
      }).then(function(response) {
        GitHubCache[query.slice(1, slashPosition)] = response.results.map(function(e) {
          return ['@' + e.command];
        });
        return callback(GitHubCache[query.slice(1, slashPosition)]);
      }, cVimError);
    } else {
      return callback(GitHubCache[query.slice(1, slashPosition)].filter(function(e) {
        return e[0].indexOf(query) === 0;
      }));
    }

  }
};
