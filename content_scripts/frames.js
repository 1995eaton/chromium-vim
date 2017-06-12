var Frames = {
  frameId: null,
  focus: function(disableAnimation) {
    window.focus();
    if (!disableAnimation) {
      var outline = document.createElement('div');
      outline.id = 'cVim-frames-outline';
      document.body.appendChild(outline);
      window.setTimeout(function() {
        document.body.removeChild(outline);
      }, 500);
    }
  },
  frameIsVisible: function(e) {
    if (e.getAttribute('aria-hidden') === 'true' ||
        e.getAttribute('height') === '0' ||
        e.getAttribute('width') === '0')
      return false;
    var style = getComputedStyle(e, null);
    if (style.display === 'none' ||
        style.opacity === '0' ||
        style.width === '0' ||
        style.height === '0' ||
        style.visibility === 'hidden')
      return false;
    var rect = e.getBoundingClientRect();
    if (rect.width <= 1 ||
        rect.height <= 1)
      return false;
    return true;
  },
  markAsActive: function() {
    RUNTIME('markActiveFrame', {
      frameId: this.frameId,
    });
  },
  init: function(frameId) {
    Frames.frameId = frameId;
    PORT('addFrame', {
      isCommandFrame: !!window.isCommandFrame
    });
  }
};

(function() {
  function focusListener() {
    if (window.portDestroyed) {
      window.removeEventListener('focus', focusListener);
      return;
    }
    if (!window.isCommandFrame)
      Frames.markAsActive();
  }
  window.addEventListener('focus', focusListener);
})();
