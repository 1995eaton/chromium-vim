var Mappings = {};

Mappings.repeats   = "";
Mappings.queue     = "";
Mappings.arrowKeys = ["<Left>", "<Up>", "<Right>", "<Down>"];

Mappings.actions   = {

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
    document.body.scrollTop = (document.body.scrollHeight - document.documentElement.clientHeight) * repeats / 100;
  },
  hideDownloadsShelf: function() {
    chrome.runtime.sendMessage({action: "hideDownloadsShelf"});
  },
  goToRootUrl: function() {
    if (window.location.pathname.length !== 0 && window.location.pathname !== "/")
      chrome.runtime.sendMessage({action: "openLink", url: window.location.origin});
  },
  goUpUrl: function(repeats) {
    var rxp = new RegExp("(\/([^\/])+){0," + repeats + "}(\/)?$");
    if (window.location.pathname.length !== 0 && window.location.pathname !== "/") {
      var match = window.location.pathname.replace(rxp, "");
      if (match !== window.location.pathname)
        chrome.runtime.sendMessage({action: "openLink", url: window.location.origin + match});
    }
  },
  nextFrame: function(repeats) {
    chrome.runtime.sendMessage({action: "focusMainWindow", repeats: repeats});
  },
  rootFrame: function() {
    chrome.runtime.sendMessage({action: "focusMainWindow", repeats: -1});
  },
  closeTab: function(repeats) {
    chrome.runtime.sendMessage({action: "closeTab", repeats: repeats});
  },
  pinTab: function() {
    chrome.runtime.sendMessage({action: "pinTab"});
  },
  firstTab: function() {
    chrome.runtime.sendMessage({action: "firstTab"});
  },
  lastTab: function() {
    chrome.runtime.sendMessage({action: "lastTab"});
  },
  lastClosedTab: function() {
    chrome.runtime.sendMessage({action: "openLast"});
  },
  moveTabRight: function(repeats) {
    chrome.runtime.sendMessage({action: "moveTabRight", repeats: repeats});
  },
  moveTabLeft: function(repeats) {
    chrome.runtime.sendMessage({action: "moveTabLeft", repeats: repeats});
  },
  reverseImage: function() {
    if (document.body.childNodes.length === 1 && document.body.firstChild.nodeName === "IMG") {
      if (document.body.firstChild.src) {
        return chrome.runtime.sendMessage({action: "openLinkTab", active: false, url: "https://www.google.com/searchbyimage?image_url=" + document.body.firstChild.src, noconvert: true});
      }
    } else {
      window.setTimeout(function() {
        // Hints.create(true, false, true);
        Hints.create("image");
      }, 0);
    }
  },
  centerMatchT: function() {
    if (Command.type === "search" || Find.matches.length)
      window.scrollBy(0, Find.matches[Find.index].getBoundingClientRect().top);
  },
  centerMatchH: function() {
    if (Command.type === "search" || Find.matches.length)
      window.scrollBy(0, Find.matches[Find.index].getBoundingClientRect().top + Find.matches[Find.index].offsetHeight - 0.5 * window.innerHeight);
  },
  centerMatchB: function() {
    if (Command.type === "search" || Find.matches.length)
      window.scrollBy(0, Find.matches[Find.index].getBoundingClientRect().top + Find.matches[Find.index].offsetHeight - window.innerHeight);
  },
  scrollDown: function(repeats) {
    Scroll.scroll("down", repeats);
  },
  scrollUp: function(repeats) {
    Scroll.scroll("up", repeats);
  },
  scrollPageDown: function(repeats) {
    Scroll.scroll("pageDown", repeats);
  },
  scrollPageUp: function(repeats) {
    Scroll.scroll("pageUp", repeats);
  },
  scrollLeft: function(repeats) {
    Scroll.scroll("left", repeats);
  },
  scrollRight: function(repeats) {
    Scroll.scroll("right", repeats);
  },
  scrollToTop: function() {
    Scroll.scroll("top");
  },
  scrollToBottom: function() {
    Scroll.scroll("bottom");
  },
  createHint: function() {
    setTimeout(Hints.create(), 0);
  },
  createTabbedHint: function() {
    setTimeout(Hints.create("tabbed"), 0);
  },
  createMultiHint: function() {
    window.setTimeout(Hints.create("multi"), 0);
  },
  createHintWindow: function() {
    window.setTimeout(Hints.create("window"), 0);
  },
  yankUrl: function() {
    setTimeout(Hints.create("yank"), 0);
  },
  yankDocumentUrl: function() {
    Clipboard.copy(document.URL);
  },
  openPaste: function() {
    Clipboard.paste(false);
  },
  openPasteTab: function() {
    Clipboard.paste(true);
  },
  insertMode: function() {
    HUD.display(" -- INSERT -- ");
    insertMode = true;
  },
  reloadTab: function() {
    chrome.runtime.sendMessage({action: "reloadTab"});
  },
  nextSearchResult: function(repeats) {
    if (Find.matches.length) Find.search(false, repeats);
    else if (Find.lastSearch !== undefined && typeof Find.lastSearch === "string")
      Find.highlight(document.body, Find.lastSearch, true, true, false);
  },
  previousSearchResult: function(repeats) {
    if (Find.matches.length)
      Find.search(true, repeats);
    else if (Find.lastSearch !== undefined && typeof Find.lastSearch === "string")
      Find.highlight(document.body, Find.lastSearch, true, true, true);
  },
  nextTab: function(r) {
    chrome.runtime.sendMessage({action: "nextTab", repeats: r});
  },
  previousTab: function(r) {
    chrome.runtime.sendMessage({action: "previousTab", repeats: r});
  },
  goBack: function(repeats) {
    history.go(-1 * repeats);
  },
  goForward: function(repeats) {
    history.go(1 * repeats);
  },
  goToSource: function() {
    chrome.runtime.sendMessage({action: "openLinkTab", active: true, url: "view-source:" + document.URL, noconvert: true});
  },
  goToInput: function(repeats) {
    this.inputElements = [];
    var allInput = document.querySelectorAll("input,textarea");
    for (var i = 0, l = allInput.length; i < l; i++) {
      if (allInput[i].isInput() && allInput[i].isVisible() && allInput[i].id !== "cVim-command-bar-input") {
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
        if (/<cr>(\s+)?$/i.test(Mappings.shortCuts[i][1]))
          Command.parse(Command.input.value, true, repeats);
        else Command.parse(Command.input.value, false, repeats);
        break;
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
  ["o",  ":open "],
  ["O",  ":open @%"],
  ["b",  ":bookmarks "],
  ["t",  ":tabopen "],
  ["I",  ":history "],
  ["go", ":duplicate&<cr>"],
  ["gO", ":duplicate<cr>"],
  ["T",  ":tabopen @%"],
  ["B",  ":buffers "],
  ["gd", ":chrome://downloads<cr>"],
  ["ge", ":chrome://extensions<cr>"]
];

Mappings.defaults = {
  closeTab:             ["x"],
  scrollDown:           ["s", "j"],
  scrollUp:             ["w", "k"],
  scrollPageUp:         ["e", "u"],
  scrollPageDown:       ["d"],
  scrollToTop:          ["gg"],
  scrollToBottom:       ["G"],
  scrollLeft:           ["h"],
  scrollRight:          ["l"],
  insertMode:           ["i"],
  reloadTab:            ["r"],
  createHint:           ["f"],
  createMultiHint:      ["M"],
  createHintWindow:     ["W"],
  pinTab:               ["gp"],
  moveTabRight:         [">"],
  moveTabLeft:          ["<"],
  goBack:               ["H", "S"],
  reverseImage:         ["gr"],
  goForward:            ["L", "D"],
  firstTab:             ["g0"],
  lastTab:              ["g$"],
  lastClosedTab:        ["X"],
  hideDownloadsShelf:   ["gj", "gD"],
  createTabbedHint:     ["F"],
  goToInput:            ["gi"],
  nextTab:              ["K", "R", "gt"],
  nextFrame:            ["gf"],
  rootFrame:            ["gF"],
  percentScroll:        ["%"],
  centerMatchT:         ["zt"],
  centerMatchB:         ["zb"],
  centerMatchH:         ["zz"],
  goToSource:           ["gs"],
  goToRootUrl:          ["gU"],
  goUpUrl:              ["gu"],
  yankUrl:              ["Y"],
  yankDocumentUrl:      ["yy"],
  openPaste:            ["p"],
  toggleVisualMode:     ["v"],
  openPasteTab:         ["P"],
  previousTab:          ["J", "E", "gT"],
  nextSearchResult:     ["n"],
  previousSearchResult: ["N"],
  openSearchBar:        ["/"],
  openSearchBarReverse: ["?"],
  openCommandBar:       [":"],
  shortCuts:            []
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
  for (var key in this.defaults)
    for (var i = 0, l = this.defaults[key].length; i < l; i++)
      if (this.defaults[key][i].substring(0, Mappings.queue.length) === Mappings.queue)
        return true;
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
      ae.selectionStart -= ae.value.length - left.length;
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
        validMapping = true; callback(key);
      }
    });
    if (validMapping) break;
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
  config = config.split(/\n+|;+/).map(function(item) { return item.split(/ +/); });
  config.forEach(function(mapping) {
    if (mapping.length && mapping[0].trimAround() === "unmapAll") {
      for (var key in Mappings.defaults) Mappings.defaults[key] = [];
      return Mappings.shortCuts = [];
    }
    if (mapping.length === 1 || !/(un)?map/.test(mapping[0])) return false;
    if (mapping.shift() === "map") {
      if (mapping.length === 2 && Mappings.defaults.hasOwnProperty(mapping[1]))
        return Mappings.defaults[mapping[1]].push(mapping[0]);
      else if (mapping[1][0] === ":")
        return Mappings.shortCuts.push([mapping[0], mapping.slice(1).join(" ")]);
    } else if (mapping.length === 1)
      for (var key in Mappings.defaults) {
        if (Array.isArray(Mappings.defaults[key])) {
          var index = 0;
          while (index !== -1) {
            index = Mappings.defaults[key].indexOf(mapping[0]);
            if (index !== -1) Mappings.defaults[key].splice(index, 1);
          }
        }
      }
      Mappings.shortCuts = Mappings.shortCuts.filter(function(item) {
        return item[0] !== mapping[0];
      });
  });
  Mappings.shortCuts = Mappings.shortCuts.map(function(item) {
    item[1] = item[1].replace(/@%/, document.URL);
    return item;
  });
  Mappings.shortCuts.forEach(function(item) {
    Mappings.defaults.shortCuts.push(item[0]);
  });
};

Mappings.isValidMapping = function(c) {
  for (var key in this.defaults)
    if (Array.isArray(this.defaults[key]) && this.defaults[key].indexOf(c) >= 0) return true;
};

Mappings.convertToAction = function(c, callback) {
  var addOne = false;

  if (!c)
    return false;
  if (Hints.active)
    return (c === ";" ? Hints.changeFocus() : Hints.handleHint(c));
  if (/[0-9]/.test(c) && !(c === "0" && Mappings.repeats === ""))
    return Mappings.repeats += c;

  Mappings.queue += c;
  for (var key in this.defaults) {
    if (!this.isValidQueue(c)) {
      Mappings.queue = ""; Mappings.repeats = "";
      break;
    }
    for (var i = 0, l = this.defaults[key].length; i < l; i++) {
      if (Mappings.queue === this.defaults[key][i]) {
        if (/^0?$/.test(Mappings.repeats)) addOne = true;
        if (key === "shortCuts")
          Mappings.actions[key](Mappings.queue, (addOne ? 1 : parseInt(Mappings.repeats)));
        else Mappings.actions[key]((addOne ? 1 : parseInt(Mappings.repeats)));
        Mappings.queue = ""; Mappings.repeats = "";
        return (callback ? callback() : true);
      }
    }
  }
};
