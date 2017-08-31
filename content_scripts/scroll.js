var Scroll = {
  positions: {},
  history: [],
  historyIndex: 0,
};

const NON_SCROLLABLE     = 0,
      SCROLLABLE_Y_DOWN  = 1,
      SCROLLABLE_Y_UP    = 2,
      SCROLLABLE_X_RIGHT = 4,
      SCROLLABLE_X_LEFT  = 8,
      SCROLLABLE = SCROLLABLE_X_LEFT | SCROLLABLE_X_RIGHT |
                   SCROLLABLE_Y_UP | SCROLLABLE_Y_DOWN;
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

  document.addEventListener('mousedown', function(event) {
    if (!event.isTrusted)
      return true;
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
    dy:   0,
    callback: null,
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
      if (scroll.callback)
        scroll.callback();
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
      if (scroll.callback)
        scroll.callback();
    }
  };

  $.setSmoothScrollEaseFN = function(fn) {
    easeFn = fn;
  };

  $.smoothScrollTo = function(elem, x, y, d, callback) {
    scrollElem = elem;
    $.cancelAnimationFrame(animationXFrame);
    $.cancelAnimationFrame(animationYFrame);
    scroll.dx = scroll.dy = d;
    scrollx.dx = scrollx.dy = d;
    scroll.callback = callback || function() {};
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

  $.smoothScrollBy = function(elem, x, y, d, callback) {
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
    scroll.callback = callback || function() {};
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

Scroll.historyStateEquals = function(s1, s2) {
  if (!s1 || !s2)
    return false;
  return s1[0] === s2[0] &&
    s1[1] === s2[1] &&
    s1[2] === s2[2];
};

Scroll.scrollToHistoryState = function(index) {
  index = index || this.historyIndex;
  var state = this.history[index];
  if (!state)
    return;
  var scrollElem = state[0];
  scrollElem.scrollLeft = state[1];
  scrollElem.scrollTop = state[2];
  this.historyIndex = index;
};

Scroll.previousHistoryState = function() {
  if (!this.historyStateEquals(this.lastState(), this.currentState()))
    this.addHistoryState();
  if (this.historyIndex > 0) {
    this.historyIndex--;
    this.scrollToHistoryState(this.historyIndex);
  }
};

Scroll.nextHistoryState = function() {
  if (this.historyIndex + 1 < this.history.length) {
    this.historyIndex++;
    this.scrollToHistoryState(this.historyIndex);
  }
};

Scroll.currentState = function() {
  // TODO make work with nested scrolling elements
  // var scrollElem = scrollingElement(SCROLLABLE);

  var scrollElem = document.scrollingElement;
  if (!scrollElem)
    return null;
  return [scrollElem, scrollElem.scrollLeft, scrollElem.scrollTop];
};

Scroll.lastState = function() {
  if (this.historyIndex >= this.history.length)
    return null;
  return this.history[this.historyIndex];
};

Scroll.addHistoryState = function() {
  var nextState = this.currentState();
  if (!nextState)
    return false;
  if (this.historyIndex + 1 < this.history.length)
    this.history = this.history.slice(0, this.historyIndex + 1);
  if (this.history.length) {
    if (this.historyStateEquals(this.lastState(), nextState))
      return false;
  }
  this.history.push(nextState);
  this.historyIndex = this.history.length - 1;
  return true;
};

Scroll.scroll = function(type, repeats) {

  var stepSize = settings ? settings.scrollstep : 60;

  var shouldLogPosition = !/^(up|down|left|right|pageUp|pageDown)$/.test(type);
  if (document.body && shouldLogPosition) {
    this.lastPosition = [document.scrollingElement.scrollLeft, document.scrollingElement.scrollTop];
    Scroll.addHistoryState();
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
