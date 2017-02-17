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
        element.localName === 'select' ||
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
  },

  /**
   * Retrieves the proper boundingRect of an element if it is visible on-screen.
   * @return boundingRect or null (if element is not visible on-screen)
   */
  getVisibleBoundingRect: function(node) {
    var i;
    var boundingRect = node.getClientRects()[0] || node.getBoundingClientRect();
    if (boundingRect.width <= 1 && boundingRect.height <= 1) {
      var rects = node.getClientRects();
      for (i = 0; i < rects.length; i++) {
        if (rects[i].width > rects[0].height && rects[i].height > rects[0].height) {
          boundingRect = rects[i];
        }
      }
    }
    if (boundingRect === void 0) {
      return null;
    }
    if (boundingRect.top > innerHeight || boundingRect.left > innerWidth) {
      return null;
    }
    if (boundingRect.width <= 1 || boundingRect.height <= 1) {
      var children = node.children;
      var visibleChildNode = false;
      for (i = 0, l = children.length; i < l; ++i) {
        boundingRect = children[i].getClientRects()[0] || children[i].getBoundingClientRect();
        if (boundingRect.width > 1 && boundingRect.height > 1) {
          visibleChildNode = true;
          break;
        }
      }
      if (visibleChildNode === false) {
        return null;
      }
    }
    if (boundingRect.top + boundingRect.height < 10 || boundingRect.left + boundingRect.width < -10) {
      return null;
    }
    var computedStyle = getComputedStyle(node, null);
    if (computedStyle.visibility !== 'visible' ||
        computedStyle.display === 'none' ||
        node.hasAttribute('disabled') ||
        parseInt(computedStyle.width, 10) === 0 ||
        parseInt(computedStyle.height, 10) === 0) {
      return null;
    }
    return boundingRect;
  },

  /**
   * Checks if an element is visible (not necessarily on-screen)
   */
  isVisible: function(element) {
    if (!(element instanceof Element))
      return false;
    return element.offsetParent &&
      !element.disabled &&
      element.getAttribute('type') !== 'hidden' &&
      getComputedStyle(element).visibility !== 'hidden' &&
      element.getAttribute('display') !== 'none';
  },

  mouseEvent: function(type, element) {
    var events;
    switch (type) {
    case 'hover': events = ['mouseover', 'mouseenter']; break;
    case 'unhover': events = ['mouseout', 'mouseleave']; break;
    case 'click': events = ['mouseover', 'mousedown', 'mouseup', 'click']; break;
    }
    events.forEach(function(eventName) {
      var event = document.createEvent('MouseEvents');
      event.initMouseEvent(eventName, true, true, window, 1, 0, 0, 0, 0, false,
          false, false, false, 0, null);
      element.dispatchEvent(event);
    });
  }

};
