var log = console.log.bind(console);
var Hints = {};

var linkHoverEnabled = false;
var gradient = ["#969696", "#d7d7d7"];
var color = "#000";
var border = "rgba(0,0,0,0.5)";

Hints.hintCharacters = "asdfgzxcvbqwert";

Hints.hideHints = function(reset) {
  if (document.getElementById("link_main") !== null) {
    document.getElementById("link_main").style.opacity = "0";
    document.getElementById("link_main").parentNode.removeChild(document.getElementById("link_main"));
  }
  this.active = reset;
  this.currentString = "";
  this.linkArr = [];
  this.linkHints = [];
  this.permutations = [];
};

Hints.changeFocus = function() {
  for (var i = 0, l = this.linkArr.length; i < l; ++i) {
    this.linkArr[i].style.zIndex = l - parseInt(this.linkArr[i].style.zIndex);
  }
};

Hints.invertColors = function(invert) {
  if (invert) {
    var linkHints = document.getElementsByClassName("link_hint");
    for (var i = 0; i < linkHints.length; ++i) {
      linkHints[i].style.background = "linear-gradient(to top, " + gradient[0] + " 50%, " + gradient[1] + " 100%)";
      linkHints[i].style.color = "#333";
      linkHints[i].style.borderColor = border;
    }
  } else {
    var linkHints = document.getElementsByClassName("link_hint");
    for (var i = 0; i < linkHints.length; ++i) {
      linkHints[i].style.background = "linear-gradient(to top, #262626 50%, #474747 100%)";
      linkHints[i].style.color = "#ccc";
      linkHints[i].style.borderColor = "rgba(255,255,255,0.5)";
    }
  }
};

Hints.handleHintFeedback = function(choice) {
  var links_found = 0;
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
      links_found++;
    } else {
      if (this.linkArr[i].parentNode) {
        this.linkArr[i].style.opacity = "0";
      }
    }
  }
  if (links_found === 1) {
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
        chrome.runtime.sendMessage({action: "openLinkTab", active: false, url: "https://www.google.com/searchbyimage?image_url=" + link.src});
      } else if (node === "BUTTON") {
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
        var e = new MouseEvent("mousedown");
        link.dispatchEvent(e);
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
        chrome.runtime.sendMessage({action: "openLinkTab", active: false, url: link.href});
      }
    }.bind(this), 0);
  }
  if (links_found < 2) {
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

Hints.create = function(tabbed, yank, image) {
  this.hideHints(true);
  var links = this.getLinks(yank ? "yank" : (image ? "image" : undefined));
  if (links.length === 0) return this.hideHints(false);
  this.yank = yank;
  this.image = image;
  this.tabbed = tabbed;
  var screen = {
    top: document.body.scrollTop,
    bottom: document.body.scrollTop + window.innerHeight,
    left: document.body.scrollLeft,
    right: document.body.scrollLeft + window.innerWidth
  };
  var link_number = 0;
  var main = document.createElement("div");
  main.cVim = true;
  var frag = document.createDocumentFragment();

  main.id = "link_main";
  main.top = document.body.scrollTop + "px";
  main.left = document.body.scrollLeft + "px";

  try {
    document.lastChild.appendChild(main);
  } catch(e) {
    document.body.appendChild(main);
  }

  for (var i = 0; i < links.length; i++) {
    var isAreaNode = false;
    var computedStyle;
    if (links[i].nodeName === "AREA" && links[i].parentNode && links[i].parentNode.nodeName === "MAP") {
      var img_parent = document.querySelectorAll("img[usemap='#" + links[i].parentNode.name + "'");
      if (!img_parent.length) continue;
      link_location = img_parent[0].getBoundingClientRect();
      isAreaNode = true;
      computedStyle = getComputedStyle(img_parent[0]);
    } else {
      link_location = links[i].getBoundingClientRect();
      computedStyle = getComputedStyle(links[i]);
      if (link_location.width === 0) {
        if (!links[i].firstElementChild) {
          continue;
        } else {
          link_location = links[i].firstElementChild.getBoundingClientRect();
          if (link_location.width === 0) {
            continue;
          }
        }
      }
    }
    if (computedStyle.opacity !== "0" && computedStyle.visibility === "visible" && computedStyle.display !== "none" && link_location.top + link_location.height >= 0 && link_location.top + 15 <= window.innerHeight && link_location.left >= 0 && link_location.left + 10 < window.innerWidth && link_location.width > 0) {
      this.linkHints.push(links[i]);
      var temp = document.createElement("div");
      temp.cVim = true;
      temp.className = "link_hint";
      temp.style.zIndex = i;
      if (isAreaNode) {
        if (!/,/.test(links[i].getAttribute("coords"))) continue;
        var mapCoordinates = links[i].coords.split(",");
        if (mapCoordinates.length < 2) continue;
        temp.style.top = link_location.top + screen.top + parseInt(mapCoordinates[1]) + "px";
        temp.style.left = link_location.left + screen.left + parseInt(mapCoordinates[0]) + "px";
      } else {
        if (link_location.top < 0) {
          temp.style.top = screen.top + "px";
        } else {
          temp.style.top = link_location.top + screen.top + "px";
        }
        if (link_location.left < 0) {
          temp.style.left = screen.left + "px";
        } else {
          if (links[i].offsetLeft > link_location.left) {
            temp.style.left = links[i].offsetLeft + "px";
          } else {
            temp.style.left = link_location.left + screen.left + "px";
          }
        }
      }
      this.linkArr.push(temp);
    }
  }

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
  };
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
  if (linkHoverEnabled && tabbed) {
    window.setTimeout(function() {
      if (shiftKey)
        Hints.invertColors(true);
    }, 250);
  }
};
