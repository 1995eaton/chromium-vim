var Visual = {};

Visual.queue = "";
Visual.visualModeActive = false;
Visual.caretModeActive = false;
Visual.textNodes = [];

Visual.getTextNodes = function(callback) {
  var walker = document.createTreeWalker(document.body, 4, null, false);
  var node;
  this.textNodes = [];
  while (node = walker.nextNode()) {
    if (node.nodeType === 3 && node.data.trim() !== "") {
      this.textNodes.push(node);
    }
  }
  if (callback) return callback();
};

Visual.exit = function() {
  this.caretModeActive  = false;
  this.visualModeActive = false;
  document.designMode   = "off";
  if (!Find.matches.length) {
    HUD.hide();
  } else HUD.display(Find.index + 1 + " / " + Find.matches.length);
  return document.body.spellcheck = true;
};

Visual.focusSearchResult = function() {
  var node = Find.getSelectedTextNode();
  if (node.data.length === 0) return false;
  this.selection = document.getSelection();
  HUD.display(" -- VISUAL -- ");
  this.selection.setPosition(node, 0);
  this.selection = document.getSelection();
  this.selection.extend(node, node.data.replace(/\s+$/, "").length);
  this.visualModeActive = true;
};

Visual.collapse = function() {
  this.visualModeActive = false;
  var b = this.textNodes.indexOf(this.selection.anchorNode);
  var e = this.textNodes.indexOf(this.selection.extentNode);
  if ((b===e && this.selection.extentOffset < this.selection.baseOffset) || (e<b)) {
    this.selection.collapseToStart();
  } else {
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
  this.selection.extend(this.textNodes[index], this.textNodes[index].data.replace(/\s+$/, "").length);
  this.visualModeActive = true;
};

Visual.scrollIntoView = function() {
  if (!this.selection.extentNode) return false;
  var extentParent = this.selection.extentNode.parentElement;
  var br = extentParent.getBoundingClientRect();
  if (br.top < 0) {
    window.scrollBy(0, br.top);
  } else if (br.top + br.height > document.documentElement.clientHeight) {
    window.scrollBy(0, br.top + br.height - document.documentElement.clientHeight);
  }
};

Visual.action = function(key) {
  this.selection = document.getSelection();
  if (key === "g") {
    if (!this.queue.length) {
      return this.queue += "g";
    } else {
      this.queue = "";
      if (!this.visualModeActive) {
        this.selection.modify("move", "backward", "documentboundary");
      } else if (this.visualModeActive) {
        this.selection.modify("extend", "backward", "documentboundary");
      }
      return this.scrollIntoView();
    }
  } else this.queue = "";
  if (key === "v") {
    this.visualModeActive = !this.visualModeActive;
    if (!this.visualModeActive) {
      HUD.setMessage(" -- CARET -- ");
      return Visual.collapse();
    } else HUD.setMessage(" -- VISUAL -- ");
  }
  if (this.selection.type === "Range") this.visualModeActive = true;
  var movementType = ((this.selection.type === "Range" || this.visualModeActive) ? "extend" : "move");
  switch (key) {
    case "l":
      this.selection.modify(movementType, "forward", "character");
      break;
    case "h":
      this.selection.modify(movementType, "backward", "character");
      break;
    case "k":
      this.selection.modify(movementType, "backward", "line");
      break;
    case "j":
      this.selection.modify(movementType, "forward", "line");
      break;
    case "w":
      this.selection.modify(movementType, "forward", "word");
      break;
    case "b":
      this.selection.modify(movementType, "backward", "word");
      break;
    case "0":
      this.selection.modify(movementType, "backward", "lineboundary");
      break;
    case "$":
      this.selection.modify(movementType, "forward", "lineboundary");
      break;
    case "G":
      this.selection.modify(movementType, "forward", "documentboundary");
      break;
    case "n": case "N":
      if (key === "N") Mappings.actions.previousSearchResult(1);
      else Mappings.actions.nextSearchResult(1);
      this.focusSearchResult();
      break;
    case "p": case "P":
      Clipboard.copy(this.selection.toString());
      Clipboard.paste(key === "P");
      this.exit();
      break;
    case "y":
      if (movementType === "extend") {
        Clipboard.copy(this.selection.toString());
        Visual.collapse();
      }
      break;
  }
  Visual.scrollIntoView();
};
