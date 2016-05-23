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
  '../content_scripts/cvimrc_parser.js',
  '../content_scripts/session.js',
  '../content_scripts/utils.js',
  '../content_scripts/dom.js',
  '../content_scripts/hints.js',
  '../content_scripts/bookmarks.js',
  '../content_scripts/keys.js',
  '../content_scripts/clipboard.js',
  '../content_scripts/complete.js',
  '../content_scripts/mappings.js',
  '../content_scripts/find.js',
  '../content_scripts/cursor.js',
  '../content_scripts/status.js',
  '../content_scripts/hud.js',
  '../content_scripts/visual.js',
  '../content_scripts/command.js',
  '../content_scripts/scroll.js',
  '../content_scripts/search.js',
  '../content_scripts/frames.js',
  '../content_scripts/messenger.js',
];

var makeHTML = function(data) {
  return '<!DOCTYPE html><html><head>' +
         '<meta charset="utf-8">' +
         '<link rel="stylesheet" href="./markdown.css">' +
         '<link rel="stylesheet" href="./hljs.css">' +
         '<link rel="stylesheet" href="../content_scripts/main.css">' +
         scripts.map(function(e) {
           return '<script src="' + e + '"></script>';
         }).join('\n') +
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
