if (/https?:\/\/(www\.)?google\.com\/(_|webhp)/.test(document.URL)) {
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
