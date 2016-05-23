#!/usr/bin/env node

LOG = console.log.bind(console);
fs = require('fs');

function readOptionCSS() {
  var text = fs.readFileSync('../background_scripts/options.js', 'utf8').split('\n');
  for (var i = 0; i < text.length; i++) {
    if (text[i].replace(/^\s*/, '').indexOf('COMMANDBARCSS: \'') === 0) {
      return text[i].replace(/^\s*COMMANDBARCSS: '/, '').slice(0, -1)
        .replace(/\\n/g, '\n');
    }
  }
}

function readUserCSS() {
  return fs.readFileSync('../background_scripts/user.css', 'utf8');
}

function optionCSSToUserCSS() {
  var optionCSS = readOptionCSS();
  fs.writeFileSync('../background_scripts/user.css', optionCSS, 'utf8');
}

function userCSSToOptionJS() {
  var css = readUserCSS();
  var outText = fs.readFileSync('../background_scripts/options.js', 'utf8').split('\n');
  for (var i = 0; i < outText.length; i++) {
    if (outText[i].replace(/^\s*/, '').indexOf('COMMANDBARCSS: \'') === 0) {
      outText[i] = '  COMMANDBARCSS: \'' + css.replace(/'/g, '\\\'').replace(/\n/g, '\\n') + '\'';
      break;
    }
  }
  outText = outText.join('\n');
  fs.writeFileSync('../background_scripts/options.js', outText, 'utf8');
}

var args = process.argv.slice(2);

function printHelp(exit) {
  var help =
'options:\n' +
'    --uo | --user-to-option  =>  write the user.css file to options.js\n' +
'    --ou | --option-to-user  =>  write the options.js file to user.css\n';
  LOG(help);
  if (exit) {
    process.exit(0);
  }
}

if (args.length !== 1) {
  LOG('argument required');
  process.exit(-1);
}

switch (arg = args[0]) {
  case '--uo':
  case '--user-to-option':
    userCSSToOptionJS();
    break;
  case '--ou':
  case '--option-to-user':
    optionCSSToUserCSS();
    break;
  case '-h':
  case '--help':
    printHelp(true);
    break;
  default:
    LOG('invalid option:', arg);
    printHelp(true);
}
