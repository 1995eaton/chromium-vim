var insertMappings = new Trie();
var mappings = new Trie();
var node = mappings;

var Mappings = {
  repeats: '',
  queue: '',
  siteSpecificBlacklists: ''
};

Mappings.lastCommand = {
  fn: '',
  queue: '',
  repeats: 1
};

Mappings.actions = {

  '<Nop>': function() {},
  toggleVisualMode: function() {
    if (!Command.domElementsLoaded) {
      return false;
    }
    Visual.caretModeActive = true;
    Visual.getTextNodes();
    Visual.lineMode = false;
    document.body.spellcheck = false;
    document.designMode = 'on';
    Visual.selection = document.getSelection();
    if (document.getSelection().type === 'Range') {
      return false;
    }
    if (Find.matches.length) {
      Visual.focusSearchResult();
    } else {
      var closestNode = Visual.closestNode();
      if (closestNode) {
        Visual.selection.setPosition(Visual.closestNode(), 0);
        HUD.display(' -- CARET -- ');
        Visual.scrollIntoView();
      } else {
        Visual.lineMode = false;
        Visual.visualModeActive = false;
        Visual.exit();
      }
    }
  },
  toggleVisualLineMode: function() {
    if (Visual.caretModeActive || Visual.visualModeActive) {
      return false;
    }
    Visual.caretModeActive = true;
    Visual.getTextNodes();
    Visual.lineMode = true;
    document.body.spellcheck = false;
    document.designMode = 'on';
    Visual.selection = document.getSelection();
    if (document.getSelection().type === 'Range') {
      return false;
    }
    if (Find.matches.length) {
      Visual.focusSearchResult(true);
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
    chrome.runtime.sendMessage({action: 'cancelAllWebRequests'});
  },
  percentScroll: function(repeats) {
    if (Mappings.repeats === '0' || Mappings.repeats === '') {
      repeats = 0;
    }
    document.body.scrollTop =
      (document.body.scrollHeight - window.innerHeight) * repeats / 100;
  },
  goToTab: function(repeats) {
    chrome.runtime.sendMessage({action: 'goToTab', index: repeats - 1});
  },
  hideDownloadsShelf: function() {
    chrome.runtime.sendMessage({action: 'hideDownloadsShelf'});
  },
  goToRootUrl: function() {
    if (window.location.pathname.length !== 0 && window.location.pathname !== '/') {
      chrome.runtime.sendMessage({
        action: 'openLink',
        tab: {
          pinned: false
        },
        url: window.location.origin
      });
    }
  },
  goUpUrl: function(repeats) {
    var rxp = new RegExp('(\/([^\/])+){0,' + repeats + '}(\/)?$');
    if (window.location.pathname.length !== 0 && window.location.pathname !== '/') {
      var match = window.location.pathname.replace(rxp, '');
      if (match !== window.location.pathname) {
        chrome.runtime.sendMessage({
          action: 'openLink',
          tab: {
            pinned: false
          },
          url: window.location.origin + match
        });
      }
    }
  },
  nextFrame: function(repeats) {
    chrome.runtime.sendMessage({action: 'focusFrame', repeats: repeats});
  },
  rootFrame: function() {
    chrome.runtime.sendMessage({action: 'focusFrame', isRoot: true});
  },
  closeTab: function(repeats) {
    chrome.runtime.sendMessage({action: 'closeTab', repeats: repeats});
  },
  closeTabLeft: function() {
    chrome.runtime.sendMessage({action: 'closeTabLeft'});
  },
  closeTabRight: function() {
    chrome.runtime.sendMessage({action: 'closeTabRight'});
  },
  closeTabsToLeft: function() {
    chrome.runtime.sendMessage({action: 'closeTabsToLeft'});
  },
  closeTabsToRight: function() {
    chrome.runtime.sendMessage({action: 'closeTabsToRight'});
  },
  pinTab: function() {
    chrome.runtime.sendMessage({action: 'pinTab'});
  },
  firstTab: function() {
    chrome.runtime.sendMessage({action: 'firstTab'});
  },
  lastTab: function() {
    chrome.runtime.sendMessage({action: 'lastTab'});
  },
  lastClosedTab: function() {
    chrome.runtime.sendMessage({action: 'openLast'});
  },
  moveTabRight: function(repeats) {
    chrome.runtime.sendMessage({action: 'moveTabRight', repeats: repeats});
  },
  moveTabLeft: function(repeats) {
    chrome.runtime.sendMessage({action: 'moveTabLeft', repeats: repeats});
  },
  lastActiveTab: function() {
    chrome.runtime.sendMessage({action: 'lastActiveTab'});
  },
  reverseImage: function() {
    if (/\(\d+×\d+\)$/.test(document.title) === true && document.body.firstChild.localName === 'img') {
      if (document.body.firstChild.src) {
        return chrome.runtime.sendMessage({
          action: 'openLinkTab',
          active: false,
          url: 'https://www.google.com/searchbyimage?image_url=' +
                document.body.firstChild.src,
          noconvert: true
        });
      }
    } else {
      window.setTimeout(function() {
        Hints.create('image');
      }, 0);
    }
  },
  multiReverseImage: function() {
    window.setTimeout(function() {
      Hints.create('multiimage');
    }, 0);
  },
  toggleImages: function() {
    if (!this.imagesDisabled) {
      this.images = [];
      var walker = document.createTreeWalker(document.body, 1, false, null);
      var el;
      while (el = walker.nextNode()) {
        var computedStyle = getComputedStyle(el, null);
        if (el.localName === 'img' || computedStyle.getPropertyValue('background-image') !== 'none') {
          var opacity = computedStyle.getPropertyValue('opacity');
          var bimg = computedStyle.getPropertyValue('background-image');
          if (opacity === '1') {
            opacity = null;
          }
          if (bimg === 'none') {
            bimg = null;
          }
          this.images.push([opacity, bimg, el]);
        }
      }
    }
    this.imagesDisabled = (this.imagesDisabled === void 0 ? true : !this.imagesDisabled);
    for (i = 0, l = this.images.length; i < l; ++i) {
      if (this.images[i][2].localName === 'img') {
        this.images[i][2].style.opacity = (this.imagesDisabled ? '0' : this.images[i][1]);
      }
      if (this.images[i][1] !== null) {
        if (this.imagesDisabled) {
          this.images[i][2].style.backgroundImage = 'none';
        } else {
          this.images[i][2].style.backgroundImage = this.images[i][1];
        }
      }
    }
  },
  toggleImageZoom: function() {
    if (/\.[a-z]+\s+\(\d+×\d+\)/i.test(document.title)) {
      var images = document.getElementsByTagName('img');
      if (images.length) {
        images[0].simulateClick();
      }
    }
  },
  zoomPageIn: function(repeats) {
    document.body.style.zoom =
      (+document.body.style.zoom ? parseFloat(document.body.style.zoom) : 1) + 0.1 * repeats;
  },
  zoomPageOut: function(repeats) {
    document.body.style.zoom =
      (+document.body.style.zoom ? parseFloat(document.body.style.zoom) : 1) - 0.1 * repeats;
  },
  zoomOrig: function() {
    document.body.style.zoom = '1';
  },
  centerMatchT: function() {
    var documentZoom = parseFloat(document.body.style.zoom) || 1;
    if (Find.matches.length && Find.matches[Find.index]) {
      window.scrollBy(0, Find.matches[Find.index].getBoundingClientRect().top * documentZoom);
    }
  },
  centerMatchH: function() {
    var documentZoom = parseFloat(document.body.style.zoom) || 1;
    if (Find.matches.length && Find.matches[Find.index]) {
      var scrollOffset = (function() {
        return this.matches[this.index].getBoundingClientRect().top *
               documentZoom + this.matches[this.index].offsetHeight -
               0.5 * window.innerHeight;
      }).call(Find);
      window.scrollBy(0, scrollOffset);
    }
  },
  centerMatchB: function() {
    var documentZoom = parseFloat(document.body.style.zoom) || 1;
    if (Find.matches.length && Find.matches[Find.index]) {
      var scrollOffset = (function() {
        return this.matches[this.index].getBoundingClientRect().top *
               documentZoom + this.matches[this.index].offsetHeight *
               documentZoom - window.innerHeight;
      }).call(Find);
      window.scrollBy(0, scrollOffset);
    }
  },
  openLastLinkInTab: function(repeats) {
    chrome.runtime.sendMessage({
      action: 'openLastLinkInTab',
      repeats: repeats
    });
  },
  openNextLinkInTab: function(repeats) {
    chrome.runtime.sendMessage({
      action: 'openNextLinkInTab',
      repeats: repeats
    });
  },
  scrollDown: function(repeats) {
    Scroll.scroll('down', repeats);
  },
  scrollUp: function(repeats) {
    Scroll.scroll('up', repeats);
  },
  scrollPageDown: function(repeats) {
    Scroll.scroll('pageDown', repeats);
  },
  scrollFullPageDown: function(repeats) {
    Scroll.scroll('fullPageDown', repeats);
  },
  scrollPageUp: function(repeats) {
    Scroll.scroll('pageUp', repeats);
  },
  scrollFullPageUp: function(repeats) {
    Scroll.scroll('fullPageUp', repeats);
  },
  scrollLeft: function(repeats) {
    Scroll.scroll('left', repeats);
  },
  scrollRight: function(repeats) {
    Scroll.scroll('right', repeats);
  },
  scrollToTop: function() {
    Scroll.scroll('top');
  },
  scrollToBottom: function() {
    Scroll.scroll('bottom');
  },
  scrollToLeft: function() {
    Scroll.scroll('leftmost');
  },
  scrollToRight: function() {
    Scroll.scroll('rightmost');
  },
  lastScrollPosition: function() {
    if (!Scroll.lastPosition) {
      return;
    }
    var currentPosition = [document.body.scrollLeft, document.body.scrollTop];
    window.scrollTo.apply(null, Scroll.lastPosition);
    Scroll.lastPosition = currentPosition;
  },
  goToMark: function() {
    var key = Mappings.lastCommand.queue.slice(-1);
    if (Scroll.positions.hasOwnProperty(key)) {
      Scroll.lastPosition = [document.body.scrollLeft, document.body.scrollTop];
      window.scrollTo.apply(null, Scroll.positions[key]);
    } else {
      Status.setMessage('Mark not set', 1, 'error');
    }
  },
  setMark: function() {
    Scroll.positions[Mappings.lastCommand.queue.slice(-1)] = [document.body.scrollLeft, document.body.scrollTop];
  },
  createHint: function() {
    window.setTimeout(function() {
      Hints.create();
    }, 0);
  },
  createTabbedHint: function() {
    window.setTimeout(function() {
      Hints.create('tabbed');
    }, 0);
  },
  createActiveTabbedHint: function() {
    window.setTimeout(function() {
      Hints.create('tabbedActive');
    }, 0);
  },
  createMultiHint: function() {
    window.setTimeout(function() {
      Hints.create('multi');
    }, 0);
  },
  createHintWindow: function() {
    window.setTimeout(function() {
      Hints.create('window');
    }, 0);
  },
  createHoverHint: function() {
    window.setTimeout(function() {
      Hints.create('hover');
    }, 0);
  },
  createUnhoverHint: function() {
    window.setTimeout(function() {
      Hints.create('unhover');
    }, 0);
  },
  yankUrl: function() {
    window.setTimeout(function() {
      Hints.create('yank');
    }, 0);
  },
  multiYankUrl: function() {
    window.setTimeout(function() {
      Hints.create('multiyank');
    }, 0);
  },
  fullImageHint: function() {
    window.setTimeout(function() {
      Hints.create('fullimage');
    }, 0);
  },
  yankDocumentUrl: function() {
    Clipboard.copy(document.URL);
    Status.setMessage(document.URL, 2);
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
    if (commandMode && document.activeElement.id === 'cVim-command-bar-input' && Command.type === 'action') {
      Search.nextResult(false);
    }
  },
  previousCompletionResult: function() {
    if (commandMode && document.activeElement.id === 'cVim-command-bar-input' && Command.type === 'action') {
      Search.nextResult(true);
    }
  },
  addQuickMark: function() {
    Marks.addQuickMark(Mappings.lastCommand.queue.slice(-1));
  },
  openQuickMark: function(repeats) {
    Marks.openQuickMark(Mappings.lastCommand.queue.slice(-1), false, repeats);
  },
  openQuickMarkTabbed: function(repeats) {
    Marks.openQuickMark(Mappings.lastCommand.queue.slice(-1), true, repeats);
  },
  insertMode: function() {
    if (Command.domElementsLoaded) {
      HUD.display(' -- INSERT -- ');
      insertMode = true;
    }
  },
  reloadTab: function() {
    chrome.runtime.sendMessage({action: 'reloadTab', nocache: false});
  },
  reloadTabUncached: function() {
    chrome.runtime.sendMessage({action: 'reloadTab', nocache: true});
  },
  reloadAllButCurrent: function() {
    chrome.runtime.sendMessage({action: 'reloadAllTabs', nocache: false, current: false});
  },
  reloadAllTabs: function() {
    chrome.runtime.sendMessage({action: 'reloadAllTabs', nocache: false, current: true});
  },
  nextSearchResult: function(repeats) {
    if (Find.matches.length) {
      Find.search(false, repeats);
    } else if (Find.lastSearch !== void 0 && typeof Find.lastSearch === 'string') {
      Find.highlight({
        base: document.body,
        search: Find.lastSearch,
        setIndex: true,
        executeSearch: true
      });
    }
  },
  previousSearchResult: function(repeats) {
    if (Find.matches.length) {
      Find.search(true, repeats);
    } else if (Find.lastSearch !== void 0 && typeof Find.lastSearch === 'string') {
      Find.highlight({
        base: document.body,
        search: Find.lastSearch,
        setIndex: true,
        executeSearch: true,
        reverse: true
      });
    }
  },
  nextTab: function(r) {
    chrome.runtime.sendMessage({action: 'nextTab', repeats: r});
  },
  previousTab: function(r) {
    chrome.runtime.sendMessage({action: 'previousTab', repeats: r});
  },
  goBack: function(repeats) {
    history.go(-1 * repeats);
  },
  goForward: function(repeats) {
    history.go(1 * repeats);
  },
  goToSource: function() {
    chrome.runtime.sendMessage({
      action: 'openLinkTab',
      active: true,
      url: 'view-source:' + document.URL,
      noconvert: true
    });
  },
  goToLastInput: function() {
    if (this.inputElements && this.inputElements[this.inputElementsIndex]) {
      this.inputElements[this.inputElementsIndex].focus();
    }
  },
  goToInput: function(repeats) {
    this.inputElements = [];
    var allInput = document.querySelectorAll('input,textarea,*[contenteditable]'),
        i;
    for (i = 0, l = allInput.length; i < l; i++) {
      if (allInput[i].isInput() && allInput[i].isVisible() && allInput[i].id !== 'cVim-command-bar-input') {
        this.inputElements.push(allInput[i]);
      }
    }
    if (this.inputElements.length === 0) {
      return false;
    }
    this.inputElementsIndex = repeats % this.inputElements.length - 1;
    if (this.inputElementsIndex < 0) {
      this.inputElementsIndex = 0;
    }
    for (i = 0, l = this.inputElements.length; i < l; i++) {
      var br = this.inputElements[i].getBoundingClientRect();
      if (br.top + br.height >= 0 &&
          br.left + br.width >= 0 &&
          br.right - br.width <= window.innerWidth &&
          br.top < window.innerHeight) {
        this.inputElementsIndex = i;
        break;
      }
    }
    this.inputFocused = true;
    this.inputElements[this.inputElementsIndex].focus();
    if (document.activeElement.hasOwnProperty('select')) {
      document.activeElement.select();
    }
    if (!document.activeElement.getAttribute('readonly')) {
      document.getSelection().collapseToEnd();
    }
  },
  shortCuts: function(command, repeats) {
    commandMode = true;
    return window.setTimeout(function() {
      Command.show(false,
          command
          .replace(/^:/, '')
          .replace(/<cr>(\s+)?$/i, '')
          .replace(/<space>/ig, ' ')
          .replace(/@%/g, document.URL)
      );
      this.queue = '';
      this.repeats = '';
      if (/<cr>(\s+)?$/i.test(command)) {
        var inputValue = Command.input.value;
        Command.hide(function() {
          Command.execute(inputValue, repeats);
        });
      } else {
        Command.complete(Command.input.value);
      }
    }, 0);
  },
  openSearchBar: function() {
    Command.hide();
    Find.lastIndex = Find.index;
    if (document && document.body) {
      Command.lastScrollTop = document.body.scrollTop;
    }
    commandMode = true;
    Find.previousMatches = Find.matches.length > 0;
    Find.swap = false;
    return Command.show('/');
  },
  openSearchBarReverse: function() {
    Command.hide();
    Find.lastIndex = Find.index;
    commandMode = true;
    if (document && document.body) {
      Command.lastScrollTop = document.body.scrollTop;
    }
    Find.previousMatches = Find.matches.length > 0;
    Find.swap = true;
    return Command.show('?');
  },
  openCommandBar: function() {
    Command.hide();
    commandMode = true;
    return Command.show(false);
  },
  repeatCommand: function(repeats) {
    if (this.hasOwnProperty(Mappings.lastCommand.fn)) {
      this[Mappings.lastCommand.fn](Mappings.lastCommand.repeats * repeats);
    }
  }

};

Mappings.defaults = [
  ['j', 'scrollDown'],
  ['gg', 'scrollToTop'],
  ['a',  ':tabnew google '],
  ['zr', ':chrome://restart&<CR>'],
  ['o',  ':open '],
  ['O',  ':open @%'],
  ['b',  ':bookmarks '],
  ['t',  ':tabnew '],
  ['I',  ':history '],
  ['T',  ':tabnew @%'],
  ['B',  ':buffer '],
  ['gd', ':chrome://downloads!<cr>'],
  ['ge', ':chrome://extensions!<cr>'],
  ['x', 'closeTab'],
  ['gxT', 'closeTabLeft' ],
  ['gxt', 'closeTabRight' ],
  ['gx0', 'closeTabsToLeft' ],
  ['gx$', 'closeTabsToRight' ],
  ['s', 'scrollDown' ],
  ['j', 'scrollDown' ],
  ['w', 'scrollUp' ],
  ['k', 'scrollUp' ],
  ['e', 'scrollPageUp' ],
  ['u', 'scrollPageUp' ],
  ['d', 'scrollPageDown' ],
  ['gg', 'scrollToTop' ],
  ['G', 'scrollToBottom' ],
  ['h', 'scrollLeft' ],
  ['l', 'scrollRight' ],
  ['0', 'scrollToLeft' ],
  ['$', 'scrollToRight' ],
  ['i', 'insertMode' ],
  ['r', 'reloadTab' ],
  ['cr', 'reloadAllButCurrent' ],
  ['gR', 'reloadTabUncached' ],
  ['f', 'createHint' ],
  ['mf', 'createMultiHint' ],
  [']]', 'nextMatchPattern' ],
  ['[[', 'previousMatchPattern' ],
  ['W', 'createHintWindow' ],
  ['gp', 'pinTab' ],
  ['>', 'moveTabRight' ],
  ['<', 'moveTabLeft' ],
  ['H', 'goBack' ],
  ['S', 'goBack' ],
  ['gr', 'reverseImage' ],
  ['mr', 'multiReverseImage' ],
  ['L', 'goForward' ],
  ['D', 'goForward' ],
  ['g0', 'firstTab' ],
  ['M*', 'addQuickMark' ],
  ['A', 'openLastHint' ],
  ['go*', 'openQuickMark' ],
  ['gn*', 'openQuickMarkTabbed' ],
  ['gq', 'cancelWebRequest' ],
  ['<C-S-h>', 'openLastLinkInTab' ],
  ['gh', 'openLastLinkInTab' ],
  ['<C-S-l>', 'openNextLinkInTab' ],
  ['gl', 'openNextLinkInTab' ],
  ['gQ', 'cancelAllWebRequests' ],
  ['q', 'createHoverHint' ],
  ['ci', 'toggleImages' ],
  ['Q', 'createUnhoverHint' ],
  ['g$', 'lastTab' ],
  ['X', 'lastClosedTab' ],
  ['gj', 'hideDownloadsShelf' ],
  ['F', 'createTabbedHint' ],
  ['gi', 'goToInput' ],
  ['gI', 'goToLastInput' ],
  ['K', 'nextTab' ],
  ['R', 'nextTab' ],
  ['gt', 'nextTab' ],
  ['gf', 'nextFrame' ],
  ['gF', 'rootFrame' ],
  ['g\'', 'lastActiveTab' ],
  ['g%', 'percentScroll' ],
  ['%', 'goToTab' ],
  ['z<Enter>', 'toggleImageZoom' ],
  ['zi', 'zoomPageIn' ],
  ['zo', 'zoomPageOut' ],
  ['z0', 'zoomOrig' ],
  ['\'\'', 'lastScrollPosition' ],
  ['\'*', 'goToMark' ],
  [';*', 'setMark' ],
  ['zt', 'centerMatchT' ],
  ['zb', 'centerMatchB' ],
  ['zz', 'centerMatchH' ],
  ['gs', 'goToSource' ],
  ['gU', 'goToRootUrl' ],
  ['gu', 'goUpUrl' ],
  ['gy', 'yankUrl' ],
  ['my', 'multiYankUrl' ],
  ['yy', 'yankDocumentUrl' ],
  ['p', 'openPaste' ],
  ['v', 'toggleVisualMode' ],
  ['V', 'toggleVisualLineMode' ],
  ['P', 'openPasteTab' ],
  ['J', 'previousTab' ],
  ['E', 'previousTab' ],
  ['gT', 'previousTab' ],
  ['n', 'nextSearchResult' ],
  ['N', 'previousSearchResult' ],
  ['/', 'openSearchBar' ],
  ['?', 'openSearchBarReverse' ],
  [':', 'openCommandBar' ],
  ['.', 'repeatCommand']
];

Mappings.defaultsClone = Object.clone(Mappings.defaults);

Mappings.insertDefaults = [
  ['<C-y>', 'deleteWord' ],
  ['<C-p>', 'deleteForwardWord' ],
  ['<C-i>', 'beginningOfLine' ],
  ['<C-e>', 'endOfLine' ],
  ['<C-u>', 'deleteToBeginning' ],
  ['<C-o>', 'deleteToEnd' ],
  ['<C-f>', 'forwardChar' ],
  ['<C-b>', 'backwardChar' ],
  ['<C-l>', 'forwardWord' ],
  ['<C-h>', 'backwardWord' ],
];

Mappings.insertFunctions = {
  editWithVim: function() {
    if (this.externalVimReq) {
      this.externalVimReq.abort();
    }
    this.externalVimReq = new XMLHttpRequest();
    var textbox = document.activeElement;
    this.externalVimReq.open('POST', 'http://127.0.0.1:8001');
    this.externalVimReq.onreadystatechange = function() {
      if (this.readyState === 4 && this.status === 200) {
        textbox.value = this.responseText.replace(/\n$/, ''); // Avoid ending newline
      }
    };
    this.externalVimReq.send(textbox.value);
  },
  deleteWord: function() {
    var activeElement = document.activeElement,
        left = activeElement.value.slice(0, activeElement.selectionStart),
        right = activeElement.value.slice(activeElement.selectionStart);
    if (activeElement.id === 'cVim-command-bar-input') {
      left = left.replace(/[^\/ ]*\/*\s*$/, '');
    } else {
      left = left.replace(/([a-zA-Z0-9_]+|[^a-zA-Z0-9\s]+)+[\n ]*$/, '');
    }
    activeElement.value = left + right;
    activeElement.selectionStart -= activeElement.value.length - left.length;
    activeElement.selectionEnd = activeElement.selectionStart;
    return true;
  },
  beginningOfLine: function() {
    document.activeElement.selectionStart = 0;
    document.activeElement.selectionEnd = 0;
    return true;
  },
  endOfLine: function() {
    document.activeElement.selectionStart = document.activeElement.value.length;
    document.activeElement.selectionEnd = document.activeElement.selectionStart;
    return true;
  },
  deleteToBeginning: function() {
    document.activeElement.value =
      document.activeElement.value.slice(document.activeElement.selectionStart - 1, -1);
    document.activeElement.selectionStart = 0;
    document.activeElement.selectionEnd = 0;
    return true;
  },
  deleteToEnd: function() {
    document.activeElement.value =
      document.activeElement.value.substring(0, document.activeElement.selectionStart);
    return true;
  },
  forwardChar: function() {
    document.activeElement.selectionStart += 1;
    return true;
  },
  backwardChar: function() {
    document.activeElement.selectionStart -= 1;
    document.activeElement.selectionEnd -= 1;
    return true;
  },
  forwardWord: function() {
    var aval = (document.activeElement.value + ' ').slice(document.activeElement.selectionStart, -1);
    var diff = aval.length - aval.replace(/^([a-zA-Z_]+|[^a-zA-Z\s]+)[\s\n]*/, '').length;
    if (diff === 0) {
      document.activeElement.selectionStart = document.activeElement.value.length;
    } else {
      document.activeElement.selectionStart += diff;
    }
    return true;
  },
  backwardWord: function() {
    var aval = document.activeElement.value.slice(0, document.activeElement.selectionStart);
    var diff = aval.length - aval.replace(/([a-zA-Z_]+|[^a-zA-Z\s]+)[\s\n]*$/, '').length;
    document.activeElement.selectionStart -= diff;
    document.activeElement.selectionEnd -= diff;
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
    e = e.replace(/^([a-zA-Z_]+|\s+|[^\s\na-zA-Z]+)(\s+)?/, '');
    document.activeElement.value = s + e;
    document.activeElement.selectionStart = s.length;
    document.activeElement.selectionEnd = s.length;
    return true;
  }
};

Mappings.insertCommand = function(modifier, callback) {
  var value = insertMappings.at(modifier);
  if (value) {
    callback(true);
    this.insertFunctions[value]();
  }
};

Mappings.indexFromKeybinding = function(obj, keybinding) {
  for (var key in obj) {
    if (Array.isArray(obj[key]) && obj[key].indexOf(keybinding) !== -1) {
      return key;
    }
  }
  return null;
};

Mappings.removeConflicts = function(obj, mapping) {
  var mrep = mapping.replace(/<[^>]+>/g, '#');
  for (var key in obj) {
    if (Array.isArray(obj[key])) {
      obj[key] = obj[key].filter(function(e) {
        if (e === mapping) {
          return false;
        }
        var erep = e.replace(/<[^>]+>/g, '#');
        if (mapping.indexOf(e) === 0 && mrep.indexOf(erep) === 0) {
          return false;
        }
        if (e.indexOf(mapping) === 0 && erep.indexOf(mrep) === 0) {
          return false;
        }
        return true;
      });
    }
  }
};

Mappings.parseLine = function(line) {
  var map = line.split(/ +/).compress();
  if (map.length) {
    switch (map[0]) {
      case 'unmapAll':
        mappings.data = [];
        return;
      case 'iunmapAll':
        insertMappings.data = [];
        return;
      case 'map':
      case 'remap':
        map[1] = map[1].replace(/<leader>/ig, settings.mapleader);
        mappings.remove(map[1]);
        return mappings.add(map[1], mappings.at(map[2]) || map.slice(2).join(' '));
      case 'imap':
      case 'iremap':
        insertMappings.remove(map[1]);
        return insertMappings.add(map[1], insertMappings.at(map[2]) || map.slice(2).join(' '));
      case 'iunmap':
        return insertMappings.remove(map[1]);
      case 'unmap':
        return mappings.remove(map[1]);
    }
  }
};

Mappings.parseCustom = function(config) {
  for (var i = 0; i < this.defaults.length; i++) {
    mappings.add.apply(mappings, this.defaults[i]);
  }
  for (i = 0; i < this.insertDefaults.length; i++) {
    insertMappings.add.apply(insertMappings, this.insertDefaults[i]);
  }
  config += this.siteSpecificBlacklists;
  config.split('\n').compress().forEach(Mappings.parseLine);
};

Mappings.executeSequence = function(c, r) {
  if (!c.length) {
    return;
  }
  if (/^\d+/.test(c)) {
    r = c.match(/^\d+/)[0];
    c = c.replace(/^\d+/, '');
    this.repeats = r;
    if (!c.length) {
      return;
    }
  }
  var com = c[0];
  this.queue += com;
  this.queue = this.queue.slice(0, -1);
  this.convertToAction(com);
  if (!commandMode && !document.activeElement.isInput()) {
    Mappings.executeSequence(c.substring(1), r);
  }
};

Mappings.handleEscapeKey = function() {

  this.queue = '';
  this.repeats = '';
  node = mappings;

  if (commandMode) {
    if (Command.type === 'search') {
      document.body.scrollTop = Command.lastScrollTop;
      if (Find.previousMatches && Command.input.value && Find.lastSearch && Find.lastSearch !== Command.input.value) {
        Find.clear();
        HUD.hide();
        Find.highlight({ base: document.body,
          search: Find.lastSearch,
          setIndex: false,
          executeSearch: false,
          reverse: true,
          saveSearch: true
        });
        Find.index = Find.lastIndex - 1;
        Find.search(false, 1, false);
      }
    }
    Command.hideData();
    return Command.hide();
  }

  if (document.activeElement.isInput()) {
    this.actions.inputFocused = false;
    return document.activeElement.blur();
  }

  if (Hints.active) {
    return Hints.hideHints(false, false);
  }

  if (insertMode) {
    insertMode = false;
    return HUD.hide();
  }

  if (Hints.lastHover) {
    Hints.lastHover.unhover();
    Hints.lastHover = null;
    return;
  }

  if (Find.matches.length) {
    Find.clear();
    return HUD.hide();
  }
};

Mappings.nonRepeatableCommands = [
  'scrollDown',
  'scrollUp',
  'scrollLeft',
  'scrollRight',
  'reloadTab'
];

Mappings.convertToAction = function(c) {
  if (c === '<Esc>' || c === '<C-[>') {
    return this.handleEscapeKey();
  }
  if (Hints.active) {
    if (settings.numerichints && c === '<Enter>') {
      if (Hints.numericMatch) {
        return Hints.dispatchAction(Hints.numericMatch);
      }
      return Hints.hideHints(false);
    }
    if (settings.typelinkhints) {
      if (c === ';') {
        Hints.changeFocus();
      } else {
        Hints.handleHint(c.replace('<Space>', ' '));
      }
      return true;
    }
    if (c === '<Space>') {
      Hints.hideHints(false);
      return true;
    }
    return (c === ';' ? Hints.changeFocus() : Hints.handleHint(c));
  }

  if (/^[0-9]$/.test(c) && !(c === '0' && Mappings.repeats === '')) {
    Mappings.repeats += c;
    return;
  }

  Mappings.queue += c;
  if (!node.data.hasOwnProperty(c)) {
    if (node.data['*']) {
      node = node.data['*'];
    } else {
      node = mappings;
      Mappings.queue = '';
      Mappings.repeats = '';
      Mappings.validMatch = false;
      return false;
    }
  } else {
    node = node.data[c];
    Mappings.validMatch = true;
  }
  if (node.value) {
    if (node.value.indexOf(':') === 0) {
      Mappings.actions.shortCuts(node.value, +Mappings.repeats || 1);
    } else {
      if (node.value !== 'repeatCommand') {
        if (Mappings.nonRepeatableCommands.indexOf(node.value) === -1) {
          Mappings.lastCommand.queue = Mappings.queue;
          Mappings.lastCommand.repeats = +Mappings.repeats || 1;
          Mappings.lastCommand.fn = node.value;
        }
        Mappings.actions[node.value](Mappings.lastCommand.repeats);
        chrome.runtime.sendMessage({
          action: 'updateLastCommand',
          data: JSON.stringify(Mappings.lastCommand)
        });
      } else {
        Mappings.actions.repeatCommand(+Mappings.repeats || 1);
      }
    }
    Mappings.queue = '';
    Mappings.repeats = '';
    node = mappings;
  }
  return true;
};
