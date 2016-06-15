(function() {

  function get_params() {
    var match,
        pl     = /\+/g,  // Regex for replacing addition symbol with a space
        search = /([^&=]+)=?([^&]*)/g,
        decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
        query  = window.location.search.substring(1);

    params = {};
    while (match = search.exec(query))
      params[decode(match[1])] = decode(match[2]);
    return params;
  }

  var params = get_params();
  if(params.url)
    window.location.href = params.url;
})();
