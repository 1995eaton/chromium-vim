#!/usr/bin/env node

var RCParser = require('../parser.js').RCParser;

var script = require('fs').readFileSync('./test/test.vim', 'utf8');

console.log(JSON.stringify(RCParser.parse(script), null, 2));
