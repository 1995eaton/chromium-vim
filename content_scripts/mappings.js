var Mappings = {};

Mappings.repeats = "";
Mappings.queue = "";
Mappings.arrowKeys = ["<Left>", "<Up>", "<Right>", "<Down>"];

Mappings.actions = {

  toggleVisualMode: function() {
    Visual.caretModeActive = true;
    Visual.getTextNodes();
    document.body.spellcheck = false;
    document.designMode = "on";
    Visual.selection = document.getSelection();
    if (Find.matches.length) {
      Visual.focusSearchResult();
    } else {
      Visual.selection.setPosition(Visual.closestNode(), 0);
      HUD.display(" -- CARET -- ");
      Visual.scrollIntoView();
    }
  },
  percentScroll: function(repeats) {
    if (Mappings.repeats === "0" || Mappings.repeats === "") repeats = 0;
    return document.body.scrollTop = (document.body.scrollHeight - document.documentElement.clientHeight) * repeats / 100;
  },
  hideDownloadsShelf: function() {
    return chrome.runtime.sendMessage({action: "hideDownloadsShelf"});
  },
  goToRootUrl: function() {
    if (window.location.pathname.length === 0 || window.location.pathname === "/") {
      return false;
    }
    return chrome.runtime.sendMessage({action: "openLink", url: window.location.origin});
  },
  goUpUrl: function(repeats) {
    var rxp = new RegExp("(\/([^\/])+){0," + repeats + "}(\/)?$");
    if (window.location.pathname.length === 0 || window.location.pathname === "/") {
      return false;
    }
    var match = window.location.pathname.replace(rxp, "");
    if (match === window.location.pathname) {
      return false;
    }
    return chrome.runtime.sendMessage({action: "openLink", url: window.location.origin + match});
  },
  nextFrame: function(repeats) {
    return chrome.runtime.sendMessage({action: "focusMainWindow", repeats: repeats});
  },
  rootFrame: function() {
    return chrome.runtime.sendMessage({action: "focusMainWindow", repeats: -1});
  },
  closeTab: function(repeats) {
    return chrome.runtime.sendMessage({action: "closeTab", repeats: repeats});
  },
  pinTab: function() {
    return chrome.runtime.sendMessage({action: "pinTab"});
  },
  firstTab: function() {
    return chrome.runtime.sendMessage({action: "firstTab"});
  },
  lastTab: function() {
    return chrome.runtime.sendMessage({action: "lastTab"});
  },
  moveTabRight: function(repeats) {
    return chrome.runtime.sendMessage({action: "moveTabRight", repeats: repeats});
  },
  moveTabLeft: function(repeats) {
    return chrome.runtime.sendMessage({action: "moveTabLeft", repeats: repeats});
  },
  reverseImage: function() {
    if (document.body.childNodes.length === 1 && document.body.firstChild.nodeName === "IMG") {
      if (document.body.firstChild.src) {
        return chrome.runtime.sendMessage({action: "openLinkTab", active: false, url: "https://www.google.com/searchbyimage?image_url=" + document.body.firstChild.src});
      }
    } else {
      setTimeout(function() {
        Hints.create(true, false, true);
      }, 0);
    }
  },
  centerMatchT: function() {
    if (Command.type === "search" || Find.matches.length) {
      return window.scrollBy(0, Find.matches[Find.index].getBoundingClientRect().top);
    }
  },
  centerMatchH: function() {
    if (Command.type === "search" || Find.matches.length) {
      return window.scrollBy(0, Find.matches[Find.index].getBoundingClientRect().top + Find.matches[Find.index].offsetHeight - 0.5 * document.documentElement.clientHeight);
    }
  },
  centerMatchB: function() {
    if (Command.type === "search" || Find.matches.length) {
      return window.scrollBy(0, Find.matches[Find.index].getBoundingClientRect().top + Find.matches[Find.index].offsetHeight - document.documentElement.clientHeight);
    }
  },
  scrollDown: function(repeats) {
    return Scroll.scroll("down", repeats);
  },
  scrollUp: function(repeats) {
    return Scroll.scroll("up", repeats);
  },
  scrollPageDown: function(repeats) {
    return Scroll.scroll("pageDown", repeats);
  },
  scrollPageUp: function(repeats) {
    return Scroll.scroll("pageUp", repeats);
  },
  scrollLeft: function(repeats) {
    return Scroll.scroll("left", repeats);
  },
  scrollRight: function(repeats) {
    return Scroll.scroll("right", repeats);
  },
  scrollToTop: function() {
    return Scroll.scroll("top");
  },
  scrollToBottom: function() {
    return Scroll.scroll("bottom");
  },
  createHint: function() {
    setTimeout(function() {
      return Hints.create();
    }, 0);
  },
  createTabbedHint: function() {
    setTimeout(function() {
      return Hints.create(true);
    }, 0);
  },
  createVisualHint: function() {
    setTimeout(function() {
      return Hints.create(false, false, false, true);
    }, 0);
  },
  yankUrl: function() {
    setTimeout(function() {
      return Hints.create(true, true);
    }, 0);
  },
  yankDocumentUrl: function() {
    return Clipboard.copy(document.URL);
  },
  openPaste: function() {
    return Clipboard.paste(false);
  },
  openPasteTab: function() {
    return Clipboard.paste(true);
  },
  insertMode: function() {
    HUD.display(" -- INSERT -- ");
    return insertMode = true;
  },
  reloadTab: function() {
    return chrome.runtime.sendMessage({action: "reloadTab"});
  },
  nextSearchResult: function(repeats) {
    if (Find.matches.length) {
      return Find.search(false, repeats);
    } else if (Find.lastSearch !== undefined && typeof Find.lastSearch === "string") {
      return Find.highlight(document.body, Find.lastSearch, true, true, false);
    }
  },
  previousSearchResult: function(repeats) {
    if (Find.matches.length) {
      return Find.search(true, repeats);
    } else if (Find.lastSearch !== undefined && typeof Find.lastSearch === "string") {
      return Find.highlight(document.body, Find.lastSearch, true, true, true);
    }
  },
  nextTab: function(r) {
    return chrome.runtime.sendMessage({action: "nextTab", repeats: r});
  },
  previousTab: function(r) {
    return chrome.runtime.sendMessage({action: "previousTab", repeats: r});
  },
  goBack: function(repeats) {
    return history.go(-1 * repeats);
  },
  goForward: function(repeats) {
    return history.go(1 * repeats);
  },
  goToSource: function() {
    return chrome.runtime.sendMessage({action: "openLinkTab", active: true, url: "view-source:" + document.URL});
  },
  goToInput: function(repeats) {
    this.inputElements = [];
    var allInput = document.querySelectorAll("input,textarea");
    for (var i = 0, l = allInput.length; i < l; i++) {
      if (allInput[i].isInput() && allInput[i].isVisible() && allInput[i].id !== "command_input") {
        this.inputElements.push(allInput[i]);
      }
    }
    if (this.inputElements.length === 0) return false;
    this.inputElementsIndex = repeats % this.inputElements.length - 1;
    if (this.inputElementsIndex < 0) this.inputElementsIndex = 0;
    for (var i = 0, l = this.inputElements.length; i < l; i++) {
      var br = this.inputElements[i].getBoundingClientRect();
      if (br.top + br.height >= 0 && br.left + br.width >= 0 && br.right - br.width <= document.documentElement.clientWidth && br.top < document.documentElement.clientHeight) {
        this.inputElementsIndex = i;
        break;
      }
    }
    this.inputFocused = true;
    this.inputElements[this.inputElementsIndex].focus();
    document.activeElement.select();
    document.getSelection().collapseToEnd();
  },
  shortCuts: function(s, repeats) {
    for (var i = 0, l = Mappings.shortCuts.length; i < l; i++) {
      if (s === Mappings.shortCuts[i][0]) {
        commandMode = true;
        Command.show(false, Mappings.shortCuts[i][1].replace(/^:/, "").replace(/<cr>(\s+)?$/i, ""));
        if (/<cr>(\s+)?$/i.test(Mappings.shortCuts[i][1])) {
          return Command.parse(Command.input.value, true, repeats);
        }
        return Command.parse(Command.input.value, false, repeats);
      }
    }
  },
  openSearchBar: function() {
    Command.hide();
    commandMode = true;
    Command.enterHit = false;
    Find.swap = false;
    return Command.show("/");
  },
  openSearchBarReverse: function() {
    Command.hide();
    commandMode = true;
    Command.enterHit = false;
    Find.swap = true;
    return Command.show("?");
  },
  openCommandBar: function() {
    Command.hide();
    commandMode = true;
    Command.enterHit = false;
    return Command.show(false);
  }
};

Mappings.shortCuts = [
  ["o", ":open "],
  ["O", ":open @%"],
  ["b", ":bookmarks "],
  ["t", ":tabopen "],
  ["I", ":history "],
  ["go", ":duplicate&<cr>"],
  ["gO", ":duplicate<cr>"],
  ["T", ":tabopen @%"],
  ["gd", ":chrome://downloads<cr>"],
  ["ge", ":chrome://extensions<cr>"]
];

Mappings.defaults = {
  closeTab: ["x"],
  scrollDown: ["s", "j"],
  scrollUp: ["w", "k"],
  scrollPageUp: ["e", "u"],
  scrollPageDown: ["d"],
  scrollToTop: ["gg"],
  scrollToBottom: ["G"],
  scrollLeft: ["h"],
  scrollRight: ["l"],
  insertMode: ["i"],
  reloadTab: ["r"],
  createHint: ["f"],
  pinTab: ["gp"],
  moveTabRight: [">"],
  moveTabLeft: ["<"],
  goBack: ["H", "S"],
  reverseImage: ["gr"],
  goForward: ["L", "D"],
  firstTab: ["g0"],
  lastTab: ["g$"],
  hideDownloadsShelf: ["gj", "gD"],
  createTabbedHint: ["F"],
  goToInput: ["gi"],
  nextTab: ["K", "R", "gt"],
  nextFrame: ["gf"],
  rootFrame: ["gF"],
  percentScroll: ["%"],
  centerMatchT: ["zt"],
  centerMatchB: ["zb"],
  centerMatchH: ["zz"],
  goToSource: ["gs"],
  goToRootUrl: ["gU"],
  goUpUrl: ["gu"],
  yankUrl: ["Y"],
  yankDocumentUrl: ["yy"],
  openPaste: ["p"],
  toggleVisualMode: ["v"],
  createVisualHint: ["V"],
  openPasteTab: ["P"],
  previousTab: ["J", "E", "gT"],
  nextSearchResult: ["n"],
  previousSearchResult: ["N"],
  openSearchBar: ["/"],
  openSearchBarReverse: ["?"],
  openCommandBar: [":"],
  shortCuts: []
};

Mappings.insertDefaults = {
  deleteWord:        ["<C-y>"],
  deleteForwardWord: ["<C-p>"],
  beginningOfLine:   ["<C-i>"],
  endOfLine:         ["<C-e>"],
  deleteToBeginning: ["<C-u>"],
  deleteToEnd:       ["<C-o>"],
  forwardChar:       ["<C-f>"],
  backwardChar:      ["<C-b>"],
  forwardWord:       ["<C-l>"],
  backwardWord:      ["<C-h>"]
};

Mappings.isValidQueue = function(c) {
  for (var key in this.defaults) {
    if (this.defaults.hasOwnProperty(key)) {
      for (var i = 0, l = this.defaults[key].length; i < l; i++) {
        if (this.defaults[key][i].substring(0, Mappings.queue.length) === Mappings.queue) {
          return true;
        }
      }
    }
  }
};

Mappings.insertFunctions = {
  deleteWord: function() {
    var ae = document.activeElement;
    var left  = ae.value.slice(0, ae.selectionStart),
    right = ae.value.slice(ae.selectionStart);
    left = left.replace(/([a-zA-Z_]+|[^a-zA-Z\s]+)?( +)?$/, "");
    var sstart = ae.selectionStart;
    var alen = ae.value.length;
    ae.value = left + right;
    if (sstart < alen) {
      ae.selectionStart -= ae.value.length - left.length
      ae.selectionEnd = ae.selectionStart;
    }
    return true;
  },
  beginningOfLine: function() {
    document.activeElement.selectionStart = 0;
    document.activeElement.selectionEnd   = 0;
    return true;
  },
  endOfLine: function() {
    document.activeElement.selectionStart = document.activeElement.value.length;
    document.activeElement.selectionEnd   = document.activeElement.selectionStart;
    return true;
  },
  deleteToBeginning: function() {
    document.activeElement.value = document.activeElement.value.slice(document.activeElement.selectionStart - 1, -1);
    document.activeElement.selectionStart = 0;
    document.activeElement.selectionEnd   = 0;
    return true;
  },
  deleteToEnd: function() {
    document.activeElement.value = document.activeElement.value.substring(0, document.activeElement.selectionStart);
    return true;
  },
  forwardChar: function() {
    document.activeElement.selectionStart += 1;
    return true;
  },
  backwardChar: function() {
    document.activeElement.selectionStart -= 1;
    document.activeElement.selectionEnd   -= 1;
    return true;
  },
  forwardWord: function() {
    var aval = (document.activeElement.value + " ").slice(document.activeElement.selectionStart, -1);
    var diff = aval.length - aval.replace(/^([a-zA-Z_]+|[^a-zA-Z\s]+)( +)?/, "").length;
    if (diff === 0)
      document.activeElement.selectionStart = document.activeElement.value.length;
    else
      document.activeElement.selectionStart += diff;
    return true;
  },
  backwardWord: function() {
    var aval = document.activeElement.value.slice(0, document.activeElement.selectionStart);
    var diff = aval.length - aval.replace(/([a-zA-Z_]+|[^a-zA-Z\s]+)( +)?$/, "").length;
    document.activeElement.selectionStart -= diff;
    document.activeElement.selectionEnd   -= diff;
    return true;
  },
  deleteForwardWord: function() {
    if (document.activeElement.selectionStart !== document.activeElement.value.length) {
      this.forwardWord();
      this.deleteWord();
    }
    return true;
  }
};

Mappings.getInsertFunction = function(modifier, callback) {
  var validMapping = false;
  for (var key in this.insertDefaults) {
    if (typeof this.insertDefaults[key] !== "object") continue;
    this.insertDefaults[key].forEach(function(item) {
      if (!validMapping && modifier === item) {
        validMapping = true;
        callback(key);
      }
    });
    if (validMapping)
      break;
  }
};

Mappings.insertCommand = function(modifier, callback) {
  this.getInsertFunction(modifier, function(func) {
    if (func && document.activeElement.hasOwnProperty("value")) {
      callback(Mappings.insertFunctions[func]());
    }
  });
};

Mappings.parseCustom = function(config) {
  if (!/\n/.test(config)) {
    config = [config];
  } else {
    config = config.split("\n");
  }
  var keywords = [
    /^(\s+)?map /i,
    /^(\s+)?unmap /i
  ];
  var m = [];
  var u = [];
  for (var i = 0, l = config.length; i < l; i++) {
    for (var j = 0; j < keywords.length; j++) {
      if (keywords[j].test(config[i])) {
        var maps = config[i].split(/(\s+)/).filter(function(m) {
          if (!/(\s+)/.test(m)) {
            return m;
          }
        });
        if (maps.length === 3 || (maps.length >= 3 && /^:/.test(maps[2]))) {
          if (maps[0].toLowerCase() === "map") {
            if (maps.length > 3) {
              var c = "";
              for (var k = 3; k < maps.length; k++) {
                c += " " + maps[k];
              }
              m.push([maps[1], maps[2] + c]);
            } else {
              m.push([maps[1], maps[2]]);
            }
          }
        } else if (maps.length === 2 && maps[0].toLowerCase() === "unmap") {
          u.push(maps[1]);
        }
      }
    }
  }
  for (var i = 0; i < u.length; i++) {
    for (var key in this.defaults) {
      for (var j = 0; j < this.defaults[key].length; j++) {
        if (this.defaults[key][j] === u[i]) {
          this.defaults[key].splice(j, 1);
        }
      }
    }
  }
  for (var i = 0; i < m.length; i++) {
    if (m[i][1][0] === ":") {
      this.shortCuts.push([m[i][0], m[i][1]]);
    } else {
      for (var key in this.defaults) {
        if (key.toLowerCase() === m[i][1].toLowerCase()) {
          this.defaults[key].push(m[i][0]);
        }
      }
    }
  }
  for (var i = 0, l = Mappings.shortCuts.length; i < l; i++) {
    Mappings.shortCuts[i][1] = Mappings.shortCuts[i][1].replace("@%", document.URL);
    Mappings.defaults.shortCuts.push(Mappings.shortCuts[i][0]);
  }
};

Mappings.isValidMapping = function(c) {
  for (var key in this.defaults) {
    for (var i = 0, l = this.defaults[key].length; i < l; ++i) {
      if (c === this.defaults[key][i]) {
        return true;
      }
    }
  }
  return false;
};

Mappings.convertToAction = function(c) {
  var addOne = false;
  if (!c) {
    return;
  } else if (Hints.active) {
    if (c === ";") {
      return Hints.changeFocus();
    }
    Hints.handleHint(c);
  } else if (Mappings.queue === "" && /[0-9]/.test(c)) {
    Mappings.repeats += c;
  } else {
    Mappings.queue += c;
    for (var key in this.defaults) {
      if (this.defaults.hasOwnProperty(key)) {
        if (!this.isValidQueue(c)) {
          Mappings.queue = "";
          Mappings.repeats = "";
        } else {
          for (var i = 0, l = this.defaults[key].length; i < l; i++) {
            if (Mappings.queue === this.defaults[key][i]) {
              if (Mappings.repeats === "0" || Mappings.repeats === "") {
                addOne = true;
              }
              if (key === "shortCuts") {
                Mappings.actions[key](Mappings.queue, (addOne ? 1 : parseInt(Mappings.repeats)));
                Mappings.queue = "";
                return Mappings.repeats = "";
              }
              Mappings.actions[key]((addOne ? 1 : parseInt(Mappings.repeats)));
              Mappings.queue = "";
              return Mappings.repeats = "";
            }
          }
        }
      }
    }
  }
};
