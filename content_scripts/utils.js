Object.prototype.isInput = function() {
  return (
      (this.nodeName === "TEXTAREA" || this.nodeName === "INPUT") &&
      !/button|image|checkbox|submit/.test(this.getAttribute("type"))
  );
};

Object.prototype.isVisible = function() {
  return (
      this.offsetParent &&
      !this.disabled &&
      this.getAttribute("type") !== "hidden" &&
      this.getAttribute("display") !== "none"
  );
}

Array.prototype.compare = function (array) {
  if (!array)
    return false;
  if (this.length != array.length)
    return false;
  for (var i = 0, l=this.length; i < l; i++) {
    if (this[i] instanceof Array && array[i] instanceof Array) {
      if (!this[i].compare(array[i]))
        return false;
    }
    else if (this[i] != array[i]) {
      return false;
    }
  }
  return true;
};

Object.prototype.getOffset = function() {
  var elem = this;
  var left = 0;
  var top = 0;
  while (elem = elem.parentNode) {
    if (elem.nodeName === "HTML") break;
    var bcr = elem.getBoundingClientRect();
    left += bcr.left;
    top += bcr.top;
  }
  return [left, top];
};

Array.prototype.compress = function() {
  for (var i = 0; i < this.length; i++) {
    if (!this[i]) {
      this.splice(i, 1);
      i--;
    }
  }
  return this;
};

Array.prototype.unique = function(){
  return Object.keys(this.reduce(function(r,v){
    return r[v]=1,r;
  },{}));
};

String.prototype.regexIndexOf = function(regex, startpos) {
  var indexOf = this.substring(startpos || 0).search(regex);
  return (indexOf >= 0) ? (indexOf + (startpos || 0)) : indexOf;
}
