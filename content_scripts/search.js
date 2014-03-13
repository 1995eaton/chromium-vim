var Search = {};

Search.index = null;

Search.fetchQuery = function(query, callback) {
  var api = "https://suggestqueries.google.com/complete/search?client=firefox&q=";
  var xhr = new XMLHttpRequest();
  xhr.open("GET", api + query);
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4 && xhr.status === 200) {
      callback(JSON.parse(xhr.responseText)[1]);
    }
  };
  xhr.send();
};

Search.go = function(tabbed) {
  var search = barInput.value.replace(/^(t|tab)?o(pen)?(\s+)/, "");
  if (/^(t|tabbed)/.test(barInput.value)) {
    chrome.runtime.sendMessage({action: "openLinkTab", url: "http://google.com/search?q=" + search});
  } else {
    chrome.runtime.sendMessage({action: "openLink", url: "http://google.com/search?q=" + search});
  }
};

Search.nextResult = function(reverse) {
  if (!dataElements.length) return;
  if (this.index === null) {
    if (!reverse) {
      this.index = 0;
    } else {
      this.index = dataElements.length - 1;
    }
  } else {
    dataElements[this.index].parentNode.style.backgroundColor = "";
    dataElements[this.index].parentNode.style.color = "";
    if (!reverse) {
      if (this.index + 1 < dataElements.length) {
        this.index++;
      } else {
        this.index = null;
        barInput.value = Command.typed;
        return;
      }
    } else {
      if (this.index === 0) {
        this.index = null;
        barInput.value = Command.typed;
        return;
      } else {
        this.index--;
      }
    }
  }
  dataElements[this.index].parentNode.style.backgroundColor = "#fefefe";
  dataElements[this.index].parentNode.style.color = "#1b1d1e";
  if (Command.actionType === "complete") {
    barInput.value = completionMatches[this.index][0];
  } else {
    barInput.value = barInput.value.match(/^(t(ab)?)?o(pen)? /)[0] + dataElements[this.index].innerText;
  }
};
