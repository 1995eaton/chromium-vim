#!/usr/bin/env node

var fs     = require('fs'),
    marked = require('marked');

process.chdir(__dirname);

marked.setOptions({
  renderer: new marked.Renderer(),
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: true,
  smartLists: true,
  smartypants: false
});

var getIncludes = function(callback) {
  fs.readFile('../pages/options.html', 'utf8', function(err, data) {
    callback(data.split('\n').filter(function(e) {
      return e.indexOf('content_scripts') !== -1;
    }).join('\n'));
  });
};

var makeHTML = function(includes, data) {
  return '<!DOCTYPE html><html><head>' +
         '<link rel="stylesheet" href="./markdown.css">' +
         includes + '</head>' + marked(data) + '</html>';
};

(function() {

  var fileMap = {
    mappings:  'README.md',
    changelog: 'CHANGELOG.md'
  };

  getIncludes(function(includes) {
    for (var key in fileMap) {
      var data = fs.readFileSync('../' + fileMap[key], 'utf8');
      fs.writeFileSync('../pages/' + key + '.html', makeHTML(includes, data));
    }
  });

})();
