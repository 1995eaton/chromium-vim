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
  getHiddenFrameURLs: function() {
    var subFrames = document.querySelectorAll('iframe[src],frame[src]');
    var hiddenURLs = [];
    for (var i = 0; i < subFrames.length; i++) {
      var frame = subFrames[i];
      if (!getVisibleBoundingRect(frame))
        hiddenURLs.push(frame.src);
    }
    return hiddenURLs;
  },
  init: function(isRoot) {
    RUNTIME('addFrame', {
      isRoot: isRoot,
      url: document.URL
    }, function(id) {
      Frames.id = id;
    });
  }
};

document.addEventListener('DOMContentLoaded', function() {
  Frames.init(self === top);
}, false);
