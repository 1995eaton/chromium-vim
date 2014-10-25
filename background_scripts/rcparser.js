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

var RCParser = {
  parse: function(input) {
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
      'site': function() {
        var opt = stream.until('\n').split(/\s+/).compress();
        if (opt[1] !== '{') {
          return;
        }
        var site = opt[0].slice(1, -1);
        var parseBlock = '';
        while (!stream.eof()) {
          var c = stream.get();
          if (c === '}') {
            break;
          }
          parseBlock += c;
        }
        output.sites = output.sites || {};
        output.sites[site] = parseBlock;
      },
      'let': function() {
        var opt = stream.until('=');
        opt = opt.split(/\s+/).filter(function(e) { return e.trim(); });
        var obj;
        if (opt.length === 2) {
          opt[0] += opt[0].charAt(opt[0].length - 1) === 's' ? 'es' : 's';
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
        case 'site':
          F.site();
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
