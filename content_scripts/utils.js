Object.prototype.isInput = function() {
  return (
      (this.nodeName === "TEXTAREA" || this.nodeName === "INPUT" || this.contentEditable === "true") &&
      !/button|radio|image|checkbox|submit/i.test(this.getAttribute("type"))
  );
};


Object.prototype.isVisible = function() {
  var br = this.getBoundingClientRect();
  var cs = getComputedStyle(this);
  return (
      (this.offsetParent &&
      !this.disabled &&
      this.getAttribute("type") !== "hidden" &&
      cs.visibility !== "hidden" &&
      this.getAttribute("display") !== "none")
  );
};


Array.prototype.unique = function(){
  return Object.keys(this.reduce(function(r,v){
    return r[v]=1,r;
  },{}));
};


String.prototype.regexIndexOf = function(regex, startpos) {
  var indexOf = this.substring(startpos || 0).search(regex);
  return (indexOf >= 0) ? (indexOf + (startpos || 0)) : indexOf;
};
