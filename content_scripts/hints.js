var log;
log = console.log.bind(console);
var Hints = {};

Hints.matchPatterns = function(forward) {
  var pattern = new RegExp("^" + (forward ? settings.nextmatchpattern : settings.previousmatchpattern) + "$", "gi");
  var treeWalker = document.createTreeWalker(document.body, 4, null, false);
  var node;
  while (node = treeWalker.nextNode()) {
    var nodeName = node.nodeName;
    if (/script|style|noscript/i.test(nodeName)) {
      continue;
    }
    var nodeText = node.data.trim();
    if (pattern.test(nodeText)) {
      var parentNode = node.parentNode;
      if (/A|BUTTON/.test(parentNode.nodeName) || parentNode.getAttribute("jsaction") || parentNode.getAttribute("onclick")) {
        var computedStyle = getComputedStyle(parentNode);
        if (computedStyle.opacity !== "0" && computedStyle.visibility === "visible" && computedStyle.display !== "none") {
          node.parentNode.click();
          break;
        }
      }
    }
  }
};

Hints.hideHints = function(reset, multi) {
  if (document.getElementById("cVim-link-container") !== null) {
    if (!multi) {
      HUD.hide();
    }
    main = document.getElementById("cVim-link-container");
    if (settings.linkanimations) {
      main.addEventListener("transitionend", function() {
        var m = document.getElementById("cVim-link-container");
        if (m !== null) m.parentNode.removeChild(m);
      });
      main.style.opacity = "0";
    } else document.getElementById("cVim-link-container").parentNode.removeChild(document.getElementById("cVim-link-container"));
  }
  this.numericMatch = undefined;
  this.active = reset;
  this.currentString = "";
  this.linkArr = [];
  this.linkHints = [];
  this.permutations = [];
  if (!this.active && settings.numerichints && settings.typelinkhints) {
    Hints.keyDelay = true;
    window.setTimeout(function() {
      Hints.keyDelay = false;
    }, settings.typelinkhintsdelay);
  }
};

Hints.changeFocus = function() {
  if (settings.numerichints) {
    this.linkArr.forEach(function(item) { item[0].style.zIndex = 1 - parseInt(item[0].style.zIndex); });
  } else {
    this.linkArr.forEach(function(item) { item.style.zIndex = 1 - parseInt(item.style.zIndex); });
  }
};

Hints.removeContainer = function() {
  var hintContainer = document.getElementById("cVim-link-container");
  if (hintContainer !== null) {
    hintContainer.parentNode.removeChild(hintContainer);
  }
};

Hints.dispatchAction = function(link) {
  var node = link.nodeName;
  if (settings.numerichints && settings.typelinkhints) {
    Hints.keyDelay = true;
    window.setTimeout(function() {
      Hints.keyDelay = false;
    }, settings.typelinkhintsdelay);
  }
  switch (this.type) {
    case "multi":
      chrome.runtime.sendMessage({action: "openLinkTab", active: false, url: link.href, noconvert: true});
      break;
    case "yank":
    case "multiyank":
      Clipboard.copy(link.href, this.multi);
      break;
    case "image":
    case "multiimage":
      chrome.runtime.sendMessage({action: "openLinkTab", active: false, url: "https://www.google.com/searchbyimage?image_url=" + link.src, noconvert: true});
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
      if (node === "TEXTAREA" || (node === "INPUT" && /^(text|password|email|search)$/i.test(link.type))) {
        setTimeout(function() {
          link.focus();
          if (link.getAttribute("readonly")) {
            link.select();
          }
        }.bind(this), 0);
        break;
      }
      if (node === "INPUT" || /button|select/i.test(node) || /^(button|checkbox)$/.test(link.getAttribute("role")) || link.getAttribute("jsaction") || link.getAttribute("onclick")) {
        window.setTimeout(function() {
          link.simulateClick();
        }, 0);
        break;
      }
      if (this.type === "tabbed") {
        chrome.runtime.sendMessage({action: "openLinkTab", active: false, url: link.href, noconvert: true});
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
    this.create(this.type, true);
  } else {
    this.hideHints(false);
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
        if (this.linkArr[i].children.length) {
          this.linkArr[i].replaceChild(this.linkArr[i].firstChild.firstChild, this.linkArr[i].firstChild);
          this.linkArr[i].normalize();
        }
        span = document.createElement("span");
        span.setAttribute("cVim", true);
        span.className = "cVim-link-hint_match";
        this.linkArr[i].firstChild.splitText(this.currentString.length);
        span.appendChild(this.linkArr[i].firstChild.cloneNode(true));
        this.linkArr[i].replaceChild(span, this.linkArr[i].firstChild);
        index = i.toString();
        linksFound++;
      } else if (this.linkArr[i].parentNode) {
        this.linkArr[i].style.opacity = "0";
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
        if (containsNumber && this.linkArr[i][0].innerText.indexOf(stringNum) === 0) {
          validMatch = true;
        } else if (!containsNumber && this.linkArr[i][2].toLowerCase().indexOf(string.replace(/.*\d/g, "")) !== -1) {
          validMatch = true;
        }
      } else if (this.linkArr[i][0].innerText.indexOf(string) === 0) {
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
              this.linkArr[j][0].innerText = c + 1;
              c++;
            }
          }
        }
        if (!Hints.numericMatch || this.linkArr[i][0].innerText === string) {
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
    this.hideHints(false);
  }
  if (linksFound === 1) {
    if (settings.numerichints) {
      this.dispatchAction(this.linkArr[index][1]);
    } else {
      this.dispatchAction(this.linkHints[index]);
    }
  }

};


Hints.handleHint = function(key) {
  if (settings.numerichints || settings.hintcharacters.split("").indexOf(key.toLowerCase()) !== -1) {
    this.currentString += key.toLowerCase();
    this.handleHintFeedback(this.currentString);
  } else {
    this.hideHints(false);
  }
};

Hints.getLinks = function() {
  var candidates, selection, item;
  var validLinks = [],
      isRedditUrl = /\.reddit\.com/.test(window.location.origin);

  switch (this.type) {
    case "yank":
    case "multiyank":
      selection = "//a|//area[@href]";
      break;
    case "image":
    case "multiimage":
      selection = "//img";
      break;
    default:
      selection = "//a|//div[@class='fc-panel']|//area[@href]|//*[not(@aria-disabled='true') and (@onclick or @role='button' or @role='checkbox' or @tabindex or @aria-haspopup or @data-cmd or @jsaction)]|//button|//select|//textarea|//input";
      break;
  }
  candidates = document.evaluate(selection, document.body, null, 6, null);
  for (var i = 0, l = candidates.snapshotLength; i < l; i++) {
    item = candidates.snapshotItem(i);
    if (isRedditUrl && (/click_thing/.test(item.getAttribute("onclick")) || (document.body.classList.contains("listing-chooser-collapsed") && item.offsetParent && (item.offsetParent.classList.contains("listing-chooser") || item.offsetParent.offsetParent && item.offsetParent.offsetParent.classList.contains("listing-chooser"))))) continue;
    if (!item.hasOwnProperty("cVim")) {
      validLinks.push(item);
    }

  }
  return validLinks;
};

Hints.generateHintString = function(n, x) {
  var l, len, r;
  l = [];
  len = settings.hintcharacters.length;
  for (var i = 0; i < x; i++) {
    r = n % len;
    l.unshift(settings.hintcharacters[r]);
    n -= r;
    n /= Math.floor(len);
    if (n < 0) break;
  }
  return l.join("");
};

Hints.create = function(type, multi) {
  var screen, links, linkNumber, main, frag, linkElement, isAreaNode, mapCoordinates, computedStyle, imgParent, c, i;
  this.type = type;
  links = this.getLinks();
  if (type && type.indexOf("multi") !== -1) {
    this.multi = true;
  } else {
    this.multi = false;
  }
  if (links.length === 0) {
    return false;
  }
  this.hideHints(true, multi);
  screen = {
    top: document.body.scrollTop,
    bottom: document.body.scrollTop + window.innerHeight,
    left: document.body.scrollLeft,
    right: document.body.scrollLeft + window.innerWidth
  };
  linkNumber = 0;

  c = 0;
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
    if (computedStyle.opacity !== "0" && computedStyle.visibility === "visible" && computedStyle.display !== "none" && linkLocation.top + linkLocation.height >= 10 && linkLocation.top + 15 <= window.innerHeight && linkLocation.left >= 0 && linkLocation.left + 10 < window.innerWidth && linkLocation.width > 0) {
      this.linkHints.push(l);
      linkElement = document.createElement("div");
      linkElement.cVim = true;
      linkElement.className = "cVim-link-hint";
      linkElement.style.zIndex = c;
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
      if (settings.numerichints) {
        if (!settings.typelinkhints) {
          this.linkArr.push([linkLocation.bottom * linkLocation.left, linkElement, l]);
        } else {
          var textValue = "";
          if (l.innerText) {
            textValue = l.innerText;
          } else if (l.value) {
            textValue = l.value;
          }
          this.linkArr.push([linkLocation.bottom * linkLocation.left, linkElement, l, textValue]);
        }
      } else {
        this.linkArr.push(linkElement);
      }
    }
    c += 1;
  }.bind(this));

  if (this.linkArr.length === 0) {
    return this.hideHints();
  }

  main = document.createElement("div");
  if (settings.linkanimations) {
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
  
  if (!multi && settings.hud) {
    HUD.display("Follow link " + (function() {
      switch (type) {
        case "yank":
          Hints.yank = true;
          return "(yank)";
        case "multiyank":
          Hints.multiyank = true;
          return "(multi-yank)";
        case "image":
          Hints.image = true;
          return "(reverse image)";
        case "tabbed":
          Hints.tabbed = true;
          return "(tabbed)";
        case "window":
          Hints.windowOpen = true;
          return "(window)";
        case "hover":
          Hints.hover = true;
          return "(hover)";
        case "unhover":
          Hints.unhover = true;
          return "(unhover)";
        case "multi":
          Hints.multiHint = true;
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
      this.linkArr[i].innerText = this.generateHintString(i, lim - 1);
      this.permutations.push(this.generateHintString(i, lim - 1));
    }

    for (i = rlim * settings.hintcharacters.length, e = i + this.linkArr.length - rlim; i < e; ++i) {
      this.permutations.push(this.generateHintString(i, lim));
    }

    for (i = this.linkArr.length - 1; i >= 0; --i) {
      this.linkArr[i].innerText = this.permutations[i];
      frag.appendChild(this.linkArr[i]);
    }
  } else {
    this.linkArr = this.linkArr.sort(function(a, b) {
      return a[0] - b[0];
    }).map(function(e) {
      return e.slice(1);
    });
    for (i = 0, l = this.linkArr.length; i < l; ++i) {
      this.linkArr[i][0].innerText = (i + 1).toString();
      frag.appendChild(this.linkArr[i][0]);
    }
  }

  main.appendChild(frag);
  main.style.opacity = "1";
};
