var Cursor = {}; // Hide the mouse cursor on keydown (Linux)

Cursor.init = function() {
  this.overlay = document.createElement("div");
  this.overlay.style.position = "fixed";
  this.overlay.style.left = "0";
  this.overlay.style.width = "100%";
  this.overlay.style.top = "0";
  this.overlay.style.height = "100%";
  this.overlay.style.zIndex = "999999999";
  this.overlay.style.cursor = "none";
  this.overlay.style.display = "none";
  this.overlay.style.webkitTransform = "translateZ(0)";
  this.overlay.style.transform = "translateZ(0)";
  if (document.body) {
    document.body.appendChild(this.overlay);
  }
  var oldX, oldY;
  document.addEventListener("mousemove", function(e) {
    if (oldX !== e.x || oldY !== e.y) {
      Cursor.overlay.style.display = "none";
    }
    oldX = e.x;
    oldY = e.y;
  });
};
