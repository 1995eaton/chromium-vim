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
  for (var i = 0; i < link_arr.length; i++) {
    if (link_arr[i].parentNode) {
      link_arr[i].parentNode.removeChild(link_arr[i]);
    }
  }
  document.getElementById("link_main").parentNode.removeChild(document.getElementById("link_main"));
  current_string = "";
  hints_active = false;
  link_arr = [];
  hint_links = [];
};

Hints.handleHintFeedback = function(choice) {
  var links_found = 0;
  if (!this.numeric) {
    var cur_index;
    for (var i = 0; i < hint_strings.length; i++) {
      if (new RegExp("^" + choice).test(letter_perms[i])) {
        cur_index = i;
        links_found++;
      } else {
        if (link_arr[i].parentNode) {
          link_arr[i].parentNode.removeChild(link_arr[i]);
        }
      }
    }
  } else {
    if (choice > link_arr.length) {
      current_string = "";
      Hints.hideHints();
    }
    for (var i = 0; i < hint_strings.length; i++) {
      if (new RegExp("^" + current_string).test(hint_strings[i])) {
        links_found++;
      }
    }
  }
  if (links_found === 1) {
    if (hint_links[cur_index].nodeName === "BUTTON") {
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
        case "text": case "password": case "email":
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
    } else if (!this.tabbed || hint_links[cur_index].getAttribute("onclick")) {
      hint_links[cur_index].click();
    } else {
      chrome.runtime.sendMessage({action: "openLinkTab", url: (!this.numeric) ? hint_links[cur_index].href : hint_links[choice].href});
    }
    setTimeout(function() {
      Hints.hideHints();
    }, 0);
  } else if (links_found === 0) {
    Hints.hideHints();
  }
};


Hints.handleHint = function(key) {
  if (!this.numeric) {
    if (new RegExp(Hints.hintCharacters.split("").join("|")).test(key.toLowerCase())) {
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

Hints.create = function(tabbed, numeric) {
  hint_strings = [];
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
          google: /google\.com/.test(document.URL) && (elements[i].getAttribute("jsaction") || elements[i].getAttribute("aria-haspopup")),
          stackoverflow: /stackoverflow\.com/.test(document.URL) && (elements[i].className === "wmd-button" || /mdhelp/.test(elements[i].getAttribute("data-tab")) || elements[i].id === "wmd-help-button"),
        },
        exclusive: {
          reddit: !(/reddit\.com/.test(document.URL) && elements[i].parentNode && elements[i].parentNode.className === "parent") && !/click_thing/.test(elements[i].getAttribute("onclick"))
        }
      };
      if ((elements[i].getAttribute("onclick") || special_urls.inclusive.google || /^(SELECT|BUTTON|TEXTAREA|A|INPUT)$/.test(elements[i].nodeName) || special_urls.inclusive.stackoverflow) && special_urls.exclusive.reddit && computedStyle.visibility !== "hidden" && computedStyle.display !== "none" && parseFloat(computedStyle.opacity) > 0) {
        clickable.push(elements[i]);
      }
    }
    return clickable;
  }
  links = getClickableLinks();
  if (links.length === 1) { // do not select my command bar
    return;
  }
  var link_number = 0;
  var main = document.createElement("div");
  hints_active = true;
  var frag = document.createDocumentFragment();
  main.id = "link_main";
  main.top = document.body.scrollTop + "px";
  main.left = document.body.scrollLeft + "px";
  document.lastChild.appendChild(main);
  for (var i = 0; i < links.length; i++) {
    var link_location = links[i].getBoundingClientRect();
    if (link_location.top >= 0 && link_location.top + link_location.height < window.innerHeight && link_location.left + link_location.width > 0 && link_location.left < window.innerWidth) {
      hint_strings.push(link_number.toString());
      hint_links.push(links[i]);
      var temp = document.createElement("div");
      temp.className = "link_hint";
      temp.style.top = link_location.top + screen.top + "px";
      temp.style.left = link_location.left + screen.left + "px";
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
      var rxp = new RegExp("^" + hint.substring(0, hint.length - 1));
      for (var i = 0, l = letter_perms.length; i < l; i++) {
        if (i != orig_index && rxp.test(letter_perms[i])) {
          return hint;
        }
      }
      if (hint.length !== 1) {
        return optimizeHint(hint.substring(0, hint.length - 1));
      }
      return hint;
    }
    for (var i = 0, l = letter_perms.length; i < l; i++) {
      letter_perms[i] = optimizeHint(letter_perms[i], i);
    }
    for (var i = link_arr.length - 1; i >= 0; i--) {
      link_arr[i].innerText = letter_perms[i];
      frag.appendChild(link_arr[i]);
    }
  }
  main.appendChild(frag);
};
