window.DOM = {
  isSubmittable: function(element) {
    if (!element) {
      return false;
    }
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
    if (!element) {
      return false;
    }
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
  isTextElement: function(element) {
    if (!element) {
      return false;
    }
    if (element.localName === 'input' || element.localName === 'textarea') {
      return true;
    }
    while (element) {
      if (element.isContentEditable) {
        return true;
      }
      element = element.parentElement;
    }
    return false;
  }
};
