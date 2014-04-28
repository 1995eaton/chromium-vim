var log = console.log.bind(console);
var Hints = {};

var linkHoverEnabled = false;

Hints.hintCharacters = "asdfgzxcvbqwert";

Hints.hideHints = function(reset) {
  if (document.getElementById("link_main") !== null) {
    if (!this.visual) HUD.hide();
    document.getElementById("link_main").parentNode.removeChild(document.getElementById("link_main"));
  }
  this.active = reset;
  this.currentString = "";
  this.linkArr = [];
  this.linkHints = [];
  this.permutations = [];
};

Hints.changeFocus = function() {
  this.linkArr.forEach(function(item) { item.style.zIndex = 1 - parseInt(item.style.zIndex) });
};

Hints.invertColors = function(invert) {
  var gradient = ["#969696", "#d7d7d7"];
  var color = "#000";
  var border = "rgba(0,0,0,0.5)";
  var linkHints = document.getElementsByClassName("link_hint");
  var currentBackground = (invert ? "linear-gradient(to top, " + gradient[0] + " 50%, " + gradient[1] + " 100%)" :
                           "linear-gradient(to top, #262626 50%, #474747 100%)");
  var currentColor = (invert ? "#333" : "#ccc");
  var currentBorderColor = (invert ? border : "rgba(255,255,255,0.5)");
  for (var i = 0; i < linkHints.length; ++i) {
    linkHints[i].style.background = currentBackground;
    linkHints[i].style.color = currentColor;
    linkHints[i].style.borderColor = currentBorderColor;
  }
};

Hints.handleHintFeedback = function(choice) {
  var linksFound = 0;
  var index;
  for (var i = 0; i < this.permutations.length; i++) {
    if (this.currentString === this.permutations[i].substring(0, this.currentString.length)) {
      if (this.linkArr[i].children.length) {
        this.linkArr[i].replaceChild(this.linkArr[i].firstChild.firstChild, this.linkArr[i].firstChild);
        this.linkArr[i].normalize();
      }
      var span = document.createElement("span");
      span.cVim = true;
      span.className = "link_hint_match";
      var matched_chars = this.linkArr[i].firstChild.splitText(this.currentString.length);
      span.appendChild(this.linkArr[i].firstChild.cloneNode(true));
      this.linkArr[i].replaceChild(span, this.linkArr[i].firstChild);
      index = i;
      linksFound++;
    } else {
      if (this.linkArr[i].parentNode) {
        this.linkArr[i].style.opacity = "0";
      }
    }
  }
  if (linksFound === 1) {
    document.getElementById("link_main").style.display = "none";
    var link = this.linkHints[index];
    setTimeout(function() {
      if (linkHoverEnabled && shiftKey) {
        var e;
        if (this.tabbed) {
          e = new Event("mouseover");
          link.dispatchEvent(e);
        } else {
          e = new Event("mouseout");
        }
        link.dispatchEvent(e);
        return this.hideHints(false);
      }
      var node = link.nodeName;
      if (this.yank) {
        Clipboard.copy(link.href);
      } else if (this.image) {
        chrome.runtime.sendMessage({action: "openLinkTab", active: false, url: "https://www.google.com/searchbyimage?image_url=" + link.src, noconvert: true});
      } else if (this.visual) {
        if (link.firstChild && link.firstChild.nodeType === 3) {
          Visual.getTextNodes(function() {
            var i = Visual.textNodes.indexOf(link.firstChild);
            if (i >= 0) {
              Mappings.actions.toggleVisualMode();
              Visual.selectNode(i);
              HUD.display(" -- VISUAL -- ");
            }
          });
        }
      } else if (node === "BUTTON" || link.getAttribute("jsaction")) {
        link.click();
      } else if (/^(button|checkbox)$/.test(link.getAttribute("role"))) {
        var ev;
        switch (link.getAttribute("aria-expanded")) {
          case "false":
            ev = new MouseEvent("mouseover");
            link.dispatchEvent(ev);
            if (link.getAttribute("aria-expanded") === "false") {
              ev = new MouseEvent("mousedown");
              link.dispatchEvent(ev);
            }
            break;
          case "true":
            ev = new MouseEvent("mouseover");
            link.dispatchEvent(ev);
            if (link.getAttribute("aria-expanded") === "false") break;
            ev = new MouseEvent("mousedown");
            link.dispatchEvent(ev);
            break;
          default:
            link.click();
            break;
        }
      } else if (node === "SELECT") {
        var ev = new MouseEvent("mousedown");
        link.dispatchEvent(ev);
      } else if (node === "TEXTAREA") {
        setTimeout(function() {
          link.focus();
        }.bind(this), 0);
      } else if (node === "INPUT") {
        switch (link.type) {
          case "text": case "password": case "email": case "search":
            setTimeout(function() {
              link.focus();
            }.bind(this), 0);
            break;
          case "radio": case "submit":
            link.click();
            break;
          case "checkbox":
            link.checked = !link.checked;
            break;
          default:
            link.click();
            break;
        }
      } else if (!this.tabbed || link.getAttribute("onclick")) {
        link.click();
      } else {
        chrome.runtime.sendMessage({action: "openLinkTab", active: false, url: link.href, noconvert: true});
      }
    }.bind(this), 0);
  }
  if (linksFound < 2) {
    this.hideHints(false);
  }

};


Hints.handleHint = function(key) {
  if (this.hintCharacters.split("").indexOf(key.toLowerCase()) > -1) {
    this.currentString += key.toLowerCase();
    this.handleHintFeedback(this.currentString);
  } else {
    this.hideHints(false);
  }
};

Hints.getLinks = function(type) {
  var candidates, selection, item;
  var valid = [],
      isRedditUrl = /\.reddit\.com/.test(window.location.origin);

  switch (type) {
    case "yank":
      selection = "//a|//area[@href]";
      break;
    case "image":
      selection = "//img";
      break;
    case "visual":
      selection = "//a|//area[@href]";
      break;
    default:
      selection = "//a|//area[@href]|//*[not(@aria-disabled='true') and (@onclick or @role='button' or @role='checkbox' or @tabindex or @aria-haspopup or @data-cmd or @jsaction)]|//button|//select|//textarea|//input";
      break;
  }
  candidates = document.evaluate(selection, document.body, null, 6, null);
  for (var i = 0, l = candidates.snapshotLength; i < l; i++) {
    item = candidates.snapshotItem(i);
    var computedStyle = getComputedStyle(item, null);
    if (isRedditUrl && (/click_thing/.test(item.getAttribute("onclick")) || (document.body.classList.contains("listing-chooser-collapsed") && item.offsetParent && (item.offsetParent.classList.contains("listing-chooser") || item.offsetParent.offsetParent && item.offsetParent.offsetParent.classList.contains("listing-chooser"))))) continue;
    if (!item.hasOwnProperty("cVim")) {
      valid.push(item);
    }

  }
  return valid;
};

Hints.create = function(tabbed, yank, image, visual) {
  var screen, links, linkNumber, main, frag, linkElement, isAreaNode, mapCoordinates, computedStyle, imgParent;
  HUD.display("Follow link " + (function() {
    if (yank)   return "(yank)";
    if (image)  return "(reverse image)";
    if (visual) return "(visual select)";
    if (tabbed) return "(tabbed)";
    return "";
  })());
  this.hideHints(true);
  links = this.getLinks(yank ? "yank" : (image ? "image" : (visual ? "visual" : undefined)));
  if (links.length === 0) return this.hideHints(false);
  this.yank = yank;
  this.image = image;
  this.tabbed = tabbed;
  this.visual = visual;
  screen = {
    top: document.body.scrollTop,
    bottom: document.body.scrollTop + window.innerHeight,
    left: document.body.scrollLeft,
    right: document.body.scrollLeft + window.innerWidth
  };
  linkNumber = 0;
  main = document.createElement("div");
  main.style.opacity = "0";
  main.cVim = true;
  frag = document.createDocumentFragment();

  main.id = "link_main";
  main.top = document.body.scrollTop + "px";
  main.left = document.body.scrollLeft + "px";

  try {
    document.lastChild.appendChild(main);
  } catch(e) {
    document.body.appendChild(main);
  }

  links.forEach(function(l) {
    isAreaNode = false;
    if (l.nodeName === "AREA" && l.parentNode && l.parentNode.nodeName === "MAP") {
      imgParent = document.querySelectorAll("img[usemap='#" + l.parentNode.name + "'");
      if (!imgParent.length) return false;
      linkLocation = imgParent[0].getBoundingClientRect();
      isAreaNode = true;
      computedStyle = getComputedStyle(imgParent[0], null);
    } else {
      linkLocation = l.getBoundingClientRect();
      computedStyle = getComputedStyle(l, null);
      if (linkLocation.width === 0) {
        if (!l.firstElementChild) return false;
        linkLocation = l.firstElementChild.getBoundingClientRect();
        if (linkLocation.width === 0) return false;
      }
    }
    if (computedStyle.opacity !== "0" && computedStyle.visibility === "visible" && computedStyle.display !== "none" && linkLocation.top + linkLocation.height >= 0 && linkLocation.top + 15 <= window.innerHeight && linkLocation.left >= 0 && linkLocation.left + 10 < window.innerWidth && linkLocation.width > 0) {
      this.linkHints.push(l);
      linkElement = document.createElement("div");
      linkElement.cVim = true;
      linkElement.className = "link_hint";
      linkElement.style.zIndex = i;
      if (isAreaNode) {
        if (!/,/.test(l.getAttribute("coords"))) return false;
        mapCoordinates = l.coords.split(",");
        if (mapCoordinates.length < 2) return false;
        linkElement.style.top = linkLocation.top + screen.top + parseInt(mapCoordinates[1]) + "px";
        linkElement.style.left = linkLocation.left + screen.left + parseInt(mapCoordinates[0]) + "px";
      } else {
        if (linkLocation.top < 0) {
          linkElement.style.top = screen.top + "px";
        } else {
          linkElement.style.top = linkLocation.top + screen.top + "px";
        }
        if (linkLocation.left < 0) {
          linkElement.style.left = screen.left + "px";
        } else {
          if (l.offsetLeft > linkLocation.left) {
            linkElement.style.left = l.offsetLeft + "px";
          } else {
            linkElement.style.left = linkLocation.left + screen.left + "px";
          }
        }
      }
      this.linkArr.push(linkElement);
    }
  }.bind(this));

  if (this.linkArr.length === 0) return this.hideHints(false);

  var lim = Math.ceil(Math.log(this.linkArr.length) / Math.log(this.hintCharacters.length));
  var rlim = Math.floor((Math.pow(this.hintCharacters.length, lim) - this.linkArr.length) / this.hintCharacters.length);
  if (lim === 0) lim = 1;

  function genHint(n, x) { // All credit goes to Vimium for this great way of generating link hints
    var l, len, r;
    l = [];
    len = Hints.hintCharacters.length;
    for (var i = 0; i < x; i++) {
      r = n % len;
      l.unshift(Hints.hintCharacters[r]);
      n -= r;
      n /= Math.floor(len);
      if (n < 0) break;
    }
    return l.join("");
  }
  for (var i = 0; i < rlim; ++i) {
    this.linkArr[i].innerText = genHint(i, lim - 1);
    this.permutations.push(genHint(i, lim - 1));
  }
  for (var i = rlim * this.hintCharacters.length, e = i + this.linkArr.length - rlim; i < e; ++i) {
    this.permutations.push(genHint(i, lim));
  }
  for (var i = this.linkArr.length - 1; i >= 0; --i) {
    this.linkArr[i].innerText = this.permutations[i];
    frag.appendChild(this.linkArr[i]);
  }
  main.appendChild(frag);
  main.style.opacity = "1";
  if (linkHoverEnabled && tabbed) {
    window.setTimeout(function() {
      if (shiftKey)
        Hints.invertColors(true);
    }, 250);
  }
};
