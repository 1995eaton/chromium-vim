var Scroll = {
  positions: {}
};

const NON_SCROLLABLE     = 0,
      SCROLLABLE_Y_DOWN  = 1,
      SCROLLABLE_Y_UP    = 2,
      SCROLLABLE_X_RIGHT = 4,
      SCROLLABLE_X_LEFT  = 8;
// const SCROLLABLE_Y = SCROLLABLE_Y_UP   | SCROLLABLE_Y_DOWN,
//       SCROLLABLE_X = SCROLLABLE_X_LEFT | SCROLLABLE_X_RIGHT;

var scrollingElement = (function() {
  function getScrollType(elem) {
    var cs = getComputedStyle(elem);
    var st = NON_SCROLLABLE;
    if (cs.overflow === 'hidden')
      return st;
    if (cs.overflowX !== 'hidden' &&
        elem.offsetHeight > elem.clientHeight &&
        elem.scrollWidth > elem.clientWidth) {
      if (elem.scrollLeft > 0)
        st |= SCROLLABLE_X_LEFT;
      if (elem.scrollLeft + elem.clientWidth < elem.scrollWidth)
        st |= SCROLLABLE_X_RIGHT;
    }
    if (cs.overflowY !== 'hidden' &&
        elem.offsetWidth > elem.clientWidth &&
        elem.scrollHeight > elem.clientHeight) {
      if (elem.scrollTop > 0)
        st |= SCROLLABLE_Y_UP;
      if (elem.scrollTop + elem.clientHeight < elem.scrollHeight)
        st |= SCROLLABLE_Y_DOWN;
    }
    return st;
  }

  var lastActiveElem = null,
      lastScrollElem = null,
      clickFocus = false;

  window.resetScrollFocus = function() {
    clickFocus = false;
  };

  document.addEventListener('mousedown', event => {
    clickFocus = true;
    lastActiveElem = event.srcElement;
  });

  return function scrollingElement(dir) {
    var elem;
    if (clickFocus) {
      elem = lastActiveElem;
    } else {
      elem = lastActiveElem = document.activeElement;
    }
    if (elem === null)
      return null;
    return (function climb(elem) {
      if (elem === null)
        return lastScrollElem || document.body;
      if (elem === document.body)
        return elem;
      var st = getScrollType(elem);
      return st & dir ? elem : climb(elem.parentElement);
    })(elem);
  };
})();

function $scrollBy(elem, x, y) {
  elem.scrollLeft += x;
  elem.scrollTop += y;
}
function $scrollTo(elem, x, y) {
  if (x !== null)
    elem.scrollLeft = x;
  if (y !== null)
    elem.scrollTop = y;
}

(function($) {

  var animationYFrame, animationXFrame,
      scrollXFunction, scrollYFunction,
      scrollElem, scrollXElem,
      lastX, lastY;
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
  }, scrollx = Object.clone(scroll);

  scrollYFunction = function() {
    var delta = easeFn(scroll.ty, scroll.y0, scroll.y1 - scroll.y0, scroll.dy);
    var time = timeFn();
    scroll.yc = delta;
    scroll.ty += time - scroll.tyo;
    scroll.tyo = time;
    $scrollTo(scrollElem, null, delta);
    if (!holdKeyScroll && scroll.ty <= scroll.dy) {
      animationYFrame = $.requestAnimationFrame(scrollYFunction);
    } else {
      $.cancelAnimationFrame(animationYFrame);
      animationYFrame = null;
      $scrollTo(scrollElem, null, scroll.y1);
      scroll.y0 = scroll.y1 = scroll.yc = scroll.ty = 0;
    }
  };

  scrollXFunction = function() {
    var delta = easeFn(scrollx.tx, scrollx.x0, scrollx.x1 - scrollx.x0, scrollx.dx);
    var time = timeFn();
    scrollx.xc = delta;
    scrollx.tx += time - scrollx.txo;
    scrollx.txo = time;
    $scrollTo(scrollXElem, delta, null);
    if (!holdKeyScroll && scrollx.tx <= scrollx.dx) {
      animationXFrame = $.requestAnimationFrame(scrollXFunction);
    } else {
      $.cancelAnimationFrame(animationXFrame);
      $scrollTo(scrollXElem, scrollx.x1, null);
      scrollx.x0 = scrollx.x1 = scrollx.xc = scrollx.tx = 0;
    }
  };

  $.setSmoothScrollEaseFN = function(fn) {
    easeFn = fn;
  };

  $.smoothScrollTo = function(elem, x, y, d) {
    scrollElem = elem;
    $.cancelAnimationFrame(animationXFrame);
    $.cancelAnimationFrame(animationYFrame);
    scroll.dx = scroll.dy = d;
    scrollx.dx = scrollx.dy = d;
    if (x !== scrollElem.scrollLeft) {
      scrollXElem = elem;
      scrollx.x0 = scrollXElem.scrollLeft;
      scrollx.x1 = x;
      scrollx.tx = 0;
      scrollx.txo = timeFn();
      scrollXFunction();
    }
    if (y !== scrollElem.scrollTop) {
      scroll.y0 = scrollElem.scrollTop;
      scroll.y1 = y;
      scroll.ty = 0;
      scroll.tyo = timeFn();
      scrollYFunction();
    }
  };

  var holdFunction = function(dx, dy) {
    var se = dx ? scrollXElem : scrollElem;
    return (function animationLoop() {
      if ($.scrollKeyUp) {
        holdKeyScroll = false;
        return;
      }
      $scrollBy(se, dx, dy);
      $.requestAnimationFrame(animationLoop);
    })();
  };

  $.smoothScrollBy = function(elem, x, y, d) {
    if (x) {
      scrollXElem = elem;
    } else {
      scrollElem = elem;
    }
    if (!$.scrollKeyUp && x === lastX && y === lastY) {
      if (!holdKeyScroll) {
        holdKeyScroll = true;
        holdFunction(x * 0.25, y * 0.25);
      }
      return;
    }
    lastX = x;
    lastY = y;
    $.scrollKeyUp = false;
    holdKeyScroll = false;
    if (x) {
      var oldDx = scrollx.x1 - scrollx.xc;
      $.cancelAnimationFrame(animationXFrame);
      scrollx.dx = d;
      scrollx.x0 = scrollXElem.scrollLeft;
      scrollx.x1 = oldDx + scrollx.x0 + x;
      scrollx.tx = 0;
      scrollx.txo = timeFn();
      scrollXFunction();
    }
    if (y) {
      var oldDy = scroll.y1 - scroll.yc;
      scroll.dy = d;
      scroll.y0 = scrollElem.scrollTop;
      scroll.y1 = oldDy + scroll.y0 + y;
      scroll.ty = 0;
      scroll.tyo = timeFn();
      $.cancelAnimationFrame(animationYFrame);
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

  var direction = (function() {
    switch (type) {
    case 'up': case 'pageUp': case 'fullPageUp': case 'top':
      return SCROLLABLE_Y_UP;
    case 'left': case 'leftmost':
      return SCROLLABLE_X_LEFT;
    case 'right': case 'rightmost':
      return SCROLLABLE_X_RIGHT;
    default:
      return SCROLLABLE_Y_DOWN;
    }
  })();
  var scrollElem = scrollingElement(direction);
  var seHeight = scrollElem === document.body ?
    document.documentElement.clientHeight :
    scrollElem.clientHeight;
  var seWidth = scrollElem === document.body ?
    document.documentElement.clientWidth :
    scrollElem.clientWidth;

  if (settings && settings.smoothscroll) {

    switch (type) {
      case 'down':
        window.smoothScrollBy(scrollElem, 0, repeats * stepSize, settings.scrollduration);
        break;
      case 'up':
        window.smoothScrollBy(scrollElem, 0, -repeats * stepSize, settings.scrollduration);
        break;
      case 'pageDown':
        window.smoothScrollBy(scrollElem, 0, repeats * seHeight / 2, settings.scrollduration);
        break;
      case 'fullPageDown':
        window.smoothScrollBy(scrollElem, 0, repeats * seHeight * (settings.fullpagescrollpercent / 100 || 1), settings.scrollduration);
        break;
      case 'pageUp':
        window.smoothScrollBy(scrollElem, 0, -repeats * seHeight / 2, settings.scrollduration);
        break;
      case 'fullPageUp':
        window.smoothScrollBy(scrollElem, 0, -repeats * seHeight * (settings.fullpagescrollpercent / 100 || 1), settings.scrollduration);
        break;
      case 'top':
        window.smoothScrollBy(scrollElem, 0, -scrollElem.scrollTop, settings.scrollduration);
        break;
      case 'bottom':
        window.smoothScrollTo(scrollElem, scrollElem.scrollLeft, scrollElem.scrollHeight - seHeight, settings.scrollduration);
        break;
      case 'left':
        window.smoothScrollBy(scrollElem, repeats * -stepSize / 2, 0, settings.scrollduration);
        break;
      case 'right':
        window.smoothScrollBy(scrollElem, repeats * stepSize / 2, 0, settings.scrollduration);
        break;
      case 'leftmost':
        window.smoothScrollBy(scrollElem, -scrollElem.scrollLeft - 10, 0, settings.scrollduration);
        break;
      case 'rightmost':
        window.smoothScrollBy(scrollElem, scrollElem.scrollWidth - scrollElem.scrollLeft - seWidth + 20, 0, settings.scrollduration);
        break;
      default:
        break;
    }

  } else {

    switch (type) {
      case 'down':
        $scrollBy(scrollElem, 0, repeats * stepSize);
        break;
      case 'up':
        $scrollBy(scrollElem, 0, -repeats * stepSize);
        break;
      case 'pageDown':
        $scrollBy(scrollElem, 0, repeats * seHeight / 2);
        break;
      case 'fullPageDown':
        $scrollBy(scrollElem, 0, repeats * seHeight * (settings.fullpagescrollpercent / 100 || 0.85));
        break;
      case 'pageUp':
        $scrollBy(scrollElem, 0, -repeats * seHeight / 2);
        break;
      case 'fullPageUp':
        $scrollBy(scrollElem, 0, -repeats * seHeight * (settings.fullpagescrollpercent / 100 || 0.85));
        break;
      case 'top':
        $scrollTo(scrollElem, 0, 0);
        break;
      case 'bottom':
        $scrollTo(scrollElem, 0, scrollElem.scrollHeight);
        break;
      case 'left':
        $scrollBy(scrollElem, -repeats * stepSize, 0);
        break;
      case 'right':
        $scrollBy(scrollElem, repeats * stepSize, 0);
        break;
      case 'leftmost':
        $scrollTo(scrollElem, 0, scrollElem.scrollTop);
        break;
      case 'rightmost':
        $scrollTo(scrollElem, scrollElem.scrollWidth - seWidth, scrollElem.scrollTop);
        break;
      default:
        break;
    }

  }

};
