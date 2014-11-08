#!/usr/bin/env node

require('../parser.js');

var script = require('fs').readFileSync('./test/test.vim', 'utf8');

console.log(JSON.stringify(RCParser.parse(script), null, 2));
