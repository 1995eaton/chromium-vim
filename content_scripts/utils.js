Object.prototype.isInput = function() {
  return (
      (this.nodeName === "TEXTAREA" || this.nodeName === "INPUT" || this.contentEditable === "true") &&
      !/button|radio|image|checkbox|submit/i.test(this.getAttribute("type"))
  );
};


Object.prototype.isVisible = function() {
  return (
      (this.offsetParent &&
      !this.disabled &&
      this.getAttribute("type") !== "hidden" &&
      getComputedStyle(this).visibility !== "hidden" &&
      this.getAttribute("display") !== "none")
  );
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

String.prototype.span = function(attributes, className) {
  var strat = "";
  for (var key in attributes) {
    strat += key + ":" + attributes[key] + ";";
  }
  return "<span " + (className !== undefined ? "class=\"" + className + "\" " : "") + "style=\"" + strat + "\">" + this + "</span>";
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
