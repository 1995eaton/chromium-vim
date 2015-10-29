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

var scripts = [
  'session',
  'utils',
  'dom',
  'hints',
  'bookmarks',
  'keys',
  'clipboard',
  'complete',
  'mappings',
  'find',
  'cursor',
  'status',
  'hud',
  'visual',
  'command',
  'scroll',
  'search',
  'frames',
  'messenger',
];

var makeHTML = function(data) {
  return '<!DOCTYPE html><html><head>' +
         '<meta charset="utf-8">' +
         '<link rel="stylesheet" href="./markdown.css">' +
         '<link rel="stylesheet" href="../content_scripts/main.css">' +
         scripts.map(function(e) { return '<script src="../content_scripts/' + e + '.js"></script>'; }).join('\n') +
         '</head>' + marked(data) + '</html>';
};

(function() {

  var fileMap = {
    mappings:  'README.md',
    changelog: 'CHANGELOG.md'
  };

  for (var key in fileMap) {
    var data = fs.readFileSync('../' + fileMap[key], 'utf8');
    fs.writeFileSync('../pages/' + key + '.html', makeHTML(data));
  }

})();
