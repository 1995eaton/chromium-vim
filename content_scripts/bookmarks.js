var Marks = {};
Marks.bookmarks        = [];
Marks.quickMarks       = {};
Marks.currentBookmarks = [];

Marks.addQuickMark = function(ch) {
  this.quickMarks[ch] = document.URL;
  chrome.runtime.sendMessage({action: "updateMarks", marks: this.quickMarks});
};

Marks.openQuickMark = function(ch, tabbed, repeats) {
  if (!this.quickMarks.hasOwnProperty(ch)) {
    return Status.setMessage("Error: mark not set", 1);
  }
  if (tabbed) {
    chrome.runtime.sendMessage({action: "openLinkTab", url: this.quickMarks[ch], repeats: repeats});
  } else {
    chrome.runtime.sendMessage({action: "openLink", url: this.quickMarks[ch]});
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
