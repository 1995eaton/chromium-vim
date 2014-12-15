var Frames = {
  focus: function() {
    window.focus();
    var outline = document.createElement('div');
    outline.id = 'cVim-frames-outline';
    document.body.appendChild(outline);
    window.setTimeout(function() {
      document.body.removeChild(outline);
    }, 500);
  },
  isVisible: function() {
    return document.body && window.innerWidth && window.innerHeight;
  },
  init: function(isRoot) {
    if (Frames.isVisible()) {
      RUNTIME('addFrame', {
        isRoot: isRoot,
        url: document.URL
      }, function(id) {
        Frames.id = id;
      });
    }
    var subFrames = document.querySelectorAll('iframe[src],frame[src]');
    for (var i = 0; i < subFrames.length; i++) {
      var frame = subFrames[i],
          computedStyle = getComputedStyle(frame, null);
      if (frame.clientWidth <= 1 || frame.clientHeight <= 1 ||
          frame.getAttribute('aria-hidden') === 'true' ||
          computedStyle.visibility === 'hidden' ||
          computedStyle.opacity === '0' ||
          computedStyle.display === 'none') {
        PORT('hideFrame', {
          url: frame.src
        });
      }
    }
  }
};

document.addEventListener('DOMContentLoaded', function() {
  Frames.init(self === top);
}, false);
