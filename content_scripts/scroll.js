var Scroll = {
  positions: {}
};

(function($) {

  var animationYFrame, animationXFrame,
      scrollXFunction, scrollYFunction;
  var holdKeyScroll = false;

  var easeFn = function(t, b, c, d) {
    return (t===d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
  };

  var timeFn = typeof window.performance === 'undefined' ?
    Date.now : performance.now.bind(performance);

  var scroll = {
    x0:   0, // starting x position
    x1:   0, // ending x position
    xc:   0, // delta-x during scroll
    tx:   0, // delta-t
    txo:  0, // last time measurement
    dx:   0, // x-duration
    y0:   0,
    y1:   0,
    yc:   0,
    ty:   0,
    tyo:  0,
    dy:   0
  };

  scrollYFunction = function() {
    var delta = easeFn(scroll.ty, scroll.y0, scroll.y1 - scroll.y0, scroll.dy);
    var time = timeFn();
    scroll.yc = delta;
    scroll.ty += time - scroll.tyo;
    scroll.tyo = time;
    $.scrollTo($.scrollX, delta);
    if (scroll.ty <= scroll.dy) {
      animationYFrame = $.requestAnimationFrame(scrollYFunction);
    } else {
      $.cancelAnimationFrame(animationYFrame);
      $.scrollTo($.scrollX, scroll.y1);
      scroll.y0 = scroll.y1 = scroll.yc = scroll.ty = 0;
    }
  };

  scrollXFunction = function() {
    var delta = easeFn(scroll.tx, scroll.x0, scroll.x1 - scroll.x0, scroll.dx);
    var time = timeFn();
    scroll.xc = delta;
    scroll.tx += time - scroll.txo;
    scroll.txo = time;
    $.scrollTo(delta, $.scrollY);
    if (scroll.tx <= scroll.dx) {
      animationXFrame = $.requestAnimationFrame(scrollXFunction);
    } else {
      $.cancelAnimationFrame(animationXFrame);
      $.scrollTo(scroll.x1, $.scrollY);
      scroll.x0 = scroll.x1 = scroll.xc = scroll.tx = 0;
    }
  };

  $.setSmoothScrollEaseFN = function(fn) {
    easeFn = fn;
  };

  $.smoothScrollTo = function(x, y, d) {
    $.cancelAnimationFrame(animationXFrame);
    $.cancelAnimationFrame(animationYFrame);
    scroll.dx = scroll.dy = d;
    if (x !== $.scrollX) {
      scroll.x0 = $.scrollX;
      scroll.x1 = x;
      scroll.tx = 0;
      scroll.txo = timeFn();
      scrollXFunction();
    }
    if (y !== $.scrollY) {
      scroll.y0 = $.scrollY;
      scroll.y1 = y;
      scroll.ty = 0;
      scroll.tyo = timeFn();
      scrollYFunction();
    }
  };

  var holdFunction = function(dx, dy) {
    return (function animationLoop() {
      if ($.scrollKeyUp) {
        holdKeyScroll = false;
        return;
      }
      $.scrollBy(dx, dy);
      $.requestAnimationFrame(animationLoop);
    })();
  };

  $.smoothScrollBy = function(x, y, d) {
    if (!$.scrollKeyUp) {
      if (!holdKeyScroll) {
        holdKeyScroll = true;
        holdFunction(x * 0.25, y * 0.25);
      }
      return;
    }
    $.scrollKeyUp = false;
    if (x) {
      var oldDx = scroll.x1 - scroll.xc;
      $.cancelAnimationFrame(animationXFrame);
      scroll.dx = d;
      scroll.x0 = $.scrollX;
      scroll.x1 = oldDx + scroll.x0 + x;
      scroll.tx = 0;
      scroll.txo = timeFn();
      scrollXFunction();
    }
    if (y) {
      var oldDy = scroll.y1 - scroll.yc;
      $.cancelAnimationFrame(animationYFrame);
      scroll.dy = d;
      scroll.y0 = $.scrollY;
      scroll.y1 = oldDy + scroll.y0 + y;
      scroll.ty = 0;
      scroll.tyo = timeFn();
      scrollYFunction();
    }
  };

  $.scrollKeyUp = true;

})(this);

Scroll.scroll = function(type, repeats) {

  var stepSize = settings ? settings.scrollstep : 60;

  if (document.body) {
    this.lastPosition = [document.body.scrollLeft, document.body.scrollTop];
  }

  if (settings && settings.smoothscroll) {

    switch (type) {
      case 'down':
        window.smoothScrollBy(0, repeats * stepSize, settings.scrollduration);
        break;
      case 'up':
        window.smoothScrollBy(0, -repeats * stepSize, settings.scrollduration);
        break;
      case 'pageDown':
        window.smoothScrollBy(0, repeats * window.innerHeight / 2, settings.scrollduration);
        break;
      case 'fullPageDown':
        window.smoothScrollBy(0, repeats * window.innerHeight * (settings.fullpagescrollpercent / 100 || 1), settings.scrollduration);
        break;
      case 'pageUp':
        window.smoothScrollBy(0, -repeats * window.innerHeight / 2, settings.scrollduration);
        break;
      case 'fullPageUp':
        window.smoothScrollBy(0, -repeats * window.innerHeight * (settings.fullpagescrollpercent / 100 || 1), settings.scrollduration);
        break;
      case 'top':
        window.smoothScrollBy(0, -document.body.scrollTop, settings.scrollduration);
        break;
      case 'bottom':
        window.smoothScrollTo(window.scrollX, document.body.scrollHeight - document.documentElement.clientHeight, settings.scrollduration);
        break;
      case 'left':
        window.smoothScrollBy(repeats * -stepSize / 2, 0, settings.scrollduration);
        break;
      case 'right':
        window.smoothScrollBy(repeats * stepSize / 2, 0, settings.scrollduration);
        break;
      case 'leftmost':
        window.smoothScrollBy(-document.body.scrollLeft - 10, 0, settings.scrollduration);
        break;
      case 'rightmost':
        window.smoothScrollBy(document.body.scrollWidth - document.body.scrollLeft - window.innerWidth + 20, 0, settings.scrollduration);
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
