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
    var style = getComputedStyle(node, null);
    if (style.visibility !== 'visible' ||
        style.display === 'none') {
      return null;
    }

    var rects = node.getClientRects();
    if (rects.length === 0)
      return null;

    var result = null;

    outer:
    for (var i = 0; i < rects.length; i++) {
      var r = rects[i];

      if (r.height <= 1 || r.width <= 1) {
        var children = node.children;
        for (var j = 0; j < children.length; j++) {
          var child = children[j];
          var childRect = this.getVisibleBoundingRect(child);
          if (childRect !== null) {
            result = childRect;
            break outer;
          }
        }
      } else {
        if (r.left + r.width < 5 || r.top + r.height < 5)
          continue;
        if (innerWidth - r.left < 5 || innerHeight - r.top < 5)
          continue;

        result = r;
        break;
      }
    }
    if (result !== null) {
      result = this.cloneRect(result);
      result.left = Math.max(0, result.left);
      result.top = Math.max(0, result.top);
      result.right = Math.min(result.right, innerWidth);
      result.bottom = Math.min(result.bottom, innerHeight);
    }

    return result;
  },

  // makes bounding rect writeable
  cloneRect: function(rect) {
    return {
      left: rect.left,
      right: rect.right,
      top: rect.top,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
    };
  },

  getVisibleBoundingAreaRect: function(node) {
    var map = node.parentElement;
    if (!map || map.localName.toLowerCase() !== 'map')
      return null;
    var mapName = map.getAttribute('name');
    if (!mapName)
      return null;
    var mapImg = document.querySelector('*[usemap="#' + mapName + '"]');
    if (!mapImg)
      return null;
    var mapImgRect = DOM.getVisibleBoundingRect(mapImg);
    if (mapImgRect === null)
      return null;
    var coords = node.coords.split(',').map(function(coord) {
      return parseInt(coord, 10);
    });
    return {
      left: mapImgRect.left + coords[0],
      right: mapImgRect.left + coords[2],
      top: mapImgRect.top + coords[1],
      bottom: mapImgRect.top + coords[3],
      width: this.right - this.left,
      height: this.bottom - this.top,
    };
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
