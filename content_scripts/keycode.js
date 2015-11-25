var Keycode = {};
Keycode.map = {
  'arabic': {
    1588: 97, // U+0634, a
    1586: 98, // U+0632, b
    1584: 99, // U+0630, c
    1610: 100, // U+064A, d
    1579: 101, // U+062B, e
    1576: 102, // U+0628, f
    1604: 103, // U+0644, g
    1575: 104, // U+0627, h
    1607: 105, // U+0647, i
    1578: 106, // U+062A, j
    1606: 107, // U+0646, k
    1605: 108, // U+0645, l
    1585: 109, // U+0631, m
    1608: 110, // U+0648, n
    1582: 111, // U+062E, o
    1581: 112, // U+062D, p
    1590: 113, // U+0636, q
    1602: 114, // U+0642, r
    1587: 115, // U+0633, s
    1601: 116, // U+0641, t
    1593: 117, // U+0639, u
    1583: 118, // U+062F, v
    1589: 119, // U+0635, w
    1591: 120, // U+0637, x
    1594: 121, // U+063A, y
    1592: 122, // U+0638, z
    1600: 96, // U+0640, `
    1633: 49, // U+0661, 1
    1634: 50, // U+0662, 2
    1635: 51, // U+0663, 3
    1636: 52, // U+0664, 4
    1637: 53, // U+0665, 5
    1638: 54, // U+0666, 6
    1639: 55, // U+0667, 7
    1640: 56, // U+0668, 8
    1641: 57, // U+0669, 9
    1632: 48, // U+0660, 0
    1563: 39, // U+061B, '
    1548: 44, // U+060C, ,
  },
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
