var Clipboard = {};

Clipboard.createTextArea = function() {
  var t = document.createElement('textarea');
  t.style.position = 'absolute';
  t.style.left = '-100%';
  return t;
};

Clipboard.copy = function(text) {
  var t = this.createTextArea();
  t.value = text;
  document.body.appendChild(t);
  t.select();
  document.execCommand('Copy');
  document.body.removeChild(t);
};

Clipboard.copyHtmlFormatted = function(nodeObj) {
  var convertToNode = function(parent, nodeObj) {
    for (var key in nodeObj) {
      if (key.indexOf('@') === 0) {
        parent.setAttribute(key.substr(1), nodeObj[key]);
      } else if (key === '_') {
        var child = document.createTextNode(nodeObj[key]);
        parent.appendChild(child);
      } else {
        var tag = document.createElement(key);
        parent.appendChild(convertToNode(tag, nodeObj[key]));
      }
    }
    return parent;
  };

  var wrapper = document.createElement('div');
  var node = convertToNode(wrapper, nodeObj);
  document.body.appendChild(node);
  var r = document.createRange();
  r.selectNode(wrapper);
  var s = window.getSelection();
  s.removeAllRanges();
  s.addRange(r);
  document.execCommand('Copy');
  wrapper.remove();
};

Clipboard.paste = function() {
  var t = this.createTextArea();
  document.body.appendChild(t);
  t.focus();
  document.execCommand('Paste');
  var text = t.value;
  document.body.removeChild(t);
  return text;
};
