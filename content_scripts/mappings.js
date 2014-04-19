var Mappings = {};

Mappings.repeats = "";
Mappings.queue = "";

Mappings.actions = {
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
        return chrome.runtime.sendMessage({action: "openLinkTab", url: "https://www.google.com/searchbyimage?image_url=" + document.body.firstChild.src});
      }
    } else {
      setTimeout(function() {
        Hints.create(true, false, true);
      }, 0);
    }
  },
  scrollMouseH: function() {
    return document.body.scrollTop = Mouse.y - window.innerHeight / 2;
  },
  scrollMouseT: function() {
    return document.body.scrollTop = Mouse.y;
  },
  scrollMouseB: function() {
    return document.body.scrollTop = Mouse.y - window.innerHeight + 25;
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
    return insertMode = true;
  },
  reloadTab: function() {
    return chrome.runtime.sendMessage({action: "reloadTab"});
  },
  nextSearchResult: function(repeats) {
    if (Command.type === "search" || Find.matches.length) {
      return Find.search(false, repeats);
    }
  },
  previousSearchResult: function(repeats) {
    if (Command.type === "search" || Find.matches.length) {
      return Find.search(true, repeats);
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
    return chrome.runtime.sendMessage({action: "openLinkTab", url: "view-source:" + document.URL});
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
      if (br.top + br.height >= 0 && br.left + br.width >= 0 && br.right - br.width <= window.innerWidth && br.top < window.innerHeight) {
        this.inputElementsIndex = i;
        break;
      }
    }
    log(this.inputElementsIndex);
    this.inputFocused = true;
    insertMode = true;
    this.inputElements[this.inputElementsIndex].focus();
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
  ["O", ":open $0"],
  ["b", ":bookmarks "],
  ["t", ":tabopen "],
  ["I", ":history "],
  ["T", ":tabopen $0"],
  ["gd", ":tabopen chrome://downloads<cr>"]
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
  createTabbedHint: ["F"],
  goToInput: ["gi"],
  nextTab: ["K", "R", "gt"],
  nextFrame: ["gf"],
  rootFrame: ["gF"],
  scrollMouseT: ["zt"],
  scrollMouseB: ["zb"],
  scrollMouseH: ["zz"],
  goToSource: ["gs"],
  goToRootUrl: ["gU"],
  goUpUrl: ["gu"],
  yankUrl: ["Y"],
  yankDocumentUrl: ["yy"],
  openPaste: ["p"],
  openPasteTab: ["P"],
  previousTab: ["J", "E", "gT"],
  nextSearchResult: ["n"],
  previousSearchResult: ["N"],
  openSearchBar: ["/"],
  openSearchBarReverse: ["?"],
  openCommandBar: [":"],
  shortCuts: []
}

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
    Mappings.shortCuts[i][1] = Mappings.shortCuts[i][1].replace("$0", document.URL);
    Mappings.defaults.shortCuts.push(Mappings.shortCuts[i][0]);
  }
};

Mappings.convertToAction = function(c) {
  if (!c) {
    return;
  } else if (Hints.active) {
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
                Mappings.repeats = "1";
              }
              if (key === "shortCuts") {
                Mappings.actions[key](Mappings.queue, parseInt(Mappings.repeats));
                Mappings.queue = "";
                return Mappings.repeats = "";
              }
              Mappings.actions[key](parseInt(Mappings.repeats));
              Mappings.queue = "";
              return Mappings.repeats = "";
            }
          }
        }
      }
    }
  }
};
