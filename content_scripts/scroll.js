var Scroll = {};
var step = 120;
var smooth = true;
Scroll.smooth = true;

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
  }
};
Scroll.smoothScrollBy = function(x, y) {
  var isVertical = (y) ? true : false;
  var duration = 50;
  var easeFunc = ease.outExpo;
  var i = 0;
  y *= 1.005;
  var delta = 0;
  var begin = setInterval(function() {
    if (isVertical) {
      window.scrollBy(0, Math.round(easeFunc(i, 0, y, duration) - delta));
    } else {
      window.scrollBy(Math.round(easeFunc(i, 0, x, duration) - delta), 0);
    }
    if (i > duration) {
      clearInterval(begin);
    }
    delta = easeFunc(i, 0, (x || y), duration);
    i += 1;

  }, 1000 / 60);
};

Scroll.scroll = function(type, repeats) {
  if (Scroll.smooth) {
    switch (type) {
      case "down":
        Scroll.smoothScrollBy(0, repeats * step);
        break;
      case "up":
        Scroll.smoothScrollBy(0, repeats * -step);
        break;
      case "pageDown":
        Scroll.smoothScrollBy(0, repeats * window.innerHeight / 2);
        break;
      case "pageUp":
        Scroll.smoothScrollBy(0, -repeats * window.innerHeight / 2);
        break;
      case "top":
        Scroll.smoothScrollBy(0, -document.body.scrollTop);
        break;
      case "bottom":
        Scroll.smoothScrollBy(0, document.body.scrollHeight - document.body.scrollTop - window.innerHeight);
        break;
      case "left":
        Scroll.smoothScrollBy(repeats * -step / 2, 0);
        break;
      case "right":
        Scroll.smoothScrollBy(repeats * step / 2, 0);
        break;
      default:
        break;
    }
  } else {
    switch (type) {
      case "down":
        scrollBy(0, step);
        break;
      case "up":
        scrollBy(0, -1 * step);
        break;
      case "pageDown":
        scrollBy(0, window.innerHeight / 2);
        break;
      case "pageUp":
        scrollBy(0, window.innerHeight / -2);
        break;
      case "top":
        scrollTo(0, 0);
        break;
      case "bottom":
        scrollTo(0, document.body.offsetHeight);
        break;
      case "left":
        scrollBy(-1 * step, 0);
        break;
      case "right":
        scrollBy(step, 0);
        break;
      default:
        break;
    }
  }
}
