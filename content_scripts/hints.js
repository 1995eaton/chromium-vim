var handleHint, handleHintFeedback, hideHints;
var hints_active, hint_strings, tab_open, links, link_arr, hint_links, letter_perms;
var log = console.log.bind(console);

links = [];
hint_links = [];
link_arr = [];

var current_string = "";

var Hints = {};

Hints.hintCharacters = "asdfgzxcvbqwert";

Hints.hideHints = function() {
  document.getElementById("link_main").parentNode.removeChild(document.getElementById("link_main"));
  current_string = "";
  hints_active = false;
  link_arr = [];
};

Hints.handleHintFeedback = function(choice) {
  var links_found = 0;
  if (!this.numeric) {
    var cur_index;
    for (var i = 0; i < hint_strings.length; i++) {
      if (current_string === letter_perms[i].substring(0, current_string.length)) {
        if (link_arr[i].children.length) {
          link_arr[i].replaceChild(link_arr[i].firstChild.firstChild, link_arr[i].firstChild);
          link_arr[i].normalize();
        }
        var span = document.createElement("span");
        span.cVim = true;
        span.className = "link_hint_match";
        var matched_chars = link_arr[i].firstChild.splitText(current_string.length);
        span.appendChild(link_arr[i].firstChild.cloneNode(true));
        link_arr[i].replaceChild(span, link_arr[i].firstChild);
        cur_index = i;
        links_found++;
      } else {
        if (link_arr[i].parentNode) {
          link_arr[i].style.opacity = "0";
        }
      }
    }
  } else {
    if (choice > link_arr.length) {
      current_string = "";
      Hints.hideHints();
    }
    for (var i = 0; i < hint_strings.length; i++) {
      if (hint_strings[i].substring(0, current_string.length) === current_string) {
        links_found++;
      }
    }
  }
  if (links_found === 1) {
    Hints.hideHints();
    setTimeout(function() {
      if (Hints.yank) {
        Clipboard.copy(hint_links[cur_index].href);
      } else if (Hints.image) {
        chrome.runtime.sendMessage({action: "openLinkTab", url: "https://www.google.com/searchbyimage?image_url=" + hint_links[cur_index].src});
      } else if (hint_links[cur_index].nodeName === "BUTTON" || hint_links[cur_index].nodeName === "AREA") {
        hint_links[cur_index].click();
      } else if (hint_links[cur_index].nodeName === "SELECT") {
        var e = new MouseEvent("mousedown");
        hint_links[cur_index].dispatchEvent(e);
      } else if (hint_links[cur_index].nodeName === "TEXTAREA") {
        setTimeout(function() {
          hint_links[cur_index].focus();
        }, 0);
      } else if (hint_links[cur_index].nodeName === "INPUT") {
        switch (hint_links[cur_index].type) {
          case "text": case "password": case "email": case "search":
            setTimeout(function() {
              hint_links[cur_index].focus();
            }, 0);
            break;
          case "radio": case "submit":
            hint_links[cur_index].click();
            break;
          case "checkbox":
            hint_links[cur_index].checked = !hint_links[cur_index].checked;
            break;
          default:
            hint_links[cur_index].click();
            break;
        }
      } else if (!Hints.tabbed || hint_links[cur_index].getAttribute("onclick")) {
        hint_links[cur_index].click();
      } else {
        chrome.runtime.sendMessage({action: "openLinkTab", url: (!Hints.numeric) ? hint_links[cur_index].href : hint_links[choice].href});
      }
    }, 0);
  } else if (links_found === 0) {
    Hints.hideHints();
  }
};


Hints.handleHint = function(key) {
  if (!this.numeric) {
    if (Hints.hintCharacters.split("").indexOf(key.toLowerCase()) > -1) {
      current_string += key.toLowerCase();
      Hints.handleHintFeedback(current_string);
    } else {
      Hints.hideHints();
    }
  } else {
    if (/0|1|2|3|4|5|6|7|8|9/.test(key)) {
      current_string += key;
      Hints.handleHintFeedback(parseInt(current_string));
    } else {
      Hints.hideHints();
    }
  }
};

Hints.create = function(tabbed, numeric, yank, image) {
  hint_strings = [];
  hint_links = [];
  this.yank = yank;
  this.image = image;
  this.tabbed = tabbed;
  this.numeric = numeric;
  var screen = {
    top: document.body.scrollTop,
    bottom: document.body.scrollTop + window.innerHeight,
    left: document.body.scrollLeft,
    right: document.body.scrollLeft + window.innerWidth
  };
  var getClickableLinks = function() {
    var elements = document.getElementsByTagName("*");
    var currentCoordinate, special_urls;
    var clickable = [];
    for (var i = 0, length = elements.length; i < length; i++) {
      var computedStyle = getComputedStyle(elements[i], null);
      special_urls = {
        inclusive: {
          stackoverflow: /stackoverflow\.com/.test(document.URL) && (elements[i].className === "wmd-button" || /mdhelp/.test(elements[i].getAttribute("data-tab")) || elements[i].id === "wmd-help-button"),
          imgur: /imgur\.com/.test(document.URL) && (/favorite-image|report-image|file-wrapper/.test(elements[i].id) || /submit-caption-button|caption-toolbar combobox edit-button( opened)?|arrow.*(up|down)|navBrowse|navNext|navPrev|item.*link|triangle|item center/.test(elements[i].className))
        },
        exclusive: {
          reddit: !(/reddit\.com/.test(document.URL) && elements[i].parentNode && (elements[i].parentNode.className === "parent" && elements[i].classList.length && (elements[i].classList[0] === "author" || elements[i].classList[0] === "subreddit"))) && !/click_thing/.test(elements[i].getAttribute("onclick"))
        }
      };
      if (yank) {
        if (elements[i].href) {
          clickable.push(elements[i]);
        }
      } else if (image) {
        if (elements[i].src) {
          clickable.push(elements[i]);
        }
      } else {
        if ((elements[i].getAttribute("onclick") || /^(AREA|SELECT|BUTTON|TEXTAREA|A|INPUT)$/.test(elements[i].nodeName) || elements[i].getAttribute("aria-haspopup") || elements[i].getAttribute("data-cmd") || elements[i].getAttribute("jsaction") || special_urls.inclusive.imgur || special_urls.inclusive.stackoverflow) && special_urls.exclusive.reddit && computedStyle.visibility !== "hidden" && !elements[i].hasOwnProperty("cVim")) {
          clickable.push(elements[i]);
        }
      }
    }
    return clickable;
  }
  links = getClickableLinks();
  if (!links.length) return;
  var link_number = 0;
  var main = document.createElement("div");
  main.cVim = true;
  hints_active = true;
  var frag = document.createDocumentFragment();
  main.id = "link_main";
  main.top = document.body.scrollTop + "px";
  main.left = document.body.scrollLeft + "px";
  document.lastChild.appendChild(main);
  for (var i = 0; i < links.length; i++) {
    var isAreaNode = false;
    if (links[i].nodeName === "AREA" && links[i].parentNode && links[i].parentNode.nodeName === "MAP") {
        var img_parent = document.querySelectorAll("img[usemap='#" + links[i].parentNode.name + "'");
        if (!img_parent.length) continue;
        link_location = img_parent[0].getBoundingClientRect();
        isAreaNode = true;
    } else {
      link_location = links[i].getBoundingClientRect();
    }
    if (link_location.top + link_location.height > 0 && link_location.top < window.innerHeight && link_location.left >= 0 && link_location.left < window.innerWidth && link_location.width > 0) {
      hint_strings.push(link_number.toString());
      hint_links.push(links[i]);
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
        temp.style.top = link_location.top + screen.top + "px";
        temp.style.left = link_location.left + screen.left + "px";
      }

      if (numeric) {
        temp.innerText = link_number;
        frag.appendChild(temp);
      }
      link_arr.push(temp);
      link_number++;
    }
  }
  if (!numeric) {
    letter_perms = [];
    var lim = Math.ceil(Math.log(link_arr.length) / Math.log(Hints.hintCharacters.length));
    log(lim);
    log(Math.pow(Hints.hintCharacters.length, lim));
    log(link_arr.length);
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
    }
    for (var i = 1; i <= link_arr.length; i++) {
      letter_perms.push(genHint(i));
    }
    function optimizeHint(hint, orig_index) { // TODO: Find a better way to get optimized hints
      var reduction = hint.substring(0, hint.length - 1);
      for (var i = 0, l = letter_perms.length; i < l; i++) {
        if (i != orig_index && reduction === letter_perms[i].substring(0, reduction.length)) {
          return hint;
        }
      }
      if (hint.length !== 1) {
        return optimizeHint(hint.substring(0, hint.length - 1));
      }
      return hint;
    }
    for (var i = link_arr.length - 1; i >= 0; i--) {
      link_arr[i].innerText = optimizeHint(letter_perms[i], i);
      frag.appendChild(link_arr[i]);
    }
  }
  main.appendChild(frag);
};
