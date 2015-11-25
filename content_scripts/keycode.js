var Keycode = {};
Keycode.map = {
  'arabic': {
    1642: 37, // U+066A, %
    1563: 39, // U+061B, '
    1548: 44, // U+060C, ,
    1632: 48, // U+0660, 0
    1633: 49, // U+0661, 1
    1634: 50, // U+0662, 2
    1635: 51, // U+0663, 3
    1636: 52, // U+0664, 4
    1637: 53, // U+0665, 5
    1638: 54, // U+0666, 6
    1639: 55, // U+0667, 7
    1640: 56, // U+0668, 8
    1641: 57, // U+0669, 9
    1603: 59, // U+0643, ;
    1567: 63, // U+061F, ?
    171: 65, // U+00AB, A
    1571: 66, // U+0623, B
    1574: 67, // U+0626, C
    1609: 68, // U+0649, D
    1616: 69, // U+0650, E
    1570: 72, // U+0622, H
    1617: 73, // U+0651, I
    1643: 75, // U+066B, K
    1644: 76, // U+066C, L
    1572: 77, // U+0624, M
    1573: 78, // U+0625, N
    1614: 81, // U+064E, Q
    1613: 82, // U+064D, R
    187: 83, // U+00BB, S
    1615: 84, // U+064F, T
    1618: 85, // U+0652, U
    1569: 86, // U+0621, V
    1611: 87, // U+064B, W
    1612: 89, // U+064C, Y
    1580: 91, // U+062C, [
    1577: 93, // U+0629, ]
    1600: 96, // U+0640, `
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
    1608: 109, // U+0648, m
    1585: 110, // U+0631, n
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
  },
  'korean': {
    12600: 69, // U+3138, E
    12626: 79, // U+3152, O
    12630: 80, // U+3156, P
    12611: 81, // U+3143, Q
    12594: 82, // U+3132, R
    12614: 84, // U+3146, T
    12617: 87, // U+3149, W
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
    12641: 109, // U+3161, m
    12636: 110, // U+315C, n
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
