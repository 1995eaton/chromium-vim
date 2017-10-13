var Visual = {
  queue: '',
  visualModeActive: false,
  caretModeActive: false,
  textNodes: []
};

Visual.getTextNodes = function(callback) {
  var walker = document.createTreeWalker(document.body, 4, null);
  var node;
  this.textNodes = [];
  while (node = walker.nextNode()) {
    if (node.nodeType === 3 && node.data.trim() !== '') {
      this.textNodes.push(node);
    }
  }
  if (callback) {
    return callback();
  }
};

Visual.exit = function() {
  this.caretModeActive  = false;
  this.visualModeActive = false;
  document.designMode   = 'off';
  if (!Find.matches.length) {
    HUD.hide();
  } else {
    HUD.display(Find.index + 1 + ' / ' + Find.matches.length);
  }
  document.body.spellcheck = true;
  return;
};

Visual.focusSearchResult = function(lineMode) {
  var node = Find.getSelectedTextNode();
  if (!node || node.data.length === 0)
    return false;
  this.selection = document.getSelection();
  this.selection.setPosition(node, 0);
  if (lineMode) {
    this.lineMode = true;
    this.visualModeActive = true;
    this.selection.setPosition(this.selection.baseNode, 0);
    this.selection.extend(this.selection.baseNode, this.selection.baseNode.length);
    HUD.display(' -- VISUAL LINE -- ');
    return this.enterLineMode();
  }
  HUD.display(' -- VISUAL -- ');
  this.selection = document.getSelection();
  this.selection.extend(node, node.data.replace(/\s+$/, '').length);
  this.visualModeActive = true;
};

Visual.collapse = function() {
  this.visualModeActive = false;
  var b = this.textNodes.indexOf(this.selection.anchorNode);
  var e = this.textNodes.indexOf(this.selection.extentNode);
  if ((b === e && this.selection.extentOffset < this.selection.baseOffset) || (e < b)) {
    this.selection.collapseToStart();
  } else if (this.selection.isCollapsed === false) {
    this.selection.collapseToEnd();
  }
};

Visual.closestNode = function() {
  for (var i = 0; i < this.textNodes.length; ++i) {
    var ee = this.textNodes[i].parentElement;
    var br = ee.getBoundingClientRect();
    if (br.top > 0) {
      return this.textNodes[i];
    }
  }
};

Visual.selectNode = function(index) {
  this.selection.setPosition(this.textNodes[index], 0);
  this.selection.extend(this.textNodes[index], this.textNodes[index].data.replace(/\s+$/, '').length);
  this.visualModeActive = true;
};

Visual.scrollIntoView = function() {
  if (!this.selection.extentNode) {
    return false;
  }
  var extentParent = this.selection.extentNode.parentElement;
  var br = extentParent.getBoundingClientRect();
  if (br.top < 0) {
    window.scrollBy(0, br.top);
  } else if (br.top + br.height > document.documentElement.clientHeight) {
    window.scrollBy(0, br.top + br.height - document.documentElement.clientHeight);
  }
};

Visual.enterLineMode = function() {
  this.selection = document.getSelection();
  this.firstLine = true;
  var base = this.textNodes[this.textNodes.indexOf(this.selection.baseNode)];
  if (base === void 0) {
    HUD.setMessage(' -- VISUAL -- ');
    return this.lineMode = false;
  }
  if (this.selection.type === 'Caret') {
    this.selection.setPosition(base, 0);
    this.selection.extend(base, base.length);
  } else {
    var bnode = this.selection.baseNode;
    var enode = this.selection.extentNode;
    if (bnode.parentNode.getBoundingClientRect().top > enode.parentNode.getBoundingClientRect().top) {
      this.selection.setPosition(bnode, bnode.length);
      this.selection.extend(enode, 0);
      this.selection.modify('extend', 'left', 'lineboundary');
    } else {
      this.selection.setPosition(bnode, 0);
      this.selection.extend(enode, enode.length);
      this.selection.modify('extend', 'right', 'lineboundary');
    }
    this.firstExtentNode = this.selection.extentNode;
  }
};

Visual.fillLine = function() {
  this.selection = document.getSelection();
  if (this.selection.type === 'Caret') {
    this.selection.setPosition(this.selection.baseNode, 0);
    this.selection.modify('extend', 'right', 'lineboundary');
  }
};

Visual.lineAction = function(key) {
  this.selection = document.getSelection();
  switch (key) {
  case 'j':
    if (this.firstLine || this.selection.extentNode === this.firstExtentNode || this.selection.baseNode === this.selection.extentNode) {
      this.selection.setPosition(this.selection.baseNode, 0);
      this.firstLine = false;
    }
    this.selection.modify('extend', 'right', 'line');
    this.selection.modify('extend', 'left', 'lineboundary');
    this.fillLine();
    break;
  case 'k':
    if (this.firstLine || this.selection.extentNode === this.firstExtentNode || this.selection.baseNode === this.selection.extentNode) {
      this.selection.setPosition(this.selection.baseNode, this.selection.baseNode.length);
      this.firstLine = false;
    }
    this.selection.modify('extend', 'left', 'line');
    this.selection.modify('extend', 'right', 'lineboundary');
    this.fillLine();
    break;
  case 'p':
  case 'P':
    Clipboard.copy(this.selection.toString());
    Clipboard.paste(key === 'P');
    this.exit();
    break;
  case 'y':
    Clipboard.copy(this.selection.toString());
    Visual.collapse();
    break;
  case 'G':
    this.selection.modify('extend', 'right', 'documentboundary');
    break;
  }
  Visual.scrollIntoView();
};

Visual.movements = {
  l: ['right', 'character'],
  h: ['left', 'character'],
  k: ['left', 'line'],
  j: ['right', 'line'],
  w: ['right', 'word'],
  b: ['left', 'word'],
  0: ['left', 'lineboundary'],
  '^': ['left', 'lineboundary'],
  $: ['right', 'lineboundary'],
  G: ['right', 'documentboundary']
};

Visual.action = function(key) {

  this.selection = document.getSelection();

  switch (key) {
  case 'g':
    if (!this.queue.length) {
      this.queue += 'g';
    } else {
      this.queue = '';
      this.selection.modify((this.visualModeActive ? 'extend' : 'move'),
          'left', 'documentboundary');
      this.scrollIntoView();
    }
    return;
  case 'v':
    if (this.lineMode) {
      HUD.setMessage(' -- VISUAL -- ');
      this.lineMode = false;
      return;
    }
    this.visualModeActive = !this.visualModeActive;
    HUD.setMessage(' -- ' +
        (this.visualModeActive ? 'VISUAL' : 'CARET') +
        ' -- ');
    break;
  case 'V':
    this.lineMode = !this.lineMode;
    this.visualModeActive = true;
    this.enterLineMode();
    HUD.setMessage(' -- VISUAL LINE -- ');
    return;
  default:
    this.queue = '';
  }

  if (this.lineMode) {
    this.lineAction(key);
    return;
  }
  if (this.selection.type === 'Range') {
    this.visualModeActive = true;
  }

  var movementType =
    (this.selection.type === 'Range' || this.visualModeActive) ?
    'extend' : 'move';

  if (this.movements.hasOwnProperty(key)) {
    this.selection.modify.apply(this.selection, [movementType].concat(this.movements[key]));
    return;
  }

  switch (key) {
  case 'n':
  case 'N':
    if (key === 'N') {
      Mappings.actions.previousSearchResult(1);
    } else {
      Mappings.actions.nextSearchResult(1);
    }
    this.focusSearchResult();
    break;
  case 'p':
  case 'P':
    Clipboard.copy(this.selection.toString());
    this.selection.collapseToEnd();
    Clipboard.paste(key === 'P');
    this.exit();
    break;
  case 'y':
    if (movementType === 'extend') {
      Clipboard.copy(this.selection.toString());
      Visual.collapse();
    }
    break;
  }

  Visual.scrollIntoView();
};
