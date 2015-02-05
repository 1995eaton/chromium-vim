window.DOM = {
  isSubmittable: function(element) {
    if (element.localName !== 'input')
      return false;
    if (element.hasAttribute('submit'))
      return true;
    while (element = element.parentElement) {
      if (element.localName === 'form')
        return true;
    }
    return false;
  },
  isEditable: function(element) {
    if (element.localName === 'textarea' ||
        element.hasAttribute('contenteditable'))
      return true;
    if (element.localName !== 'input')
      return false;
    var type = element.getAttribute('type');
    switch (type) {
      case 'button':
      case 'checkbox':
      case 'color':
      case 'file':
      case 'hidden':
      case 'image':
      case 'radio':
      case 'reset':
      case 'submit':
      case 'week':
        return false;
    }
    return true;
  },
  preventAutoFocus: function() {
    var manualClick = false,
        wasBlurred = false;
    document.addEventListener('mousedown', function() {
      manualClick = true;
    }, true);
    window.addEventListener('blur', function() {
      wasBlurred = true;
    });
    document.addEventListener('focusin', function(event) {
      if (event.target && /input|textarea/.test(event.target.localName)) {
        if (!manualClick && !KeyHandler.hasPressedKey && !wasBlurred)
          event.target.blur();
        wasBlurred = manualClick = false;
      }
    }, true);
  }
};
