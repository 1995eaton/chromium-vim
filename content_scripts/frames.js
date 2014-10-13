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
      RUNTIME('addFrame', {isRoot: isRoot}, function(index) {
        Frames.index = index;
      });
    }
  }
};

document.addEventListener('DOMContentLoaded', function() {
  Frames.init(self === top);
}, false);
