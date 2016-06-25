Marks = (function() {

  var bookmarks = [],
      quickMarks = {},
      files = [];

  var _ = {};

  _.filePath = function(_files) {
    files = _files || files;
    var input = Command.input.value.replace(/.*\//, '');
    Command.completions = { files: [] };
    var i, c;
    if (!files) {
      return;
    }
    for (i = 0, c = 0; i < files.length; ++i) {
      if (files[i][0] && files[i][0].indexOf(input) === 0) {
        if (!input && files[i][0] !== '..' && files[i][0][0] === '.') {
          continue;
        }
        Command.completions.files.push([files[i][0], files[i][1]]);
        if (++c > settings.searchlimit) {
          break;
        }
      }
    }
    if (c <= settings.searchlimit && !input) {
      for (i = 0; i < files.length; ++i) {
        if (files[i] !== '..' && files[i][0] === '.') {
          Command.completions.files.push([files[i][0], !files[i][1]]);
          if (++c > settings.searchlimit) {
            break;
          }
        }
      }
    }
    Command.updateCompletions();
  };

  _.addQuickMark = function(ch) {
    if (quickMarks[ch] === void 0) {
      Status.setMessage('New QuickMark "' + ch + '" added', 1);
      quickMarks[ch] = [document.URL];
    } else if (quickMarks[ch].indexOf(document.URL) === -1) {
      Status.setMessage('Current URL added to QuickMark "' + ch + '"', 1);
      quickMarks[ch].push(document.URL);
    } else {
      quickMarks[ch].splice(quickMarks[ch].indexOf(document.URL));
      if (quickMarks[ch].length === 0) {
        Status.setMessage('Quickmark "' + ch + '" removed', 1);
        delete quickMarks[ch];
      } else {
        Status.setMessage('Current URL removed from existing QuickMark "' + ch + '"', 1);
      }
    }
    RUNTIME('updateMarks', {marks: quickMarks});
  };

  _.openQuickMark = function(ch, opts, repeats) {
    if (!quickMarks.hasOwnProperty(ch)) {
      return Status.setMessage('mark not set', 1, 'error');
    }
    if (repeats !== 1 || (!opts.tab.tabbed && !opts.tab.newWindow)) {
      if (quickMarks[ch][repeats - 1]) {
        opts.url = quickMarks[ch][repeats - 1];
        RUNTIME('openLink', opts);
      } else {
        opts.url = quickMarks[ch][0];
        RUNTIME('openLink', opts);
      }
    } else if (opts.tab.tabbed) {
      for (var i = 0, l = quickMarks[ch].length; i < l; ++i) {
        opts.url = quickMarks[ch][i];
        RUNTIME('openLink', opts);
      }
    } else if (opts.tab.newWindow) {
      RUNTIME('openLinksWindow', {
        urls: quickMarks[ch]
      });
    }
  };

  _.parseQuickMarks = function(marks) {
    quickMarks = {};
    for (var key in marks) {
      if (Array.isArray(marks[key])) {
        quickMarks[key] = marks[key];
      } else if (typeof marks[key] === 'string') {
        quickMarks[key] = [marks[key]];
      }
    }
  };

  _.parse = function(marks) {
    bookmarks = [];
    (function recurse(marks) {
      marks.forEach(function(bookmark) {
        if (bookmark.url) {
          bookmarks.push([bookmark.title, bookmark.url]);
        }
        if (bookmark.children) {
          recurse(bookmark.children);
        }
      });
    })(marks);
  };

  _.match = function(string, callback, limit) {
    if (string.trim() === '') {
      callback(bookmarks.slice(0, settings.searchlimit + 1));
      return;
    }
    callback(searchArray({
      array: bookmarks,
      search: string,
      limit: limit,
      fn: function(item) { return item.join(' '); }
    }));
  };

  var lastFileSearch, lastSearchLength;
  _.parseFileCommand = function(search) {
    if ((search.slice(-1) === '/' && lastSearchLength < search.length) || lastSearchLength > search.length || !(lastFileSearch && lastFileSearch.replace(/[^\/]+$/, '') === search) && (search.slice(-1) === '/' && !(lastFileSearch && lastFileSearch.slice(-1) === '/'))) {
      lastFileSearch = search;
      lastSearchLength = search.length;
      if (settings.homedirectory) {
        search = search.replace('~', settings.homedirectory);
      }
      RUNTIME('getFilePath', { path: search }, function(data) {
        Marks.filePath(data);
      });
    } else {
      lastFileSearch = search;
      _.filePath();
    }
  };

  _.matchPath = function(path) { PORT('getBookmarkPath', {path: path}); };

  return _;

})();
