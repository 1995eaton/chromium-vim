var Files = {};

Files.sendRequest = function(path, callback) {
  var xhr;
  xhr = new XMLHttpRequest();
  xhr.open('GET', 'file://' + path);
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      callback(xhr.responseText);
    }
  };
  xhr.send();
};

Files.parseHTML = function(data) {
  var matches = data.match(/addRow\('[^)]+'\)/g);
  var results = [];
  if (matches) {
    for (var i = 0, l = matches.length; i < l; ++i) {
      var m = JSON.parse(matches[i].replace(/[^(]+\(/, '[').slice(0, -1) + ']');
      results.push([m[0], (m[2] ? 'Directory' : 'File (' + m[3] + ')')]);
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

