var Mappings = {};

Mappings.repeats = "";

Mappings.toKeyCode = function(c) {
  var isCap = c.toUpperCase() === c;
  return [isCap, c.toUpperCase().charCodeAt()];
};

Mappings.fromKeyDown = function(key) {
  if (key.ctrlKey || key.metaKey) {
    return;
  }
  if (key.keyCode >= 180 && key.keyCode < 200 && !key.shiftKey) {
    return String.fromCharCode(key.keyCode - 144);
  } else if (key.keyCode === 186 && key.shiftKey) {
    return ":";
  } else if (key.keyCode === 9) {
    if (key.shiftKey) {
      return "<S-TAB>";
    }
    return "<TAB>";
  }
  if (key.shiftKey) {
    return String.fromCharCode(key.keyCode).toUpperCase();
  }
  return String.fromCharCode(key.keyCode).toLowerCase();
};

Mappings.queue = "";

Mappings.actions = {
  closeTab: function(repeats) {
    return chrome.runtime.sendMessage({action: "closeTab", repeats: repeats});
  },
  pinTab: function() {
    return chrome.runtime.sendMessage({action: "pinTab"});
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
        Hints.create(true, false, false, true);
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
      return Hints.create(false, false, false);
    }, 0);
  },
  createTabbedHint: function() {
    setTimeout(function() {
      return Hints.create(true, false, false);
    }, 0);
  },
  yankUrl: function() {
    setTimeout(function() {
      return Hints.create(true, false, true);
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
    if (Command.type === "search") {
      return Find.search(false, repeats);
    }
  },
  previousSearchResult: function(repeats) {
    if (Command.type === "search") {
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
  handleTab: function(e) {
    if (this.inputFocused) {
      if (!e.shiftKey) {
        if (this.inputElementsIndex + 1 === this.inputElements.length) {
          this.inputElementsIndex = 0;
        } else {
          this.inputElementsIndex++;
        }
      } else {
        if (this.inputElementsIndex - 1 < 0) {
          this.inputElementsIndex = this.inputElements.length - 1;
        } else {
          this.inputElementsIndex--;
        }
      }
      if (this.inputElements.length) {
        this.inputElements[this.inputElementsIndex].focus();
      }
    } else if (/command/.test(document.activeElement.id || document.activeElement.className)) {
      if (Command.type === "action") {
        if (Command.actionType === "query" || Command.actionType === "bookmarks") {
          Search.nextResult(e.shiftKey);
        }else {
          if (!Command.typed) {
            barInput.value = "";
            Command.complete(barInput.value, e.shiftKey, true);
          } else {
            Command.complete(Command.typed, e.shiftKey, true);
          }
        }
      }
    }
  },
  goToInput: function(repeats) {
    this.inputElements = [];
    var allInput = document.querySelectorAll("input,textarea");
    for (var i = 0, l = allInput.length; i < l; i++) {
      if (allInput[i].isInput() && allInput[i].isVisible() && allInput[i].id !== "command_input") {
        this.inputElements.push(allInput[i]);
      }
    }
    this.inputElementsIndex = repeats % this.inputElements.length;
    this.inputFocused = true;
    if (this.inputElements.length) {
      insertMode = true;
      return this.inputElements[this.inputElementsIndex].focus();
    }
  },
  shortCuts: function(s, repeats) {
    for (var i = 0, l = Mappings.shortCuts.length; i < l; i++) {
      if (s === Mappings.shortCuts[i][0]) {
        commandMode = true;
        Command.show(false, Mappings.shortCuts[i][1].replace(/^:/, "").replace(/<cr>(\s+)?$/i, ""));
        if (/<cr>(\s+)?$/i.test(Mappings.shortCuts[i][1])) {
          return Command.parse(barInput.value, true, repeats);
        }
        return Command.parse(barInput.value, false, repeats);
      }
    }
  },
  openSearchBar: function() {
    commandMode = true;
    Command.enterHit = false;
    return Command.show(true);
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
  ["O", ":tabopen "],
  ["b", ":bookmarks "],
  ["t", ":tabopen "]
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
  createTabbedHint: ["F"],
  goToInput: ["gi"],
  nextTab: ["K", "R", "gt"],
  scrollMouseT: ["zt"],
  scrollMouseB: ["zb"],
  scrollMouseH: ["zz"],
  goToSource: ["gs"],
  yankUrl: ["Y"],
  yankDocumentUrl: ["yy"],
  openPaste: ["p"],
  openPasteTab: ["P"],
  previousTab: ["J", "E", "gT"],
  nextSearchResult: ["n"],
  previousSearchResult: ["N"],
  openSearchBar: ["/"],
  openCommandBar: [":"],
  shortCuts: []
}

Mappings.isValidQueue = function(c) {
  for (var key in this.defaults) {
    if (this.defaults.hasOwnProperty(key)) {
      if (Mappings.queue === "") {
        for (var i = 0, l = this.defaults[key].length; i < l; i++) {
          if ((new RegExp("^" + c)).test(this.defaults[key][i])) {
            return true;
          }
        }
      } else {
        for (var i = 0, l = this.defaults[key].length; i < l; i++) {
          if ((new RegExp("^" + Mappings.queue)).test(this.defaults[key][i])) {
            return true;
          }
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
    Mappings.defaults.shortCuts.push(Mappings.shortCuts[i][0]);
  }
};

Mappings.convertToAction = function(c) {
  if (!c || !/[a-zA-Z:;0-9.,\/-<>]/.test(c)) return;
  if (hints_active) {
    return Hints.handleHint(c);
  }
  if (Mappings.queue === "" && /[0-9]/.test(c)) {
    Mappings.repeats += c;
  } else {
    Mappings.queue += c;
    for (var key in this.defaults) {
      if (this.defaults.hasOwnProperty(key)) {
        if (!this.isValidQueue(c)) {
          Mappings.queue = "";
          Mappings.repeats = "";
          if (this.isValidQueue(c)) {
            Mappings.queue = c;
          }
        }
        for (var i = 0, l = this.defaults[key].length; i < l; i++) {
          if (Mappings.queue === this.defaults[key][i]) {
            if (Mappings.repeats === "0" || Mappings.repeats === "") {
              Mappings.repeats = "1";
            }
            if (key === "shortCuts") {
              Mappings.actions[key](Mappings.queue, parseInt(Mappings.repeats));
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
};
