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

Clipboard.copyHtmlFormatted = function(html) {
  var wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  document.body.appendChild(wrapper);
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
