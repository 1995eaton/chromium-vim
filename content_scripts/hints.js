var Hints = {};

Hints.matchPatterns = function(forward) {
  var pattern = new RegExp("^" + (forward ? settings.nextmatchpattern : settings.previousmatchpattern) + "$", "gi");
  var nodeIterator = document.createNodeIterator(document.body, 4, null, false);
  var node;
  while (node = nodeIterator.nextNode()) {
    var localName = node.localName;
    if (/script|style|noscript/.test(localName)) {
      continue;
    }
    var nodeText = node.data.trim();
    if (pattern.test(nodeText)) {
      var parentNode = node.parentNode;
      if (/a|button/.test(parentNode.localName) || parentNode.getAttribute("jsaction") || parentNode.getAttribute("onclick")) {
        var computedStyle = getComputedStyle(parentNode);
        if (computedStyle.opacity !== "0" && computedStyle.visibility === "visible" && computedStyle.display !== "none") {
          node.parentNode.click();
          break;
        }
      }
    }
  }
};

Hints.hideHints = function(reset, multi, useKeyDelay) {
  if (reset && document.getElementById("cVim-link-container") !== null) {
    document.getElementById("cVim-link-container").parentNode.removeChild(document.getElementById("cVim-link-container"));
  } else if (document.getElementById("cVim-link-container") !== null) {
    if (!multi) {
      HUD.hide();
    }
    main = document.getElementById("cVim-link-container");
    if (settings.linkanimations) {
      main.addEventListener("transitionend", function() {
        var m = document.getElementById("cVim-link-container");
        if (m !== null) {
          m.parentNode.removeChild(m);
        }
      });
      main.style.opacity = "0";
    } else {
      document.getElementById("cVim-link-container").parentNode.removeChild(document.getElementById("cVim-link-container"));
    }
  }
  this.linkPreview = false;
  this.numericMatch = void 0;
  this.active = reset;
  this.currentString = "";
  this.linkArr = [];
  this.linkHints = [];
  this.permutations = [];
  if (useKeyDelay && !this.active && settings.numerichints && settings.typelinkhints) {
    Hints.keyDelay = true;
    window.setTimeout(function() {
      Hints.keyDelay = false;
    }, settings.typelinkhintsdelay);
  }
};

Hints.changeFocus = function() {
  this.linkArr.forEach(function(item) { item[0].style.zIndex = 1 - +item[0].style.zIndex; });
};

Hints.removeContainer = function() {
  var hintContainer = document.getElementById("cVim-link-container");
  if (hintContainer !== null) {
    hintContainer.parentNode.removeChild(hintContainer);
  }
};

Hints.dispatchAction = function(link) {
  if (!link) {
    return false;
  }
  this.lastClicked = link;
  var node = link.localName;
  if (settings.numerichints && settings.typelinkhints) {
    Hints.keyDelay = true;
    window.setTimeout(function() {
      Hints.keyDelay = false;
    }, settings.typelinkhintsdelay);
  }
  switch (this.type) {
    case "yank":
    case "multiyank":
      var text = link.href || link.value || link.getAttribute("placeholder");
      if (text && this.type !== "multiyank") {
        Clipboard.copy(text, this.multi);
        Status.setMessage(text, 2);
      }
      break;
    case "image":
    case "multiimage":
      var url = googleReverseImage(link.src, null);
      if (url) {
        chrome.runtime.sendMessage({action: "openLinkTab", active: false, url: url, noconvert: true});
      }
      break;
    case "hover":
      if (Hints.lastHover) {
        Hints.lastHover.unhover();
        if (Hints.lastHover === link) {
          Hints.lastHover = null;
          break;
        }
      }
      link.hover();
      Hints.lastHover = link;
      break;
    case "unhover":
      link.unhover();
      break;
    case "window":
      chrome.runtime.sendMessage({action: "openLinkWindow", focused: false, url: link.href, noconvert: true});
      break;
    default:
      if (node === "textarea" || (node === "input" && /^(text|password|email|search)$/i.test(link.type)) ||
          link.getAttribute("contenteditable") === "true") {
        setTimeout(function() {
          link.focus();
          if (link.getAttribute("readonly")) {
            link.select();
          }
        }.bind(this), 0);
        break;
      }
      if (node === "input" || /button|select/i.test(node) || /^(button|checkbox|menu)$/.test(link.getAttribute("role")) ||
          link.getAttribute("jsaction") || link.getAttribute("onclick") || link.getAttribute("role") === "checkbox") {
        window.setTimeout(function() {
          link.simulateClick();
        }, 0);
        break;
      }
      if (link.getAttribute("target") !== "_top" && (/tabbed/.test(this.type) || this.type === "multi")) {
        chrome.runtime.sendMessage({action: "openLinkTab", active: this.type === "tabbedActive", url: link.href, noconvert: true});
      } else {
        if (link.getAttribute("href")) {
          link.click();
        } else {
          link.simulateClick();
        }
      }
      break;
  }
  if (this.multi) {
    this.removeContainer();
    window.setTimeout(function() {
      if (!document.activeElement.isInput()) {
        this.create(this.type, true);
      }
    }.bind(this), 0);
  } else {
    this.hideHints(false, false, true);
  }
};

Hints.handleHintFeedback = function() {
  var linksFound = 0,
      index,
      i,
      span;
  if (!settings.numerichints) {
    for (i = 0; i < this.permutations.length; i++) {
      if (this.permutations[i].indexOf(this.currentString) === 0) {
        if (this.linkArr[i][0].children.length) {
          this.linkArr[i][0].replaceChild(this.linkArr[i][0].firstChild.firstChild, this.linkArr[i][0].firstChild);
          this.linkArr[i][0].normalize();
        }
        span = document.createElement("span");
        span.setAttribute("cVim", true);
        span.className = "cVim-link-hint_match";
        this.linkArr[i][0].firstChild.splitText(this.currentString.length);
        span.appendChild(this.linkArr[i][0].firstChild.cloneNode(true));
        this.linkArr[i][0].replaceChild(span, this.linkArr[i][0].firstChild);
        index = i.toString();
        linksFound++;
      } else if (this.linkArr[i][0].parentNode) {
        this.linkArr[i][0].style.opacity = "0";
      }
    }
  } else {
    var containsNumber, validMatch, stringNum, string;
    Hints.numericMatch = null;
    this.currentString = this.currentString.toLowerCase();
    string = this.currentString;
    containsNumber = /\d+$/.test(string);
    if (containsNumber) {
      stringNum = this.currentString.match(/[0-9]+$/)[0];
    }
    if ((!string) || (!settings.typelinkhints && /\D/.test(string.slice(-1)))) {
      return this.hideHints(false);
    }
    for (i = 0, l = this.linkArr.length; i < l; ++i) {

      if (this.linkArr[i][0].style.opacity === "0") {
        continue;
      }
      validMatch = false;

      if (settings.typelinkhints) {
        if (containsNumber && this.linkArr[i][0].textContent.indexOf(stringNum) === 0) {
          validMatch = true;
        } else if (!containsNumber && this.linkArr[i][2].toLowerCase().indexOf(string.replace(/.*\d/g, "")) !== -1) {
          validMatch = true;
        }
      } else if (this.linkArr[i][0].textContent.indexOf(string) === 0) {
        validMatch = true;
      }

      if (validMatch) {
        if (this.linkArr[i][0].children.length) {
          this.linkArr[i][0].replaceChild(this.linkArr[i][0].firstChild.firstChild, this.linkArr[i][0].firstChild);
          this.linkArr[i][0].normalize();
        }
        if (settings.typelinkhints && !containsNumber) {
          var c = 0;
          for (var j = 0; j < this.linkArr.length; ++j) {
            if (this.linkArr[j][0].style.opacity !== "0") {
              this.linkArr[j][0].textContent = (c + 1).toString() + (this.linkArr[j][3] ? ": " + this.linkArr[j][3] : "");
              c++;
            }
          }
        }
        if (!Hints.numericMatch || this.linkArr[i][0].textContent === string) {
          Hints.numericMatch = this.linkArr[i][1];
        }
        if (containsNumber) {
          span = document.createElement("span");
          span.setAttribute("cVim", true);
          span.className = "cVim-link-hint_match";
          this.linkArr[i][0].firstChild.splitText(stringNum.length);
          span.appendChild(this.linkArr[i][0].firstChild.cloneNode(true));
          this.linkArr[i][0].replaceChild(span, this.linkArr[i][0].firstChild);
        }
        index = i.toString();
        linksFound++;
      } else if (this.linkArr[i][0].parentNode) {
        this.linkArr[i][0].style.opacity = "0";
      }
    }
  }

  if (linksFound === 0) {
    this.hideHints(false, false, true);
  }
  if (linksFound === 1) {
    this.dispatchAction(this.linkArr[index][1]);
    this.hideHints(false);
  }

};


Hints.handleHint = function(key) {
  if (this.linkPreview) {
    this.dispatchAction(this.linkArr[this.currentIndex][1]);
  }
  if (settings.numerichints || settings.hintcharacters.split("").indexOf(key.toLowerCase()) !== -1) {
    this.currentString += key.toLowerCase();
    this.handleHintFeedback(this.currentString);
  } else {
    this.hideHints(false, false, true);
  }
};

Hints.evaluateLink = function(link, linkIndex) {
  var isAreaNode = false,
      imgParent, linkElement, linkStyle, mapCoordinates;
  if (link.localName === "area" && link.parentNode && link.parentNode.localName === "map") {
    imgParent = document.querySelector("img[usemap='#" + link.parentNode.name + "'");
    if (!imgParent) {
      return;
    }
    linkLocation = getVisibleBoundingRect(imgParent);
    isAreaNode = true;
  } else {
    linkLocation = getVisibleBoundingRect(link);
  }
  if (!linkLocation) {
    return;
  }
  linkElement = this.linkElementBase.cloneNode(false);
  linkStyle = linkElement.style;
  linkStyle.zIndex = linkIndex;
  if (isAreaNode) {
    mapCoordinates = link.getAttribute("coords").split(",");
    if (mapCoordinates.length < 2) {
      return;
    }
    linkStyle.top = linkLocation.top * this.documentZoom + document.body.scrollTop + parseInt(mapCoordinates[1]) + "px";
    linkStyle.left = linkLocation.left * this.documentZoom + document.body.scrollLeft + parseInt(mapCoordinates[0]) + "px";
  } else {
    if (linkLocation.top < 0) {
      linkStyle.top = document.body.scrollTop+ "px";
    } else {
      linkStyle.top = linkLocation.top * this.documentZoom + document.body.scrollTop + "px";
    }
    if (linkLocation.left < 0) {
      linkStyle.left = document.body.scrollLeft + "px";
    } else {
      if (l.offsetLeft > linkLocation.left) {
        linkStyle.left = link.offsetLeft * this.documentZoom + "px";
      } else {
        linkStyle.left = linkLocation.left * this.documentZoom + document.body.scrollLeft + "px";
      }
    }
  }
  if (settings && settings.numerichints) {
    if (!settings.typelinkhints) {
      this.linkArr.push([linkLocation.bottom * linkLocation.left, linkElement, link]);
    } else {
      var textValue = "";
      var alt = "";
      if (link.firstElementChild && link.firstElementChild.alt) {
        textValue = link.firstElementChild.alt;
        alt = textValue;
      } else {
        textValue = link.textContent || link.value || link.alt || "";
      }
      this.linkArr.push([linkLocation.left + linkLocation.top, linkElement, link, textValue, alt]);
    }
  } else {
    this.linkArr.push([linkElement, link]);
  }
};

Hints.siteFilters = {
  "reddit.com": function(node) {
    if (node.localName === "a" && !node.getAttribute("href")) {
      return false;
    }
    if (node.getAttribute("onclick") && node.getAttribute("onclick").indexOf("click_thing") === 0) {
      return false;
    }
    return true;
  }
};

Hints.getLinks = function() {
  var node, nodeIterator, name, role, applicableFiltersLength, filterCatch,
      i = 0,
      applicableFilters = [];

  nodeIterator = document.createNodeIterator(document.body, 1, {
    acceptNode: function(node) {
      name = node.localName.toLowerCase();
      if (Hints.type) {
        if (Hints.type.indexOf("yank") !== -1) {
          return name === "a" || name === "textarea" || name === "input";
        } else if (Hints.type.indexOf("image") !== -1) {
          return name === "img";
        }
      }
      if (name === "a" || name === "button" || name === "select" || name === "textarea" || name === "input" || name === "area") {
        return NodeFilter.FILTER_ACCEPT;
      }
      if (node.getAttribute("onclick") || node.getAttribute("tabindex") || node.getAttribute("aria-haspopup") || node.getAttribute("data-cmd") || node.getAttribute("jsaction")) {
        return NodeFilter.FILTER_ACCEPT;
      }
      if (role = node.getAttribute("role")) {
        if (role === "button" || role === "checkbox" || role.indexOf("menu") === 0) {
          return NodeFilter.FILTER_ACCEPT;
        }
      }
      return NodeFilter.FILTER_REJECT;
    }
  });

  for (var key in this.siteFilters) {
    if (window.location.origin.indexOf(key) !== -1) {
      applicableFilters.push(this.siteFilters[key]);
    }
  }
  applicableFiltersLength = applicableFilters.length;

  while (node = nodeIterator.nextNode()) {
    filterCatch = false;
    for (var j = 0; j < applicableFiltersLength; j++) {
      if (!applicableFilters[j](node)) {
        filterCatch = true;
        break;
      }
    }
    if (!filterCatch) {
      this.evaluateLink(node, i++);
    }
  }
};

Hints.generateHintString = function(n, x) {
  var len = settings.hintcharacters.length,
      l = [],
      r;
  for (var i = 0; n >= 0 && i < x; i++) {
    r = n % len;
    l.push(settings.hintcharacters[r]);
    n -= r;
    n /= Math.floor(len);
  }
  return l.reverse().join("");
};

Hints.create = function(type, multi) {
  if (!Command.domElementsLoaded) {
    return false;
  }
  var links, main, frag, i, l;
  this.type = type;
  this.hideHints(true, multi);
  if (document.body && document.body.style) {
    Hints.documentZoom = +document.body.style.zoom || 1;
  } else {
    Hints.documentZoom = 1;
  }
  Hints.linkElementBase = document.createElement("div");
  Hints.linkElementBase.cVim = true;
  Hints.linkElementBase.className = "cVim-link-hint";
  links = this.getLinks();
  if (type && type.indexOf("multi") !== -1) {
    this.multi = true;
  } else {
    this.multi = false;
  }
  if (this.linkArr.length === 0) {
    return this.hideHints();
  }

  main = document.createElement("div");
  if (settings && settings.linkanimations) {
    main.style.opacity = "0";
  }
  main.cVim = true;
  frag = document.createDocumentFragment();

  main.id = "cVim-link-container";
  main.top = document.body.scrollTop + "px";
  main.left = document.body.scrollLeft + "px";

  try {
    document.lastChild.appendChild(main);
  } catch(e) {
    document.body.appendChild(main);
  }

  if (!multi && settings && settings.hud) {
    HUD.display("Follow link " + (function() {
      switch (type) {
        case "yank":
          return "(yank)";
        case "multiyank":
          return "(multi-yank)";
        case "image":
          return "(reverse image)";
        case "tabbed":
        case "tabbedActive":
          return "(tabbed)";
        case "window":
          return "(window)";
        case "hover":
          return "(hover)";
        case "unhover":
          return "(unhover)";
        case "multi":
          return "(multi)";
        default:
          return "";
      }
    })());
  }

  if (!settings.numerichints) {
    var lim = Math.ceil(Math.log(this.linkArr.length) / Math.log(settings.hintcharacters.length)) || 1;
    var rlim = Math.floor((Math.pow(settings.hintcharacters.length, lim) - this.linkArr.length) / settings.hintcharacters.length);

    for (i = 0; i < rlim; ++i) {
      this.linkArr[i][0].textContent = this.generateHintString(i, lim - 1);
      this.permutations.push(this.generateHintString(i, lim - 1));
    }

    for (i = rlim * settings.hintcharacters.length, e = i + this.linkArr.length - rlim; i < e; ++i) {
      this.permutations.push(this.generateHintString(i, lim));
    }

    for (i = this.linkArr.length - 1; i >= 0; --i) {
      this.linkArr[i][0].textContent = this.permutations[i];
      frag.appendChild(this.linkArr[i][0]);
    }
  } else {
    this.linkArr = this.linkArr.sort(function(a, b) {
      return a[0] - b[0];
    }).map(function(e) {
      return e.slice(1);
    });
    for (i = 0, l = this.linkArr.length; i < l; ++i) {
      this.linkArr[i][0].textContent = (i + 1).toString() + (this.linkArr[i][3] ? ": " + this.linkArr[i][3] : "");
      frag.appendChild(this.linkArr[i][0]);
    }
  }

  main.appendChild(frag);
  main.style.opacity = "1";
};
