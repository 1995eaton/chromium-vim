HTMLElement.prototype.isInput = function() {
  return (
      (this.nodeName === "TEXTAREA" || this.nodeName === "INPUT" || this.getAttribute("contenteditable") === "true") && !this.disabled &&
      !/button|radio|file|image|checkbox|submit/i.test(this.getAttribute("type"))
  );
};

HTMLElement.prototype.isVisible = function() {
  return this.offsetParent && !this.disabled &&
         this.getAttribute("type") !== "hidden" &&
         getComputedStyle(this).visibility !== "hidden" &&
         this.getAttribute("display") !== "none";
};

Array.prototype.unique = function() {
  var a = [];
  for (var i = 0, l = this.length; i < l; ++i) {
    if (a.indexOf(this[i]) === -1)
      a.push(this[i]);
  }
  return a;
};

String.prototype.trimAround = function() {
  return this.replace(/^(\s+)?(.*\S)?(\s+)?$/g, "$2");
};

String.prototype.escape = function() {
  return this.replace(/&/g, "&amp;")
             .replace(/"/g, "&quot;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;");
};

String.prototype.span = function(attributes, className) {
  var strat = "";
  for (var key in attributes) {
    if (typeof attributes[key] === "string") {
      strat += key + ":" + attributes[key] + ";";
    }
  }
  return "<span " + (className !== undefined ? "class=\"" + className + "\" " : "") + "style=\"" + strat + "\">" + (attributes.escape ? this.escape() : this) + "</span>"; // TODO: escape left half
};

String.prototype.isBoolean = function() {
  return /^(true|false|0|1)$/i.test(this);
};

// Stolen from https://gist.github.com/alisterlf/3490957
String.prototype.removeDiacritics = function() {
  var strAccents = this.split("");
  var strAccentsOut = [];
  var strAccentsLen = strAccents.length;
  var accents = "ÀÁÂÃÄÅàáâãäåÒÓÔÕÕÖØòóôõöøÈÉÊËèéêëðÇçÐÌÍÎÏìíîïÙÚÛÜùúûüÑñŠšŸÿýŽž";
  var accentsOut = "AAAAAAaaaaaaOOOOOOOooooooEEEEeeeeeCcDIIIIiiiiUUUUuuuuNnSsYyyZz";
  for (var y = 0; y < strAccentsLen; y++) {
    if (accents.indexOf(strAccents[y]) !== -1) {
      strAccentsOut[y] = accentsOut.substr(accents.indexOf(strAccents[y]), 1);
    } else
      strAccentsOut[y] = strAccents[y];
  }
  strAccentsOut = strAccentsOut.join("");
  return strAccentsOut;
};

Number.prototype.mod = function(n) {
  return ((this % n) + n) % n;
};

Object.prototype.clone = function() {
  var old = history.state;
  history.replaceState(this);
  var clone = history.state;
  history.replaceState(old);
  return clone;
};

Object.prototype.flatten = function() {
	var _ret = {};
	for (var key in this) {
		if (this.hasOwnProperty(key)) {
      if (key !== "qmarks" && key !== "searchengines" && typeof this[key] === "object" && !Array.isArray(this[key])) {
        var _rec = this[key].flatten();
        for (var subKey in _rec) {
          if (!_rec.hasOwnProperty(subKey)) {
            continue;
          }
          _ret[subKey] = _rec[subKey];
        }
      } else {
        _ret[key] = this[key];
      }
    }
  }
	return _ret;
};

function simulateMouseEvents(element, events) {
  for (var i = 0; i < events.length; ++i) {
    var ev = document.createEvent("MouseEvents");
    ev.initMouseEvent(events[i], true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
    element.dispatchEvent(ev);
  }
}

HTMLElement.prototype.hover = function() {
  simulateMouseEvents(this, ["mouseover", "mouseenter"]);
};

HTMLElement.prototype.unhover = function() {
  simulateMouseEvents(this, ["mouseout", "mouseleave"]);
};

HTMLElement.prototype.simulateClick = function() {
  simulateMouseEvents(this, ["mouseover", "mousedown", "mouseup", "click"]);
};

Node.prototype.isTextNode = function() {
  return this.nodeType === 3 && !/SCRIPT|STYLE|NOSCRIPT|MARK/.test(this.parentNode.nodeName) && this.data.trim() !== "";
};

String.prototype.rxp = function() {
  return new RegExp(this, Array.prototype.slice.call(arguments));
};

String.prototype.parseLocation = function() {
  var protocolMatch = "^[a-zA-Z0-9\\-]+:(?=\\/\\/)",
      hostnameMatch = "^[a-zA-Z0-9\\-.]+",
      pathPattern = "\\/.*";
  var urlProtocol = (this.match(protocolMatch.rxp()) || [""])[0] || "",
      urlHostname = (this.substring(urlProtocol.length + 2).match(hostnameMatch.rxp("g")) || [""])[0] || "",
      urlPath = ((this.substring(urlProtocol.length + 2 + urlHostname.length).match(pathPattern.rxp()) || [""])[0] || "").replace(/[#?].*/, "");
  return {
    protocol: urlProtocol,
    hostname: urlHostname,
    pathname: urlPath
  };
};

String.prototype.convertLink = function() {
  var url = this.trimLeft().trimRight();
  if (url.length === 0) {
    return "chrome://newtab";
  }
  if (/^\//.test(url)) {
    url = "file://" + url;
  }
  if (/^(chrome|chrome-extension|file):\/\/\S+$/.test(url)) {
    return url;
  }
  var pattern = new RegExp("^((https?|ftp):\\/\\/)?"+
  "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|"+
  "((\\d{1,3}\\.){3}\\d{1,3})|"+
  "localhost)" +
  "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*"+
  "(\\?[;&a-z\\d%_.~+=-]*)?"+
  "(\\#[-a-z\\d_]*)?$","i");
  if (pattern.test(url))
    return (/:\/\//.test(url) ? "" : "http://") + url;
  return "https://www.google.com/search?q=" + url;
};

function matchLocation(url, pattern) { // Uses @match syntax
  // See https://code.google.com/p/chromium/codesearch#chromium/src/extensions/common/url_pattern.h&sq=package:chromium
  var urlLocation = url.parseLocation(),
      protocol    = (pattern.match(/.*:\/\//) || [""])[0].slice(0, -2),
      hostname, path, pathMatch, hostMatch;
  if (/\*\*/.test(pattern)) {
    console.error("cVim Error: Invalid pattern: \"%s\"", pattern);
    return false;
  }
  if (!protocol.length) {
    console.error("cVim Error: Invalid protocol in pattern: \"%s\"", pattern);
    return false;
  }
  pattern = pattern.replace(/.*:\/\//, "");
  if (protocol !== "*:" && urlLocation.protocol !== protocol) {
    return false;
  }
  if (urlLocation.protocol !== "file:") {
    hostname = pattern.match(/^[^\/]+\//g);
    if (!hostname) {
      console.error("cVim Error: Invalid host in pattern: \"%s\"", pattern);
      return false;
    }
    var origHostname = hostname;
    hostname = hostname[0].slice(0, -1).replace(/([.])/g, "\\$1").replace(/\*/g, ".*");
    hostMatch = urlLocation.hostname.match(new RegExp(hostname, "i"));
    if (!hostMatch || hostMatch[0].length !== urlLocation.hostname.length) {
      return false;
    }
    pattern = "/" + pattern.slice(origHostname[0].length);
  }
  if (pattern.length) {
    path = pattern.replace(/([.&\\\/\(\)\[\]!?])/g, "\\$1").replace(/\*/g, ".*");
    pathMatch = urlLocation.pathname.match(new RegExp(path));
    if (!pathMatch || pathMatch[0].length !== urlLocation.pathname.length) {
      return false;
    }
  }
  return true;
}
