var pause = document.getElementById("pause");
var blacklist = document.getElementById("blacklist");
var settings = document.getElementById("settings");
var isEnabled = true;
var isBlacklisted = false;

var port = chrome.extension.connect({name: "main"});
port.onMessage.addListener(function(data) {
  blacklist.innerText = "Enable cVim on this domain";
  isBlacklisted = true;
});
port.postMessage({action: "getBlacklisted"});

chrome.runtime.sendMessage({action: "getActiveState"}, function (response) {
  isEnabled = response;
  if (isEnabled) {
    pause.innerText = "Disable cVim";
  } else {
    pause.innerText = "Enable cVim";
  }
});
settings.onclick = function() {
  chrome.runtime.sendMessage({action: "openLinkTab", active: true, url: chrome.extension.getURL("/pages/options.html")});
};
pause.onclick = function() {
  isEnabled = !isEnabled;
  if (isEnabled) {
    pause.innerText = "Disable cVim";
  } else {
    pause.innerText = "Enable cVim";
  }
  chrome.runtime.sendMessage({action: "toggleEnabled", blacklisted: isBlacklisted});
};

blacklist.onclick = function() {
  isBlacklisted = !isBlacklisted;
  if (blacklist.innerText === "Disable cVim on this domain") {
    blacklist.innerText = "Enable cVim on this domain";
  } else {
    blacklist.innerText = "Disable cVim on this domain";
  }
  chrome.runtime.sendMessage({action: "toggleBlacklisted"});
  if (isEnabled) {
    chrome.runtime.sendMessage({action: "toggleEnabled", singleTab: true, blacklisted: isBlacklisted});
  }
};
