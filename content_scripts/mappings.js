var insertMappings = new Trie(),
    mappingTrie = new Trie(),
    currentTrieNode = mappingTrie;

var Mappings = {
  repeats: '',
  queue: '',
  siteSpecificBlacklists: '',
  lastCommand: {
    fn: '',
    queue: '',
    repeats: 1,
    args: []
  }
};

Mappings.defaults = [
  ['j',         'scrollDown'],
  ['gg',        'scrollToTop'],
  ['a',         ':tabnew google '],
  ['zr',        ':chrome://restart&<CR>'],
  ['o',         ':open '],
  ['O',         ':open @%'],
  ['b',         ':bookmarks '],
  ['t',         ':tabnew '],
  ['I',         ':history '],
  ['T',         ':tabnew @%'],
  ['B',         ':buffer '],
  ['gd',        ':chrome://downloads!<cr>'],
  ['ge',        ':chrome://extensions!<cr>'],
  ['x',         'closeTab'],
  ['gxT',       'closeTabLeft'],
  ['gxt',       'closeTabRight'],
  ['gx0',       'closeTabsToLeft'],
  ['gx$',       'closeTabsToRight'],
  ['s',         'scrollDown'],
  ['j',         'scrollDown'],
  ['w',         'scrollUp'],
  ['k',         'scrollUp'],
  ['e',         'scrollPageUp'],
  ['u',         'scrollPageUp'],
  ['d',         'scrollPageDown'],
  ['gg',        'scrollToTop'],
  ['G',         'scrollToBottom'],
  ['h',         'scrollLeft'],
  ['l',         'scrollRight'],
  ['0',         'scrollToLeft'],
  ['$',         'scrollToRight'],
  ['i',         'insertMode'],
  ['r',         'reloadTab'],
  ['cr',        'reloadAllButCurrent'],
  ['gR',        'reloadTabUncached'],
  ['f',         'createHint'],
  ['mf',        'createMultiHint'],
  [']]',        'nextMatchPattern'],
  ['[[',        'previousMatchPattern'],
  ['W',         'createHintWindow'],
  ['gp',        'pinTab'],
  ['>',         'moveTabRight'],
  ['<',         'moveTabLeft'],
  ['H',         'goBack'],
  ['S',         'goBack'],
  ['gr',        'reverseImage'],
  ['mr',        'multiReverseImage'],
  ['L',         'goForward'],
  ['D',         'goForward'],
  ['g0',        'firstTab'],
  ['M*',        'addQuickMark'],
  ['A',         'openLastHint'],
  ['go*',       'openQuickMark'],
  ['gn*',       'openQuickMarkTabbed'],
  ['gq',        'cancelWebRequest'],
  ['<C-S-h>',   'openLastLinkInTab'],
  ['gh',        'openLastLinkInTab'],
  ['<C-S-l>',   'openNextLinkInTab'],
  ['gl',        'openNextLinkInTab'],
  ['gQ',        'cancelAllWebRequests'],
  ['q',         'createHoverHint'],
  ['Q',         'createUnhoverHint'],
  ['g$',        'lastTab'],
  ['X',         'lastClosedTab'],
  ['gj',        'hideDownloadsShelf'],
  ['F',         'createTabbedHint'],
  ['gi',        'goToInput'],
  ['gI',        'goToLastInput'],
  ['K',         'nextTab'],
  ['R',         'nextTab'],
  ['gt',        'nextTab'],
  ['gf',        'nextFrame'],
  ['gF',        'rootFrame'],
  ['g\'',       'lastActiveTab'],
  ['g%',        'percentScroll'],
  ['%',         'goToTab'],
  ['z<Enter>',  'toggleImageZoom'],
  ['zi',        'zoomPageIn'],
  ['zo',        'zoomPageOut'],
  ['z0',        'zoomOrig'],
  ['\'\'',      'lastScrollPosition'],
  ['\'*',       'goToMark'],
  [';*',        'setMark'],
  ['zt',        'centerMatchT'],
  ['zb',        'centerMatchB'],
  ['zz',        'centerMatchH'],
  ['gs',        ':viewsource&<CR>'],
  ['gU',        'goToRootUrl'],
  ['gu',        'goUpUrl'],
  ['gy',        'yankUrl'],
  ['my',        'multiYankUrl'],
  ['yy',        'yankDocumentUrl'],
  ['p',         'openPaste'],
  ['v',         'toggleVisualMode'],
  ['V',         'toggleVisualLineMode'],
  ['P',         'openPasteTab'],
  ['J',         'previousTab'],
  ['E',         'previousTab'],
  ['gT',        'previousTab'],
  ['n',         'nextSearchResult'],
  ['N',         'previousSearchResult'],
  ['/',         'openSearchBar'],
  ['?',         'openSearchBarReverse'],
  [':',         'openCommandBar'],
  ['<C-6>',     'lastUsedTab'],
  ['.',         'repeatCommand'],
  ['<C-b>',     'createBookmark'],
];

Mappings.defaultsClone = Object.clone(Mappings.defaults);

Mappings.actions = {

  lastUsedTab: function() { RUNTIME('lastUsedTab'); },
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
    RUNTIME('cancelAllWebRequests');
  },
  percentScroll: function(repeats) {
    repeats = (Mappings.repeats === '0' || Mappings.repeats === '') ? 0 : repeats;
    document.body.scrollTop =
      (document.body.scrollHeight - window.innerHeight) * repeats / 100;
  },
  goToTab: function(repeats) {
    RUNTIME('goToTab', {index: repeats - 1});
  },
  hideDownloadsShelf: function() {
    RUNTIME('hideDownloadsShelf');
  },
  goToRootUrl: function() {
    RUNTIME('openLink', {
      url: location.protocol + '//' + location.hostname,
      tab: { pinned: null }
    });
  },
  goUpUrl: function(repeats) {
    var path = '/' + location.pathname.split('/')
      .filter(function(e) { return e; })
      .slice(0, -repeats).join('/');
    if (path !== location.pathname) {
      RUNTIME('openLink', {
        url: location.protocol + '//' + location.hostname + path,
        tab: { pinned: null }
      });
    }
  },
  nextFrame: function(repeats) {
    RUNTIME('focusFrame', {repeats: repeats});
  },
  rootFrame: function() {
    RUNTIME('focusFrame', {isRoot: true});
  },
  closeTab: function(repeats) {
    RUNTIME('closeTab', {repeats: repeats});
  },
  closeTabLeft: function(repeats) {
    RUNTIME('closeTabLeft', {repeats: repeats});
  },
  closeTabRight: function(repeats) {
    RUNTIME('closeTabRight', {repeats: repeats});
  },
  closeTabsToLeft: function() {
    RUNTIME('closeTabsToLeft');
  },
  closeTabsToRight: function() {
    RUNTIME('closeTabsToRight');
  },
  pinTab: function() {
    RUNTIME('pinTab');
  },
  firstTab: function() {
    RUNTIME('firstTab');
  },
  lastTab: function() {
    RUNTIME('lastTab');
  },
  lastClosedTab: function() {
    RUNTIME('openLast');
  },
  moveTabRight: function(repeats) {
    RUNTIME('moveTabRight', {repeats: repeats});
  },
  moveTabLeft: function(repeats) {
    RUNTIME('moveTabLeft', {repeats: repeats});
  },
  lastActiveTab: function() {
    RUNTIME('lastActiveTab');
  },
  reverseImage: function() {
    if (/\(\d+×\d+\)$/.test(document.title) === true && document.body.firstChild.localName === 'img') {
      if (document.body.firstChild.src) {
        RUNTIME('openLinkTab', {
          active: false,
          url: 'https://www.google.com/searchbyimage?image_url=' +
                document.body.firstChild.src,
          noconvert: true
        });
        return;
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
  toggleImageZoom: function() {
    if (/\.[a-z]+\s+\(\d+×\d+\)/i.test(document.title)) {
      var images = document.getElementsByTagName('img');
      if (images.length) {
        images[0].simulateClick();
      }
    }
  },
  zoomPageIn: function(repeats) {
    RUNTIME('zoomIn', {repeats: repeats}, function() {
      document.body.style.zoom =
        (+document.body.style.zoom ? parseFloat(document.body.style.zoom) : 1) + settings.zoomfactor * repeats;
    });
  },
  zoomPageOut: function(repeats) {
    RUNTIME('zoomOut', {repeats: repeats}, function() {
      document.body.style.zoom =
        (+document.body.style.zoom ? parseFloat(document.body.style.zoom) : 1) - settings.zoomfactor * repeats;
    });
  },
  zoomOrig: function() {
    RUNTIME('zoomOrig', null, function() {
      document.body.style.zoom = '1';
    });
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
    RUNTIME('openLastLinkInTab', {repeats: repeats});
  },
  openNextLinkInTab: function(repeats) {
    RUNTIME('openNextLinkInTab', {repeats: repeats});
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
    Scroll.positions[Mappings.lastCommand.queue.slice(-1)] =
      [document.body.scrollLeft, document.body.scrollTop];
  },
  createHint: function() { Hints.create(); },
  createTabbedHint: function() { Hints.create('tabbed'); },
  createActiveTabbedHint: function() { Hints.create('tabbedActive'); },
  createMultiHint: function() { Hints.create('multi'); },
  createHintWindow: function() { Hints.create('window'); },
  createHoverHint: function() { Hints.create('hover'); },
  createUnhoverHint: function() { Hints.create('unhover'); },
  yankUrl: function() { Hints.create('yank'); },
  multiYankUrl: function() { Hints.create('multiyank'); },
  fullImageHint: function() { Hints.create('fullimage'); },
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
    RUNTIME('reloadTab', {nocache: false});
  },
  reloadTabUncached: function() {
    RUNTIME('reloadTab', {nocache: true});
  },
  reloadAllButCurrent: function() {
    RUNTIME('reloadAllTabs', {nocache: false, current: false});
  },
  reloadAllTabs: function() {
    RUNTIME('reloadAllTabs', {nocache: false, current: true});
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
    RUNTIME('nextTab', {repeats: r});
  },
  previousTab: function(r) {
    RUNTIME('previousTab', {repeats: r});
  },
  goBack: function(repeats) {
    history.go(-1 * repeats);
  },
  goForward: function(repeats) {
    history.go(1 * repeats);
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
    if (document.activeElement.select) {
      document.activeElement.select();
    }
    if (!document.activeElement.hasAttribute('readonly')) {
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
      this[Mappings.lastCommand.fn].apply(this,
          (Mappings.lastCommand.args || []).concat(Mappings.lastCommand.repeats * repeats));
    }
  },
  createBookmark: function() { PORT('createBookmark', {url: document.URL, title: document.title}); },
  quitChrome: function() { PORT('quitChrome'); }

};

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

Mappings.insertFunctions = (function() {
  var selection = document.getSelection();

  function modify() {
    if (arguments.length === 3) {
      selection.modify.apply(selection, arguments);
      return;
    }
    selection.modify.bind(
        selection,
        selection.type === 'Range' ? 'extend' : 'move'
    ).apply(null, arguments);
  }

  function deleteSelection() {
    document.execCommand('delete', false, 0);
  }

  return {
    __setElement__: function(e) {
      element = e;
    },
    __getElement__: function() {
      return element;
    },
    editWithVim: function() {
      PORT('editWithVim', {
        text: element.value || element.innerHTML
      });
    },
    forwardChar: modify.bind(null, 'right', 'character'),
    backwardChar: modify.bind(null, 'left', 'character'),
    backwardWord: function() {
      modify('left', 'word');
    },
    forwardWord: function() {
      if (element.value !== void 0) {
        var start = element.selectionStart;
        var end = element.value.slice(start).match(/[a-zA-Z_0-9]+[\s\n]*|(\n|[^a-zA-Z_0-9])\1*/);
        end = start + (end ? end[0].length : 0);
        element.selectionStart = end;
        element.selectionEnd = end;
        return;
      }
      modify('right', 'word');
    },
    deleteToBeginning: function() {
      modify('extend', 'left', 'documentboundary');
      deleteSelection();
    },
    deleteToEnd: function() {
      modify('extend', 'right', 'documentboundary');
      deleteSelection();
      modify('move', 'right', 'documentboundary');
    },
    beginningOfLine: function() {
      modify('left', 'documentboundary');
    },
    endOfLine: function() {
      modify('right', 'documentboundary');
    },
    deleteWord: function() {
      modify('extend', 'left', 'word');
      deleteSelection();
    },
    deleteForwardWord: function() {
      if (element.value !== void 0) {
        var start = element.selectionStart;
        var end = element.value.slice(start).match(/[a-zA-Z_0-9]+[\s\n]*|(\n|[^a-zA-Z_0-9])\1*/);
        end = start + (end ? end[0].length : 0);
        element.selectionStart = start;
        element.selectionEnd = end;
      } else {
        modify('extend', 'right', 'word');
      }
      deleteSelection();
    }
  };
})();

Mappings.insertCommand = function(modifier, callback) {
  var value = insertMappings.at(modifier);
  if (value) {
    callback(true);
    this.insertFunctions.__setElement__(document.activeElement);
    this.insertFunctions[value]();
  }
};

Mappings.parseLine = function(line) {
  var map = line.split(/ +/).compress();
  if (map.length) {
    switch (map[0]) {
      case 'unmapAll':
        mappingTrie.data = [];
        return;
      case 'iunmapAll':
        insertMappings.data = [];
        return;
      case 'map':
      case 'remap':
        map[1] = map[1].replace(/<leader>/ig, settings.mapleader);
        mappingTrie.remove(map[1]);
        return mappingTrie.add(map[1], mappingTrie.at(map[2]) || map.slice(2).join(' '));
      case 'imap':
      case 'iremap':
        insertMappings.remove(map[1]);
        return insertMappings.add(map[1], insertMappings.at(map[2]) || map.slice(2).join(' '));
      case 'iunmap':
        return insertMappings.remove(map[1]);
      case 'unmap':
        return mappingTrie.remove(map[1]);
    }
  }
};

Mappings.parseCustom = function(config) {
  this.defaults.forEach(function(e) {
    mappingTrie.add.apply(mappingTrie, e);
  });
  this.insertDefaults.forEach(function(e) {
    insertMappings.add.apply(insertMappings, e);
  });
  (config += this.siteSpecificBlacklists)
    .split('\n').compress().forEach(this.parseLine);
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
    this.executeSequence(c.substring(1), r);
  }
};

Mappings.handleEscapeKey = function() {

  this.queue = '';
  this.repeats = '';
  currentTrieNode = mappingTrie;

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
    if (document.getSelection().type === 'Range') {
      document.getSelection().collapseToEnd();
      return;
    }
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

Mappings.clearQueue = function() {
  currentTrieNode = mappingTrie;
  this.queue = this.repeats = '';
  this.validMatch = false;
};

Mappings.convertToAction = function(key) {

  if (key === '<Esc>' || key === '<C-[>') {
    this.handleEscapeKey();
    return false;
  }
  if (Hints.active) {
    Hints.handleHint(key);
    return true;
  }

  if (/^[0-9]$/.test(key) && !(key === '0' && this.repeats === '')) {
    this.repeats += key;
    return;
  }

  this.queue += key;
  if (!currentTrieNode.data.hasOwnProperty(key)) {
    if (currentTrieNode.data['*']) {
      currentTrieNode = currentTrieNode.data['*'];
    } else {
      this.clearQueue();
      return false;
    }
  } else {
    currentTrieNode = currentTrieNode.data[key];
    this.validMatch = true;
  }

  if (currentTrieNode.value) {
    if (currentTrieNode.value.charAt(0) === ':') {
      this.actions.shortCuts(currentTrieNode.value, +this.repeats || 1);
      this.lastCommand.queue = this.queue;
      this.lastCommand.repeats = +this.repeats || 1;
      this.lastCommand.fn = 'shortCuts';
      this.lastCommand.args = [currentTrieNode.value];
      RUNTIME('updateLastCommand', {
        data: JSON.stringify(this.lastCommand)
      });
    } else {
      if (currentTrieNode.value !== 'repeatCommand') {
        if (!this.actions[currentTrieNode.value]) {
          this.clearQueue();
          return false;
        }
        if (this.nonRepeatableCommands.indexOf(currentTrieNode.value) === -1) {
          this.lastCommand.queue = this.queue;
          this.lastCommand.repeats = +this.repeats || 1;
          this.lastCommand.fn = currentTrieNode.value;
        }
        this.actions[currentTrieNode.value](+this.repeats || 1);
        RUNTIME('updateLastCommand', {
          data: JSON.stringify(this.lastCommand)
        });
      } else {
        this.actions.repeatCommand(+this.repeats || 1);
      }
    }
    this.clearQueue();
  }

  return true;

};
