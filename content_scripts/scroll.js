var Scroll = {};
Scroll.positions = {};

var Easing = {
  // jQuery Easing v1.3 - http://gsgd.co.uk/sandbox/jquery/easing/
  // Open source under the BSD License.
  // Copyright © 2008 George McGinley Smith
  // All rights reserved.
  // https://raw.github.com/danro/jquery-easing/master/LICENSE
  inQuad: function(t, b, c, d) {
    return c*(t/=d)*t + b;
  },
  outQuad: function(t, b, c, d) {
    return -c *(t/=d)*(t-2) + b;
  },
  inOutQuad: function(t, b, c, d) {
    if ((t /= d/2) < 1) {
      return c/2*t*t + b;
    }
    return -c/2 * ((--t)*(t-2) - 1) + b;
  },
  inCubic: function(t, b, c, d) {
    return c*(t/=d)*t*t + b;
  },
  outCubic: function(t, b, c, d) {
    return c*((t=t/d-1)*t*t + 1) + b;
  },
  inOutCubic: function(t, b, c, d) {
    if ((t /= d/2) < 1) {
      return c/2*t*t*t + b;
    }
    return c/2*((t-=2)*t*t + 2) + b;
  },
  inQuart: function(t, b, c, d) {
    return c*(t/=d)*t*t*t + b;
  },
  outQuart: function(t, b, c, d) {
    return -c * ((t=t/d-1)*t*t*t - 1) + b;
  },
  inOutQuart: function(t, b, c, d) {
    if ((t /= d/2) < 1) {
      return c/2*t*t*t*t + b;
    }
    return -c/2 * ((t-=2)*t*t*t - 2) + b;
  },
  inQuint: function(t, b, c, d) {
    return c*(t/=d)*t*t*t*t + b;
  },
  outQuint: function(t, b, c, d) {
    return c*((t=t/d-1)*t*t*t*t + 1) + b;
  },
  inOutQuint: function(t, b, c, d) {
    if ((t /= d/2) < 1) {
      return c/2*t*t*t*t*t + b;
    }
    return c/2*((t-=2)*t*t*t*t + 2) + b;
  },
  inSine: function(t, b, c, d) {
    return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
  },
  outSine: function(t, b, c, d) {
    return c * Math.sin(t/d * (Math.PI/2)) + b;
  },
  inOutSine: function(t, b, c, d) {
    return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
  },
  inExpo: function(t, b, c, d) {
    return (t===0) ? b : c * Math.pow(2, 10 * (t/d - 1)) + b;
  },
  outExpo: function(t, b, c, d) {
    return (t===d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
  },
  inOutExpo: function(t, b, c, d) {
    if (t===0) {
      return b;
    }
    if (t===d) {
      return b+c;
    }
    if ((t /= d/2) < 1) {
      return c/2 * Math.pow(2, 10 * (t - 1)) + b;
    }
    return c/2 * (-Math.pow(2, -10 * --t) + 2) + b;
  },
  inCirc: function(t, b, c, d) {
    return -c * (Math.sqrt(1 - (t/=d)*t) - 1) + b;
  },
  outCirc: function(t, b, c, d) {
    return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
  },
  inOutCirc: function(t, b, c, d) {
    if ((t /= d/2) < 1) {
      return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
    }
    return c/2 * (Math.sqrt(1 - (t-=2)*t) + 1) + b;
  },
  inElastic: function(t, b, c, d) {
    var s=1.70158;var p=0;var a=c;
    if (t===0) {
      return b;
    }
    if ((t/=d)===1) {
      return b+c;
    }
    if (!p) {
      p=d*0.3;
    }
    if (a < Math.abs(c)) {
      a=c;
      s=p/4;
    } else {
      s = p/(2*Math.PI) * Math.asin (c/a);
    }
    return -(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
  },
  outElastic: function(t, b, c, d) {
    var s=1.70158;var p=0;var a=c;
    if (t===0) {
      return b;
    }
    if ((t/=d)===1) {
      return b+c;
    }
    if (!p) {
      p=d*0.3;
    }
    if (a < Math.abs(c)) {
      a=c;
      s=p/4;
    } else {
      s = p/(2*Math.PI) * Math.asin (c/a);
    }
    return a*Math.pow(2,-10*t) * Math.sin( (t*d-s)*(2*Math.PI)/p ) + c + b;
  },
  inOutElastic: function(t, b, c, d) {
    var s=1.70158;var p=0;var a=c;
    if (t===0) {
      return b;
    }
    if ((t /= d/2)===2) {
      return b+c;
    }
    if (!p) {
      p=d*(0.3*1.5);
    }
    if (a < Math.abs(c)) {
      a=c;
      s=p/4;
    } else {
      s = p/(2*Math.PI) * Math.asin (c/a);
    }
    if (t < 1) {
      return -0.5*(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
    }
    return a*Math.pow(2,-10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )*0.5 + c + b;
  },
  inBack: function(t, b, c, d, s) {
    if (s === undefined) {
      s = 1.70158;
    }
    return c*(t/=d)*t*((s+1)*t - s) + b;
  },
  outBack: function(t, b, c, d, s) {
    if (s === undefined) {
      s = 1.70158;
    }
    return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
  },
  inOutBack: function(t, b, c, d, s) {
    if (s === undefined) {
      s = 1.70158;
    }
    if ((t /= d/2) < 1) {
      return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
    }
    return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
  },
  outBounce: function(t, b, c, d) {
    if ((t/=d) < (1/2.75)) {
      return c*(7.5625*t*t) + b;
    } else if (t < (2/2.75)) {
      return c*(7.5625*(t-=(1.5/2.75))*t + 0.75) + b;
    } else if (t < (2.5/2.75)) {
      return c*(7.5625*(t-=(2.25/2.75))*t + 0.9375) + b;
    } else {
      return c*(7.5625*(t-=(2.625/2.75))*t + 0.984375) + b;
    }
  },
  inBounce: function(t, b, c, d) {
    return c - ease.outBounce (d-t, 0, c, d) + b;
  },
  inOutBounce: function(t, b, c, d) {
    if (t < d/2) {
      return ease.inBounce (t*2, 0, c, d) * 0.5 + b;
    }
    return ease.outBounce (t*2-d, 0, c, d) * 0.5 + c*0.5 + b;
  }
};

(function($) {

  var animationYFrame, animationXFrame,
      scrollXFunction, scrollYFunction;

  var easeFn = Easing.outExpo;
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

  $.smoothScrollBy = function(x, y, d) {
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
