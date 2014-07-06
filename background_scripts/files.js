var Files = {};

Files.sendRequest = function(path, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', 'file://' + path);
  xhr.onreadystatechange = function() {
    // this won't work if the xhr.status === 200
    // check is added below. don't know why...
    if (xhr.readyState === 4) {
      callback(xhr.responseText);
    }
  };
  xhr.send();
};

Files.parseHTML = function(data) {
  var matches = data.match(/addRow\("[^)]+"\)/g),
      results = [],
      i, match;
  if (matches !== null) {
    for (i = 0, l = matches.length; i < l; ++i) {
      match = JSON.parse(matches[i].replace(/[^(]+\(/, '[').slice(0, -1) + ']');
      results.push([match[0], (match[2] ? 'Directory' : 'File (' + match[3] + ')')]);
    }
  }
  return results;
};

Files.getPath = function(path, callback) {
  path = path.replace(/[^\/]*$/, '');
  if (!path) {
    return;
  }
  this.sendRequest(path, function(data) {
    data = Files.parseHTML(data);
    callback(data);
  });
};

