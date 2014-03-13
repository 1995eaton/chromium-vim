var Search = {};

Search.fetchQuery = function(query, callback) {
  var api = "http://suggestqueries.google.com/complete/search?client=firefox&q=";
  var xhr = new XMLHttpRequest();
  xhr.open("GET", api + query);
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4 && xhr.status === 200) {
      callback(JSON.parse(xhr.responseText)[1]);
    }
  };
  xhr.send();
};
