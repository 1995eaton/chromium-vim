#!/usr/bin/env node

var fs = require("fs");
var marked = require("marked");

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

function getIncludes(callback) {
  fs.readFile("../pages/options.html", "utf8", function(err, data) {
    callback(data.split("\n").filter(function(e) {
      return /content_scripts/.test(e);
    }).join("\n"));
  });
}

function makeHTML(includes, data) {
  var compiled = "<!DOCTYPE html><html><head>";
  compiled += "<link rel=\"stylesheet\" href=\"./markdown.css\">";
  compiled += includes + "</head>" + marked(data);
  compiled += "</html>";
  return compiled;
}

var fileMap = {
  mappings: "README.md",
  changelog: "CHANGELOG.md"
};

getIncludes(function(includes) {
  fs.readFile("../" + fileMap.mappings, "utf8", function(err, data) {
    fs.writeFileSync("../pages/mappings.html", makeHTML(includes, data));
  });
  fs.readFile("../" + fileMap.changelog, "utf8", function(err, data) {
    fs.writeFileSync("../pages/changelog.html", makeHTML(includes, data));
  });
});
