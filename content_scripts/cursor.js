var Cursor = { // Hide the mouse cursor on keydown (Linux)
  // Jiggle the screen for CSS styles to take hold on pages with no overflow.
  // This still doesn't seem to work on new tabs until the mouse is touched
  wiggleWindow: function() {
    document.body.style.minHeight = document.documentElement.clientHeight + 2 + 'px';
    var jiggleDirection =
      +(document.scrollingElement.scrollTop !== 0 &&
          document.body.scrollHeight -
          document.scrollingElement.scrollTop    -
          document.documentElement.clientHeight === 0);
    document.scrollingElement.scrollTop -= jiggleDirection;
    document.scrollingElement.scrollTop += jiggleDirection;
    document.body.style.minHeight = '';
  },
  init: function() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'cVim-cursor';
    document.body.appendChild(this.overlay);
    var oldX, oldY;
    this.overlay.style.display = 'block';
    Cursor.wiggleWindow();
    this.overlay.style.display = 'none';
    document.addEventListener('mousemove', function(e) {
      if (!e.isTrusted)
        return true;
      if (oldX !== e.x || oldY !== e.y) {
        Cursor.overlay.style.display = 'none';
      }
      oldX = e.x;
      oldY = e.y;
    });
  }
};
