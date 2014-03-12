Object.prototype.isInput = function() {
  return this.nodeName === "TEXTAREA" ||
    this.nodeName === "INPUT";
};
