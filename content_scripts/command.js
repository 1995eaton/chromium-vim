var Command = {};
var settings, sessions;

Command.dataElements = [];
Command.matches = [];
Command.lastInputValue = '';

Command.setup = function() {
  this.bar = document.createElement('div');
  this.bar.id = 'cVim-command-bar';
  this.bar.cVim = true;
  this.bar.style[(this.onBottom) ? 'bottom' : 'top'] = '0';
  this.input = document.createElement('input');
  this.input.type = 'text';
  this.input.id = 'cVim-command-bar-input';
  this.input.cVim = true;
  this.statusBar = document.createElement('div');
  this.statusBar.id = 'cVim-status-bar';
  this.statusBar.style[(this.onBottom) ? 'bottom' : 'top'] = '0';
  this.modeIdentifier = document.createElement('span');
  this.modeIdentifier.id = 'cVim-command-bar-mode';
  this.modeIdentifier.cVim = true;
  this.bar.appendChild(this.modeIdentifier);
  this.bar.appendChild(this.input);
  this.bar.spellcheck = false;
  // this.input.addEventListener('blur', function() { // Possible fix for #43
  //   window.setTimeout(function() {
  //     Command.hide.call(Command);
  //   }, 0);
  // });
  try {
    document.lastChild.appendChild(this.bar);
    document.lastChild.appendChild(this.statusBar);
  } catch(e) {
    document.body.appendChild(this.bar);
    document.body.appendChild(this.statusBar);
  }
  if (!this.data) {
    this.data = document.createElement('div');
    this.data.id = 'cVim-command-bar-search-results';
    this.data.cVim = true;
    try {
      document.lastChild.appendChild(this.data);
    } catch(e) {
      document.body.appendChild(this.data);
    }
    this.barHeight = parseInt(getComputedStyle(this.bar).height, 10);
    if (this.onBottom) {
      this.barPaddingTop = 0;
      this.barPaddingBottom = this.barHeight;
      this.data.style.bottom = this.barHeight + 'px';
    } else {
      this.barPaddingBottom = 0;
      this.barPaddingTop = this.barHeight;
      this.data.style.top = this.barHeight + 'px';
    }
  }
};

Command.history = {
  index: {},
  search: [],
  url: [],
  action: [],
  setInfo: function(type, index) {
    var fail = false;
    if (index < 0) {
      index = 0;
      fail = true;
    }
    if (index >= this[type].length) {
      index = this[type].length;
      fail = true;
    }
    this.index[type] = index;
    return !fail;
  },
  cycle: function(type, reverse) {
    if (this[type].length === 0) {
      return false;
    }
    var len = this[type].length,
        index = this.index[type];
    if (index === void 0) {
      index = len;
    }
    var lastIndex = index;
    index += reverse ? -1 : 1;
    if (Command.typed && Command.typed.trim()) {
      while (this.setInfo(type, index)) {
        if (this[type][index].substring(0, Command.typed.length) === Command.typed) {
          break;
        }
        index += reverse ? -1 : 1;
      }
    }
    if (reverse && !~index) {
      this.index[type] = lastIndex;
      return;
    }
    Command.hideData();
    this.setInfo(type, index);
    if (this.index[type] !== this[type].length) {
      Command.input.value = this[type][this.index[type]];
    } else {
      Command.input.value = Command.typed || '';
    }
  }
};

Command.completions = {};

Command.completionStyles = {
  topsites:  [ 'Top Site', 'darkcyan' ],
  history:   [ 'History',      'cyan' ],
  bookmarks: [ 'Bookmark',  '#6d85fd' ]
};

Command.completionOrder = {
  engines: 5,
  topsites: 4,
  bookmarks: 2,
  history: 3,
  getImportance: function(item) {
    if (!this.hasOwnProperty(item)) {
      return -1;
    }
    return this[item];
  }
};

Command.updateCompletions = function(useStyles) {
  this.completionResults = [];
  this.dataElements = [];
  this.data.innerHTML = '';
  var key, i;
  var completionKeys = Object.keys(this.completions).sort(function(a, b) {
    return this.completionOrder.getImportance(b) - this.completionOrder.getImportance(a);
  }.bind(this));
  for (i = 0; i < completionKeys.length; i++) {
    key = completionKeys[i];
    for (var j = 0; j < this.completions[key].length; ++j) {
      this.completionResults.push([key].concat(this.completions[key][j]));
    }
  }
  for (i = 0; i < this.completionResults.length; ++i) {
    if (i > settings.searchlimit) {
      break;
    }
    var item = document.createElement('div');
    item.className = 'cVim-completion-item';
    var identifier;
    if (useStyles && this.completionStyles.hasOwnProperty(this.completionResults[i][0])) {
      var styles = this.completionStyles[this.completionResults[i][0]];
      identifier = document.createElement('span');
      identifier.style.color = styles[1];
      identifier.textContent = styles[0] + ': ';
    }
    if (this.completionResults[i].length >= 3) {
      var left = document.createElement('span');
      left.className = 'cVim-left';
      left.textContent = decodeHTMLEntities(this.completionResults[i][1]);
      var right = document.createElement('span');
      right.className = 'cVim-right';
      right.textContent = decodeHTMLEntities(this.completionResults[i][2]);
      if (identifier) {
        left.insertBefore(identifier, left.firstChild);
      }
      item.appendChild(left);
      item.appendChild(right);
    } else {
      var full = document.createElement('span');
      full.className = 'cVim-full';
      full.textContent = decodeHTMLEntities(this.completionResults[i][1]);
      item.appendChild(full);
    }
    this.dataElements.push(item);
    this.data.appendChild(item);
  }
  if (!this.active || !commandMode) {
    this.hideData();
  } else {
    this.data.style.display = 'block';
  }
};

Command.hideData = function() {
  this.completions = {};
  Search.lastActive = null;
  this.dataElements.length = 0;
  if (this.data) {
    this.data.innerHTML = '';
    Search.index = null;
  }
};

Command.descriptions = [
  ['open',         'Open a link in the current tab'],
  ['tabnew',       'Open a link in a new tab'],
  ['tabnext',      'Switch to the next open tab'],
  ['tabprevious',  'Switch to the previous open tab'],
  ['new',          'Open a link in a new window'],
  ['buffer',       'Select from a list of current tabs'],
  ['history',      'Search through your browser history'],
  ['bookmarks',    'Search through your bookmarks'],
  ['file',         'Browse local directories'],
  ['set',          'Configure Settings'],
  ['tabhistory',   'Open a tab from its history states'],
  ['execute',      'Execute a sequence of keys'],
  ['session',      'Open a saved session in a new window'],
  ['restore',      'Open a recently closed tab'],
  ['mksession',    'Create a saved session of current tabs'],
  ['delsession',   'Delete sessions'],
  ['map',          'Map a command'],
  ['unmap',        'Unmap a command'],
  ['tabattach',    'Move current tab to another window'],
  ['tabdetach',    'Move current tab to a new window'],
  ['chrome://',    'Opens Chrome urls'],
  ['duplicate',    'Clone the current tab'],
  ['settings',     'Open the options page for this extension'],
  ['help',         'Shows the help page'],
  ['changelog',    'Shows the changelog page'],
  ['quit',         'Close the current tab'],
  ['qall',         'Close the current window'],
  ['stop',         'Stop the current page from loading'],
  ['stopall',      'Stop all pages in Chrome from loading'],
  ['undo',         'Reopen the last closed tab'],
  ['togglepin',    'Toggle the tab\'s pinned state'],
  ['nohlsearch',   'Clears the search highlight'],
  ['viewsource',   'View the source for the current document'],
  ['script',       'Run JavaScript on the current page']
];

Command.deleteCompletions = function(completions) {
  completions = completions.split(',');
  for (var i = 0, l = completions.length; i < l; ++i) {
    this.completions[completions[i]] = [];
  }
};

Command.complete = function(value) {
  Search.index = null;
  this.typed = this.input.value;
  value = value.replace(/(^[^\s&!*]+)[&!*]*/, '$1');
  var search = value.replace(/^(chrome:\/\/|\S+ +)/, '');

  if (/^(tabnew|tabedit|tabe|tabopen|to|open|o|wo|new|winopen)(\s+)/.test(value)) {

    this.deleteCompletions('engines,bookmarks,complete,chrome,search');
    search = search.split(/ +/).compress();

    if ((search.length < 2 || !~Complete.engines.indexOf(search[0])) && !Complete.hasAlias(search[0]) || (Complete.hasAlias(search[0]) &&  value.slice(-1) !== ' ' && search.length < 2)) {

      if (~Complete.engines.indexOf(search[0])) {
        this.hideData();
        return;
      }

      this.completions.engines = [];
      for (var i = 0, l = Complete.engines.length; i < l; ++i) {
        if (!search[0] || Complete.engines[i].indexOf(search.join(' ')) === 0) {
          this.completions.engines.push([Complete.engines[i], Complete.requestUrls[Complete.engines[i]]]);
        }
      }
      this.updateCompletions(true);

      this.completions.topsites = Search.topSites.filter(function(e) {
        return ~(e[0] + ' ' + e[1]).toLowerCase().indexOf(search.slice(0).join(' ').toLowerCase());
      }).slice(0, 5).map(function(e) {
        return [e[0], e[1]];
      });
      this.updateCompletions(true);

      if (search.length) {
        Marks.match(search.join(' '), function(response) {
          this.completions.bookmarks = response;
          this.updateCompletions(true);
        }.bind(this), 2);
      }

      this.historyMode = false;
      this.searchMode = true;
      PORT('searchHistory', {search: value.replace(/^\S+\s+/, ''), limit: settings.searchlimit});
      return;

    }

    if (search[0] = (Complete.getAlias(search[0]) || search[0])) {
      if (search.length < 2) {
        this.hideData();
        return;
      }
    }
    if (~Complete.engines.indexOf(search[0]) && Complete.hasOwnProperty(search[0])) {
      Complete[search[0]](search.slice(1).join(' '), function(response) {
        this.completions = { search: response };
        this.updateCompletions();
      }.bind(this));
    }
    return;

  }

  if (/^chrome:\/\//.test(value)) {
    Search.chromeMatch(search, function(matches) {
      this.completions = { chrome: matches };
      this.updateCompletions();
    }.bind(this));
    return;
  }

  if (/^tabhistory +/.test(value)) {
    RUNTIME('getHistoryStates', null, function(response) {
      this.completions = {
        tabhistory: searchArray(response.links, value.replace(/\S+\s+/, ''), settings.searchlimit, true)
      };
      this.updateCompletions();
    }.bind(this));
    return;
  }

  if (/^taba(ttach)? +/.test(value)) {
    RUNTIME('getWindows');
    this.completions = { };
    return;
  }

  if (/^buffer(\s+)/.test(value)) {
    PORT('getBuffers');
    return;
  }

  if (/^restore\s+/.test(value)) {
    RUNTIME('getChromeSessions', null, function(sessions) {
      this.completions = {
        chromesessions: Object.keys(sessions).map(function(e) {
          return [sessions[e].id + ': ' + sessions[e].title, sessions[e].url, sessions[e].id];
        }).filter(function(e) {
          return ~e.join('').toLowerCase().indexOf(value.replace(/^\S+\s+/, '').toLowerCase());
        })
      };
      this.updateCompletions();
    }.bind(this));
    return;
  }

  if (/^(del)?session(\s+)/.test(value)) {
    this.completions = {
      sessions: sessions.filter(function(e) {
        var regexp;
        var isValidRegex = true;
        try {
          regexp = new RegExp(search, 'i');
        } catch (ex) {
          isValidRegex = false;
        }
        if (isValidRegex) {
          return regexp.test(e[0]);
        }
        return e[0].substring(0, search.length) === search;
      })
    };
    this.updateCompletions();
    return;
  }

  if (/^set(\s+)/.test(value)) {
    Search.settingsMatch(search, function(matches) {
      this.completions = {settings: matches};
      this.updateCompletions();
    }.bind(this));
    return;
  }

  if (/^hist(ory)?(\s+)/.test(value)) {
    if (search.trim() === '') {
      this.hideData();
      return;
    }
    this.historyMode = true;
    PORT('searchHistory', {search: search, limit: settings.searchlimit});
    return;
  }

  if (/^file +/.test(value)) {
    if ((search.slice(-1) === '/' && Marks.lastSearchLength < search.length) || Marks.lastSearchLength > search.length || !(Marks.lastFileSearch && Marks.lastFileSearch.replace(/[^\/]+$/, '') === search) && (search.slice(-1) === '/' && !(Marks.lastFileSearch && Marks.lastFileSearch.slice(-1) === '/'))) {
      Marks.lastFileSearch = search;
      Marks.lastSearchLength = search.length;
      if (settings.homedirectory) {
        search = search.replace('~', settings.homedirectory);
      }
      RUNTIME('getFilePath', {path: search});
    } else {
      Marks.lastFileSearch = search;
      Marks.filePath();
    }
    return;
  }

  if (/^b(ook)?marks(\s+)/.test(value)) {
    this.completions = {};
    if (search[0] === '/') {
      return Marks.matchPath(search);
    }
    Marks.match(search, function(response) {
      this.completions.bookmarks = response;
      this.updateCompletions();
    }.bind(this));
    return;
  }

  this.completions = {
    complete: this.descriptions.filter(function(element) {
      return value === element[0].slice(0, value.length);
    })
  };
  this.updateCompletions();
};

Command.execute = function(value, repeats) {

  // Match commands like ':tabnew*&! search' before commands like ':tabnew search&*!'
  // e.g. :tabnew& google asdf* => opens a new pinned tab
  // ! == whether to open in a new tab or not
  // & == whether the tab will be active
  // * == whether the tab will be pinned
  var tab = {
    active: value === (value = value.replace(/(^[^\s&]+)&([*!]*)/, '$1$2')),
    pinned: value !== (value = value.replace(/(^[^\s*]+)\*([!]*)/, '$1$2')),
    tabbed: value !== (value = value.replace(/(^[^\s!]+)!/, '$1'))
  };
  var glob = {
    active: value === (value = value.replace(/&([*!]*)$/, '$1')),
    pinned: value !== (value = value.replace(/\*([!]*)$/, '$1')),
    tabbed: value !== (value = value.replace(/!$/, ''))
  };
  tab.active = tab.active && glob.active;
  tab.pinned = tab.pinned || glob.pinned;
  tab.tabbed = tab.tabbed || glob.tabbed;
  if (!tab.active && !tab.tabbed) {
    tab.tabbed = true;
  }

  this.history.index = {};

  switch (value) {
    case 'nohlsearch':
    case 'nohl':
      Find.clear();
      HUD.hide();
      return;
    case 'duplicate':
      RUNTIME('duplicateTab', {repeats: repeats});
      return;
    case 'settings':
      tab.tabbed = true;
      RUNTIME('openLink', {
        tab: tab,
        url: chrome.extension.getURL('/pages/options.html'),
        repeats: repeats
      });
      return;
    case 'changelog':
      tab.tabbed = true;
      RUNTIME('openLink', {
        tab: tab,
        url: chrome.extension.getURL('/pages/changelog.html'),
        repeats: repeats
      });
      return;
    case 'help':
      tab.tabbed = true;
      RUNTIME('openLink', {tab: tab, url: chrome.extension.getURL('/pages/mappings.html')});
      return;
    case 'stop':
      window.stop();
      return;
    case 'stopall':
      RUNTIME('cancelAllWebRequests');
      return;
    case 'viewsource':
      RUNTIME('openLink', {tab: tab, url: 'view-source:' + document.URL, noconvert: true});
      return;
    case 'togglepin':
      RUNTIME('pinTab');
      return;
    case 'undo':
      RUNTIME('openLast');
      return;
    case 'tabnext':
    case 'tabn':
      RUNTIME('nextTab');
      return;
    case 'tabprevious':
    case 'tabp':
    case 'tabN':
      RUNTIME('previousTab');
      return;
    case 'tabprevious':
      return;
    case 'q':
    case 'quit':
    case 'exit':
      RUNTIME('closeTab', {repeats: repeats});
      return;
    case 'qa':
    case 'qall':
      RUNTIME('closeWindow');
      return;
  }

  if (/^chrome:\/\/\S+$/.test(value)) {
    RUNTIME('openLink', {
      tab: tab,
      url: value,
      noconvert: true
    });
    return;
  }

  if (/^bookmarks +/.test(value) && !/^\S+\s*$/.test(value)) {
    if (/^\S+\s+\//.test(value)) {
      RUNTIME('openBookmarkFolder', {
        path: value.replace(/\S+\s+/, ''),
        noconvert: true
      });
      return;
    }
    if (this.completionResults.length &&
        !this.completionResults.some(function(e) { return e[1] === value.replace(/^\S+\s*/, ''); })) {
      RUNTIME('openLink', {
        tab: tab,
        url: this.completionResults[0][2],
        noconvert: true
      });
      return;
    }
    RUNTIME('openLink', {
      tab: tab,
      url: value.replace(/^\S+\s+/, ''),
      noconvert: true
    });
    return;
  }

  if (/^history +/.test(value) && !/^\S+\s*$/.test(value)) {
    RUNTIME('openLink', {
      tab: tab,
      url: Complete.convertToLink(value),
      noconvert: true
    });
    return;
  }

  if (/^taba(ttach)? +/.test(value) && !/^\S+\s*$/.test(value)) {
    var windowId;
    if (windowId = this.completionResults[parseInt(value.replace(/^\S+ */, ''), 10)]) {
      RUNTIME('moveTab', {
        windowId: windowId[3]
      });
      return;
    }
  }

  if (/^tabd(etach)?/.test(value)) {
    RUNTIME('moveTab');
    return;
  }

  if (/^file +/.test(value)) {
    RUNTIME('openLink', {
      tab: tab,
      url: 'file://' + value.replace(/\S+ +/, '').replace(/^~/, settings.homedirectory),
      noconvert: true
    });
    return;
  }

  if (/^(new|winopen|wo)$/.test(value.replace(/ .*/, '')) && !/^\S+\s*$/.test(value)) {
    RUNTIME('openLinkWindow', {
      tab: tab,
      url: Complete.convertToLink(value),
      repeats: repeats,
      noconvert: true
    });
    return;
  }

  if (/^restore\s+/.test(value)) {
    RUNTIME('restoreChromeSession', {
      sessionId: value.replace(/\S+\s+/, '').trimAround()
    });
  }

  if (/^(tabnew|tabedit|tabe|to|tabopen|tabhistory)$/.test(value.replace(/ .*/, ''))) {
    tab.tabbed = true;
    RUNTIME('openLink', {
      tab: tab,
      url: Complete.convertToLink(value),
      repeats: repeats,
      noconvert: true
    });
    return;
  }

  if (/^(o|open)$/.test(value.replace(/ .*/, '')) && !/^\S+\s*$/.test(value)) {
    RUNTIME('openLink', {
      tab: tab,
      url: Complete.convertToLink(value),
      noconvert: true
    });
    return;
  }

  if (/^buffer +/.test(value)) {
    var index = +value.replace(/^\S+\s+/, ''),
        selectedBuffer;
    if (Number.isNaN(index)) {
      selectedBuffer = Command.completionResults[0];
      if (selectedBuffer === void 0) {
        return;
      }
    } else {
      selectedBuffer = Command.completionResults.filter(function(e) {
        return e[1].indexOf(index.toString()) === 0;
      })[0];
    }
    if (selectedBuffer !== void 0) {
      RUNTIME('goToTab', {id: selectedBuffer[3]});
    } else if (Command.completionResults.length) {
      RUNTIME('goToTab', {id: Command.completionResults[0][3]});
    }
    return;
  }

  if (/^execute +/.test(value)) {
    var command = value.replace(/^\S+/, '').trim();
    realKeys = '';
    repeats = '';
    Command.hide();
    Mappings.executeSequence(command);
    return;
  }

  if (/^delsession/.test(value)) {
    value = value.replace(/^\S+(\s+)?/, '').trimAround();
    if (value === '') {
      Status.setMessage('argument required', 1, 'error');
      return;
    }
    if (~sessions.indexOf(value)) {
      sessions.splice(sessions.indexOf(value), 1);
    }
    value.split(' ').forEach(function(v) {
      RUNTIME('deleteSession', {name: v});
    });
    PORT('getSessionNames');
    return;
  }

  if (/^mksession/.test(value)) {
    value = value.replace(/^\S+(\s+)?/, '').trimAround();
    if (value === '') {
      Status.setMessage('session name required', 1, 'error');
      return;
    }
    if (/[^a-zA-Z0-9_-]/.test(value)) {
      Status.setMessage('only alphanumeric characters, dashes, and underscores are allowed', 1, 'error');
      return;
    }
    if (!~sessions.indexOf(value)) {
      sessions.push(value);
    }
    RUNTIME('createSession', {name: value});
    return;
  }

  if (/^session/.test(value)) {
    value = value.replace(/^\S+(\s+)?/, '').trimAround();
    if (value === '') {
      Status.setMessage('session name required', 1, 'error');
      return;
    }
    RUNTIME('openSession', {name: value, sameWindow: !tab.active}, function() {
      Status.setMessage('session does not exist', 1, 'error');
    });
    return;
  }

  if (/^((i?(re)?map)|i?unmap(All)?)+/.test(value)) {
    Mappings.parseLine(value);
    return;
  }

  if (/^set +/.test(value) && value !== 'set') {
    value = value.replace(/^set +/, '').split(/[ =]+/);
    var isSet, swapVal,
        isQuery = /\?$/.test(value[0]);
    value[0] = value[0].replace(/\?$/, '');
    if (!settings.hasOwnProperty(value[0].replace(/^no|!$/g, ''))) {
      Status.setMessage('unknown option: ' + value[0], 1, 'error');
      return;
    }

    if (isQuery) {
      Status.setMessage(value + ': ' + settings[value[0]], 1);
      return;
    }

    isSet    = !/^no/.test(value[0]);
    swapVal  = tab.tabbed;
    value[0] = value[0].replace(/^no|\?$/g, '');

    if (value.length === 1 && Boolean(settings[value]) === settings[value]) {
      if (value[0] === 'hud' && !isSet) {
        HUD.hide(true);
      }
      if (swapVal) {
        settings[value[0]] = !settings[value[0]];
      } else {
        settings[value[0]] = isSet;
      }
      RUNTIME('syncSettings', {settings: settings});
    }
    return;
  }

  if (/^script +/.test(value)) {
    RUNTIME('runScript', {code: value.slice(7)});
  }

};

Command.show = function(search, value) {
  if (!this.domElementsLoaded) {
    return;
  }
  this.type = '';
  this.active = true;
  if (document.activeElement) {
    document.activeElement.blur();
  }
  if (search) {
    this.type = 'search';
    this.modeIdentifier.innerHTML = search;
  } else {
    this.type = 'action';
    this.modeIdentifier.innerHTML = ':';
  }
  if (value) {
    this.input.value = value;
    this.typed = value;
  }
  if (Status.active) {
    Status.hide();
  }
  this.bar.style.display = 'inline-block';
  setTimeout(function() {
    this.input.focus();

    // Temp fix for Chromium issue in #97
    if (document.activeElement.id === 'cVim-command-bar-input') {
      document.activeElement.select();
      document.getSelection().collapseToEnd();
    }
    // End temp fix

  }.bind(this), 0);
};

Command.hide = function(callback) {
  if (document.activeElement) {
    document.activeElement.blur();
  }
  this.hideData();
  if (this.bar) {
    this.bar.style.display = 'none';
  }
  if (this.input) {
    this.input.value = '';
  }
  if (this.data) {
    this.data.style.display = 'none';
  }
  this.historyMode = false;
  this.active = false;
  commandMode = false;
  Search.index = null;
  this.history.index = {};
  this.typed = '';
  this.dataElements = [];
  if (callback) {
    callback();
  }
};

Command.insertCSS = function() {
  var css = settings.COMMANDBARCSS;
  if (!css) {
    return;
  }
  if (settings.linkanimations) {
    css += '.cVim-link-hint { transition: opacity 0.2s ease-out, background 0.2s ease-out; }';
  }
  var head = document.getElementsByTagName('head');
  if (!head.length && location.protocol !== 'chrome-extensions:' &&
      location.pathname !== '/_/chrome/newtab') {
    if (location.protocol !== 'chrome:') {
      RUNTIME('injectCSS', {css: css, runAt: 'document_start'});
    }
  }
  // For some reason, Chrome's own implementation of CSS injection seems to miss some styles.
  if (head.length) {
    this.css = document.createElement('style');
    this.css.textContent = css;
    head[0].appendChild(this.css);
  }
};

Command.onDOMLoad = function() {
  this.insertCSS();
  this.onBottom = settings.barposition === 'bottom';
  if (this.data !== void 0) {
    this.data.style[(!this.onBottom) ? 'bottom' : 'top'] = '';
    this.data.style[(this.onBottom) ? 'bottom' : 'top'] = '20px';
  }
  if (!settings.autofocus) {
    var manualFocus = false;
    var initialFocus = window.setInterval(function() {
      if (document.activeElement) {
        if (/input|textarea/i.test(document.activeElement.localName) && !manualFocus &&
            document.activeElement.id !== 'cVim-command-bar-input') {
          document.activeElement.blur();
        }
      }
      if (manualFocus) {
        window.clearInterval(initialFocus);
      }
    }, 5);
    var initialKeyDown = window.addEventListener('keydown', function() {
      manualFocus = true;
      document.removeEventListener('keydown', initialKeyDown, true);
    }, true);
    var initialMouseDown = document.addEventListener('mousedown', function() {
      manualFocus = true;
      document.removeEventListener('mousedown', initialMouseDown, true);
    }, true);
  }
  this.setup();
  this.domElementsLoaded = true;
};

Command.updateSettings = function(config) {
  var key;
  if (Array.isArray(config.completionengines) && config.completionengines.length) {
    Complete.engines = Complete.engines.filter(function(e) {
      return ~config.completionengines.indexOf(e);
    });
  }
  if (config.searchengines && config.searchengines.constructor === Object) {
    for (key in config.searchengines) {
      if (!~Complete.engines.indexOf(key) && typeof config.searchengines[key] === 'string') {
        Complete.engines.push(key);
        Complete.requestUrls[key] = config.searchengines[key];
      }
    }
  }
  if (config.searchaliases && config.searchaliases.constructor === Object) {
    for (key in config.searchaliases) {
      if (Complete.engines.indexOf(key)) {
        Complete.aliases[key] = config.searchaliases[key];
      }
    }
  }
  if (config.locale) {
    Complete.setLocale(config.locale);
  }
  if (config.hintcharacters && config.hintcharacters.split('').unique().length > 1) {
    settings.hintcharacters = config.hintcharacters.split('').unique().join('');
  }
  if (config !== settings) {
    for (key in config) {
      if (key.toUpperCase() !== key && settings.hasOwnProperty(key)) {
        settings[key] = config[key];
      }
    }
  }
};

Command.init = function(enabled) {
  var key;
  Mappings.defaults = Object.clone(Mappings.defaultsClone);
  Mappings.parseCustom(settings.MAPPINGS);
  if (enabled) {
    this.loaded = true;
    this.updateSettings(settings);
    for (key in settings.sites) {
      if (matchLocation(document.URL, key)) {
        PORT('parseRC', {config: settings.sites[key]});
      }
    }
    waitForLoad(this.onDOMLoad, this);
    if (settings.autohidecursor) {
      waitForLoad(Cursor.init, Cursor);
    }
  } else {
    this.loaded = false;
    if (this.css && this.css.parentNode) {
      this.css.parentNode.removeChild(this.css);
    }
    var links = document.getElementById('cVim-link-container');
    if (Cursor.overlay && Cursor.overlay.parentNode) {
      Cursor.overlay.parentNode.removeChild(Cursor.overlay);
    }
    if (this.bar && this.bar.parentNode) {
      this.bar.parentNode.removeChild(this.bar);
    }
    if (links) {
      links.parentNode.removeChild(links);
    }
    removeListeners();
  }
};

Command.configureSettings = function(_settings) {

  settings = _settings;
  this.initialLoadStarted = true;
  var checkBlacklist = function() {
    var blacklists = settings.blacklists,
        blacklist;
    Command.blacklisted = false;
    for (var i = 0, l = blacklists.length; i < l; i++) {
      blacklist = blacklists[i].trimAround().split(/\s+/g);
      if (!blacklist.length) {
        continue;
      }
      if (matchLocation(document.URL, blacklist[0])) {
        return true;
      }
    }
  };
  var loadMain = function() {
    Command.loaded = true;
    RUNTIME('setIconEnabled');
    Command.init(true);
  };
  Search.settings = Object.keys(settings).filter(function(e) {
    return settings[e].constructor === Boolean;
  });
  removeListeners();
  settings.searchlimit = +settings.searchlimit;
  if (!checkBlacklist()) {
    RUNTIME('getActiveState', null, function(response) {
      if (response) {
        addListeners();
        loadMain();
      } else {
        Command.init(false);
      }
    });
  } else {
    this.init(false);
  }
};

if (!Command.loaded) {
  RUNTIME('getSettings');
}
