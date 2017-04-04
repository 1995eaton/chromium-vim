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
  function isScrollableDelta(elem, scrollType, delta) {
    var origin = elem[scrollType];
    elem[scrollType] += delta;
    if (origin === elem[scrollType]) return false;
    else elem[scrollType] -= delta;
    return true;
  }

  function isScrollable(elem, scrollType) {
    return isScrollableDelta(elem, scrollType, 1) || isScrollableDelta(elem, scrollType, -1);
  }

  function getScrollType(elem) {
    var cs = getComputedStyle(elem);
    var st = NON_SCROLLABLE;
    if (cs.overflow === 'hidden')
      return st;
    if (cs.overflowX !== 'hidden' && isScrollable(elem, "scrollLeft")) {
      if (elem.scrollLeft > 0)
        st |= SCROLLABLE_X_LEFT;
      if (elem.scrollLeft + elem.clientWidth < elem.scrollWidth)
        st |= SCROLLABLE_X_RIGHT;
    }
    if (cs.overflowY !== 'hidden' && isScrollable(elem, "scrollTop")) {
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

  document.addEventListener('mousedown', function(event) {
    clickFocus = true;
    lastActiveElem = event.srcElement;
  });

  return function scrollingElement(dir) {
    var scrollType = (function() {
      switch (dir) {
      case SCROLLABLE_X_RIGHT: case SCROLLABLE_X_LEFT:
        return "scrollLeft";
      default:
        return "scrollTop";
      }
    })();

    var elem;
    if (clickFocus) {
      elem = lastActiveElem;
    } else {
      elem = lastActiveElem = document.activeElement;

      if (elem === document.body && !isScrollable(document.activeElement, scrollType)) {
        var elem_candidates = document.elementsFromPoint(window.innerWidth/2, window.innerHeight/2);
        for (var e of elem_candidates) {
          if (getScrollType(e) & dir) {
            elem = lastActiveElem = e;
            break;
          }
        }
      }
    }

    if (elem === null)
      return null;
    return (function climb(elem) {
      if (elem === null)
        return lastScrollElem || document.scrollingElement;
      if (elem === document.scrollingElement)
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
    return (t === d) ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b;
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
  var scrollx = Object.clone(scroll);

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
    this.lastPosition = [document.scrollingElement.scrollLeft, document.scrollingElement.scrollTop];
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

  var scrollElem = scrollingElement(direction),
      hy = scrollElem === document.body ? innerHeight : scrollElem.clientHeight,
      hw = scrollElem === document.body ? innerWidth  : scrollElem.clientWidth,
      x = 0,
      y = 0;

  switch (type) {
  case 'down':
    y = repeats * stepSize;
    break;
  case 'up':
    y -= repeats * stepSize;
    break;
  case 'pageDown':
    y = repeats * hy >> 1;
    break;
  case 'fullPageDown':
    y = repeats * hy * (settings.fullpagescrollpercent / 100 || 1);
    break;
  case 'pageUp':
    y -= repeats * hy >> 1;
    break;
  case 'fullPageUp':
    y -= repeats * hy * (settings.fullpagescrollpercent / 100 || 1);
    break;
  case 'top':
    y -= scrollElem.scrollTop;
    break;
  case 'bottom':
    y = scrollElem.scrollHeight - scrollElem.scrollTop - hy + 20;
    break;
  case 'left':
    x -= repeats * stepSize >> 1;
    break;
  case 'right':
    x = repeats * stepSize >> 1;
    break;
  case 'leftmost':
    x -= scrollElem.scrollLeft;
    break;
  case 'rightmost':
    x = scrollElem.scrollWidth - scrollElem.scrollLeft - hw + 20;
    break;
  }

  if (settings && settings.smoothscroll) {
    window.smoothScrollBy(scrollElem, x, y, settings.scrollduration);
  } else {
    $scrollBy(scrollElem, x, y);
  }

};
