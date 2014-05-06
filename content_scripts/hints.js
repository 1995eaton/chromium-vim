var log = console.log.bind(console);
var Hints = {};

var linkHoverEnabled = false;

Hints.hideHints = function(reset) {
  if (document.getElementById("cVim-link-container") !== null) {
    HUD.hide();
    main = document.getElementById("cVim-link-container");
    if (settings.linkanimations) {
      main.addEventListener("transitionend", function() {
        var m = document.getElementById("cVim-link-container");
        if (m !== null) m.parentNode.removeChild(m);
      });
      main.style.opacity = "0";
    } else document.getElementById("cVim-link-container").parentNode.removeChild(document.getElementById("cVim-link-container"));
  }
  this.active = reset;
  this.currentString = "";
  this.linkArr = [];
  this.linkHints = [];
  this.permutations = [];
};

Hints.changeFocus = function() {
  this.linkArr.forEach(function(item) { item.style.zIndex = 1 - parseInt(item.style.zIndex); });
};

Hints.invertColors = function(invert) {
  var gradient = ["#969696", "#d7d7d7"];
  var border = "rgba(0,0,0,0.5)";
  var linkHints = document.getElementsByClassName("cVim-link-hint");
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

Hints.handleHintFeedback = function() {
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
      span.className = "cVim-link-hint_match";
      this.linkArr[i].firstChild.splitText(this.currentString.length);
      span.appendChild(this.linkArr[i].firstChild.cloneNode(true));
      this.linkArr[i].replaceChild(span, this.linkArr[i].firstChild);
      index = i.toString();
      linksFound++;
    } else {
      if (this.linkArr[i].parentNode) {
        this.linkArr[i].style.opacity = "0";
      }
    }
  }
  if (linksFound === 1) {
    var link = this.linkHints[index];
    setTimeout(function() {
      var ev, main;
      if (this.type === "multi") {
        chrome.runtime.sendMessage({action: "openLinkTab", active: false, url: link.href, noconvert: true});
        main = document.getElementById("cVim-link-container");
        if (main !== null) main.parentNode.removeChild(main);
        return this.create("multi");
      }
      var node = link.nodeName;
      if (this.type === "yank") {
        Clipboard.copy(link.href);
      } else if (this.type === "image") {
        chrome.runtime.sendMessage({action: "openLinkTab", active: false, url: "https://www.google.com/searchbyimage?image_url=" + link.src, noconvert: true});
      } else if (node === "BUTTON" || link.getAttribute("jsaction")) {
        link.click();
      } else if (/^(button|checkbox)$/.test(link.getAttribute("role"))) {
        link.focus();
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
        ev = new MouseEvent("mousedown");
        link.dispatchEvent(ev);
      } else if (node === "TEXTAREA") {
        setTimeout(function() {
          link.focus();
        }.bind(this), 0);
      } else if (node === "INPUT") {
        switch (link.type) {
          case "text":
          case "password":
          case "email":
          case "search":
            setTimeout(function() {
              link.focus();
            }.bind(this), 0);
            break;
          case "radio":
          case "submit":
            link.click();
            break;
          case "checkbox":
            link.checked = !link.checked;
            break;
          default:
            link.click();
            break;
        }
      } else if (this.type === "window") {
        chrome.runtime.sendMessage({action: "openLinkWindow", focused: false, url: link.href, noconvert: true});
      } else if (this.type !== "tabbed" && link.getAttribute("onclick") !== null) {
        link.click();
      } else if (this.type === "tabbed") {
        chrome.runtime.sendMessage({action: "openLinkTab", active: false, url: link.href, noconvert: true});
      } else {
        main = document.getElementById("cVim-link-container");
        if (main !== null) main.parentNode.removeChild(main);
        link.click();
      }
    }.bind(this), 0);
  }
  if (linksFound < 2) {
    this.hideHints(false);
  }

};


Hints.handleHint = function(key) {
  if (settings.hintcharacters.split("").indexOf(key.toLowerCase()) > -1) {
    this.currentString += key.toLowerCase();
    this.handleHintFeedback(this.currentString);
  } else {
    this.hideHints(false);
  }
};

Hints.getLinks = function() {
  var candidates, selection, item;
  var valid = [],
      isRedditUrl = /\.reddit\.com/.test(window.location.origin);

  switch (this.type) {
    case "yank":
      selection = "//a|//area[@href]";
      break;
    case "image":
      selection = "//img";
      break;
    default:
      selection = "//a|//area[@href]|//*[not(@aria-disabled='true') and (@onclick or @role='button' or @role='checkbox' or @tabindex or @aria-haspopup or @data-cmd or @jsaction)]|//button|//select|//textarea|//input";
      break;
  }
  candidates = document.evaluate(selection, document.body, null, 6, null);
  for (var i = 0, l = candidates.snapshotLength; i < l; i++) {
    item = candidates.snapshotItem(i);
    if (isRedditUrl && (/click_thing/.test(item.getAttribute("onclick")) || (document.body.classList.contains("listing-chooser-collapsed") && item.offsetParent && (item.offsetParent.classList.contains("listing-chooser") || item.offsetParent.offsetParent && item.offsetParent.offsetParent.classList.contains("listing-chooser"))))) continue;
    if (!item.hasOwnProperty("cVim")) {
      valid.push(item);
    }

  }
  return valid;
};

Hints.create = function(type) {
  var screen, links, linkNumber, main, frag, linkElement, isAreaNode, mapCoordinates, computedStyle, imgParent, c, i;
  this.type = type;
  links = this.getLinks();
  if (links.length === 0) {
    return false;
  }
  this.hideHints(true);
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
      this.linkArr.push(linkElement);
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

  HUD.display("Follow link " + (function() {
    switch (type) {
      case "yank":
        Hints.yank = true;
        return "(yank)";
      case "image":
        Hints.image = true;
        return "(reverse image)";
      case "tabbed":
        Hints.tabbed = true;
        return "(tabbed)";
      case "window":
        Hints.windowOpen = true;
        return "(window)";
      case "multi":
        Hints.multiHint = true;
        return "(multi)";
      default:
        return "";
    }
  })());

  var lim = Math.ceil(Math.log(this.linkArr.length) / Math.log(settings.hintcharacters.length));
  var rlim = Math.floor((Math.pow(settings.hintcharacters.length, lim) - this.linkArr.length) / settings.hintcharacters.length);
  if (lim === 0) lim = 1;

  function genHint(n, x) { // All credit goes to Vimium for this great way of generating link hints
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
  }
  for (i = 0; i < rlim; ++i) {
    this.linkArr[i].innerText = genHint(i, lim - 1);
    this.permutations.push(genHint(i, lim - 1));
  }
  for (i = rlim * settings.hintcharacters.length, e = i + this.linkArr.length - rlim; i < e; ++i) {
    this.permutations.push(genHint(i, lim));
  }
  for (i = this.linkArr.length - 1; i >= 0; --i) {
    this.linkArr[i].innerText = this.permutations[i];
    frag.appendChild(this.linkArr[i]);
  }
  main.appendChild(frag);
  main.style.opacity = "1";
};
