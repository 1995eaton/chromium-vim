var Scroll = {};

var step = 60;
Scroll.scroll = function(type) {
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
