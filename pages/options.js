var loadSettings, mouseDown, saveRelease, resetRelease, fetchSettings;
var fade, save, save_clicked, reset_clicked, reset, linkHintCharacters, commandBarCSS, commandBarOnBottom, hoverDelay, settings, editor, mappingContainerFadeOut, usedPlaceholder;
var placeholder = 'Look at the mappings page for command names\n\nCommands are "map" and "unmap"\n\nExample:\n # unmap j\n # map j scrollDown\n\nCommands can also be mapping to command mode\n\nExample:\n # map v :tabopen http://www.google.com\n\nCommand mode commands can be followed by <CR> so enter does not have to be pressed to execute\n # map v :tabopen http://www.google.com<CR>\n\nModifier keys may also be mapped (if it is not already used by Chrome or the operating system)\n\nExample:\n "<C-" => Control key\n # map <C-i> goToInput\n "<M-" => Meta key (Windows key / Command key (Mac))\n # map <M-i> goToInput\n "<A-" => Alt key\n # map <A-i> goToInput\n';

loadSettings = function () {
  for (var key in settings) {
    if (/true|false/.test(settings[key])) {
      if (settings[key] === "true") {
        document.getElementById(key).checked = true;
      } else {
        if (settings[key] === "false") {
          document.getElementById(key).checked = false;
        } else {
          document.getElementById(key).checked = true;
        }
      }
    } else {
      document.getElementById(key).value = settings[key];
    }
  }
  if (editor) {
    editor.setValue(settings["commandBarCSS"]);
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
    for (var key in settings) {
      localStorage[key] = "";
    }
    fetchSettings();
  }
};

saveRelease = function (e) {
  if (save_clicked) {
    for (var key in settings) {
      if (/true|false/.test(settings[key])) {
        if (document.getElementById(key).checked) {
          localStorage[key] = "true";
        } else {
          localStorage[key] = "false";
        }
      }
      else if (key === "commandBarCSS") {
        localStorage[key] = editor.getValue();
      } else {
        if (key === "mappings" && usedPlaceholder) {
          localStorage[key] = "";
        } else {
          localStorage[key] = document.getElementById(key).value;
        }
      }
    }
  }
  save.innerText = "Saved";
  setTimeout(function () {
    save.innerText = "Save";
  }, 3000);
};

fadeTransitionEnd = function(e) {
  console.log(e);
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
  } else if (e.target.className === "mapping-help") {
    mappingContainer.style.display = "block";
    setTimeout(function() {
      mappingContainer.style.opacity = "1";
    }, 5);
  } else if (e.target.id === "close") {
    mappingContainer.style.opacity = "0";
    mappingContainerFadeOut = true;
  }
  save.innerText = "Save";
};

fetchSettings = function (callback) {
  chrome.runtime.sendMessage({getSettings: true}, function (s) {
    settings = s;
    loadSettings();
    if (callback) {
      callback();
    }
  });
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
