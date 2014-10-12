var Settings = {},
    Config = {};

var Stream = function(input) {
  this.i = 0;
  this.l = input.length;
  this.s = input;
};
Stream.prototype = {
  eof: function() {
    return this.i >= this.l;
  },
  get: function() {
    return this.eof() ? null : this.s[this.i++];
  },
  peek: function() {
    return this.i + 1 >= this.l ? null : this.s[this.i+1];
  },
  peekBack: function() {
    return this.i === 0 ? null : this.s[this.i - 1];
  },
  char: function() {
    return this.eof() ? null : this.s[this.i];
  },
  until: function(c) {
    for (var s = ''; c.indexOf(this.char()) === -1 && !this.eof();) {
      s += this.get();
    }
    while (c.indexOf(this.char()) !== -1 && !this.eof()) {
      this.get();
    }
    return s === '' ? null : s;
  },
  skip: function(m) {
    while (m.test(this.char()) && !this.eof()) {
      this.get();
    }
  }
};

var Config = {
  parse: function() {
    var input = Settings.rcEl.value;
    input = input.replace(/\n\s*\\\s*/g, '');
    var output = {
      MAPPINGS: ''
    };
    var stream = new Stream(input);
    var ws = ' \n\t';

    var string = function() {
      var begin = stream.get();
      var s = '';
      var isesc = false;
      while (!stream.eof()) {
        var c = stream.get();
        if (isesc) {
          s += c;
          isesc = false;
          continue;
        }
        if (c === begin) {
          return s;
        }
        s += c;
      }
    };

    var number = function() {
      var s = '';
      while (/[0-9\.]/.test(stream.char())) {
        s += stream.get();
      }
      return parseFloat(s);
    };

    var array = function() {
      var a = [];
      stream.get();
      while (!stream.eof()) {
        stream.skip(/[ \t]/);
        a.push(string());
        stream.skip(/[ \t]/);
        if (stream.char() === ']') {
          stream.get();
          return a;
        }
        stream.get();
      }
    };

    var ev = function() {
      stream.skip(/[\s\n]/);
      switch (stream.char()) {
        case '\'':
        case '"':
          return string();
        case '[':
          return array();
        default:
          return number();
      }
    };

    var F = {
      'set': function() {
        var opt = stream.until('\n');
        var value = true;
        if (opt.charAt(0) === 'n' && opt.charAt(1) === 'o') {
          value = false;
          opt = opt.slice(2);
        }
        output[opt] = value;
      },
      'let': function() {
        var opt = stream.until('=');
        opt = opt.split(/\s+/).filter(function(e) { return e.trim(); });
        var obj;
        if (opt.length === 2) {
          opt[0] += 's';
          if (!output.hasOwnProperty(opt[0]) || typeof output[opt[0]] !== 'object') {
            output[opt[0]] = {};
          }
          obj = output[opt[0]];
          opt = opt[1];
          obj[opt] = ev();
        } else {
          opt = opt[0];
          output[opt] = ev();
        }
      }
    };

    while (!stream.eof()) {
      stream.skip(/[\s\n]/);
      var word = stream.until(ws);
      switch (word) {
        case 'set':
          F.set();
          break;
        case 'let':
          F.let();
          break;
        case 'map':
        case 'unmap':
        case 'imap':
        case 'iunmap':
        case 'iunmapAll':
        case 'unmapAll':
          var rest = stream.until('\n');
          if (rest) {
            output.MAPPINGS += word + ' ' + rest + '\n';
          }
          break;
        default:
          if (typeof word === 'string' && word.charAt(0) === '"') {
          }
          break;
      }
    }
    return output;
  }
};

Settings.checkConfig = function(config) {
  var validSettings = Object.keys(Settings.settings).filter(function(e) {
    return e.toLowerCase() === e;
  });
  for (var key in config) {
    if (validSettings.indexOf(key) !== -1 && sameType(config[key], Settings.settings[key])) {
      if (config[key].constructor === Object) {
        Settings.settings[key] = Object.extend(Settings.settings[key], config[key]);
      } else {
        Settings.settings[key] = config[key];
      }
    }
  }
};

Settings.loadrc = function(config) {
  this.rcEl.value = config.MAPPINGS;
  this.rcEl.style.height = this.rcEl.scrollHeight + 'px';
  if (this.cssEl) {
    this.cssEl.setValue(config.COMMANDBARCSS);
  }
  this.gistUrl.value = config.GISTURL;
};

Settings.resetSettings = function() {
  this.rcEl.value = this.defaults.MAPPINGS;
  this.cssEl.setValue(this.defaults.COMMANDBARCSS);
  this.gistUrl.value = this.defaults.GISTURL;
  delete this.settings;
  this.settings = Object.clone(this.defaults);
};

Settings.saveSettings = function() {
  this.settings = Object.clone(this.defaults);
  this.checkConfig(Config.parse());
  this.settings.COMMANDBARCSS = this.cssEl.getValue();
  this.settings.GISTURL = this.gistUrl.value;
  this.settings.MAPPINGS = this.rcEl.value;
  this.settings.mapleader = this.settings.mapleader.replace(/ /g, '<Space>');
  this.saveButton.value = 'Saved';
  chrome.runtime.sendMessage({action: 'saveSettings', settings: Settings.settings, sendSettings: true});
  setTimeout(function() {
    this.saveButton.value = 'Save';
  }.bind(this), 3000);
};

Settings.editMode = function(e) {
  if (this.cssEl) {
    if (e.target.value === 'Vim') {
      this.cssEl.setOption('keyMap', 'vim');
    } else {
      this.cssEl.setOption('keyMap', 'default');
    }
  }
};

Settings.syncGist = function() {
  var url = this.gistUrl.value;
  if (url.trim() === '') {
    return false;
  }
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url + (url.indexOf('raw') === -1 &&
        url.indexOf('github') !== -1 ? '/raw' : ''));
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4 && xhr.status === 200) {
      document.getElementById('mappings').value = xhr.responseText;
    }
  };
  xhr.send();
};

Settings.init = function() {

  document.body.spellcheck = false;
  this.initialLoad = true;

  this.saveButton = document.getElementById('save_button');
  this.rcEl = document.getElementById('mappings');
  this.editModeEl = document.getElementById('edit_mode');

  function autoSize() {
    var stop = document.body.scrollTop;
    this.style.height = '';
    this.style.height = this.scrollHeight + 'px';
    document.body.scrollTop = stop;
  }

  this.rcEl.addEventListener('input', autoSize);

  chrome.runtime.sendMessage({action: 'getDefaults'});

  this.editModeEl.addEventListener('change', this.editMode.bind(this), false);
  this.saveButton.addEventListener('click', this.saveSettings.bind(this), false);
  document.getElementById('reset_button').addEventListener('click', this.resetSettings.bind(this), false);
  document.getElementById('clearHistory').addEventListener('click', function() {
    localStorage.search = '';
    localStorage.url    = '';
    localStorage.action = '';
  });
  this.gistUrl = document.getElementById('gistUrl');
  document.getElementById('gistSync').addEventListener('click', this.syncGist.bind(this));
  this.gistPlaceHolder = 'https://gist.github.com/1995eaton/9e68803bf1f1e7524340';
  this.gistUrl.addEventListener('focus', function() {
    this.setAttribute('placeholder', '');
  });
  this.gistUrl.addEventListener('blur', function() {
    this.setAttribute('placeholder', Settings.gistPlaceHolder);
  });

};

document.addEventListener('DOMContentLoaded', Settings.init.bind(Settings));

chrome.extension.onMessage.addListener(function(request) {
  if (request.action === 'sendSettings') {
    if (Settings.initialLoad) {
      Settings.cssEl = CodeMirror.fromTextArea(document.getElementById('commandBarCSS'), {lineNumbers: true});
      Settings.initialLoad = false;
      Settings.loadrc(request.settings);
    }
  } else if (request.action === 'sendDefaultSettings') {
    Settings.settings = request.settings;
    Settings.defaults = Object.clone(request.settings);
    Settings.checkConfig(Config.parse());
  }
});
