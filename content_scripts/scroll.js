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
var endScale = 1.6;
Scroll.smoothScrollBy = function(x, y, ignoreRepeats) {

  if (!ignoreRepeats) {
    if (document.body.scrollTop + y < 0)
      y = (-document.body.scrollTop - window.innerHeight) * endScale;
    else if (document.body.scrollTop + y > document.body.scrollHeight)
      y = (document.body.scrollHeight - document.body.scrollTop) * endScale;
    else if (document.body.scrollLeft + x < 0)
      x = (-document.body.scrollLeft - window.innerWidth) * endScale;
    else if (document.body.scrollLeft + x > document.body.scrollWidth)
      x = (document.body.scrollWidth - document.body.scrollLeft) * endScale;
  }

  var direction = (x == 0)? "vertical" : "horizontal";
  var duration = 30;
  var scale = 1;
  y *= scale;
  var i = 0;
  var begin = setInterval(function() {
    if (direction === "horizontal") {
      window.scrollBy(ease.outQuint(i, i/duration*x, -i/duration*x, duration), 0);
    } else {
      window.scrollBy(0, ease.outQuint(i, i/duration*y, -i/duration*y, duration));
    }
    i += 1;
    if (i >= duration) {
      clearInterval(begin);
    }

  }, 1000 / 60);
};

Scroll.scroll = function(type, repeats) {
  if (Scroll.smooth) {
    switch (type) {
      case "down":
        Scroll.smoothScrollBy(0, repeats * step, repeats === 1);
        break;
      case "up":
        Scroll.smoothScrollBy(0, repeats * -step, repeats === 1);
        break;
      case "pageDown":
        Scroll.smoothScrollBy(0, repeats * window.innerHeight / 2, repeats === 1);
        break;
      case "pageUp":
        Scroll.smoothScrollBy(0, -repeats * window.innerHeight / 2, repeats === 1);
        break;
      case "top":
        Scroll.smoothScrollBy(0, document.body.scrollTop * -endScale, true);
        break;
      case "bottom":
        Scroll.smoothScrollBy(0, (document.body.scrollHeight - document.body.scrollTop) * endScale, true);
        break;
      case "left":
        Scroll.smoothScrollBy(repeats * -step / 2, 0, repeats === 1);
        break;
      case "right":
        Scroll.smoothScrollBy(repeats * step / 2, 0, repeats === 1);
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
