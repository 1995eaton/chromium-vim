var Mappings = {};

Mappings.toKeyCode = function(c) {
  var isCap = c.toUpperCase() === c;
  return [isCap, c.toUpperCase().charCodeAt()];
};

Mappings.fromKeyDown = function(key) {
  if (key.ctrlKey || key.metaKey) {
    return;
  }
  if (key.keyCode === 191 && !key.shiftKey) {
    return "/";
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
  closeTab: function() {
    if (!hints_active && !insertMode && !document.activeElement.isInput()) {
      return chrome.runtime.sendMessage({action: "closeTab"});
    }
  },
  scrollDown: function() {
    if (!hints_active && !insertMode && !document.activeElement.isInput()) {
      return Scroll.scroll("down");
    }
  },
  scrollUp: function() {
    if (!hints_active && !insertMode && !document.activeElement.isInput()) {
      return Scroll.scroll("up");
    }
  },
  scrollPageDown: function() {
    if (!hints_active && !insertMode && !document.activeElement.isInput()) {
      return Scroll.scroll("pageDown");
    }
  },
  scrollPageUp: function() {
    if (!hints_active && !insertMode && !document.activeElement.isInput()) {
      return Scroll.scroll("pageUp");
    }
  },
  scrollLeft: function() {
    if (!hints_active && !insertMode && !document.activeElement.isInput()) {
      return Scroll.scroll("left");
    }
  },
  scrollRight: function() {
    if (!hints_active && !insertMode && !document.activeElement.isInput()) {
      return Scroll.scroll("right");
    }
  },
  scrollToTop: function() {
    if (!hints_active && !insertMode && !document.activeElement.isInput()) {
      return Scroll.scroll("top");
    }
  },
  scrollToBottom: function() {
    if (!hints_active && !insertMode && !document.activeElement.isInput()) {
      return Scroll.scroll("bottom");
    }
  },
  createHint: function() {
    if (!hints_active && !insertMode && !document.activeElement.isInput()) {
      setTimeout(function() {
        return Hints.create(false, false, false);
      }, 0);
    }
  },
  createTabbedHint: function() {
    if (!hints_active && !insertMode && !document.activeElement.isInput()) {
      setTimeout(function() {
        return Hints.create(true, false, false);
      }, 0);
    }
  },
  yankUrl: function() {
    if (!hints_active && !insertMode && !document.activeElement.isInput()) {
      setTimeout(function() {
        return Hints.create(true, false, true);
      }, 0);
    }
  },
  yankDocumentUrl: function() {
    if (!hints_active && !insertMode && !document.activeElement.isInput()) {
      return Clipboard.copy(document.URL);
    }
  },
  openPaste: function() {
    if (!hints_active && !insertMode && !document.activeElement.isInput()) {
      return Clipboard.paste(false);
    }
  },
  openPasteTab: function() {
    if (!hints_active && !insertMode && !document.activeElement.isInput()) {
      return Clipboard.paste(true);
    }
  },
  insertMode: function() {
    if (!hints_active && !document.activeElement.isInput()) {
      return insertMode = true;
    }
  },
  reloadTab: function() {
    if (!hints_active && !insertMode && !document.activeElement.isInput()) {
      return Clipboard.paste(true);
      return chrome.runtime.sendMessage({action: "reloadTab"});
    }
  },
  nextSearchResult: function() {
    if (Command.type === "search" && !hints_active && !insertMode && !document.activeElement.isInput()) {
      return Find.search(false, true);
    }
  },
  previousSearchResult: function() {
    if (Command.type === "search" && !hints_active && !insertMode && !document.activeElement.isInput()) {
      return Find.search(true, true);
    }
  },
  nextTab: function() {
    if (!hints_active && !insertMode && !document.activeElement.isInput()) {
      return chrome.runtime.sendMessage({action: "nextTab"});
    }
  },
  previousTab: function() {
    if (!hints_active && !insertMode && !document.activeElement.isInput()) {
      return chrome.runtime.sendMessage({action: "previousTab"});
    }
  },
  goBack: function() {
    if (!hints_active && !insertMode && !document.activeElement.isInput()) {
      return history.go(-1);
    }
  },
  goForward: function() {
    if (!hints_active && !insertMode && !document.activeElement.isInput()) {
      return history.go(1);
    }
  },
  goToSource: function() {
    if (!hints_active && !insertMode && !document.activeElement.isInput()) {
      return chrome.runtime.sendMessage({action: "openLinkTab", url: "view-source:" + document.URL});
    }
  },
  cycleHistoryUp: function(e) {
    if (e) e.preventDefault();
    if (document.activeElement.id === "command_input") {
    }
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
  goToInput: function() {
    if (!hints_active && !insertMode && !document.activeElement.isInput()) {
      this.inputElements = [];
      var allInput = document.querySelectorAll("input,textarea");
      for (var i = 0, l = allInput.length; i < l; i++) {
        if (allInput[i].isInput() && allInput[i].isVisible() && allInput[i].id !== "command_input") {
          this.inputElements.push(allInput[i]);
        }
      }
      this.inputElementsIndex = 0;
      this.inputFocused = true;
      for (var i = 0, l = allInput.length; i < l; i++) {
        var b = allInput[i].getBoundingClientRect();
        if (b.top >= 0 && b.top < window.innerHeight && b.left >= 0 && b.left < window.innerWidth) {
          this.inputElementsIndex = i;
          break;
        }
      }
      if (this.inputElements.length) {
        return this.inputElements[this.inputElementsIndex].focus();
      }
    }
  },
  shortCuts: function(s) {
    if (!hints_active && !insertMode && !document.activeElement.isInput()) {
      for (var i = 0, l = Mappings.shortCuts.length; i < l; i++) {
        if (s === Mappings.shortCuts[i][0]) {
          commandMode = true;
          if (/^:bookmarks(\s+)/.test(Mappings.shortCuts[i][1])) {
            Command.show(false, Mappings.shortCuts[i][1].replace(/^:/, ""));
            return Command.parse(barInput.value);
          }
          return Command.show(false, Mappings.shortCuts[i][1].replace(/^:/, ""));
        }
      }
    }
  },
  openSearchBar: function() {
    if (!hints_active && !insertMode && !document.activeElement.isInput()) {
      if (Find.index === null)
        Find.index = -1;
      commandMode = true;
      Command.enterHit = false;
      return Command.show(true);
    }
  },
  openCommandBar: function() {
    if (!hints_active && !insertMode && !document.activeElement.isInput()) {
      Command.hide();
      commandMode = true;
      Command.enterHit = false;
      return Command.show(false);
    }
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
  goBack: ["H", "S"],
  goForward: ["L", "D"],
  createTabbedHint: ["F"],
  goToInput: ["gi"],
  nextTab: ["K", "R", "gt"],
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
  shortCuts: (function() {
    var s = [];
    for (var i = 0, l = Mappings.shortCuts.length; i < l; i++) {
      s.push(Mappings.shortCuts[i][0]);
    }
    return s;
  })()
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

Mappings.convertToAction = function(c) {
  if (!c || !/[a-zA-Z0-9:\/]/.test(c)) {
    return;
  }
  if (hints_active) {
    return Hints.handleHint(c);
  }
  Mappings.queue += c;
  for (var key in this.defaults) {
    if (this.defaults.hasOwnProperty(key)) {
      if (!this.isValidQueue(c)) {
        Mappings.queue = "";
        if (this.isValidQueue(c)) {
          Mappings.queue = c;
        }
      }
      for (var i = 0, l = this.defaults[key].length; i < l; i++) {
        if (Mappings.queue === this.defaults[key][i]) {
          if (key === "shortCuts") {
            return Mappings.actions[key](Mappings.queue);
          }
          return Mappings.actions[key]();
          Mappings.queue = "";
        }
      }
    }
  }
};
