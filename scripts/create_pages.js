#!/usr/bin/env node

process.chdir(__dirname);

var fs = require('fs');
var hljs = require('highlight.js');

var md = require('markdown-it')('default', {
  html: false,
  typographer: true,
  quotes: '""\'\'',
  langPrefix: 'language-',
  highlight: function(str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return '<pre class="hljs"><code>' +
          hljs.highlight(lang, str, true).value +
          '</code></pre>';
      } catch (error) {
        console.error(error);
      }
    }
    return '<pre class="hljs"><code>' +
      md.utils.escapeHtml(str) +
      '</code></pre>';
  }
});

var scripts = [
  'session',
  'utils',
  'dom',
  'hints',
  'bookmarks',
  'command',
  'keys',
  'clipboard',
  'complete',
  'mappings',
  'find',
  'cursor',
  'status',
  'hud',
  'visual',
  'scroll',
  'search',
  'frames',
  'messenger',
];

var makeHTML = function(data) {
  return '<!DOCTYPE html><html><head>' +
         '<meta charset="utf-8">' +
         '<link rel="stylesheet" href="./markdown.css">' +
         '<link rel="stylesheet" href="./hljs.css">' +
         '<link rel="stylesheet" href="../content_scripts/main.css">' +
         scripts.map(function(e) { return '<script src="../content_scripts/' + e + '.js"></script>'; }).join('\n') +
         '</head>' + md.render(data) + '</html>';
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
