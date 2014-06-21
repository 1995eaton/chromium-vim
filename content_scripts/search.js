var Search = {};

Search.index = null;
Search.topSites = [];

Search.chromeUrls = ['accessibility', 'appcache-internals', 'apps', 'blob-internals', 'bookmarks', 'cache', 'chrome', 'chrome-urls', 'components', 'crashes', 'credits', 'devices', 'dns', 'downloads', 'extensions', 'flags', 'flash', 'gcm-internals', 'gpu', 'help', 'histograms', 'history', 'indexeddb-internals', 'inspect', 'invalidations', 'ipc', 'linux-proxy-config', 'media-internals', 'memory', 'memory-internals', 'nacl', 'net-internals', 'newtab', 'omnibox', 'plugins', 'policy', 'predictors', 'print', 'profiler', 'quota-internals', 'sandbox', 'serviceworker-internals', 'settings', 'signin-internals', 'stats', 'sync-internals', 'system', 'terms', 'tracing', 'translate-internals', 'user-actions', 'version', 'view-http-cache', 'webrtc-internals', 'webrtc-logs', 'crash', 'kill', 'hang', 'shorthang', 'gpuclean', 'gpucrash', 'gpuhang', 'ppapiflashcrash', 'ppapiflashhang', 'quit', 'restart'];

Search.chromeMatch = function(string, callback) {
  if (string.trim() === '') {
    return callback(Search.chromeUrls.slice(0, settings.searchlimit));
  }
  callback(this.chromeUrls.filter(function(element) {
    return (string === element.substring(0, string.length));
  }));
};

Search.settingsMatch = function(string, callback) {
  if (!string.trim()) {
    return callback(this.settings.slice(0, settings.searchlimit));
  }
  return callback(this.settings.filter(function(e) {
    return e.substring(0, string.replace(/^no/, '').length) === string.replace(/^no/, '');
  }).slice(0, settings.searchlimit));
};

Search.nextResult = function(reverse) {
  var i, l;
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
    Command.dataElements[this.index].style.backgroundColor = '';
    Command.dataElements[this.index].style.color = '';
    spanElements = Command.dataElements[this.index].getElementsByTagName('span');
    for (i = 0, l = spanElements.length; i < l; ++i) {
      spanElements[i].style.color = '';
    }
    if (this.lastStyle) {
      spanElements[0].firstElementChild.style.color = this.lastStyle;
    }
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

  Command.dataElements[this.index].style.backgroundColor = '#fefefe';
  Command.dataElements[this.index].style.color = '#1b1d1e';
  spanElements = Command.dataElements[this.index].getElementsByTagName('span');
  l = spanElements.length;
  if (spanElements[0].childNodes.length === 2) {
    this.lastStyle = spanElements[0].firstElementChild.style.color;
  } else {
    delete this.lastStyle;
  }
  for (i = 0; i < l; ++i) {
    spanElements[i].style.color = '#1b1d1e';
  }
  switch (Command.completionResults[this.index][0]) {
    case 'chrome':
      Command.input.value = 'chrome://' + Command.completionResults[this.index][1];
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
      var value = Command.input.value.split(/\s+/).filter(function(e) { return e; });
      if (Command.completionResults[this.index].length === 3) {
        Command.input.value = value[0] + ' ' + Command.completionResults[this.index][2];
      } else {
        Command.input.value = value.slice(0, 2).join(' ') + ' ' + Command.completionResults[this.index][1];
      }
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
      Command.input.value = Command.input.value.match(/^\S+/)[0] + ' ' + Command.completionResults[this.index][1][0];
      break;
    case 'complete':
      if (Command.completionResults[this.index][1] !== void 0) {
        Command.input.value = Command.completionResults[this.index][1];
      }
      break;
  }

};
