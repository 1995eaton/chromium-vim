var Scroll = {};
var step = 120;
var smooth = true;
Scroll.smooth = true;

easeOutExpo = function (t, b, c, d) {
	return c * ( -Math.pow( 2, -10 * t/d ) + 1 ) + b;
};

easeOutSine = function (t, b, c, d) {
	return c * Math.sin(t/d * (Math.PI/2)) + b;
};

Scroll.smoothScrollBy = function(x, y) {
  var direction = (x == 0)? "vertical" : "horizontal";
  var duration = 45;
  var scale = 1;
  y *= scale;
  var i = 0;
  var begin = setInterval(function() {
    if (direction === "horizontal") {
      window.scrollBy(easeOutExpo(i, i/duration*x, -i/duration*x, duration), 0);
    } else {
      window.scrollBy(0, easeOutExpo(i, i/duration*y, -i/duration*y, duration));
    }
    i += 1;
    if (i >= duration) {
      clearInterval(begin);
    }

  }, 1000 / 60);
};

Scroll.scroll = function(type) {
  if (Scroll.smooth) {
    switch (type) {
      case "down":
        Scroll.smoothScrollBy(0, step);
        break;
      case "up":
        Scroll.smoothScrollBy(0, -step);
        break;
      case "pageDown":
        Scroll.smoothScrollBy(0, window.innerHeight / 2);
        break;
      case "pageUp":
        Scroll.smoothScrollBy(0, -1 * window.innerHeight / 2);
        break;
      case "top":
        Scroll.smoothScrollBy(0, document.body.scrollTop * -1.1);
        break;
      case "bottom":
        Scroll.smoothScrollBy(0, (document.body.scrollHeight - document.body.scrollTop) * 1.1);
        break;
      case "left":
        Scroll.smoothScrollBy(-step, 0);
        break;
      case "right":
        Scroll.smoothScrollBy(step, 0);
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
