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
  } else if (key.keyCode === 27) {
    return "<ESC>";
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
  handleEscape: function() {
    if (hints_active) {
      return Hints.hideHints();
    }
  },
  insertMode: function() {
    if (!document.activeElement.isInput()) {
      return insertMode = true;
    }
  },
  reloadTab: function() {
    if (!document.activeElement.isInput()) {
      return chrome.runtime.sendMessage({action: "reloadTab"});
    }
  },
  nextSearchResult: function() {
    if (Command.type === "search" && !hints_active && !insertMode && !document.activeElement.isInput()) {
      return Command.search(false, true);
    }
  },
  previousSearchResult: function() {
    if (Command.type === "search" && !hints_active && !insertMode && !document.activeElement.isInput()) {
      return Command.search(true, true);
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
      if (this.inputIndex + 1 === this.inputElements.length) {
        this.inputIndex = 0;
      } else {
        this.inputIndex++;
      }
      this.inputElements[inputIndex].focus();
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
    if (!this.inputElements || !this.inputElements.length) {
      this.inputElements = [];
      var inputElementsTemp = document.querySelectorAll("input,textarea");
      for (var i = 0; i < inputElementsTemp.length; i++) {
        if (!inputElementsTemp[i].disabled && inputElementsTemp[i].id !== "command_input" && inputElementsTemp[i].style.display !== "none" && inputElementsTemp[i].style.opacity !== "0" && (inputElementsTemp[i].nodeName === "TEXTAREA" || (inputElementsTemp[i].nodeName === "INPUT" && (inputElementsTemp[i].type === "text" || inputElementsTemp[i].type === "search")))) {
          this.inputElements.push(inputElementsTemp[i]);
        }
        if (i + 1 === inputElementsTemp.length) {
          for (var i2 = 0; i2 < inputElements.length; i2++) {
            if (this.inputElements[i2].offsetTop >= document.body.scrollTop) {
              this.inputFocused = true;
              this.inputIndex = i2;
              setTimeout(function() {
                this.inputElements[i2].focus();
              }, 0);
              break;
            }
          }
        }
      }
    } else {
      setTimeout(function() {
        this.inputFocused = true;
        this.inputElements[this.inputIndex].focus();
      }, 0);
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
      commandMode = true;
      Command.enterHit = true;
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
  handleEscape: ["<ESC>"],
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
