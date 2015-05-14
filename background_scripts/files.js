var Files = {
  parseHTML: function(data) {
    return (data.match(/addRow\(".*/g) || []).map(function(e) {
      e = JSON.parse('[' + e.slice(7).replace(/\);.*/, ']'));
      return [e[0], e[2] ? 'Directory' : 'File (' + e[3] + ')'];
    });
  },
  getPath: function(path, callback) {
    if (path = path.replace(/[^\/]*$/, '')) {
      httpRequest({url: 'file://' + path}).then(function(data) {
        callback(Files.parseHTML(data));
      }, function(xhr) { if (xhr); });
    }
  }
};
