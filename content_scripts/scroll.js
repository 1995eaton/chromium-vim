var Scroll = {};

Scroll.stepSize = 75;
Scroll.smoothScroll = true;

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

  var isVertical = (y) ? true : false,
      duration = 30,
      easeFunc = ease.outExpo,
      i = 0,
      delta = 0;

  function animLoop() {

    if (isVertical) {
      window.scrollBy(0, Math.round(easeFunc(i, 0, y, duration) - delta));
    } else {
      window.scrollBy(Math.round(easeFunc(i, 0, x, duration) - delta), 0);
    }

    if (i < duration) {
      window.requestAnimationFrame(animLoop);
    }

    delta = easeFunc(i, 0, (x || y), duration);
    i += 1;
  }

  animLoop();
};

Scroll.scroll = function(type, repeats) {

  if (Scroll.smoothScroll) {

    switch (type) {
      case "down":
        Scroll.smoothScrollBy(0, repeats * this.stepSize);
        break;
      case "up":
        Scroll.smoothScrollBy(0, -repeats * this.stepSize);
        break;
      case "pageDown":
        Scroll.smoothScrollBy(0, repeats * window.innerHeight / 2);
        break;
      case "pageUp":
        Scroll.smoothScrollBy(0, -repeats * window.innerHeight / 2);
        break;
      case "top":
        Scroll.smoothScrollBy(0, -document.body.scrollTop - 10);
        break;
      case "bottom":
        Scroll.smoothScrollBy(0, document.body.scrollHeight - document.body.scrollTop - window.innerHeight + 10);
        break;
      case "left":
        Scroll.smoothScrollBy(repeats * -this.stepSize / 2, 0);
        break;
      case "right":
        Scroll.smoothScrollBy(repeats * this.stepSize / 2, 0);
        break;
      default:
        break;
    }

  } else {

    switch (type) {
      case "down":
        scrollBy(0, repeats * this.stepSize);
        break;
      case "up":
        scrollBy(0, -repeats * this.stepSize);
        break;
      case "pageDown":
        scrollBy(0, repeats * window.innerHeight / 2);
        break;
      case "pageUp":
        scrollBy(0, -repeats * window.innerHeight / 2);
        break;
      case "top":
        scrollTo(0, 0);
        break;
      case "bottom":
        scrollTo(0, document.body.offsetHeight);
        break;
      case "left":
        scrollBy(-repeats * this.stepSize, 0);
        break;
      case "right":
        scrollBy(repeats * this.stepSize, 0);
        break;
      default:
        break;
    }

  }
};
