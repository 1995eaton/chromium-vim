var Cursor = {}; // Hide the mouse cursor on keydown (Linux)

Cursor.init = function() {
  this.overlay = document.createElement("div");
  this.overlay.id = "cVim-cursor";
  document.body.appendChild(this.overlay);
  var oldX, oldY;
  document.addEventListener("mousemove", function(e) {
    if (oldX !== e.x || oldY !== e.y) {
      Cursor.overlay.style.display = "none";
    }
    oldX = e.x;
    oldY = e.y;
  });
};
