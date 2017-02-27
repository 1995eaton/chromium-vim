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
  path = Utils.compressArray(path.split('/'));
  chrome.bookmarks.getTree(function(tree) {
    var dir = tree[0];
    while (dir = Bookmarks.containsFolder(path[0], dir)) {
      path = path.slice(1);
      if (!path || !path.length) {
        var links = dir.children.map(function(e) { return e.url; });
        callback(Utils.compressArray(links));
      }
    }
  });
};

Bookmarks.getPath = function(marks, path, callback, initialPath) {
  var result = [],
      folder = null,
      matchFound = false;
  if (!initialPath) {
    initialPath = path.replace(/\/[^\/]+$/, '/').replace(/\/+/g, '/');
  }
  if (typeof path !== 'string' || path[0] !== '/') {
    return false;
  }
  path = Utils.compressArray(path.split(/\//));
  marks.forEach(function(item) {
    if (item.title === path[0]) {
      folder = item;
    }
    if (path[0] && item.title.slice(0, path[0].length).toLowerCase() === path[0].toLowerCase()) {
      result.push([item.title, (item.url || 'folder'), initialPath]);
    }
    if (path.length === 0) {
      if (!matchFound) {
        result = [];
      }
      matchFound = true;
      result.push([item.title, (item.url || 'folder'), initialPath]);
    }
  });
  if (path.length === 0 || !folder) {
    return callback(result);
  }
  this.getPath(folder.children, '/' + path.slice(1).join('/'), callback, initialPath);
};
