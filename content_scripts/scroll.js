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

  this.isScrolling = true;
  function animLoop() {

    if (isVertical) {
      window.scrollBy(0, Math.round(easeFunc(i, 0, y, settings.scrollduration) - delta));
    } else {
      window.scrollBy(Math.round(easeFunc(i, 0, x, settings.scrollduration) - delta), 0);
    }

    if (i < settings.scrollduration) {
      window.requestAnimationFrame(animLoop);
    } else {
      Scroll.isScrolling = false;
    }

    delta = easeFunc(i, 0, (x || y), settings.scrollduration);
    i += 1;
  }

  animLoop();
};

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
        Scroll.smoothScrollBy(0, -document.body.scrollTop - 10);
        break;
      case 'bottom':
        Scroll.smoothScrollBy(0, document.body.scrollHeight - document.body.scrollTop - window.innerHeight + 10);
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
