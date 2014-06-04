var Marks = {};
Marks.bookmarks        = [];
Marks.quickMarks       = {};
Marks.currentBookmarks = [];
Marks.files = [];

Marks.filePath = function() {
  var input = Command.input.value.replace(/.*\//, "");
  var ret = [];
  var i, c;
  for (i = 0, c = 0; i < this.files.length; ++i) {
    if (this.files[i][0] && this.files[i][0].indexOf(input) === 0) {
      if (!input && this.files[i][0] !== ".." && this.files[i][0][0] === ".") {
        continue;
      }
      ret.push(["file", this.files[i][0], this.files[i][1]]);
      c++;
      if (c >= settings.searchlimit) {
        break;
      }
    }
  }
  if (c < settings.searchlimit && !input) {
    for (i = 0; i < this.files.length; ++i) {
      if (this.files[i] !== ".." && this.files[i][0] === ".") {
        ret.push(["file", this.files[i][0], !this.files[i][1]]);
        c++;
        if (c >= settings.searchlimit) {
          break;
        }
      }
    }
  }
  Command.hideData();
  return Command.appendResults(ret);
};

Marks.addQuickMark = function(ch) {
  if (this.quickMarks[ch] === undefined) {
    Status.setMessage("New QuickMark \"" + ch + "\" added", 1);
    this.quickMarks[ch] = [document.URL];
  } else if (this.quickMarks[ch].indexOf(document.URL) === -1) {
    Status.setMessage("Current URL added to QuickMark \"" + ch + "\"", 1);
    this.quickMarks[ch].push(document.URL);
  } else {
    this.quickMarks[ch].splice(this.quickMarks[ch].indexOf(document.URL));
    if (this.quickMarks[ch].length === 0) {
      Status.setMessage("Quickmark \"" + ch + "\" removed", 1);
      delete this.quickMarks[ch];
    } else {
      Status.setMessage("Current URL removed from existing QuickMark \"" + ch + "\"", 1);
    }
  }
  chrome.runtime.sendMessage({action: "updateMarks", marks: this.quickMarks});
};

Marks.openQuickMark = function(ch, tabbed, repeats) {
  if (!this.quickMarks.hasOwnProperty(ch)) {
    return Status.setMessage("mark not set", 1, "error");
  }
  if (tabbed) {
    if (repeats !== 1) {
      if (this.quickMarks[ch][repeats - 1]) {
        chrome.runtime.sendMessage({action: "openLinkTab", url: this.quickMarks[ch][repeats - 1]});
      } else {
        chrome.runtime.sendMessage({action: "openLinkTab", url: this.quickMarks[ch][0]});
      }
    } else {
      for (var i = 0, l = this.quickMarks[ch].length; i < l; ++i) {
        chrome.runtime.sendMessage({action: "openLinkTab", url: this.quickMarks[ch][i]});
      }
    }
  } else {
    if (this.quickMarks[ch][repeats - 1]) {
      chrome.runtime.sendMessage({action: "openLink", url: this.quickMarks[ch][repeats - 1]});
    } else {
      chrome.runtime.sendMessage({action: "openLink", url: this.quickMarks[ch][0]});
    }
  }
};

Marks.parse = function(marks) {
  marks.forEach(function(bookmark) {
    if (bookmark.url) {
      Marks.bookmarks.push(["bookmark", bookmark.title, bookmark.url]);
    }
    if (bookmark.children) {
      Marks.parse(bookmark.children);
    }
  });
};

Marks.match = function(string, callback) {

  var regexp,
      i,
      matches = [];

  if (string.trim() === "") {
    return callback(this.bookmarks.slice(0, settings.searchlimit));
  }

  try {
    regexp = new RegExp(string, "i");
  } catch (e) {}

  for (i = 0, l = this.bookmarks.length; i < l; ++i) {
    if (regexp) {
      if (regexp.test(this.bookmarks[i].slice(1, 3).join(" "))) {
        matches.push(this.bookmarks[i]);
      }
    } else if (this.bookmarks[i][1].indexOf(string) === 0) { // Get the most relavent matches first
      matches.push(this.bookmarks[i]);
    }
    if (matches.length === settings.searchlimit) {
      break;
    }
  }

  if (matches.length < settings.searchlimit && !regexp) {
    for (i = 0, l = this.bookmarks.length; i < l; ++i) {
      if (this.bookmarks[i][1].indexOf(string) !== -1) { // Go for any match position at this point
        matches.push(this.bookmarks[i]);
      }
      if (matches.length === settings.searchlimit) {
        break;
      }
    }
  }

  callback(matches);

};

Marks.matchPath = function(path) {
  port.postMessage({action: "getBookmarkPath", path: path});
};
