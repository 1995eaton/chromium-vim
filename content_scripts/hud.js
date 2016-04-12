var HUD = {
  visible: false,
  slideDuration: 40
};

HUD.transitionEvent = function() {
  if (HUD.overflowValue) {
    document.body.style.overflowX = HUD.overflowValue;
  }
  delete HUD.overflowValue;
  HUD.element.removeEventListener('transitionend', HUD.transitionEvent, true);
  HUD.element.parentNode.removeChild(HUD.element);
  delete HUD.element;
  HUD.visible = false;
  HUD.transition = false;
};

HUD.hide = function(ignoreSetting) {
  if (!ignoreSetting) {
    if (!settings.hud || this.element === void 0) {
      return false;
    }
    if (Find.matches.length) {
      return HUD.display(Find.index + 1 + ' / ' + Find.matches.length);
    }
  }
  if (!this.element) {
    return false;
  }
  HUD.transition = true;
  this.element.addEventListener('transitionend', this.transitionEvent, true);
  var width = this.element.offsetWidth;
  this.element.style.right = -width + 'px';
};

HUD.setMessage = function(text, duration) {
  window.clearTimeout(this.hideTimeout);
  if (!settings.hud || this.element === void 0) {
    return false;
  }
  this.element.firstElementChild.textContent = text;
  if (duration) {
    this.hideTimeout = window.setTimeout(function() {
      HUD.hide();
    }, duration * 1000);
  }
};

HUD.display = function(text, duration) {
  if (HUD.visible && HUD.transition) {
    this.element.removeEventListener('transitionend', this.transitionEvent, true);
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    delete this.element;
  }
  HUD.visible = true;
  if (!settings.hud || HUD.element !== void 0) {
    return HUD.setMessage(text, duration);
  }
  if (this.element) {
    this.element.removeEventListener('transitionend', this.transitionEvent, true);
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    delete this.element;
  }
  window.clearTimeout(this.hideTimeout);
  var span, pageWidth, screenWidth;
  if (!this.element) {
    this.element = document.createElement('div');
    this.element.id  = 'cVim-hud';
    if (Command.onBottom) {
      this.element.style.bottom = 'initial';
      this.element.style.top    = '0';
    }
  }
  this.element.innerHTML = '';
  span = document.createElement('span');
  span.textContent = text;
  this.element.appendChild(span);

  try {
    document.lastElementChild.appendChild(this.element);
  } catch (e) {
    if (document.body === void 0) {
      return false;
    } else {
      document.body.appendChild(this.element);
    }
  }

  this.element.style.right = -this.element.offsetWidth + 'px';

  screenWidth = document.documentElement.clientWidth;
  pageWidth   =  document.body.scrollWidth;
  if (screenWidth === pageWidth) {
    this.overflowValue = getComputedStyle(document.body).overflowX;
    document.body.style.overflowX = 'hidden';
  }

  this.element.style.right = '0';

  if (duration) {
    this.hideTimeout = window.setTimeout(function() {
      HUD.hide();
    }, duration * 1000);
  }

};
