var Keycode = {};
Keycode.map = {
  'korean': {
    12609: 97, // U+3141, a
    12640: 98, // U+3160, b
    12618: 99, // U+314A, c
    12615: 100, // U+3147, d
    12599: 101, // U+3137, e
    12601: 102, // U+3139, f
    12622: 103, // U+314E, g
    12631: 104, // U+3157, h
    12625: 105, // U+3151, i
    12627: 106, // U+3153, j
    12623: 107, // U+314F, k
    12643: 108, // U+3163, l
    12636: 109, // U+315C, n
    12641: 110, // U+3161, m
    12624: 111, // U+3150, o
    12628: 112, // U+3154, p
    12610: 113, // U+3142, q
    12593: 114, // U+3131, r
    12596: 115, // U+3134, s
    12613: 116, // U+3145, t
    12629: 117, // U+3155, u
    12621: 118, // U+314D, v
    12616: 119, // U+3148, w
    12620: 120, // U+314C, x
    12635: 121, // U+315B, y
    12619: 122, // U+314B, z
  },
};

// If the code can be converted, return the keyboard layout.
// Otherwise, return undefined.
Keycode.needConvert = function(code) {
  for (var layout in Keycode.map) {
    if (Keycode.map.hasOwnProperty(layout)) {
      if (Keycode.map[layout].hasOwnProperty(code)) {
        return layout;
      }
    }
  }
  return undefined;
};

Keycode.convert = function(event) {
  var layout = Keycode.needConvert(event.which);
  if (layout !== undefined) {
    var newKeycode = Keycode.map[layout][event.which];
    if (event.shiftKey) {
      newKeycode -= 32; // to upper case
    }

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
