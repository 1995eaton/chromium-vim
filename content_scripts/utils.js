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
