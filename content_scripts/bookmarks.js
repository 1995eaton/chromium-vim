var Marks = {
  bookmarks: [],
  files: [],
  currentBookmarks: [],
  quickMarks: {}
};

Marks.filePath = function() {
  var input = Command.input.value.replace(/.*\//, '');
  Command.completions = { files: [] };
  var i, c;
  if (!this.files) {
    return;
  }
  for (i = 0, c = 0; i < this.files.length; ++i) {
    if (this.files[i][0] && this.files[i][0].indexOf(input) === 0) {
      if (!input && this.files[i][0] !== '..' && this.files[i][0][0] === '.') {
        continue;
      }
      Command.completions.files.push([this.files[i][0], this.files[i][1]]);
      c++;
      if (c > settings.searchlimit) {
        break;
      }
    }
  }
  if (c <= settings.searchlimit && !input) {
    for (i = 0; i < this.files.length; ++i) {
      if (this.files[i] !== '..' && this.files[i][0] === '.') {
        Command.completions.files.push([this.files[i][0], !this.files[i][1]]);
        c++;
        if (c > settings.searchlimit) {
          break;
        }
      }
    }
  }
  Command.updateCompletions();
};

Marks.addQuickMark = function(ch) {
  if (this.quickMarks[ch] === void 0) {
    Status.setMessage('New QuickMark "' + ch + '" added', 1);
    this.quickMarks[ch] = [document.URL];
  } else if (this.quickMarks[ch].indexOf(document.URL) === -1) {
    Status.setMessage('Current URL added to QuickMark "' + ch + '"', 1);
    this.quickMarks[ch].push(document.URL);
  } else {
    this.quickMarks[ch].splice(this.quickMarks[ch].indexOf(document.URL));
    if (this.quickMarks[ch].length === 0) {
      Status.setMessage('Quickmark "' + ch + '" removed', 1);
      delete this.quickMarks[ch];
    } else {
      Status.setMessage('Current URL removed from existing QuickMark "' + ch + '"', 1);
    }
  }
  RUNTIME('updateMarks', {marks: this.quickMarks});
};

Marks.openQuickMark = function(ch, tabbed, repeats) {
  if (!this.quickMarks.hasOwnProperty(ch)) {
    return Status.setMessage('mark not set', 1, 'error');
  }
  if (tabbed) {
    if (repeats !== 1) {
      if (this.quickMarks[ch][repeats - 1]) {
        RUNTIME('openLinkTab', {url: this.quickMarks[ch][repeats - 1]});
      } else {
        RUNTIME('openLinkTab', {url: this.quickMarks[ch][0]});
      }
    } else {
      for (var i = 0, l = this.quickMarks[ch].length; i < l; ++i) {
        RUNTIME('openLinkTab', {url: this.quickMarks[ch][i]});
      }
    }
  } else {
    if (this.quickMarks[ch][repeats - 1]) {
      RUNTIME('openLink', {
        tab: {
          pinned: false
        },
        url: this.quickMarks[ch][repeats - 1]
      });
    } else {
      RUNTIME('openLink', {
        tab: {
          pinned: false
        },
        url: this.quickMarks[ch][0]
      });
    }
  }
};

Marks.parse = function(marks) {
  marks.forEach(function(bookmark) {
    if (bookmark.url) {
      Marks.bookmarks.push([bookmark.title, bookmark.url]);
    }
    if (bookmark.children) {
      Marks.parse(bookmark.children);
    }
  });
};

Marks.match = function(string, callback, limit) {
  if (string.trim() === '') {
    return callback(this.bookmarks.slice(0, settings.searchlimit + 1));
  }
  callback(searchArray(this.bookmarks, string, limit, true, function(item) {
    return item.join(' ');
  }));
};

Marks.matchPath = function(path) { PORT('getBookmarkPath', {path: path}); };
