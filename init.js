if (document.URL.indexOf('https://www.google.com/_/') === 0) {
  window.addEventListener('load', function() {
    window.setTimeout(init, 1500);
  });
} else {
  init();
}
