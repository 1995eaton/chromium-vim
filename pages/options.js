var loadSettings, mouseDown, saveRelease, resetRelease, fetchSettings;
var fade, save, save_clicked, reset_clicked, reset, linkHintCharacters, commandBarCSS, commandBarOnBottom, hoverDelay, settings, editor, mappingContainerFadeOut, usedPlaceholder, firstLoad;

var placeholder = '<- Click here for command names\n\nCommands are prefixed by "map" and "unmap"\n\nExample:\n # unmap j\n # map j scrollDown\n\nCommands can also be mapped to command mode commands\n\nExample:\n # map v :tabopen http://www.google.com\n\nCommand mode commands followed by <CR> executes the command immediately (enter does not need to be pressed)\n # map v :tabopen http://www.google.com<CR>\n\nModifier keys may also be mapped (if not already used by Chrome or the operating system)\n\nExample:\n "<C-" => Control key\n # map <C-i> goToInput\n "<M-" => Meta key (Windows key / Command key [Mac])\n # map <M-i> goToInput\n "<A-" => Alt key\n # map <A-i> goToInput\n';

loadSettings = function () {
  for (var key in settings) {
    if (typeof settings[key] === "boolean") {
      document.getElementById(key).checked = settings[key];
    } else {
      document.getElementById(key).value = settings[key];
    }
  }
  if (editor) {
    editor.setValue(settings.commandBarCSS);
  }
  if (document.getElementById("mappings").value.trim() === "") {
    usedPlaceholder = true;
    document.getElementById("mappings").value = placeholder;
  }
  document.getElementById("mappings").addEventListener("focus", onFocus, false);
  document.getElementById("mappings").addEventListener("blur", onBlur, false);
};

resetRelease = function () {
  if (reset_clicked) {
    chrome.runtime.sendMessage({setDefault: true});
    fetchSettings();
  }
};

saveRelease = function (e) {
  if (save_clicked) {
    for (var key in settings) {
      if (typeof settings[key] === "boolean") {
        settings[key] = document.getElementById(key).checked;
      } else if (key === "commandBarCSS") {
        settings[key] = editor.getValue();
      } else if (key === "mappings" && usedPlaceholder) {
        settings[key] = "";
      } else {
        settings[key] = document.getElementById(key).value;
      }
    }
    chrome.storage.sync.set({settings: settings});
    chrome.runtime.sendMessage({reloadSettings: true});
    save.innerText = "Saved";
    setTimeout(function () {
      save.innerText = "Save";
    }, 3000);
  }
};

fadeTransitionEnd = function(e) {
  if (e.target.id === "mappingContainer" && e.propertyName === "opacity" && mappingContainerFadeOut) {
    mappingContainerFadeOut = false;
    mappingContainer.style.display = "none";
  }
};

mouseDown = function (e) {
  save_clicked = false;
  reset_clicked = false;
  if (e.target.id === "save_button") {
    save_clicked = true;
  } else if (e.target.id === "reset_button") {
    reset_clicked = true;
  } else if (e.target.id === "clearHistory") {
    localStorage["search"] = "";
    localStorage["url"]    = "";
    localStorage["action"] = "";
  } else if (e.target.id === "close") {
    mappingContainer.style.opacity = "0";
    mappingContainerFadeOut = true;
  }
  save.innerText = "Save";
};

fetchSettings = function () {
  chrome.runtime.sendMessage({getSettings: true});
};

editMode = function (e) {
  if (editor) {
    if (e.target.value === "Vim") {
      editor.setOption("keyMap", "vim");
    } else {
      editor.setOption("keyMap", "default");
    }
  }
};

onFocus = function(e) {
  if (e.target.id === "mappings" && usedPlaceholder) {
    document.getElementById("mappings").value = "";
    usedPlaceholder = true;
  } else if (e.target.id !== "mappings" && document.getElementById("mappings").value.trim() === "") {
    usedPlaceholder = true;
    document.getElementById("mappings").value = placeholder;
  }
};
onBlur = function(e) {
  if (document.getElementById("mappings").value.trim() === "") {
    usedPlaceholder = true;
    document.getElementById("mappings").value = placeholder;
  } else {
    usedPlaceholder = false;
  }
};

document.addEventListener("DOMContentLoaded", function () {
  firstLoad = true;
  document.body.spellcheck = false;
  save = document.getElementById("save_button");
  reset = document.getElementById("reset_button");
  smoothScroll = document.getElementById("smoothScroll");
  mappingContainer = document.getElementById("mappingContainer");
  linkHintCharacters = document.getElementById("linkHintCharacters");
  commandBarOnBottom = document.getElementById("commandBarOnBottom");
  commandBarCSS = document.getElementById("commandBarCSS");
  dropDown = document.getElementById("edit_mode");
  fetchSettings(function () {
    editor = CodeMirror.fromTextArea(document.getElementById("commandBarCSS"), {lineNumbers: true});
  });
  document.addEventListener("mousedown", mouseDown, false);
  document.addEventListener("transitionend", fadeTransitionEnd, false);
  dropDown.addEventListener("change", editMode, false);
  save.addEventListener("mouseup", saveRelease, false);
  reset.addEventListener("mouseup", resetRelease, false);
});

chrome.extension.onMessage.addListener(function(request) {
  if (request.action === "sendSettings") {
    settings = request.settings;
    if (firstLoad) {
      editor = CodeMirror.fromTextArea(document.getElementById("commandBarCSS"), {lineNumbers: true});
      firstLoad = false;
    }
    loadSettings();
  }
});
