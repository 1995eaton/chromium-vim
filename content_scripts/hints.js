var keyDown, handleHint, handleHintFeedback, hideHints;
var hints_active, hint_strings, tab_open, links, link_arr, hint_links, hint_chars, letter_perms;
var log = console.log.bind(console);

hint_chars = "asdfgqwertzxcvb";
links = [];
hint_links = [];
link_arr = [];

var current_string = "";

var Hints = {};

Hints.hideHints = function() {
  for (var i = 0; i < link_arr.length; i++) {
    if (link_arr[i].parentNode) {
      link_arr[i].parentNode.removeChild(link_arr[i]);
    }
  }
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
    chrome.runtime.sendMessage({action: (this.tabbed) ? "openLinkTab" : "openLink", url: (!this.numeric) ? hint_links[cur_index] : hint_links[choice]}, function() {
      Hints.hideHints();
    });
  } else if (links_found === 0) {
    Hints.hideHints();
  }
};


Hints.handleHint = function(e) {
  if (!e.shiftKey && !e.metaKey && !e.ctrlKey) {
    var chr = String.fromCharCode(e.which);
    if (!this.numeric) {
      if (new RegExp(hint_chars.split("").join("|")).test(chr.toLowerCase())) {
        current_string += chr.toLowerCase();
        Hints.handleHintFeedback(current_string);
      } else {
        Hints.hideHints();
      }
    } else {
      if (/0|1|2|3|4|5|6|7|8|9/.test(chr)) {
        current_string += chr;
        Hints.handleHintFeedback(parseInt(current_string));
      } else {
        Hints.hideHints();
      }
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
  if (links.length === 0) {
    links = document.links;
  }
  var link_number = 0;
  var main = document.createElement("div");
  hints_active = true;
  main.id = "link_main";
  main.top = document.body.scrollTop + "px";
  main.left = document.body.scrollLeft + "px";
  for (var i = 0; i < links.length; i++) {
    var link_location = links[i].getBoundingClientRect();
    if (link_location.top > 0 && link_location.top < window.innerHeight && link_location.left > 0 && link_location.left < window.innerWidth) {
      hint_strings.push(link_number.toString());
      hint_links.push(links[i].href);
      var temp = document.createElement("div");
      temp.className = "link_hint";
      temp.style.top = link_location.top + screen.top + "px";
      temp.style.left = link_location.left + screen.left + "px";
      if (numeric) {
        temp.innerText = link_number;
        main.appendChild(temp);
      }
      link_arr.push(temp);
      link_number++;
    }
  }
  if (!numeric) {
    letter_perms = [];
    var lim = Math.ceil(Math.log(link_arr.length) / Math.log(hint_chars.length));
    function genHint(n) {
      var l, r;
      l = [];
      for (var i = 0; i < lim; i++) {
        r = n % hint_chars.length;
        l.push(hint_chars[r]);
        n -= r;
        n = Math.floor(n/hint_chars.length);
      }
      return l.join("");
    }
    for (var i = 1; i <= link_arr.length; i++) {
      letter_perms.push(genHint(i));
    }
    for (var i = link_arr.length - 1; i >= 0; i--) {
      link_arr[i].innerText = letter_perms[i];
      main.appendChild(link_arr[i]);
    }
  }
  document.lastChild.appendChild(main);
};
