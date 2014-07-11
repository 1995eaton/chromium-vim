var Command = {};
var settings, sessions;

Command.dataElements = [];
Command.matches = [];

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
  this.input.addEventListener('blur', function() { // Possible fix for #43
    window.setTimeout(function() {
      Command.hide.call(Command);
    }, 0);
  });
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
    this.barHeight = parseInt(getComputedStyle(this.bar).height);
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
    index += reverse? -1 : 1;
    if (Command.typed && Command.typed.trim()) {
      while (this.setInfo(type, index)) {
        if (this[type][index].substring(0, Command.typed.length) === Command.typed) {
          break;
        }
        index += reverse? -1 : 1;
      }
    }
    if (reverse && index === -1) {
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
  topsites: ['Top Site', 'darkcyan'],
  history:  ['History', 'cyan'],
  bookmarks: ['Bookmark', '#6d85fd']
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
  this.data.style.display = 'block';
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
  ['new',      'Open a link in a new window'],
  ['buffer',      'Select from a list of current tabs'],
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
  ['tabattach',    'Move current tab to another window'],
  ['chrome://',    'Opens Chrome urls'],
  ['duplicate',    'Clone the current tab'],
  ['settings',     'Open the options page for this extension'],
  ['help',         'Shows the help page'],
  ['changelog',    'Shows the changelog page'],
  ['date',         'Display the current date'],
  ['quit',         'Close the current tab'],
  ['qall',         'Close the current window'],
  ['stop',         'Stop the current page from loading'],
  ['stopall',      'Stop all pages in Chrome from loading'],
  ['undo',         'Reopen the last closed tab'],
  ['togglepin',    'Toggle the tab\'s pinned state'],
  ['nohl',         'Clears the search highlight'],
  ['viewsource',   'View the source for the current document']
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

    if ((search.length < 2 || Complete.engines.indexOf(search[0]) === -1) && !Complete.hasAlias(search[0]) || (Complete.hasAlias(search[0]) &&  value.slice(-1) !== ' ' && search.length < 2)) {

      if (Complete.engines.indexOf(search[0]) !== -1) {
        return this.hideData();
      }

      this.completions.engines = [];
      for (var i = 0, l = Complete.engines.length; i < l; ++i) {
        if (!search[0] || Complete.engines[i].indexOf(search.join(' ')) === 0) {
          this.completions.engines.push([Complete.engines[i], Complete.requestUrls[Complete.engines[i]]]);
        }
      }
      this.updateCompletions(true);

      this.completions.topsites = Search.topSites.filter(function(e) {
        return (e[0] + ' ' + e[1]).toLowerCase().indexOf(search.slice(0).join(' ').toLowerCase()) !== -1;
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
      return port.postMessage({action: 'searchHistory', search: value.replace(/^\S+\s+/, ''), limit: settings.searchlimit});

    }

    if (search[0] = (Complete.getAlias(search[0]) || search[0])) {
      if (search.length < 2) {
        this.hideData();
        return;
      }
    }
    if (Complete.engines.indexOf(search[0]) !== -1 && Complete.hasOwnProperty(search[0])) {
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
    chrome.runtime.sendMessage({action: 'getHistoryStates'}, function(response) {
      this.completions = {
        tabhistory: response.links.filter(function(e) {
          return e.indexOf(value.replace(/\S+\s+/, '')) !== -1;
        })
      };
      this.updateCompletions();
    }.bind(this));
    return;
  }

  if (/^taba(ttach)? +/.test(value)) {
    chrome.runtime.sendMessage({action: 'getWindows'});
    this.completions = { };
    return;
  }

  if (/^buffer(\s+)/.test(value)) {
    port.postMessage({action: 'getBuffers'});
    return;
  }

  if (/^restore\s+/.test(value)) {
    chrome.runtime.sendMessage({action: 'getChromeSessions'}, function(sessions) {
      this.completions = {
        chromesessions: Object.keys(sessions).map(function(e) {
          return [sessions[e].id + ': ' + sessions[e].title, sessions[e].url, sessions[e].id];
        }).filter(function(e) {
          return e.join('').toLowerCase().indexOf(value.replace(/^\S+\s+/, '').toLowerCase()) !== -1;
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
    return this.updateCompletions();
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
      return this.hideData();
    }
    this.historyMode = true;
    port.postMessage({action: 'searchHistory', search: search, limit: settings.searchlimit});
    return;
  }

  if (/^file +/.test(value)) {
    if ((search.slice(-1) === '/' && Marks.lastSearchLength < search.length) || Marks.lastSearchLength > search.length || !(Marks.lastFileSearch && Marks.lastFileSearch.replace(/[^\/]+$/, '') === search) && (search.slice(-1) === '/' && !(Marks.lastFileSearch && Marks.lastFileSearch.slice(-1) === '/'))) {
      Marks.lastFileSearch = search;
      Marks.lastSearchLength = search.length;
      if (settings.homedirectory) {
        search = search.replace('~', settings.homedirectory);
      }
      return chrome.runtime.sendMessage({action: 'getFilePath', path: search});
    } else {
      Marks.lastFileSearch = search;
      return Marks.filePath();
    }
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
    case 'nohl':
      Find.clear();
      HUD.hide();
      break;
    case 'duplicate':
      tab.tabbed = true;
      chrome.runtime.sendMessage({action: 'openLink', tab: tab, url: document.URL, repeats: repeats});
      break;
    case 'settings':
      tab.tabbed = true;
      chrome.runtime.sendMessage({action: 'openLink', tab: tab, url: chrome.extension.getURL('/pages/options.html'), repeats: repeats});
      break;
    case 'changelog':
      tab.tabbed = true;
      chrome.runtime.sendMessage({action: 'openLink', tab: tab, url: chrome.extension.getURL('/pages/changelog.html'), repeats: repeats});
      break;
    case 'date':
      var date = new Date();
      var weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      Status.setMessage(weekDays[date.getDay()] + ', ' + months[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear(), 2);
      break;
    case 'help':
      tab.tabbed = true;
      chrome.runtime.sendMessage({action: 'openLink', tab: tab, url: chrome.extension.getURL('/pages/mappings.html')});
      break;
    case 'stop':
      window.stop();
      break;
    case 'stopall':
      chrome.runtime.sendMessage({action: 'cancelAllWebRequests'});
      break;
    case 'viewsource':
      chrome.runtime.sendMessage({action: 'openLink', tab: tab, url: 'view-source:' + document.URL, noconvert: true});
      break;
    case 'togglepin':
      chrome.runtime.sendMessage({action: 'pinTab'});
      break;
    case 'undo':
      chrome.runtime.sendMessage({action: 'openLast'});
      break;
    case 'tabnext':
    case 'tabn':
      chrome.runtime.sendMessage({action: 'nextTab'});
      break;
    case 'tabprevious':
    case 'tabp':
    case 'tabN':
      chrome.runtime.sendMessage({action: 'previousTab'});
      break;
    case 'tabprevious':
      break;
    case 'q':
    case 'quit':
    case 'exit':
      chrome.runtime.sendMessage({action: 'closeTab', repeats: repeats});
      break;
    case 'qa':
    case 'qall':
      chrome.runtime.sendMessage({action: 'closeWindow'});
      break;
    default:
      break;
  }

  if (/^chrome:\/\/\S+$/.test(value)) {
    return chrome.runtime.sendMessage({
      action: 'openLink',
      tab: tab,
      url: value,
      noconvert: true
    });
  }

  if (/^bookmarks +/.test(value) && !/^\S+\s*$/.test(value)) {
    if (/^\S+\s+\//.test(value)) {
      return chrome.runtime.sendMessage({
        action: 'openBookmarkFolder',
        path: value.replace(/\S+\s+/, ''),
        noconvert: true
      });
    }
    return chrome.runtime.sendMessage({
      action: 'openLink',
      tab: tab,
      url: value.replace(/^\S+\s+/, ''),
      noconvert: true
    });
  }

  if (/^history +/.test(value) && !/^\S+\s*$/.test(value)) {
    return chrome.runtime.sendMessage({
      action: 'openLink',
      tab: tab,
      url: Complete.convertToLink(value),
      noconvert: true
    });
  }

  if (/^taba(ttach)? +/.test(value) && !/^\S+\s*$/.test(value)) {
    var windowId;
    if (windowId = this.completionResults[parseInt(value.replace(/^\S+ */, '')) - 1]) {
      return chrome.runtime.sendMessage({
        action: 'moveTab',
        windowId: windowId[3]
      });
    }
  }

  if (/^file +/.test(value)) {
    return chrome.runtime.sendMessage({
      action: 'openLink',
      tab: tab,
      url: 'file://' + value.replace(/\S+ +/, '').replace(/^~/, settings.homedirectory),
      noconvert: true
    });
  }

  if (/^(new|winopen|wo)$/.test(value.replace(/ .*/, '')) && !/^\S+\s*$/.test(value)) {
    return chrome.runtime.sendMessage({
      action: 'openLinkWindow',
      tab: tab,
      url: Complete.convertToLink(value),
      repeats: repeats,
      noconvert: true
    });
  }

  if (/^restore\s+/.test(value)) {
    chrome.runtime.sendMessage({
      action: 'restoreChromeSession',
      sessionId: value.replace(/\S+\s+/, '').trimAround()
    });
  }

  if (/^(tabnew|tabedit|tabe|to|tabopen|tabhistory)$/.test(value.replace(/ .*/, ''))) {
    tab.tabbed = true;
    return chrome.runtime.sendMessage({
      action: 'openLink',
      tab: tab,
      url: Complete.convertToLink(value),
      repeats: repeats,
      noconvert: true
    });
  }

  if (/^(o|open)$/.test(value.replace(/ .*/, '')) && !/^\S+\s*$/.test(value)) {
    return chrome.runtime.sendMessage({
      action: 'openLink',
      tab: tab,
      url: Complete.convertToLink(value),
      noconvert: true
    });
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
      chrome.runtime.sendMessage({
        action: 'goToTab',
        id: selectedBuffer[3]
      });
    }
    return;
  }

  if (/^execute +/.test(value)) {
    var command = value.replace(/^\S+/, '').trim();
    realKeys = '';
    repeats = '';
    Command.hide();
    return Mappings.executeSequence(command);
  }

  if (/^delsession/.test(value)) {
    value = value.replace(/^\S+(\s+)?/, '').trimAround();
    if (value === '') {
      return Status.setMessage('argument required', 1, 'error');
    }
    if (sessions.indexOf(value) !== -1) {
      sessions.splice(sessions.indexOf(value), 1);
    }
    value.split(' ').forEach(function(v) {
      chrome.runtime.sendMessage({action: 'deleteSession', name: v});
    });
    return port.postMessage({action: 'getSessionNames'});
  }

  if (/^mksession/.test(value)) {
    value = value.replace(/^\S+(\s+)?/, '').trimAround();
    if (value === '') {
      return Status.setMessage('session name required', 1, 'error');
    }
    if (/[^a-zA-Z0-9_-]/.test(value)) {
      return Status.setMessage('only alphanumeric characters, dashes, and underscores are allowed', 1, 'error');
    }
    if (sessions.indexOf(value) === -1) {
      sessions.push(value);
    }
    chrome.runtime.sendMessage({
      action: 'createSession',
      name: value
    });
    return;
  }

  if (/^session/.test(value)) {
    value = value.replace(/^\S+(\s+)?/, '').trimAround();
    if (value === '') {
      return Status.setMessage('session name required', 1, 'error');
    }
    return chrome.runtime.sendMessage({
      action: 'openSession',
      name: value,
      sameWindow: !tab.active
    }, function() {
      Status.setMessage('session does not exist', 1, 'error');
    });
  }

  if (/^set +/.test(value) && value !== 'set') {
    value = value.replace(/^set +/, '').split(/[ =]+/);
    var isSet, swapVal,
        isQuery = /\?$/.test(value[0]);
    value[0] = value[0].replace(/\?$/, '');
    if (!settings.hasOwnProperty(value[0].replace(/^no|!$/g, ''))) {
      return Status.setMessage('unknown option: ' + value[0], 1, 'error');
    }

    if (isQuery) {
      return Status.setMessage(value + ': ' + settings[value[0]], 1);
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
      chrome.runtime.sendMessage({action: 'syncSettings', settings: settings});
    }
    return;
  }

};

Command.show = function(search, value) {
  if (!this.domElementsLoaded) {
    return false;
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
  if (!settings.COMMANDBARCSS) {
    return;
  }
  var head = document.getElementsByTagName('head');
  if (!head.length && window.location.protocol !== 'chrome-extensions:' && window.location.pathname !== '/_/chrome/newtab') {
    if (window.location.protocol !== 'chrome:') {
      chrome.runtime.sendMessage({
        action: 'injectCSS',
        css: settings.COMMANDBARCSS,
        runAt: 'document_start'
      });
    }
  }
  // For some reason, Chrome's own implementation of CSS injection seems to miss some styles.
  if (head.length) {
    this.css = document.createElement('style');
    this.css.textContent = settings.COMMANDBARCSS;
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
        if (/input|textarea/i.test(document.activeElement.localName) && !manualFocus) {
          document.activeElement.blur();
        }
      }
      if (manualFocus) {
        window.clearInterval(initialFocus);
      }
    }, 5);
    var initialKeyDown = document.addEventListener('keydown', function() {
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

Command.init = function(enabled) {
  var key;
  Mappings.defaults = Object.clone(Mappings.defaultsClone);
  Mappings.shortCuts = Object.clone(Mappings.shortCutsClone);
  Mappings.parseCustom(settings.MAPPINGS);
  if (enabled) {
    this.loaded = true;

    if (Array.isArray(settings.completionengines) && settings.completionengines.length) {
      Complete.engines = Complete.engines.filter(function(e) {
        return settings.completionengines.indexOf(e) !== -1;
      });
    }
    if (settings.searchengines && settings.searchengines.constructor === Object) {
      for (key in settings.searchengines) {
        if (Complete.engines.indexOf(key) === -1 && typeof settings.searchengines[key] === 'string') {
          Complete.engines.push(key);
          Complete.requestUrls[key] = settings.searchengines[key];
        }
      }
    }
    if (settings.searchaliases && settings.searchaliases.constructor === Object) {
      for (key in settings.searchaliases) {
        if (Complete.engines.indexOf(key)) {
          Complete.aliases[key] = settings.searchaliases[key];
        }
      }
    }

    if (settings.locale) {
      Complete.setLocale(settings.locale);
    }

    waitForLoad(this.onDOMLoad, this);
    if (settings.autohidecursor) {
      waitForLoad(Cursor.init, Cursor);
    }
    Scroll.smoothScroll = settings.smoothscroll;
    Scroll.stepSize = +settings.scrollstep;
    if (settings.hintcharacters.split('').unique().length > 1) {
      settings.hintcharacters = settings.hintcharacters.split('').unique().join('');
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
        if (blacklist.length > 1) {
          var unmaps      = blacklist.slice(1),
            unmapString = '';
          for (var j = 0, q = unmaps.length; j < q; ++j) {
            unmapString += '\nunmap ' + unmaps[j];
          }
          Mappings.siteSpecificBlacklists += unmapString;
          break;
        }
        return true;
      }
    }
  };
  var loadMain = function() {
    Command.loaded = true;
    chrome.runtime.sendMessage({action: 'setIconEnabled'});
    Command.init(true);
  };
  Search.settings = Object.keys(settings).filter(function(e) {
    return settings[e].constructor === Boolean;
  });
  removeListeners();
  settings.searchlimit = +settings.searchlimit;
  if (!checkBlacklist()) {
    chrome.runtime.sendMessage({action: 'getActiveState'}, function(response) {
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
  chrome.runtime.sendMessage({action: 'getSettings'});
}
