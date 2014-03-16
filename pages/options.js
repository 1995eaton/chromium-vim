var loadSettings, mouseDown, saveRelease, resetRelease, fetchSettings;
var fade, save, save_clicked, reset_clicked, reset, linkHintCharacters, commandBarCSS, commandBarOnBottom, hoverDelay, settings, editor;

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
        localStorage[key] = document.getElementById(key).value;
      }
    }
  }
  save.innerText = "Saved";
  setTimeout(function () {
    save.innerText = "Save";
  }, 3000);
};

mouseDown = function (e) {
  save_clicked = false;
  reset_clicked = false;
  if (e.target.id === "save_button") {
    save_clicked = true;
  } else if (e.target.id === "reset_button") {
    reset_clicked = true;
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

document.addEventListener("DOMContentLoaded", function () {
  document.body.spellcheck = false;
  save = document.getElementById("save_button");
  reset = document.getElementById("reset_button");
  smoothScroll = document.getElementById("smoothScroll");
  linkHintCharacters = document.getElementById("linkHintCharacters");
  commandBarOnBottom = document.getElementById("commandBarOnBottom");
  commandBarCSS = document.getElementById("commandBarCSS");
  dropDown = document.getElementById("edit_mode");
  fetchSettings(function () {
    editor = CodeMirror.fromTextArea(document.getElementById("commandBarCSS"), {lineNumbers: true});
  });
  document.addEventListener("mousedown", mouseDown, false);
  dropDown.addEventListener("change", editMode, false);
  save.addEventListener("mouseup", saveRelease, false);
  reset.addEventListener("mouseup", resetRelease, false);
});
