var Scroll = {};

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
  outCirc: function (t, b, c, d) {
    t /= d;
    t--;
    return c * Math.sqrt(1 - t*t) + b;
  }
};

Scroll.smoothScrollBy = function(x, y) {

  var isVertical = (y) ? true : false,
      easeFunc = ease.outExpo,
      i = 0,
      delta = 0;

  function animLoop() {

    if (isVertical) {
      window.scrollBy(0, Math.round(easeFunc(i, 0, y, settings.scrollduration) - delta));
    } else {
      window.scrollBy(Math.round(easeFunc(i, 0, x, settings.scrollduration) - delta), 0);
    }

    if (i < settings.scrollduration) {
      window.requestAnimationFrame(animLoop);
    }

    delta = easeFunc(i, 0, (x || y), settings.scrollduration);
    i += 1;
  }

  animLoop();
};

Scroll.scroll = function(type, repeats) {

  if (settings.smoothscroll) {

    switch (type) {
      case "down":
        Scroll.smoothScrollBy(0, repeats * settings.scrollstep);
        break;
      case "up":
        Scroll.smoothScrollBy(0, -repeats * settings.scrollstep);
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
        Scroll.smoothScrollBy(repeats * -settings.scrollstep / 2, 0);
        break;
      case "right":
        Scroll.smoothScrollBy(repeats * settings.scrollstep / 2, 0);
        break;
      default:
        break;
    }

  } else {

    switch (type) {
      case "down":
        scrollBy(0, repeats * settings.scrollstep);
        break;
      case "up":
        scrollBy(0, -repeats * settings.scrollstep);
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
        scrollBy(-repeats * settings.scrollstep, 0);
        break;
      case "right":
        scrollBy(repeats * settings.scrollstep, 0);
        break;
      default:
        break;
    }

  }
};
