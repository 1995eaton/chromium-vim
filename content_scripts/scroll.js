var Scroll = {};
Scroll.positions = {};


var ease = {
  outSine: function(t, b, c, d) {
    return c * Math.sin(t/d * (Math.PI/2)) + b;
  },
  outQuint: function(t, b, c, d) {
    t /= d;
    t--;
    return c*(t*t*t*t*t + 1) + b;
  },
  outQuad: function(t, b, c, d) {
    t /= d;
    return -c * t*(t-2) + b;
  },
  outExpo: function(t, b, c, d) {
    return c * ( -Math.pow( 2, -10 * t/d ) + 1 ) + b;
  },
  outQuart: function(t, b, c, d) {
    return -c * ((t=t/d-1)*t*t*t - 1) + b;
  },
  outCirc: function(t, b, c, d) {
    t /= d;
    t--;
    return c * Math.sqrt(1 - t*t) + b;
  }
};

(function() {
  var animationYFrame;
  var animationXFrame;
  var scroll = {
    x0: 0,
    y0: 0,
    x1: 0,
    y1: 0,
    tx: 0,
    ty: 0
  };
  var easeFn = ease.outExpo;
  var scrollYFunction = function() {
    var delta = easeFn(scroll.ty++,
        scroll.y0,
        scroll.y1 - scroll.y0,
        settings.scrollduration);
    scroll.y0 = delta;
    window.scrollTo(window.scrollX, scroll.y0);
    if (scroll.ty < settings.scrollduration && Math.abs(scroll.y1 - scroll.y0) > 1) {
      animationYFrame = window.requestAnimationFrame(scrollYFunction);
    } else {
      window.cancelAnimationFrame(animationYFrame);
      scroll.y0 = 0;
      scroll.y1 = 0;
      scroll.ty = 0;
    }
  };
  var scrollXFunction = function() {
    var delta = easeFn(scroll.tx++,
        scroll.x0,
        scroll.x1 - scroll.x0,
        settings.scrollduration);
    scroll.x0 = delta;
    window.scrollTo(scroll.x0, window.scrollY);
    if (scroll.tx < settings.scrollduration && Math.abs(scroll.x1 - scroll.x0) > 1) {
      animationXFrame = window.requestAnimationFrame(scrollXFunction);
    } else {
      window.cancelAnimationFrame(animationXFrame);
      scroll.x0 = 0;
      scroll.x1 = 0;
      scroll.tx = 0;
    }
  };
  Scroll.smoothScrollTo = function(x, y) {
    if (x !== window.scrollX) {
      window.cancelAnimationFrame(animationXFrame);
      scroll.x0 = window.scrollX;
      scroll.x1 = x;
      scroll.tx = 0;
      scrollXFunction();
    }
    if (y !== window.scrollY) {
      window.cancelAnimationFrame(animationYFrame);
      scroll.y0 = window.scrollY;
      scroll.y1 = y;
      scroll.ty = 0;
      scrollYFunction();
    }
  };
  Scroll.smoothScrollBy = function(x, y) {
    var oldDy = scroll.y1 - scroll.y0;
    var oldDx = scroll.x1 - scroll.x0;
    if (x) {
      window.cancelAnimationFrame(animationXFrame);
      scroll.x0 = window.scrollX;
      scroll.x1 = oldDx + scroll.x0 + x;
      scroll.tx = 0;
      scrollXFunction();
    }
    if (y) {
      window.cancelAnimationFrame(animationYFrame);
      scroll.y0 = window.scrollY;
      scroll.y1 = oldDy + scroll.y0 + y;
      scroll.ty = 0;
      scrollYFunction();
    }
  };
})();

Scroll.scroll = function(type, repeats) {

  var stepSize = settings ? settings.scrollstep : 60;

  if (document.body) {
    this.lastPosition = [document.body.scrollLeft, document.body.scrollTop];
  }

  if (settings && settings.smoothscroll) {

    switch (type) {
      case 'down':
        Scroll.smoothScrollBy(0, repeats * stepSize);
        break;
      case 'up':
        Scroll.smoothScrollBy(0, -repeats * stepSize);
        break;
      case 'pageDown':
        Scroll.smoothScrollBy(0, repeats * window.innerHeight / 2);
        break;
      case 'fullPageDown':
        Scroll.smoothScrollBy(0, repeats * window.innerHeight * (settings.fullpagescrollpercent / 100 || 0.85));
        break;
      case 'pageUp':
        Scroll.smoothScrollBy(0, -repeats * window.innerHeight / 2);
        break;
      case 'fullPageUp':
        Scroll.smoothScrollBy(0, -repeats * window.innerHeight * (settings.fullpagescrollpercent / 100 || 0.85));
        break;
      case 'top':
        Scroll.smoothScrollBy(0, -document.body.scrollTop);
        break;
      case 'bottom':
        Scroll.smoothScrollBy(0, document.body.scrollHeight - document.body.scrollTop - window.innerHeight + 20);
        break;
      case 'left':
        Scroll.smoothScrollBy(repeats * -stepSize / 2, 0);
        break;
      case 'right':
        Scroll.smoothScrollBy(repeats * stepSize / 2, 0);
        break;
      case 'leftmost':
        Scroll.smoothScrollBy(-document.body.scrollLeft - 10, 0);
        break;
      case 'rightmost':
        Scroll.smoothScrollBy(document.body.scrollWidth - document.body.scrollLeft - window.innerWidth + 20, 0);
        break;
      default:
        break;
    }

  } else {

    switch (type) {
      case 'down':
        scrollBy(0, repeats * stepSize);
        break;
      case 'up':
        scrollBy(0, -repeats * stepSize);
        break;
      case 'pageDown':
        scrollBy(0, repeats * window.innerHeight / 2);
        break;
      case 'fullPageDown':
        scrollBy(0, repeats * window.innerHeight * (settings.fullpagescrollpercent / 100 || 0.85));
        break;
      case 'pageUp':
        scrollBy(0, -repeats * window.innerHeight / 2);
        break;
      case 'fullPageUp':
        scrollBy(0, -repeats * window.innerHeight * (settings.fullpagescrollpercent / 100 || 0.85));
        break;
      case 'top':
        scrollTo(0, 0);
        break;
      case 'bottom':
        scrollTo(0, document.body.scrollHeight);
        break;
      case 'left':
        scrollBy(-repeats * stepSize, 0);
        break;
      case 'right':
        scrollBy(repeats * stepSize, 0);
        break;
      case 'leftmost':
        scrollTo(0, document.body.scrollTop);
        break;
      case 'rightmost':
        scrollTo(document.body.scrollWidth - document.documentElement.offsetWidth, document.body.scrollTop);
        break;
      default:
        break;
    }

  }

};
