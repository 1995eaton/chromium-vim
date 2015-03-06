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
  },
  nodeSelectorMatch: function(node, selector) {
    if (selector.indexOf('[') === -1 && selector.indexOf(' ') === -1) {
      switch (selector.charAt(0)) {
      case '.':
        return node.className === selector.slice(1).split('.').join(' ');
      case '#':
        return node.id === selector.slice(1);
      }
    }
    var fragment = document.createDocumentFragment();
    fragment.appendChild(node.cloneNode(false));
    return !!fragment.querySelector(selector);
  },
  onTitleChange: function(callback) {
    waitForLoad(function() {
      var title = (document.getElementsByTagName('title') || [])[0];
      if (!title) {
        return;
      }
      new MutationObserver(function() {
        callback(title.textContent);
      }).observe(title, {
        childList: true
      });
    });
  }
};
