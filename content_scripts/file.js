function sendRequest(path, callback) {
  var xhr;
  xhr = new XMLHttpRequest();
  xhr.open("GET", "file://" + path);
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      callback(xhr.responseText);
    }
  };
  xhr.send();
}

function parseHTML(data) {
  var matches = data.match(/addRow\("[^)]+"\)/g);
  var results = [];
  if (matches) {
    for (var i = 0, l = matches.length; i < l; ++i) {
      results.push(JSON.parse(matches[i].replace(/[^(]+\(/, "[").slice(0, -1) + "]")[0]);
    }
  }
  return results;
}

function getPath(path) {
  sendRequest(path, function(data) {
    data = parseHTML(data);
    console.log(data);
  });
}

getPath("/");
