var Command = {};
var settings, sessions;

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
  ['source',       'Load a config from a local file'],
  ['set',          'Configure boolean settings'],
  ['call',         'Call a cVim command'],
  ['let',          'Configure non-boolean settings'],
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
  ['chrome',       'Opens Chrome urls'],
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

Command.dataElements = [];
Command.matches = [];
Command.customCommands = {};
Command.lastInputValue = '';

Command.setupFrameElements = function() {
  this.bar = document.createElement('div');
  this.bar.id = 'cVim-command-bar';
  this.bar.cVim = true;
  this.bar.style[(this.onBottom) ? 'bottom' : 'top'] = '0';
  this.modeIdentifier = document.createElement('span');
  this.modeIdentifier.id = 'cVim-command-bar-mode';
  this.modeIdentifier.cVim = true;
  this.bar.appendChild(this.modeIdentifier);
  this.bar.appendChild(this.input);
  this.bar.spellcheck = false;
  try {
    document.lastChild.appendChild(this.bar);
  } catch (e) {
    document.body.appendChild(this.bar);
  }
  if (!this.data) {
    this.data = document.createElement('div');
    this.data.id = 'cVim-command-bar-search-results';
    this.data.cVim = true;
    try {
      document.lastChild.appendChild(this.data);
    } catch (e) {
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

Command.setup = function() {
  this.input = document.createElement('input');
  this.input.type = 'text';
  this.input.id = 'cVim-command-bar-input';
  this.input.cVim = true;
  this.statusBar = document.createElement('div');
  this.statusBar.id = 'cVim-status-bar';
  this.statusBar.style[(this.onBottom) ? 'bottom' : 'top'] = '0';
  try {
    document.lastChild.appendChild(this.statusBar);
  } catch (e) {
    document.body.appendChild(this.statusBar);
  }
  if (window.isCommandFrame)
    Command.setupFrameElements();
};

Command.commandBarFocused = function() {
  return commandMode && this.active && document.activeElement &&
    document.activeElement.id === 'cVim-command-bar-input';
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
        if (this[type][index].substring(0, Command.typed.length)
            === Command.typed) {
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
  engines:   ['Se',  '#87ff87'],
  topsites:  ['Ts',  '#00afaf'],
  history:   ['Hi',  '#87afff'],
  bookmarks: ['Bk',  '#af5fff']
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
  if (!window.isCommandFrame)
    return;
  this.completionResults = [];
  this.dataElements = [];
  this.data.innerHTML = '';
  var key, i;
  var completionKeys = Object.keys(this.completions).sort(function(a, b) {
    return this.completionOrder.getImportance(b) -
           this.completionOrder.getImportance(a);
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
    if (useStyles &&
        this.completionStyles.hasOwnProperty(this.completionResults[i][0])) {
      var styles = this.completionStyles[this.completionResults[i][0]];
      identifier = document.createElement('span');
      identifier.style.backgroundColor = styles[1];
      identifier.style.position = 'absolute';
      identifier.style.height = '100%';
      identifier.style.width = '2px';
      identifier.style.left = '0';
    }
    if (this.completionResults[i].length >= 3) {
      var left = document.createElement('span');
      left.className = 'cVim-left';
      left.textContent = this.completionResults[i][1];
      var right = document.createElement('span');
      right.className = 'cVim-right';
      right.textContent = this.completionResults[i][2];
      if (identifier) {
        left.style.paddingLeft = '4px';
        left.insertBefore(identifier, left.firstChild);
      }
      item.appendChild(left);
      item.appendChild(right);
    } else {
      var full = document.createElement('span');
      full.className = 'cVim-full';
      full.textContent = this.completionResults[i][1];
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

Command.deleteCompletions = function(completions) {
  completions = completions.split(',');
  for (var i = 0, l = completions.length; i < l; ++i) {
    this.completions[completions[i]] = [];
  }
};

Command.expandCompletion = function(value) {
  var firstWord = value.match(/^[a-z]+(\b|$)/);
  var exactMatch = this.descriptions.some(function(e) {
    return e[0] === firstWord;
  });
  if (firstWord && this.customCommands.hasOwnProperty(firstWord[0])) {
    return value.replace(firstWord[0], this.customCommands[firstWord[0]]);
  }
  if (firstWord && !exactMatch) {
    firstWord = firstWord[0];
    var completedWord = (function() {
      for (var i = 0; i < this.descriptions.length; i++)
        if (this.descriptions[i][0].indexOf(firstWord) === 0 &&
            !this.customCommands.hasOwnProperty(this.descriptions[i][0]))
          return this.descriptions[i][0];
      for (var key in this.customCommands)
        if (key.indexOf(firstWord) === 0)
          return this.customCommands[key];
    }.bind(this))();
    if (completedWord)
      return value.replace(firstWord, completedWord);
  }
  return value;
};

Command.callCompletionFunction = (function() {

  var self = Command;
  var search;

  var searchCompletion = function(value) {
    self.deleteCompletions('engines,bookmarks,complete,chrome,search');
    search = Utils.compressArray(search.split(/ +/));
    if ((search.length < 2 && value.slice(-1) !== ' ') ||
        (!Complete.engineEnabled(search[0]) && !Complete.hasAlias(search[0]))) {
      self.completions.engines = Complete.getMatchingEngines(search.join(' ')).map(function(name) {
        return [name, Complete.engines[name].requestUrl];
      });
      self.updateCompletions(true);
      self.completions.topsites = Search.topSites.filter(function(e) {
        return ~(e[0] + ' ' + e[1]).toLowerCase()
          .indexOf(search.slice(0).join(' ').toLowerCase());
      }).slice(0, 5).map(function(e) {
        return [e[0], e[1]];
      });
      self.updateCompletions(true);
      if (search.length) {
        Marks.match(search.join(' '), function(response) {
          self.completions.bookmarks = response;
          self.updateCompletions(true);
        }, 2);
      }
      self.historyMode = false;
      self.searchMode = true;
      PORT('searchHistory', {
        search: value.replace(/^\S+\s+/, ''),
        limit: settings.searchlimit
      });
      return;
    }
    if (search[0] = (Complete.getAlias(search[0]) || search[0])) {
      if (search.length < 2) {
        self.hideData();
        return;
      }
    }
    if (Complete.engineEnabled(search[0])) {
      Complete.queryEngine(search[0], search.slice(1).join(' '), function(response) {
        self.completions = { search: response };
        self.updateCompletions();
      });
    }
  };

  var tabHistoryCompletion = function(value) {
    RUNTIME('getHistoryStates', null, function(response) {
      self.completions = {
        tabhistory: searchArray({
          array: response.links,
          search: value.replace(/\S+\s+/, ''),
          limit: settings.searchlimit
        })
      };
      self.updateCompletions();
    });
  };

  var restoreTabCompletion = function(value) {
    RUNTIME('getChromeSessions', null, function(sessions) {
      self.completions = {
        chromesessions: Object.keys(sessions).map(function(e) {
          return [sessions[e].id + ': ' + sessions[e].title,
                  sessions[e].url,
                  sessions[e].id];
        }).filter(function(e) {
          return ~e.join('').toLowerCase()
            .indexOf(value.replace(/^\S+\s+/, '').toLowerCase());
        })
      };
      self.updateCompletions();
    });
  };

  var deleteSessionCompletion = function() {
    self.completions = {
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
    self.updateCompletions();
  };

  return function(value) {
    search = value.replace(/^(chrome:\/\/|\S+ +)/, '');
    var baseCommand = (value.match(/^\S+/) || [null])[0];
    switch (baseCommand) {
    case 'tabnew':
    case 'tabedit':
    case 'tabopen':
    case 'open':
    case 'new':
      searchCompletion(value);
      return true;
    case 'chrome':
      Search.chromeMatch(search, function(matches) {
        self.completions = { chrome: matches };
        self.updateCompletions();
      });
      return true;
    case 'tabhistory':
      tabHistoryCompletion(value);
      return true;
    case 'tabattach':
      RUNTIME('getWindows', function(wins) {
        if (Command.active === true) {
          Command.completions = {
            windows: Object.keys(wins).map(function(e, i) {
              var tlen = wins[e].length.toString();
              return [
                (i + 1).toString() + ' (' + tlen +
                 (tlen === '1' ? ' Tab)' : ' Tabs)'),
                wins[e].join(', '),
                e
              ];
            })
          };
          Command.completions.windows.unshift(['0 (New window)', '']);
          Command.updateCompletions();
        }
      });
      self.completions = {};
      return true;
    case 'buffer':
      PORT('getBuffers');
      return true;
    case 'restore':
      restoreTabCompletion(value);
      return true;
    case 'session':
    case 'mksession':
    case 'delsession':
      deleteSessionCompletion(value);
      return true;
    case 'set':
      Search.settingsMatch(search, function(matches) {
        self.completions = {settings: matches};
        self.updateCompletions();
      });
      return true;
    case 'let': // TODO
      return true;
    case 'history':
      if (search.trim() === '') {
        self.hideData();
        return;
      }
      self.historyMode = true;
      PORT('searchHistory', {search: search, limit: settings.searchlimit});
      return true;
    case 'file':
      Marks.parseFileCommand(search);
      return true;
    case 'source':
      Marks.parseFileCommand(search);
      return true;
    case 'bookmarks':
      self.completions = {};
      if (search[0] === '/') {
        return Marks.matchPath(search);
      }
      Marks.match(search, function(response) {
        self.completions.bookmarks = response;
        self.updateCompletions();
      });
      return true;
    }
    return false;
  };

})();

Command.complete = function(value) {
  Search.index = null;
  this.typed = this.input.value;
  var originalValue = value; // prevent expandCompletion from
                             // limiting command completions
  value = this.expandCompletion(value).replace(/(^[^\s&$!*?=|]+)[&$!*?=|]*/, '$1');
  if (~value.indexOf(' ') && this.callCompletionFunction(value) === true) {
    return;
  }
  // Default completion for commands
  this.completions = {
    complete: this.descriptions.filter(function(element) {
      return originalValue === element[0].slice(0, originalValue.length);
    })
  };
  this.updateCompletions();
};

Command.execute = function(value, repeats) {

  if (value.indexOf('@%') !== -1) {
    RUNTIME('getRootUrl', function(url) {
      Command.execute(value.split('@%').join(url), repeats);
    });
    return;
  }
  if (value.indexOf('@"') !== -1) {
    RUNTIME('getPaste', function(paste) {
      Command.execute(value.split('@"').join(paste), repeats);
    });
    return;
  }

  commandMode = false;

  var split = Utils.compressArray(value.split(/\s+/g));
  if (this.customCommands.hasOwnProperty(split[0])) {
    this.execute(this.customCommands[split[0]] + ' ' + split.slice(1).join(' '), 1);
    return;
  }

  value = this.expandCompletion(value);
  value = value.replace(/@@[a-zA-Z_$][a-zA-Z0-9_$]*/g, function(e) {
    return settings.hasOwnProperty(e) ? settings[e] : e;
  });

  // Match commands like ':tabnew*&! search' before
  // commands like ':tabnew search&*!'
  // e.g. :tabnew& google asdf* => opens a new pinned tab
  // ! == whether to open in a new tab or not
  // & == whether the tab will be active
  // * == whether the tab will be pinned
  // = == force cVim to treat text as a URL
  // ? == force cVim to tread text as a search
  // | == whether to open url in incognito mode (only works for new windows)
  var tab = {
    active: true,
    newWindow: false,
    isURL: false,
    isLink: false,
    pinned: false,
    tabbed: false,
    incognito: false,
  };
  (value.match(/^[^\s&$!*=?|]*([&$!*=?|]+)/) || [])
    .concat(value.match(/[&$!*=?|]*$/) || [])
    .join('').split('')
    .forEach(function(e) {
      switch (e) {
      case '&': tab.active    = false; break;
      case '$': tab.newWindow = true;  break;
      case '!': tab.tabbed    = true;  break;
      case '*': tab.pinned    = true;  break;
      case '?': tab.isLink    = true;  tab.isURL = false; break;
      case '=': tab.isLink    = false; tab.isURL = true;  break;
      case '|': tab.incognito = true;  tab.newWindow = true; break;
      }
    });
  value = value.replace(/^([^\s&$*!=?|]*)[&$*!=?|]*\s/, '$1 ');
  value = value.replace(/[&$*!=?|]+$/, function(e) {
    return e.replace(/[^=?]/g, '');
  });
  if (Complete.engineEnabled(Utils.compressArray(value.split(/\s+/g))[1]))
    value = value.replace(/[=?]+$/, '');

  this.history.index = {};

  switch (value) {
  case 'nohlsearch':
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
    RUNTIME('openLink', {
      tab: tab,
      url: chrome.extension.getURL('/pages/mappings.html')
    });
    return;
  case 'stop':
    window.stop();
    return;
  case 'stopall':
    RUNTIME('cancelAllWebRequests');
    return;
  case 'viewsource':
    PORT('viewSource', {tab: tab});
    return;
  case 'pintab':
    RUNTIME('pinTab', {pinned: true});
    break;
  case 'unpintab':
    RUNTIME('pinTab', {pinned: false});
    break;
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

  if (/^chrome +/.test(value)) {
    RUNTIME('openLink', {
      tab: tab,
      url: value.replace(' ', '://'),
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
        !this.completionResults.some(function(e) {
          return e[2] === value.replace(/^\S+\s*/, '');
        })) {
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
    if (windowId = this.completionResults[parseInt(
          value.replace(/^\S+ */, ''), 10)]) {
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
      url: 'file://' + value.replace(/\S+ +/, '')
        .replace(/^~/, settings.homedirectory),
      noconvert: true
    });
    return;
  }

  if (/^source/.test(value)) {
    var path = value.replace(/\S+ */, '');
    if (!path.length) {
      path = null;
    } else {
      path = 'file://' + path;
      path = path.split('~').join(settings.homedirectory || '~');
    }
    RUNTIME('loadLocalConfig', { path: path }, function(res) {
      if (res.code === -1) {
        // TODO: Fix Status (status bar cannot be displayed after the command
        //       bar iframe exits
        Status.setMessage('config file could not be opened', 1, 'error');
        console.error('cvim error: "%s" could not be opened for parsing', path);
      }
    });
    return;
  }

  if (/^(new|winopen|wo)$/.test(value.replace(/ .*/, ''))) {
    RUNTIME('openLinkWindow', {
      tab: tab,
      url: Complete.convertToLink(value, tab.isURL, tab.isLink),
      repeats: repeats,
      noconvert: true,
      incognito: tab.incognito
    });
    return;
  }

  if (/^restore\s+/.test(value)) {
    var sessionId = value.replace(/^\S+\s+/, '');
    if (Number.isNaN(+sessionId) && this.completionResults.length)
      sessionId = this.completionResults[0][3];
    RUNTIME('restoreChromeSession', {
      sessionId: Utils.trim(sessionId)
    });
  }

  if (/^(tabnew|tabedit|tabe|to|tabopen|tabhistory)$/
      .test(value.replace(/ .*/, ''))) {
    tab.tabbed = true;
    RUNTIME('openLink', {
      tab: tab,
      url: Complete.convertToLink(value, tab.isURL, tab.isLink),
      repeats: repeats,
      noconvert: true
    });
    return;
  }

  if (/^(o|open)$/.test(value.replace(/ .*/, '')) && !/^\S+\s*$/.test(value)) {
    RUNTIME('openLink', {
      tab: tab,
      url: Complete.convertToLink(value, tab.isURL, tab.isLink),
      noconvert: true
    });
    return;
  }

  if (/^buffer +/.test(value)) {
    var index = +value.replace(/^\S+\s+/, '') - 1,
        selectedBuffer;
    if (Number.isNaN(index)) {
      selectedBuffer = Command.completionResults[0];
      if (selectedBuffer === void 0)
        return;
    } else {
      selectedBuffer = Command.completionResults.filter(function(e) {
        return e[1].indexOf((index + 1).toString()) === 0;
      })[0];
    }
    if (selectedBuffer !== void 0)
      RUNTIME('goToTab', {id: selectedBuffer[3]});
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
    value = Utils.trim(value.replace(/^\S+(\s+)?/, ''));
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
    value = Utils.trim(value.replace(/^\S+(\s+)?/, ''));
    if (value === '') {
      Status.setMessage('session name required', 1, 'error');
      return;
    }
    if (/[^a-zA-Z0-9_-]/.test(value)) {
      Status.setMessage('only alphanumeric characters, dashes, ' +
                        'and underscores are allowed', 1, 'error');
      return;
    }
    if (!~sessions.indexOf(value)) {
      sessions.push(value);
    }
    RUNTIME('createSession', { name: value }, function(response) {
      sessions = response;
    });
    return;
  }

  if (/^session/.test(value)) {
    value = Utils.trim(value.replace(/^\S+(\s+)?/, ''));
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
    settings.MAPPINGS += '\n' + value;
    Mappings.parseLine(value);
    PORT('syncSettings', { settings: settings });
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

  if (/^let +/.test(value) && value !== 'let') {
    try {
      var added = RCParser.parse(value);
      delete added.MAPPINGS;
      Object.merge(settings, added);
      PORT('syncSettings', { settings: settings });
    } catch (e) {
      Command.hide();
    }
    return;
  }

  if (/^call +/.test(value)) {
    Mappings.parseLine(value);
    return;
  }

  if (/^script +/.test(value)) {
    RUNTIME('runScript', {code: value.slice(7)});
  }

};

Command.show = function(search, value, complete) {
  if (!this.domElementsLoaded) {
    Command.callOnCvimLoad(function() {
      Command.show(search, value, complete);
    });
    return;
  }
  if (window.isCommandFrame === void 0) {
    Mappings.handleEscapeKey();
    Mappings.clearQueue();
    window.wasFocused = true;
    PORT('showCommandFrame', {
      frameId: Frames.frameId,
      search: search,
      value: value,
      complete: complete ? value : null
    });
    return;
  }
  commandMode = true;
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
    if (complete !== null) {
      this.complete(value);
    }

    // UPDATE: seems to work without patch now (Chromium 44.0.2403.130)
    // Temp fix for Chromium issue in #97
    if (this.commandBarFocused()) {
      document.activeElement.select();

      // TODO: figure out why a842dd6 and fix for #527 are necessary
      // document.getSelection().collapseToEnd();
      document.getSelection().modify('move', 'right', 'lineboundary');

    }
    // End temp fix

  }.bind(this), 0);
};

Command.hide = function(callback) {
  if (window.isCommandFrame)
    this.input.blur();
  commandMode = false;
  this.historyMode = false;
  this.active = false;
  Search.index = null;
  this.history.index = {};
  this.typed = '';
  this.dataElements = [];
  this.hideData();
  if (this.bar)
    this.bar.style.display = 'none';
  if (this.input)
    this.input.value = '';
  if (this.data)
    this.data.style.display = 'none';
  if (callback)
    callback();
  if (window.isCommandFrame)
    PORT('hideCommandFrame');
};

Command.insertCSS = function() {
  var css = settings.COMMANDBARCSS;
  if (!css) {
    return;
  }
  if (settings.linkanimations) {
    css += '.cVim-link-hint { transition: opacity 0.2s ease-out, ' +
           'background 0.2s ease-out; }';
  }

  RUNTIME('injectCSS', {css: css, runAt: 'document_start'});

  var head = document.getElementsByTagName('head');
  if (head.length) {
    this.css = document.createElement('style');
    this.css.textContent = css;
    head[0].appendChild(this.css);
  }
};

Command.callOnCvimLoad = (function() {
  var fnQueue = [];
  return function(FN) {
    if (!this.domElementsLoaded) {
      if (typeof FN === 'function') {
        fnQueue.push(FN);
      }
    } else {
      if (typeof FN === 'function') {
        FN();
      }
      fnQueue.forEach(function(FN) {
        FN();
      });
      fnQueue.length = 0;
    }
  };
})();

Command.onDOMLoad = function() {
  this.onDOMLoadAll();
  if (window.self === window.top) {
    Command.frame = document.createElement('iframe');
    Command.frame.src = chrome.runtime.getURL('cmdline_frame.html');
    Command.frame.id = 'cVim-command-frame';
    document.lastElementChild.appendChild(Command.frame);
  }
};

Command.preventAutoFocus = function() {
  var manualFocus = false;

  var addTextListeners = (function() {
    var allElems = [];
    return function(elems) {
      elems = [].filter.call(elems, function(e) {
        return allElems.indexOf(e) === -1;
      });
      allElems = allElems.concat(elems);
      elems.forEach(function(elem) {
        var listener = function(event) {
          if (manualFocus) {
            elem.removeEventListener('focus', listener);
            return;
          }
          if (event.sourceCapabilities === null) {
            event.preventDefault();
            elem.blur();
          }
        };
        elem.addEventListener('focus', listener);
      });
    };
  })();

  var reset;
  if (KeyboardEvent.prototype.hasOwnProperty('key')) {
    reset = function(key) {
      if (['Control', 'Alt', 'Meta', 'Shift'].indexOf(key) !== -1)
        return;
      manualFocus = true;
      KeyHandler.listener.removeListener('keydown', reset);
      window.removeEventListener('mousedown', reset, true);
    };
    KeyHandler.listener.addListener('keydown', reset);
    window.addEventListener('mousedown', reset, true);
  } else {
    reset = function(event) {
      if (!event.isTrusted)
        return true;
      manualFocus = true;
      window.removeEventListener('keypress', reset, true);
      window.removeEventListener('mousedown', reset, true);
    };
    window.addEventListener('keypress', reset, true);
    window.addEventListener('mousedown', reset, true);
  }

  var preventFocus = function() {
    if (manualFocus)
      return;
    var textElements = document.querySelectorAll('input,textarea,*[contenteditable]');
    for (var i = 0; i < textElements.length; i++) {
      if (manualFocus)
        break;
      if (document.activeElement === textElements[i])
        textElements[i].blur();
    }
    addTextListeners(textElements);
  };

  window.addEventListener('load', preventFocus);
  preventFocus();
};

Command.onDOMLoadAll = function() {
  this.insertCSS();
  this.onBottom = settings.barposition === 'bottom';
  if (this.data !== void 0) {
    this.data.style[(!this.onBottom) ? 'bottom' : 'top'] = '';
    this.data.style[(this.onBottom) ? 'bottom' : 'top'] = '20px';
  }
  if (!settings.autofocus)
    this.preventAutoFocus();
  httpRequest({
    url: chrome.runtime.getURL('content_scripts/main.css')
  }, function(data) {
    this.mainCSS = data;
  }.bind(this));
  this.setup();
  this.domElementsLoaded = true;
  this.callOnCvimLoad();
  Scroll.addHistoryState();
};

Command.updateSettings = function(config) {
  var key;
  if (Array.isArray(config.completionengines)) {
    config.completionengines.forEach(function(name) {
      Complete.enableEngine(name);
    });
  }
  this.customCommands = config.COMMANDS || {};
  Object.keys(this.customCommands).forEach(function(name) {
    this.descriptions.push([name, ':' + this.customCommands[name]]);
  }.bind(this));
  if (config.searchengines && config.searchengines.constructor === Object) {
    for (key in config.searchengines) {
      var engine = config.searchengines[key];
      if (typeof engine === 'string') {
        Complete.addEngine(key, engine);
      } else if (Array.isArray(engine) && engine.length === 2 &&
                 typeof engine[0] === 'string' &&
                 typeof engine[1] === 'string') {
        Complete.addEngine(key, {
          baseUrl: engine[0],
          requestUrl: engine[1]
        });
      }
    }
  }
  if (config.searchaliases && config.searchaliases.constructor === Object) {
    for (key in config.searchaliases) {
      if (!Complete.hasEngine(key) || !Complete.engineEnabled(key)) {
        Complete.addAlias(key, config.searchaliases[key]);
      }
    }
  }
  if (config.locale) {
    Complete.setLocale(config.locale);
  }

  var chars = Utils.uniqueElements((config.hintcharacters || '').split(''));
  settings.hintcharacters = chars.join('');

  if (config !== settings) {
    for (key in config) {
      if (key.toUpperCase() !== key && settings.hasOwnProperty(key)) {
        settings[key] = config[key];
      }
    }
  }
};


Command.addSettingBlock = function(config) {
  for (var key in config) {
    if (key === 'MAPPINGS') {
      settings.MAPPINGS += '\n' + config[key];
      Mappings.parseCustom(settings.MAPPINGS, false);
    } else if (config[key].constructor === Object) {
      settings[key] = Object.extend(settings[key], config[key]);
    } else {
      settings[key] = config[key];
    }
  }
};


Command.init = function(enabled) {
  Mappings.defaults = Object.clone(Mappings.defaultsClone);
  Mappings.parseCustom(settings.MAPPINGS, true);
  if (enabled) {
    RUNTIME('setIconEnabled');
    this.loaded = true;
    this.updateSettings(settings);
    waitForLoad(this.onDOMLoad, this);
    if (settings.autohidecursor) {
      waitForLoad(Cursor.init, Cursor);
    }
    addListeners();
    if (typeof settings.AUTOFUNCTIONS === 'object') {
      Object.getOwnPropertyNames(settings.AUTOFUNCTIONS).forEach(function(name) {
        eval('(function(){' + settings.AUTOFUNCTIONS[name] + '})()');
      });
    }
  } else {
    RUNTIME('setIconDisabled');
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

Command.onSettingsLoad = (function() {
  var funcList = [];
  var loaded = false;
  return function(callback) {
    if (typeof callback === 'function') {
      if (!loaded) {
        funcList.push(callback);
      } else {
        callback();
      }
    } else {
      funcList.forEach(function(func) {
        func();
      });
      funcList.length = 0;
      loaded = true;
    }
  };
})();

Command.destroy = function() {
  var removeElements = function() {
    for (var i = 0; i < arguments.length; i++) {
      var elem = arguments[i];
      if (!elem) continue;
      if (typeof elem.remove === 'function')
        elem.remove();
    }
  };
  removeElements(this.input, this.modeIdentifier, this.data, this.bar,
                 this.statusBar, this.frame, this.css);
};

Command.configureSettings = function(_settings) {
  settings = _settings;
  this.onSettingsLoad();
  DOM.onTitleChange(function(text) {
    if (!Session.ignoreTitleUpdate && settings.showtabindices) {
      if (text.indexOf(Session.tabIndex + ' ') !== 0) {
        document.title = Session.tabIndex + ' ' + document.title;
      }
    }
    Session.ignoreTitleUpdate = false;
  });
  this.initialLoadStarted = true;
  var checkBlacklist = function() {
    var blacklists = settings.blacklists,
        blacklist;
    Command.blacklisted = false;
    var isBlacklisted = false;
    for (var i = 0, l = blacklists.length; i < l; i++) {
      blacklist = Utils.split(blacklists[i], /\s+/);
      if (!blacklist.length) {
        continue;
      }
      if (blacklist[0].charAt(0) === '@') {
        if (matchLocation(document.URL, blacklist[0].slice(1))) {
          isBlacklisted = false;
          break;
        }
      } else if (matchLocation(document.URL, blacklist[0])) {
        isBlacklisted = true;
      }
    }
    return isBlacklisted;
  };
  Search.settings = Object.keys(settings).filter(function(e) {
    return typeof settings[e] === 'boolean';
  });
  removeListeners();
  settings.searchlimit = +settings.searchlimit;
  if (!checkBlacklist()) {
    RUNTIME('getActiveState', null, function(isActive) {
      Command.init(isActive);
    });
  } else {
    this.init(false);
  }
};
