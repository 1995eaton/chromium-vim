var Mappings = {};

Mappings.repeats   = "";
Mappings.queue     = "";
Mappings.siteSpecificBlacklists = "";

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
  openLastHint: function() {
    Hints.dispatchAction(Hints.lastClicked);
  },
  nextMatchPattern: function() {
    Hints.matchPatterns(true);
  },
  previousMatchPattern: function() {
    Hints.matchPatterns(false);
  },
  cancelWebRequest: function() {
    window.stop();
  },
  cancelAllWebRequests: function() {
    chrome.runtime.sendMessage({action: "cancelAllWebRequests"});
  },
  percentScroll: function(repeats) {
    if (Mappings.repeats === "0" || Mappings.repeats === "") repeats = 0;
    document.body.scrollTop = (document.body.scrollHeight - document.documentElement.clientHeight) * repeats / 100;
  },
  goToTab: function(repeats) {
    chrome.runtime.sendMessage({action: "goToTab", index: repeats - 1});
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
        Hints.create("image");
      }, 0);
    }
  },
  multiReverseImage: function() {
    window.setTimeout(function() {
      Hints.create("multiimage");
    }, 0);
  },
  toggleImages: function() {
    if (!this.imagesDisabled) {
      this.images = [];
      var walker = document.createTreeWalker(document.body, 1, false, null);
      var el;
      while (el = walker.nextNode()) {
        var computedStyle = getComputedStyle(el, null);
        if (el.nodeName === "IMG" || computedStyle.getPropertyValue("background-image") !== "none") {
          var opacity = computedStyle.getPropertyValue("opacity");
          var bimg = computedStyle.getPropertyValue("background-image");
          if (opacity === "1") {
            opacity = null;
          }
          if (bimg === "none") {
            bimg = null;
          }
          this.images.push([opacity, bimg, el]);
        }
      }
    }
    this.imagesDisabled = (this.imagesDisabled === undefined ? true : !this.imagesDisabled);
    for (i = 0, l = this.images.length; i < l; ++i) {
      if (this.images[i][2].nodeName === "IMG") {
        this.images[i][2].style.opacity = (this.imagesDisabled ? "0" : this.images[i][1]);
      }
      if (this.images[i][1] !== null) {
        if (this.imagesDisabled) {
          this.images[i][2].style.backgroundImage = "none";
        } else {
          this.images[i][2].style.backgroundImage = this.images[i][1];
        }
      }
    }
  },
  toggleImageZoom: function() {
    if (/\.[a-z]+\s+\(\d+×\d+\)/.test(document.title)) {
      var images = document.getElementsByTagName("img");
      if (images.length) {
        images[0].simulateClick();
      }
    }
  },
  toggleDimDisplay: function() {
    if (this.isDim === undefined) {
      this.isDim = false;
    }
    this.isDim ^= 1;
    function clearDimOverlay() {
      var e;
      while (e = document.getElementById("cVim-display-dim")) {
        e.parentNode.removeChild(e);
      }
    }
    clearDimOverlay();
    if (this.isDim) {
      var e = document.createElement("div");
      e.id = "cVim-display-dim";
      e.style.position = "fixed";
      e.style.left = "0";
      e.style.right = "0";
      e.style.top = "0";
      e.style.bottom = "0";
      e.style.zIndex = "999999";
      e.style.pointerEvents = "none";
      e.style.webkitTransform = "translateZ(0)";
      e.style.backgroundColor = "rgba(175, 77, 0, 0.15)";
      try {
        document.lastChild.appendChild(e);
      } catch (ex) {
        document.body.appendChild(e);
      }
    }
  },
  zoomPageIn: function(repeats) {
    document.body.style.zoom = (isNaN(parseInt(document.body.style.zoom)) ? 1 : parseFloat(document.body.style.zoom)) + 0.1 * repeats;
  },
  zoomPageOut: function(repeats) {
    document.body.style.zoom = (isNaN(parseInt(document.body.style.zoom)) ? 1 : parseFloat(document.body.style.zoom)) - 0.1 * repeats;
  },
  zoomOrig: function() {
    document.body.style.zoom = "1";
  },
  centerMatchT: function() {
    var documentZoom = parseFloat(document.body.style.zoom) || 1;
    if (Find.matches.length && Find.matches[Find.index])
      window.scrollBy(0, Find.matches[Find.index].getBoundingClientRect().top * documentZoom);
  },
  centerMatchH: function() {
    var documentZoom = parseFloat(document.body.style.zoom) || 1;
    if (Find.matches.length && Find.matches[Find.index])
      window.scrollBy(0, Find.matches[Find.index].getBoundingClientRect().top * documentZoom + Find.matches[Find.index].offsetHeight - 0.5 * window.innerHeight);
  },
  centerMatchB: function() {
    var documentZoom = parseFloat(document.body.style.zoom) || 1;
    if (Find.matches.length && Find.matches[Find.index])
      window.scrollBy(0, Find.matches[Find.index].getBoundingClientRect().top * documentZoom + Find.matches[Find.index].offsetHeight * documentZoom - window.innerHeight);
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
  scrollToLeft: function() {
    Scroll.scroll("leftmost");
  },
  scrollToRight: function() {
    Scroll.scroll("rightmost");
  },
  createHint: function() {
    window.setTimeout(function() {
      Hints.create();
    }, 0);
  },
  createTabbedHint: function() {
    window.setTimeout(function() {
      Hints.create("tabbed");
    }, 0);
  },
  createMultiHint: function() {
    window.setTimeout(function() {
      Hints.create("multi");
    }, 0);
  },
  createHintWindow: function() {
    window.setTimeout(function() {
      Hints.create("window");
    }, 0);
  },
  createHoverHint: function() {
    window.setTimeout(function() {
      Hints.create("hover");
    }, 0);
  },
  createUnhoverHint: function() {
    window.setTimeout(function() {
      Hints.create("unhover");
    }, 0);
  },
  yankUrl: function() {
    window.setTimeout(function() {
      Hints.create("yank");
    }, 0);
  },
  multiYankUrl: function() {
    window.setTimeout(function() {
      Hints.create("multiyank");
    }, 0);
  },
  yankDocumentUrl: function() {
    Clipboard.copy(document.URL);
  },
  openPaste: function() {
    Clipboard.paste(false);
  },
  openPasteTab: function(repeats) {
    for (var i = 0; i < repeats; ++i) {
      Clipboard.paste(true);
    }
  },
  nextCompletionResult: function() {
    if (commandMode && document.activeElement.id === "cVim-command-bar-input" && Command.type === "action") {
      Search.nextResult(false);
    }
  },
  previousCompletionResult: function() {
    if (commandMode && document.activeElement.id === "cVim-command-bar-input" && Command.type === "action") {
      Search.nextResult(true);
    }
  },
  addQuickMark: function(repeats, queue) {
    Marks.addQuickMark(queue.slice(-1));
  },
  openQuickMark: function(repeats, queue) {
    Marks.openQuickMark(queue.slice(-1), false, repeats);
  },
  openQuickMarkTabbed: function(repeats, queue) {
    Marks.openQuickMark(queue.slice(-1), true, repeats);
  },
  insertMode: function() {
    HUD.display(" -- INSERT -- ");
    insertMode = true;
  },
  reloadTab: function() {
    chrome.runtime.sendMessage({action: "reloadTab", nocache: false});
  },
  reloadTabUncached: function() {
    chrome.runtime.sendMessage({action: "reloadTab", nocache: true});
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
    var allInput = document.querySelectorAll("input,textarea"),
        i;
    for (i = 0, l = allInput.length; i < l; i++) {
      if (allInput[i].isInput() && allInput[i].isVisible() && allInput[i].id !== "cVim-command-bar-input") {
        this.inputElements.push(allInput[i]);
      }
    }
    if (this.inputElements.length === 0) return false;
    this.inputElementsIndex = repeats % this.inputElements.length - 1;
    if (this.inputElementsIndex < 0) this.inputElementsIndex = 0;
    for (i = 0, l = this.inputElements.length; i < l; i++) {
      var br = this.inputElements[i].getBoundingClientRect();
      if (br.top + br.height >= 0 && br.left + br.width >= 0 && br.right - br.width <= document.documentElement.clientWidth && br.top < document.documentElement.clientHeight) {
        this.inputElementsIndex = i;
        break;
      }
    }
    this.inputFocused = true;
    this.inputElements[this.inputElementsIndex].focus();
    document.activeElement.select();
    if (!document.activeElement.getAttribute("readonly")) {
      document.getSelection().collapseToEnd();
    }
  },
  shortCuts: function(s, repeats) {
    for (var i = 0, l = Mappings.shortCuts.length; i < l; i++) {
      if (s === Mappings.shortCuts[i][0]) {
        commandMode = true;
        window.setTimeout(function() {
          Command.show(false, Mappings.shortCuts[i][1].replace(/^:/, "").replace(/<cr>(\s+)?$/i, ""));
          this.queue = "";
          this.repeats = "";
          if (/<cr>(\s+)?$/i.test(Mappings.shortCuts[i][1])) {
            Command.execute(Command.input.value, repeats);
          } else Command.complete(Command.input.value);
        }, 0);
        break;
      }
    }
  },
  openSearchBar: function() {
    Command.hide();
    Command.lastScrollTop = document.body.scrollTop;
    commandMode = true;
    Find.swap = false;
    return Command.show("/");
  },
  openSearchBarReverse: function() {
    Command.hide();
    commandMode = true;
    Find.swap = true;
    return Command.show("?");
  },
  openCommandBar: function() {
    Command.hide();
    commandMode = true;
    return Command.show(false);
  }
};

Mappings.shortCuts = [
  ["a",  ":tabopen google "],
  ["o",  ":open "],
  ["O",  ":open @%"],
  ["b",  ":bookmarks "],
  ["t",  ":tabopen "],
  ["I",  ":history "],
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
  scrollToLeft:         ["0"],
  scrollToRight:        ["$"],
  insertMode:           ["i"],
  reloadTab:            ["r"],
  reloadTabUncached:    ["gR"],
  createHint:           ["f"],
  createMultiHint:      ["mf"],
  nextMatchPattern:     ["]]"],
  previousMatchPattern: ["[["],
  createHintWindow:     ["W"],
  pinTab:               ["gp"],
  moveTabRight:         [">"],
  moveTabLeft:          ["<"],
  goBack:               ["H", "S"],
  reverseImage:         ["gr"],
  multiReverseImage:    ["mr"],
  goForward:            ["L", "D"],
  firstTab:             ["g0"],
  addQuickMark:         ["M*"],
  openLastHint:         ["A"],
  openQuickMark:        ["go*"],
  openQuickMarkTabbed:  ["gn*"],
  cancelWebRequest:     ["gq"],
  cancelAllWebRequests: ["gQ"],
  createHoverHint:      ["q"],
  toggleImages:         ["ci"],
  toggleDimDisplay:     ["cc"],
  createUnhoverHint:    ["Q"],
  lastTab:              ["g$"],
  lastClosedTab:        ["X"],
  hideDownloadsShelf:   ["gj", "gD"],
  createTabbedHint:     ["F"],
  goToInput:            ["gi"],
  nextTab:              ["K", "R", "gt"],
  nextFrame:            ["gf"],
  rootFrame:            ["gF"],
  percentScroll:        ["g%"],
  goToTab:              ["%"],
  toggleImageZoom:      ["z<Enter>"],
  zoomPageIn:           ["zi"],
  zoomPageOut:          ["zo"],
  zoomOrig:             ["z0"],
  centerMatchT:         ["zt"],
  centerMatchB:         ["zb"],
  centerMatchH:         ["zz"],
  goToSource:           ["gs"],
  goToRootUrl:          ["gU"],
  goUpUrl:              ["gu"],
  yankUrl:              ["Y"],
  multiYankUrl:         ["my"],
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
Mappings.defaultsClone = Mappings.defaults.clone();
Mappings.shortCutsClone = Mappings.shortCuts.clone();

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
    if (diff === 0) {
      document.activeElement.selectionStart = document.activeElement.value.length;
    } else {
      document.activeElement.selectionStart += diff;
    }
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
    var start = document.activeElement.selectionStart;
    var end = document.activeElement.selectionEnd;
    if (start !== end) {
      return false;
    }
    var s = document.activeElement.value.slice(0, start);
    var e = document.activeElement.value.slice(start);
    e = e.replace(/^([a-zA-Z_]+|\s+|[^\sa-zA-Z]+)(\s+)?/, "");
    document.activeElement.value = s + e;
    document.activeElement.selectionStart = s.length;
    document.activeElement.selectionEnd = s.length;
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

Mappings.removeMapping = function(list, mapping) {
  for (var key in list) {
    if (Array.isArray(list[key])) {
      while (list[key].indexOf(mapping) !== -1) {
        list[key].splice(list[key].indexOf(mapping), 1);
      }
    }
  }
};

Mappings.parseCustom = function(config) {
  config += this.siteSpecificBlacklists;
  config = config.split(/\n+/).map(function(item) { return item.replace(/(\s+)?".*/, "").split(/ +/); });
  config.forEach(function(mapping) {
    var key;
    if (!mapping.length) {
      return false;
    }
    if (!/^(imap|iunmap|map|unmap)$/.test(mapping[0]) || (mapping.length < 3 && /^(map|imap)$/.test(mapping[0]))) {
      return false;
    }
    if (mapping.length === 1) {
      if (mapping[0].trimAround() === "unmapAll") {
        for (key in Mappings.defaults) {
          Mappings.defaults[key] = [];
        }
        Mappings.shortCuts = [];
      } else if (mapping[0].trimAround() === "iunmapAll") {
        for (key in Mappings.insertDefaults) {
          Mappings.insertDefaults[key] = [];
        }
      }
      return;
    }
    if (mapping[0] === "map") {
      mapping.shift();
      if (Mappings.defaults.hasOwnProperty(mapping[1])) {
        return Mappings.defaults[mapping[1]].push(mapping[0]);
      }
      if (mapping[1][0] === ":") {
        return Mappings.shortCuts.push([mapping[0], mapping.slice(1).join(" ")]);
      }
    } else if (mapping[0] === "imap") {
      mapping.shift();
      if (Mappings.insertDefaults.hasOwnProperty(mapping[1])) {
        return Mappings.insertDefaults[mapping[1]].push(mapping[0]);
      }
    }
    if (mapping.length === 2) {
      if (mapping[0] === "iunmap") {
        Mappings.removeMapping(Mappings.insertDefaults, mapping[1]);
      } else {
        Mappings.removeMapping(Mappings.defaults, mapping[1]);
        Mappings.shortCuts = Mappings.shortCuts.filter(function(item) {
          return item[0] !== mapping[1];
        });
      }
    }
  });
  Mappings.shortCuts = Mappings.shortCuts.map(function(item) {
    item[1] = item[1].replace(/@%/, document.URL);
    return item;
  });
  Mappings.shortCuts.forEach(function(item) {
    Mappings.defaults.shortCuts.push(item[0]);
  });
};

Mappings.executeSequence = function(c, r) {
  if (!c.length) return;
  if (/^[0-9]+/.test(c)) {
    r = c.match(/^[0-9]+/)[0];
    c = c.replace(/^[0-9]+/, "");
    this.repeats = r;
    if (!c.length) return;
  }
  var com = c[0];
  this.queue += com;
  this.queue = this.queue.slice(0, -1);
  this.convertToAction(com);
  if (!commandMode && !document.activeElement.isInput()) {
    Mappings.executeSequence(c.substring(1), r);
  }
};

Mappings.isValidQueue = function(wildCard) {
  var wild, key, i;
  for (key in this.defaults) {
    for (i = 0, l = this.defaults[key].length; i < l; i++) {
      wild = this.defaults[key][i].replace(/\*$/, wildCard);
      if (wild.substring(0, Mappings.queue.length) === Mappings.queue) {
        return true;
      }
    }
  }
};

Mappings.isValidMapping = function(c) {
  for (var key in this.defaults)
    if (Array.isArray(this.defaults[key]) && this.defaults[key].indexOf(c) >= 0) return true;
};

Mappings.convertToAction = function(c) {
  var addOne = false;
  if (!c || c.trim() === "") {
    return false;
  }
  if (Hints.active) {
    if (settings.numerichints && c === "<Enter>") {
      if (Hints.numericMatch) {
        return Hints.dispatchAction(Hints.numericMatch);
      }
      return Hints.hideHints(false);
    }
    if (settings.typelinkhints) {
      if (c === ";") {
        Hints.changeFocus();
      } else {
        Hints.handleHint(c.replace("<Space>", " "));
      }
      return true;
    }
    if (c === "<Space>") {
      return false;
    }
    return (c === ";" ? Hints.changeFocus() : Hints.handleHint(c));
  }
  if (!c || c === "<Space>") {
    return false;
  }
  if (/^[0-9]$/.test(c) && !(c === "0" && Mappings.repeats === "") && Mappings.queue.length === 0) {
    return Mappings.repeats += c;
  }

  Mappings.queue += c;
  for (var key in this.defaults) {
    if (!this.isValidQueue(c)) {
      Mappings.queue = "";
      Mappings.repeats = "";
      Mappings.validMatch = false;
      return false;
    }

    Mappings.validMatch = true;
    for (var i = 0, l = this.defaults[key].length; i < l; i++) {
      if (Mappings.queue === this.defaults[key][i].replace(/\*$/, c)) {
        Mappings.validMatch = false;
        if (/^0?$/.test(Mappings.repeats)) addOne = true;
        if (key === "shortCuts")
          Mappings.actions[key](Mappings.queue, (addOne ? 1 : parseInt(Mappings.repeats)));
        else Mappings.actions[key]((addOne ? 1 : parseInt(Mappings.repeats)), Mappings.queue);
        Mappings.queue = "";
        Mappings.repeats = "";
      }
    }
  }
  return true;
};
