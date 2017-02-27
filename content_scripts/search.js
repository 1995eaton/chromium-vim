var Search = {};

Search.index = null;
Search.topSites = [];

Search.chromeUrls = ['accessibility', 'appcache-internals', 'apps', 'blob-internals', 'bookmarks', 'cache', 'chrome', 'chrome-urls', 'components', 'crashes', 'credits', 'devices', 'dns', 'downloads', 'extensions', 'flags', 'flash', 'gcm-internals', 'gpu', 'help', 'histograms', 'history', 'indexeddb-internals', 'inspect', 'invalidations', 'ipc', 'linux-proxy-config', 'media-internals', 'memory', 'memory-internals', 'nacl', 'net-internals', 'newtab', 'omnibox', 'plugins', 'policy', 'predictors', 'print', 'profiler', 'quota-internals', 'sandbox', 'serviceworker-internals', 'settings', 'signin-internals', 'stats', 'sync-internals', 'system', 'terms', 'tracing', 'translate-internals', 'user-actions', 'version', 'view-http-cache', 'webrtc-internals', 'webrtc-logs', 'crash', 'kill', 'hang', 'shorthang', 'gpuclean', 'gpucrash', 'gpuhang', 'ppapiflashcrash', 'ppapiflashhang', 'quit', 'restart'];

Search.chromeMatch = function(string, callback) {
  callback(searchArray({
    array: this.chromeUrls,
    search: string,
    limit: settings.searchlimit
  }));
};

Search.settingsMatch = function(string, callback) {
  callback(searchArray({
    array: this.settings,
    search: string.replace(/^no/, ''),
    limit: settings.searchlimit
  }));
};

Search.nextResult = function(reverse) {
  if (!Command.dataElements.length) {
    if (Command.input.value.length) {
      return false;
    }
    return Command.complete('');
  }

  if (this.index === null) {
    if (!reverse) {
      this.index = 0;
    } else {
      this.index = Command.dataElements.length - 1;
    }
  } else {
    Command.dataElements[this.index].removeAttribute('active');
    if (!reverse) {
      if (this.index + 1 < Command.dataElements.length) {
        this.index++;
      } else {
        this.index = null;
        Command.input.value = Command.typed || '';
        return;
      }
    } else {
      if (this.index === 0) {
        this.index = null;
        Command.input.value = Command.typed || '';
        return;
      } else {
        this.index--;
      }
    }
  }

  Command.dataElements[this.index].setAttribute('active', '');

  switch (Command.completionResults[this.index][0]) {
  case 'chrome':
    Command.input.value = Command.input.value.match(/^\S+ /)[0] +
                          Command.completionResults[this.index][1];
    break;
  case 'bookmarks':
  case 'history':
  case 'topsites':
    Command.input.value = Command.input.value.match(/^\S+ /)[0] + Command.completionResults[this.index][2];
    break;
  case 'tabhistory':
    Command.input.value = 'tabhistory ' + Command.completionResults[this.index][1];
    break;
  case 'engines':
    Command.input.value = Command.input.value.match(/^\S+ /)[0] + Command.completionResults[this.index][1];
    break;
  case 'search':
    var value = Utils.split(Command.input.value, /\s+/);
    var repl = '';
    if (Command.customCommands.hasOwnProperty(value[0])) {
      value = [value[0]];
      repl = Utils.split(Command.customCommands[value[0]], /\s+/).slice(2).join(' ');
    }
    var inputValue, searchValue;
    if (Command.completionResults[this.index].length === 3) {
      inputValue = value[0] + ' ';
      searchValue = Command.completionResults[this.index][2];
    } else {
      inputValue = value.slice(0, 2).join(' ') + ' ';
      searchValue = Command.completionResults[this.index][1];
    }
    if (searchValue.indexOf(repl) === 0)
      searchValue = Utils.trim(searchValue.replace(repl, ''));
    Command.input.value = inputValue + searchValue;
    break;
  case 'windows':
    Command.input.value = Command.input.value.match(/^\S+/)[0] + ' ' + Command.completionResults[this.index][1].replace(/ .*/, '');
    break;
  case 'chromesessions':
    Command.input.value = Command.input.value.match(/^\S+/)[0] + ' ' + Command.completionResults[this.index][3].replace(/ .*/, '');
    break;
  case 'markOptions':
    Command.input.value = Command.input.value.replace(/-[a-zA-Z]*$/, Command.completionResults[this.index][1]);
    break;
  case 'sessions':
    Command.input.value = Command.input.value.match(/^\S+/)[0] + ' ' + Command.completionResults[this.index][1];
    break;
  case 'files':
    Command.input.value = Command.input.value.replace(/[^\/]+$/, '') + Command.completionResults[this.index][1];
    break;
  case 'settings':
    var command = Command.input.value.split(/\s+/);
    Command.input.value = command[0] + ' ' + (/^no/.test(command[1]) ? 'no' : '') + Command.completionResults[this.index][1];
    break;
  case 'paths':
    if (Command.completionResults[this.index][2] !== 'folder') {
      Command.input.value = 'bookmarks ' + Command.completionResults[this.index][2];
    } else {
      Command.input.value = 'bookmarks ' + Command.completionResults[this.index][3] + Command.completionResults[this.index][1];
    }
    break;
  case 'buffers':
    Command.input.value = Command.input.value.match(/^\S+/)[0] + ' ' + Command.completionResults[this.index][1].replace(/:.*/, '');
    break;
  case 'complete':
    if (Command.completionResults[this.index][1] !== void 0) {
      Command.input.value = Command.completionResults[this.index][1];
    }
    break;
  }

};
