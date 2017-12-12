var insertMappings = new Trie(),
    mappingTrie = new Trie(),
    currentTrieNode = mappingTrie;

var Mappings = {
  repeats: '',
  queue: '',
  lastCommand: {
    fn: '',
    queue: '',
    repeatStr: '',
    repeats: 1
  }
};

Mappings.defaults = [
  ['j',         'scrollDown'],
  ['gg',        'scrollToTop'],
  ['a',         ':tabnew google '],
  ['o',         ':open '],
  ['O',         ':open @%'],
  ['b',         ':bookmarks '],
  ['t',         ':tabnew '],
  ['I',         ':history '],
  ['T',         ':tabnew @%'],
  ['B',         ':buffer '],
  ['gd',        ':chrome downloads!<cr>'],
  ['ge',        ':chrome extensions!<cr>'],
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
  ['[d',        'previousDomain'],
  [']d',        'nextDomain'],
  ['g0',        'firstTab'],
  ['M*',        'addQuickMark'],
  ['A',         'openLastHint'],
  ['go*',       'openQuickMark'],
  ['gn*',       'openQuickMarkTabbed'],
  ['gw*',       'openQuickMarkWindowed'],
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
  ['<C-o>',     'previousScrollPosition'],
  ['<C-i>',     'nextScrollPosition'],
  ['\'*',       'goToMark'],
  [';*',        'setMark'],
  ['zt',        'centerMatchT'],
  ['zb',        'centerMatchB'],
  ['zz',        'centerMatchH'],
  ['gs',        ':viewsource!<CR>'],
  ['gU',        'goToRootUrl'],
  ['gu',        'goUpUrl'],
  ['gy',        'yankUrl'],
  ['my',        'multiYankUrl'],
  ['yy',        'yankDocumentUrl'],
  ['yY',        'yankFrameUrl'],
  ['ya',        'yankWindowUrls'],
  ['yh',        'yankHighlight'],
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
  ['g+',        'incrementURLPath'],
  ['g-',        'decrementURLPath'],
  ['#',         'resetScrollFocus'],
  ['cm',        'muteTab']
];

Mappings.defaultsClone = Object.clone(Mappings.defaults);

Mappings.actions = {

  lastUsedTab: function() { RUNTIME('lastUsedTab'); },
  '<Nop>': function() {},
  toggleVisualMode: function() {
    Command.callOnCvimLoad(function() {
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
    });
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
    Hints.matchPatterns(settings.nextmatchpattern);
  },
  previousMatchPattern: function() {
    Hints.matchPatterns(settings.previousmatchpattern);
  },
  cancelWebRequest: function() {
    window.stop();
  },
  cancelAllWebRequests: function() {
    RUNTIME('cancelAllWebRequests');
  },
  percentScroll: function(repeats) {
    repeats = (Mappings.repeats === '0' || Mappings.repeats === '')
              ? 0 : repeats;
    document.scrollingElement.scrollTop =
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
      url: location.protocol + '//' + location.hostname +
           (location.port ? ':' + location.port : ''),
      tab: { pinned: null }
    });
  },
  goUpUrl: function(repeats) {
    var path = '/' + location.pathname.split('/')
      .filter(function(e) { return e; })
      .slice(0, -repeats).join('/');
    if (path !== location.pathname) {
      RUNTIME('openLink', {
        url: location.protocol + '//' + location.hostname +
             (location.port ? ':' + location.port : '') + path,
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
  lastClosedTab: function(repeats) {
    RUNTIME('openLast', { repeats: repeats });
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
    if (/\(\d+×\d+\)$/.test(document.title) === true &&
        document.body.firstChild.localName === 'img') {
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
        DOM.mouseEvent('click', images[0]);
      }
    }
  },
  zoomPageIn: function(repeats) {
    RUNTIME('zoomIn', {repeats: repeats}, function() {
      document.body.style.zoom =
        (+document.body.style.zoom ? parseFloat(document.body.style.zoom) : 1)
        + settings.zoomfactor * repeats;
    });
  },
  zoomPageOut: function(repeats) {
    RUNTIME('zoomOut', {repeats: repeats}, function() {
      document.body.style.zoom =
        (+document.body.style.zoom ? parseFloat(document.body.style.zoom) : 1)
        - settings.zoomfactor * repeats;
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
      window.scrollBy(0, Find.matches[Find.index].getBoundingClientRect().top *
                         documentZoom);
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
    var currentPosition = [document.scrollingElement.scrollLeft, document.scrollingElement.scrollTop];
    window.scrollTo.apply(null, Scroll.lastPosition);
    Scroll.lastPosition = currentPosition;
  },
  previousScrollPosition: function() {
    Scroll.previousHistoryState();
  },
  nextScrollPosition: function() {
    Scroll.nextHistoryState();
  },
  goToMark: function() {
    var key = Mappings.lastCommand.queue.slice(-1);
    if (Scroll.positions.hasOwnProperty(key)) {
      Scroll.lastPosition =
        [document.scrollingElement.scrollLeft, document.scrollingElement.scrollTop];
      window.scrollTo.apply(null, Scroll.positions[key]);
    } else {
      Status.setMessage('Mark not set', 1, 'error');
    }
  },
  setMark: function() {
    Scroll.positions[Mappings.lastCommand.queue.slice(-1)] =
      [document.scrollingElement.scrollLeft, document.scrollingElement.scrollTop];
  },
  createHint: function() { Hints.create(); },
  createTabbedHint: function() { Hints.create('tabbed'); },
  createActiveTabbedHint: function() { Hints.create('tabbedActive'); },
  createMultiHint: function() { Hints.create('multi'); },
  createHintWindow: function() { Hints.create('window'); },
  createEditHint: function() { Hints.create('edit'); },
  createHoverHint: function() { Hints.create('hover'); },
  createUnhoverHint: function() { Hints.create('unhover'); },
  createScriptHint: function(repeats, scriptName) {
    Hints.scriptFunction = scriptName;
    if (settings.FUNCTIONS.hasOwnProperty(scriptName)) {
      Hints.create('script');
    }
  },
  yankUrl: function() { Hints.create('yank'); },
  multiYankUrl: function() { Hints.create('multiyank'); },
  fullImageHint: function() { Hints.create('fullimage'); },
  yankDocumentUrl: function() {
    RUNTIME('getRootUrl', function(url) {
      Clipboard.copy(url);
      Status.setMessage(url, 2);
    });
  },
  yankFrameUrl: function() {
    Clipboard.copy(document.URL);
    Status.setMessage(document.URL, 2);
  },
  yankWindowUrls: function() {
    PORT('yankWindowUrls');
  },
  yankHighlight: function() {
    var selection = document.getSelection();
    if (selection.type === 'Range' && selection.toString() !== '') {
      Clipboard.copy(selection.toString());
      return;
    }
    var match = Find.matches[Find.index];
    if (match) {
      Clipboard.copy(match.textContent);
    }
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
    if (Command.commandBarFocused())
      Search.nextResult(false);
  },
  previousCompletionResult: function() {
    if (Command.commandBarFocused())
      Search.nextResult(true);
  },
  addQuickMark: function() {
    Marks.addQuickMark(Mappings.lastCommand.queue.slice(-1));
  },
  openQuickMark: function(repeats) {
    Marks.openQuickMark(Mappings.lastCommand.queue.slice(-1), {
      tab: {},
    }, repeats);
  },
  openQuickMarkTabbed: function(repeats) {
    Marks.openQuickMark(Mappings.lastCommand.queue.slice(-1), {
      tab: {tabbed: true}
    }, repeats);
  },
  openQuickMarkWindowed: function(repeats) {
    Marks.openQuickMark(Mappings.lastCommand.queue.slice(-1), {
      tab: {newWindow: true}
    }, repeats);
  },
  insertMode: function() {
    Command.callOnCvimLoad(function() {
      HUD.display(' -- INSERT -- ');
    });
    insertMode = true;
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
      Find.search(Find.mode || '/', repeats);
    } else if (Find.lastSearch !== void 0 &&
               typeof Find.lastSearch === 'string') {
      Find.highlight({
        base: document.body,
        mode: Find.mode || '/',
        search: Find.lastSearch,
        setIndex: true,
        executeSearch: false
      });
      Find.search(Find.mode || '/', +(Find.mode === '?'));
    }
  },
  previousSearchResult: function(repeats) {
    if (Find.matches.length) {
      Find.search(Find.mode || '?', -repeats);
    } else if (Find.lastSearch !== void 0 &&
               typeof Find.lastSearch === 'string') {
      Find.highlight({
        base: document.body,
        mode: Find.mode || '?',
        search: Find.lastSearch,
        setIndex: true,
        executeSearch: false,
      });
      Find.search(Find.mode || '?', -(Find.mode !== '?'));
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

  _switchDomain: function(direction, repeats) {
    RUNTIME('getHistoryStates', null, function(response) {
      if (response.links.length === 0)
        return;

      var curDomain = new URL(response.links[response.state]).hostname;

      var searchSpace = direction > 0 ?
        response.links.slice(response.state) :
        response.links.slice(0, response.state + 1).reverse();

      for (var i = 1, domainDistance = 0; i < searchSpace.length; i++) {
        var targetDomain = new URL(searchSpace[i]).hostname;
        if (targetDomain !== curDomain) {
          if (++domainDistance >= repeats) {
            history.go(i * (direction > 0 ? 1 : -1));
            break;
          }
        }
      }
    });
  },
  previousDomain: function(repeats) {
    this._switchDomain(-1, repeats);
  },
  nextDomain: function(repeats) {
    this._switchDomain(1, repeats);
  },

  goToLastInput: function() {
    if (this.inputElements && this.inputElements[this.inputElementsIndex]) {
      this.inputElements[this.inputElementsIndex].focus();
    }
  },
  goToInput: function(repeats) {
    this.inputElements = [];
    var allInput = document.
      querySelectorAll('input,textarea,*[contenteditable]');
    for (var i = 0, l = allInput.length; i < l; i++) {
      if (DOM.isEditable(allInput[i]) &&
          DOM.isVisible(allInput[i]) &&
          allInput[i].id !== 'cVim-command-bar-input') {
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
      document.getSelection().modify('move', 'right', 'lineboundary');
    }
  },
  shortCuts: function(command, repeats) {
    commandMode = true;
    if (command.indexOf('@%') !== -1) {
      RUNTIME('getRootUrl', function(url) {
        this.shortCuts(command.split('@%').join(url), repeats);
      }.bind(this));
      return;
    }
    return window.setTimeout(function() {
      var shouldComplete = !/<cr>(\s+)?$/i.test(command);
      command = command
        .replace(/^:/, '')
        .replace(/<cr>(\s+)?$/i, '')
        .replace(/<space>/ig, ' ');
      if (!shouldComplete) {
        Command.execute(command, repeats);
        return;
      }
      Command.show(false, command, shouldComplete);
      this.queue = '';
      this.repeats = '';
    }, 0);
  },
  openSearchBar: function() {
    Find.lastIndex = Find.index;
    if (document.readyState === 'interactive' || document.readyState === 'complete') {
      Command.lastScrollTop = document.scrollingElement.scrollTop;
    }
    commandMode = true;
    Find.previousMatches = Find.matches.length > 0;
    return Command.show('/');
  },
  openSearchBarReverse: function() {
    Find.lastIndex = Find.index;
    commandMode = true;
    if (document.readyState === 'interactive' || document.readyState === 'complete') {
      Command.lastScrollTop = document.scrollingElement.scrollTop;
    }
    Find.previousMatches = Find.matches.length > 0;
    return Command.show('?');
  },
  openLinkSearchBar: function() {
    Find.lastIndex = Find.index;
    if (document.readyState === 'interactive' || document.readyState === 'complete') {
      Command.lastScrollTop = document.scrollingElement.scrollTop;
    }
    commandMode = true;
    Find.previousMatches = Find.matches.length > 0;
    return Command.show('$');
  },
  openCommandBar: function() {
    commandMode = true;
    return Command.show(false, '', settings.completeonopen);
  },
  repeatCommand: function(repeats) {
    if (this.hasOwnProperty(Mappings.lastCommand.fn)) {
      this[Mappings.lastCommand.fn]
        .call(this,
              Mappings.lastCommand.repeats * repeats,
              Mappings.lastCommand.params);
    }
  },
  createBookmark: function() {
    PORT('createBookmark', {
      url: document.URL,
      title: document.title
    });
  },
  quitChrome: function() { PORT('quitChrome'); },
  passKeys: function(repeats) { Mappings.keyPassesLeft = repeats; },
  resetScrollFocus: function() { window.resetScrollFocus(); },
  clearSearchHighlight: function() {
    Find.clear();
    HUD.hide();
  },
  muteTab: function() {
    RUNTIME('muteTab');
  }

};

(function() {
  var replaceURLNumber = function(callback) {
    var url = document.URL.replace(/\b\d+\b/, callback);
    if (url !== document.URL)
      RUNTIME('openLink', { url: url, tab: { tabbed: false } });
  };
  Mappings.actions.incrementURLPath = function(repeats) {
    replaceURLNumber(function(e) { return +e + repeats; });
  };
  Mappings.actions.decrementURLPath = function(repeats) {
    replaceURLNumber(function(e) { return Math.max(0, +e - repeats); });
  };
})();

Mappings.insertDefaults = [
  ['<C-y>', 'deleteWord'],
  ['<C-p>', 'deleteForwardWord'],
  ['<C-i>', 'beginningOfLine'],
  ['<C-e>', 'endOfLine'],
  ['<C-u>', 'deleteToBeginning'],
  ['<C-o>', 'deleteToEnd'],
  ['<C-f>', 'forwardChar'],
  ['<C-b>', 'backwardChar'],
  ['<C-j>', 'forwardLine'],
  ['<C-k>', 'backwardLine'],
  ['<C-l>', 'forwardWord'],
  ['<C-h>', 'backwardWord'],
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
    if (selection.type === 'Range' && selection.toString().length !== 0) {
      document.execCommand('delete', false, 0);
      return true;
    }
    return false;
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
      if (element.value !== void 0) {
        var text = element.value.split('').reverse().join('');
        var len = text.length;
        var start = len - element.selectionStart;
        var end = text.slice(start)
          .match(/[\s\n]*[a-zA-Z_0-9]+|(\n|[^a-zA-Z_0-9])+/);
        end = start + (end ? end[0].length : 0);
        element.selectionStart = len - end;
        element.selectionEnd = len - end;
        return;
      }
      modify('left', 'word');
    },
    forwardWord: function() {
      if (element.value !== void 0) {
        var start = element.selectionStart;
        var end = element.value.slice(start)
          .match(/[a-zA-Z_0-9]+[\s\n]*|(\n|[^a-zA-Z_0-9])+/);
        end = start + (end ? end[0].length : 0);
        element.selectionStart = end;
        element.selectionEnd = end;
        return;
      }
      modify('right', 'word');
    },
    deleteToBeginning: function() {
      modify('extend', 'left', 'lineboundary');
      if (!deleteSelection()) {
        modify('extend', 'left', 'character');
        deleteSelection();
      }
    },
    deleteToEnd: function() {
      modify('extend', 'right', 'lineboundary');
      deleteSelection();
      modify('move', 'right', 'lineboundary');
    },
    beginningOfLine: function() {
      modify('left', 'lineboundary');
    },
    endOfLine: function() {
      modify('right', 'lineboundary');
    },
    deleteWord: function() {
      modify('extend', 'left', 'word');
      deleteSelection();
    },
    deleteForwardWord: function() {
      if (element.value !== void 0) {
        var start = element.selectionStart;
        var end = element.value.slice(start)
          .match(/[a-zA-Z_0-9]+[\s\n]*|(\n|[^a-zA-Z_0-9])\1*/);
        end = start + (end ? end[0].length : 0);
        element.selectionStart = start;
        element.selectionEnd = end;
      } else {
        modify('extend', 'right', 'word');
      }
      deleteSelection();
    },
    deleteChar: function() {
      modify('extend', 'left', 'character');
      deleteSelection();
    },
    deleteForwardChar: function() {
      modify('extend', 'right', 'character');
      deleteSelection();
    },
    forwardLine: function() {
      modify('move', 'right', 'line');
    },
    backwardLine: function() {
      modify('move', 'left', 'line');
    },
    selectAll: function() {
      if (element.select) {
        element.select();
      }
    }
  };
})();

Mappings.insertCommand = function(modifier, callback) {
  var value = insertMappings.findValue(this.splitMapping(modifier));
  if (value) {
    callback(true);
    if (this.insertFunctions[value]) {
      this.insertFunctions.__setElement__(document.activeElement);
      this.insertFunctions[value]();
    } else if (this.actions[value]) {
      this.actions[value]();
    }
  }
};

Mappings.splitMapping = function(string) {
  var blocks = [].slice.call(string.match(/<[^>]+>/g) || []);
  var split = [];
  for (var i = 0; i < string.length; i++) {
    if (string.slice(i).indexOf(blocks[0]) === 0) {
      i += blocks[0].length - 1;
      split.push(blocks.shift());
    } else {
      split.push(string.charAt(i));
    }
  }
  return split;
};

Mappings.parseLine = function(line) {
  var map = Utils.compressArray(line.split(/ +/));
  if (map.length) {
    switch (map[0]) {
    case 'unmapAll':
      mappingTrie.children = {};
      return;
    case 'iunmapAll':
      insertMappings.children = {};
      return;
    case 'map':
    case 'remap':
      if (map[1] === map[2]) {
        return;
      }
      map[1] = map[1].replace(/<leader>/ig, settings.mapleader);
      mappingTrie.removeByKey(this.splitMapping(map[1]));
      mappingTrie.insert(this.splitMapping(map[1]), map.slice(2).join(' '));
      return;
    case 'imap':
    case 'iremap':
      if (map[1] === map[2]) {
        return;
      }
      insertMappings.removeByKey(map[1]);
      return insertMappings.insert(this.splitMapping(map[1]),
          insertMappings.findValue(this.splitMapping(map[2])) ||
          map.slice(2).join(' ').replace(/\s+".*/, ''));
    case 'iunmap':
      map.slice(1).forEach(function(unmap) {
        insertMappings.removeByKey(this.splitMapping(unmap));
      }.bind(this));
      return;
    case 'unmap':
      map.slice(1).forEach(function(unmap) {
        mappingTrie.removeByKey(this.splitMapping(unmap));
      }.bind(this));
      return;
    case 'call':
      waitForLoad(function() {
        map = Utils.trim(map.slice(1).join(' '));
        if (map[0] === ':') {
          Command.execute(map.slice(1).replace(/<CR>/i, ''), 1);
        } else if (Mappings.actions[map]) {
          ECHO('callMapFunction', {
            name: map
          });
        } else {
          ECHO('eval', {
            name: map.replace(/\(.*/, ''),
            args: map.replace(/[^(]+/, '') || '()'
          });
        }
      });
      break;
    }
  }
};

Mappings.parseCustom = function(config, updateSiteMappings) {
  this.defaults.forEach(function(e) {
    mappingTrie.insert(Mappings.splitMapping(e[0]), e[1]);
  });
  this.insertDefaults.forEach(function(e) {
    insertMappings.insert(Mappings.splitMapping(e[0]), e[1]);
  });
  Utils.split(config, '\n').forEach(function(e) {
    Mappings.parseLine(e);
  });

  if (updateSiteMappings && settings.sites) {
    for (var key in settings.sites) {
      if (matchLocation(document.URL, key)) {
        Command.addSettingBlock(settings.sites[key]);
      }
    }
  }
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
  if (Hints.active) {
    Hints.handleHint(com);
  } else if (Visual.caretModeActive || Visual.visualModeActive) {
    Visual.action(com);
  } else {
    this.convertToAction(com);
  }
  if (!commandMode && !DOM.isEditable(document.activeElement)) {
    setTimeout(function() {
      Mappings.executeSequence(c.substring(1), r);
    });
  } else {
    setTimeout(function() {
      document.activeElement.value += c.substring(1);
    });
  }
};

Mappings.handleEscapeKey = function() {
  this.queue = '';
  this.repeats = '';
  currentTrieNode = mappingTrie;

  if (commandMode) {
    if (Command.type === 'search') {
      PORT('cancelIncSearch', {
        search: Command.input.value
      });
    }
    Command.hideData();
    Command.hide();
    return;
  }

  if (DOM.isEditable(document.activeElement)) {
    if (document.getSelection().type === 'Range') {
      document.getSelection().collapseToEnd();
      return;
    }
    this.actions.inputFocused = false;
    document.activeElement.blur();
    return;
  }

  if (Hints.active) {
    return Hints.hideHints(false, false);
  }

  if (insertMode) {
    insertMode = false;
    HUD.hide();
    return;
  }

  if (Hints.lastHover) {
    DOM.mouseEvent('unhover', Hints.lastHover);
    Hints.lastHover = null;
    return;
  }

  if (Find.matches.length) {
    Find.clear();
    document.activeElement.blur();
    HUD.hide();
    return;
  }

  // default Chrome behavior (#248)
  window.stop();
};

Mappings.nonRepeatableCommands = [];

Mappings.clearQueue = function() {
  currentTrieNode = mappingTrie;
  this.queue = this.repeats = '';
  this.validMatch = false;
};

Mappings.shouldPrevent = function(key) {
  if (key === '<Esc>' || key === '<C-[>' || Hints.active) {
    return true;
  }
  if (/^[0-9]$/.test(key) &&
      !(currentTrieNode.hasKey(key) && this.repeats === '') &&
      !(key === '0' && this.repeats === '')) {
    return true;
  }
  if (!currentTrieNode.hasKey(key)) {
    if (currentTrieNode.getKey('*')) {
      return true;
    }
  } else {
    return true;
  }
  return false;
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

  if (/^[0-9]$/.test(key) &&
      !(currentTrieNode.hasKey(key) &&
        this.repeats === '') &&
      !(key === '0' && this.repeats === '')) {
    this.repeats += key;
    return;
  }

  this.queue += key;
  if (!currentTrieNode.hasKey(key)) {
    if (currentTrieNode.getKey('*')) {
      currentTrieNode = currentTrieNode.getKey('*');
    } else {
      this.clearQueue();
      return false;
    }
  } else {
    currentTrieNode = currentTrieNode.getKey(key);
    this.validMatch = true;
  }

  var mapVal = currentTrieNode.value || '';
  var actionParams; (function() {
    if (mapVal.charAt(0) !== ':') {
      mapVal = mapVal.replace(/\([^)]+\)/, function(e) {
        actionParams = e.slice(1, -1);
        return '';
      });
    }
  })();

  if (mapVal) {
    if (/^\d+\D/.test(mapVal)) {
      this.repeats = +mapVal.replace(/\D.*/g, '') || 1;
      mapVal = mapVal.replace(/^\d+/, '');
    }
    for (var mapLinks = [mapVal];
         !this.actions[mapVal] && mapVal.charAt(0) !== ':';
         mapLinks.push(mapVal)) {
      mapVal = mappingTrie.findValue(this.splitMapping(mapVal));
      if (mapVal === null) {
        this.clearQueue();
        return false;
      }
      if (~mapLinks.indexOf(mapVal)) {
        Status.setMessage('recursive mapping detected', void 0, 'error');
        this.clearQueue();
        return false;
      }
    }
    if (mapVal !== 'repeatCommand' &&
        this.nonRepeatableCommands.indexOf(mapVal) === -1) {
      this.lastCommand.queue = this.queue;
      this.lastCommand.repeats = +this.repeats || 1;
      this.lastCommand.fn = mapVal;
      this.lastCommand.params = actionParams;
      this.lastCommand.repeatStr = this.repeats;
    }
    if (mapVal.charAt(0) === ':') {
      this.actions.shortCuts(mapVal, this.lastCommand.repeats);
    } else {
      if (mapVal !== 'repeatCommand') {
        this.actions[mapVal](+this.repeats || 1, actionParams);
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
