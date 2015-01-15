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
  getSubFrames: function() {
    var subFrames = document.querySelectorAll('iframe[src],frame[src]');
    var result = [document.URL];
    for (var i = 0; i < subFrames.length; i++) {
      if (this.frameIsVisible(subFrames[i]))
        result.push(subFrames[i].src);
    }
    return result;
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
