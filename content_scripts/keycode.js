var Keycode = {};
Keycode.map = {
    // korean
    12609: [97, 65], // U+3141, a
    12640: [98, 66], // U+3160, b
    12618: [99, 67], // U+314A, c
    12615: [100, 68], // U+3147, d
    12599: [101, 69], // U+3137, e
    12601: [102, 70], // U+3139, f
    12622: [103, 71], // U+314E, g
    12631: [104, 72], // U+3157, h
    12625: [105, 73], // U+3151, i
    12627: [106, 74], // U+3153, j
    12623: [107, 75], // U+314F, k
    12643: [108, 76], // U+3163, l
    12636: [109, 77], // U+315C, n
    12641: [110, 78], // U+3161, m
    12624: [111, 79], // U+3150, o
    12628: [112, 80], // U+3154, p
    12610: [113, 81], // U+3142, q
    12593: [114, 82], // U+3131, r
    12596: [115, 83], // U+3134, s
    12613: [116, 84], // U+3145, t
    12629: [117, 85], // U+3155, u
    12621: [118, 86], // U+314D, v
    12616: [119, 87], // U+3148, w
    12620: [120, 88], // U+314C, x
    12635: [121, 89], // U+315B, y
    12619: [122, 90] // U+314B, z
};
Keycode.needConvert = function(code) {
  return Keycode.map.hasOwnProperty(code);
};
Keycode.convert = function(event) {
  if (Keycode.needConvert(event.which)) {
    var newKeycode = Keycode.map[event.which][event.shiftKey ? 1 : 0];
    var newEvent = document.createEvent('KeyboardEvent');

    // chromium hacks
    Object.defineProperty(newEvent, 'keyCode', {
      get : function() {
        return newKeycode;
      }
    });
    Object.defineProperty(newEvent, 'which', {
      get : function() {
        return newKeycode;
      }
    });
    newEvent.initKeyboardEvent(event.type, event.bubbles, event.cancelable, event.view, String.fromCharCode(newKeycode), event.location, event.ctrlKey, event.altKey, event.shiftKey, event.metaKey);

    return newEvent;
  }
  return event;
}
