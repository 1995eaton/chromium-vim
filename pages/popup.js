var pause = document.getElementById("pause");
var blacklist = document.getElementById("blacklist");
var isEnabled = true;
var isBlacklisted = false;

chrome.runtime.sendMessage({action: "getBlacklisted"});

setTimeout(function() {
  chrome.runtime.sendMessage({action: "getBlacklistedResponse"}, function(response) {
    if (response) {
      blacklist.innerText = "Enable cVim on this domain";
      isBlacklisted = true;
    }
  });
}, 50);

chrome.runtime.sendMessage({action: "getActiveState"}, function (response) {
  isEnabled = response;
  if (isEnabled) {
    pause.innerText = "Disable cVim";
  } else {
    pause.innerText = "Enable cVim";
  }
});

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
  // if (isEnabled) {
    chrome.runtime.sendMessage({action: "toggleEnabled", singleTab: true, blacklisted: isBlacklisted});
  // }
};
