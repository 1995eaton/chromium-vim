var log = console.log.bind(console);
var Hints = {};

Hints.hintCharacters = "asdfgzxcvbqwert";

Hints.hideHints = function() {
  document.getElementById("link_main").parentNode.removeChild(document.getElementById("link_main"));
  this.currentString = "";
  this.active = false;
  this.linkArr = [];
};

Hints.handleHintFeedback = function(choice) {
  var links_found = 0;
  var index;

  for (var i = 0; i < this.strings.length; i++) {
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
    this.hideHints();
    setTimeout(function() {
      var node = this.linkHints[index].nodeName;
      if (this.yank) {
        Clipboard.copy(this.linkHints[index].href);
      } else if (this.image) {
        chrome.runtime.sendMessage({action: "openLinkTab", url: "https://www.google.com/searchbyimage?image_url=" + this.linkHints[index].src});
      } else if (node === "BUTTON") {
        this.linkHints[index].click();
      } else if (node === "SELECT") {
        var e = new MouseEvent("mousedown");
        this.linkHints[index].dispatchEvent(e);
      } else if (node === "TEXTAREA") {
        setTimeout(function() {
          this.linkHints[index].focus();
        }.bind(this), 0);
      } else if (node === "INPUT") {
        switch (this.linkHints[index].type) {
          case "text": case "password": case "email": case "search":
            setTimeout(function() {
              this.linkHints[index].focus();
            }.bind(this), 0);
            break;
          case "radio": case "submit":
            this.linkHints[index].click();
            break;
          case "checkbox":
            this.linkHints[index].checked = !this.linkHints[index].checked;
            break;
          default:
            this.linkHints[index].click();
            break;
        }
      } else if (!this.tabbed || this.linkHints[index].getAttribute("onclick")) {
        this.linkHints[index].click();
      } else {
        chrome.runtime.sendMessage({action: "openLinkTab", url: this.linkHints[index].href});
      }
    }.bind(this), 0);
  } else if (links_found === 0) {
    this.hideHints();
  }

};


Hints.handleHint = function(key) {
  if (this.hintCharacters.split("").indexOf(key.toLowerCase()) > -1) {
    this.currentString += key.toLowerCase();
    this.handleHintFeedback(this.currentString);
  } else {
    this.hideHints();
  }
};


Hints.create = function(tabbed, yank, image) {
  var links = [];
  this.strings = [];
  this.linkHints = [];
  this.permutations = [];
  this.linkArr = [];
  this.currentString = "";
  this.yank = yank;
  this.image = image;
  this.tabbed = tabbed;

  var screen = {
    top: document.body.scrollTop,
    bottom: document.body.scrollTop + window.innerHeight,
    left: document.body.scrollLeft,
    right: document.body.scrollLeft + window.innerWidth
  };

  var getClickableLinks = function() {
    var elements;
    var isRedditUrl = /\.reddit\.com/.test(window.location.host);
    if (yank) {
      elements = document.querySelectorAll("a,[href]")
    } else if (image) {
      elements = document.querySelectorAll("img")
    } else {
      elements = document.querySelectorAll("[onclick],a,area,select,button,textarea,input,[aria-haspopup],[data-cmd],[jsaction]")
    }
    var clickable = [];
    for (var i = 0, length = elements.length; i < length; i++) {
      var computedStyle = getComputedStyle(elements[i], null);

      if (isRedditUrl && /click_thing/.test(elements[i].getAttribute("onclick"))) {
        continue;
      }
      if (computedStyle.visibility !== "hidden" && !elements[i].hasOwnProperty("cVim")) {
        clickable.push(elements[i]);
      }

    }
    return clickable;
  }

  links = getClickableLinks();
  if (!links.length) return;

  var link_number = 0;
  var main = document.createElement("div");
  main.cVim = true;
  this.active = true;
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
    if (links[i].nodeName === "AREA" && links[i].parentNode && links[i].parentNode.nodeName === "MAP") {
      var img_parent = document.querySelectorAll("img[usemap='#" + links[i].parentNode.name + "'");
      if (!img_parent.length) continue;
      link_location = img_parent[0].getBoundingClientRect();
      isAreaNode = true;
    } else {
      link_location = links[i].getBoundingClientRect();
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
    if (link_location.top + link_location.height >= 0 && link_location.top <= window.innerHeight && link_location.left + link_location.width >= 0 && link_location.left < window.innerWidth) {
      this.strings.push(link_number.toString());
      this.linkHints.push(links[i]);
      var temp = document.createElement("div");
      temp.cVim = true;
      temp.className = "link_hint";
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
          temp.style.left = link_location.left + screen.left + "px";
        }
      }
      this.linkArr.push(temp);
      link_number++;
    }
  }

  var lim = Math.ceil(Math.log(this.linkArr.length) / Math.log(this.hintCharacters.length));
  if (lim === 0) lim = 1;

  function genHint(n) {
    var l, r;
    l = [];
    for (var i = 0; i < lim; i++) {
      r = n % Hints.hintCharacters.length;
      l.push(Hints.hintCharacters[r]);
      n -= r;
      n = Math.floor(n / Hints.hintCharacters.length);
    }
    return l.join("");
  };

  for (var i = 1; i <= this.linkArr.length; i++) {
    this.permutations.push(genHint(i));
  }

  function optimizeHint(hint, orig_index) {
    var reduction = hint.substring(0, hint.length - 1);
    for (var i = 0, l = Hints.permutations.length; i < l; i++) {
      if (i != orig_index && reduction === Hints.permutations[i].substring(0, reduction.length)) {
        return hint;
      }
    }
    if (hint.length !== 1) {
      return optimizeHint(hint.substring(0, hint.length - 1));
    }
    return hint;
  }

  for (var i = this.linkArr.length - 1; i >= 0; i--) {
    this.linkArr[i].innerText = optimizeHint(this.permutations[i], i);
    frag.appendChild(this.linkArr[i]);
  }
  main.appendChild(frag);

};
