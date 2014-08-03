if (document.URL.indexOf('https://www.google.com/_/') === 0) {
  var pageAction = function() {
    init();
    window.removeEventListener('keydown', pageAction);
    window.removeEventListener('click', pageAction);
  };
  window.addEventListener('keydown', pageAction);
  window.addEventListener('click', pageAction);
} else {
  init();
}
