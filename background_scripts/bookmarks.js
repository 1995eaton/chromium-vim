var Bookmarks = {};

Bookmarks.getMarks = function(callback) {
  chrome.bookmarks.getTree(function(tree) {
    callback(tree[0].children);
  });
};

Bookmarks.containsFolder = function(path, directory) {
  directory = directory.children;
  for (var i = 0, l = directory.length; i < l; ++i) {
    if (path === directory[i].title) {
      return directory[i];
    }
  }
};

Bookmarks.getFolderLinks = function(path, callback) {
  path = path.split('/').filter(function(e) { return e; });
  chrome.bookmarks.getTree(function(tree) {
    var dir = tree[0];
    while (dir = Bookmarks.containsFolder(path[0], dir)) {
      path = path.slice(1);
      if (!path || !path.length) {
        callback(dir.children.filter(function(e) {
          return e.url;
        }).map(function(e) {
          return e.url;
        }));
      }
    }
  });
};

Bookmarks.getPath = function(m, p, callback, initialPath) {
  var _ret = [],
  folder = null,
  matchFound = false;
  if (!initialPath) {
    initialPath = p.replace(/\/[^\/]+$/, '/').replace(/\/+/g, '/');
  }
  if (typeof p !== 'string' || p[0] !== '/') {
    return false;
  }
  p = p.split(/\//).filter(function(e) { return e; });
  m.forEach(function(item) {
    if (item.title === p[0]) {
      folder = item;
    }
    if (p[0] && item.title.substring(0, p[0].length).toLowerCase() === p[0].toLowerCase()) {
      _ret.push([item.title, (item.url || 'folder'), initialPath]);
    }
    if (p.length === 0) {
      if (!matchFound) {
        _ret = [];
      }
      matchFound = true;
      _ret.push([item.title, (item.url || 'folder'), initialPath]);
    }
  });
  if (p.length === 0 || !folder) {
    return callback(_ret);
  }
  p = p.slice(1);
  this.getPath(folder.children, '/' + p.join('/'), callback, initialPath);
};
