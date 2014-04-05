var settingsDefault = {

  smoothScroll: "true",
  linkHintCharacters: "asdfgqwertzxcvb",
  commandBarOnBottom: "true",
  mappings: null,
  commandBarCSS: '#link_main, .link_hint, #command_bar, #command_bar_mode, #command_input, #command_search_results, .completion-item, .completion-item .full, .completion-item .left, .completion-item .right {\n  font-family: Helvetica, Helvetica Neue, Neue, Sans, Arial;\n  font-size: 11pt !important;\n  -webkit-font-smoothing: antialiased !important;\n}\n#link_main {\n  position: absolute;\n  pointer-events: none;\n  width: 100%; left: 0;\n  height: 100%; top: 0;\n  z-index: 2147483647;\n}\n.link_hint {\n  background: linear-gradient(to top, #262626 50%, #474747 100%);\n  border: 1px solid rgba(255,255,255,0.5) !important;\n  border-radius: 2px;\n  color: #ccc !important;\n  padding: 2px !important;\n  font-size: 11pt !important;\n  font-weight: 100 !important;\n  display: inline-block !important;\n  vertical-align: middle !important;\n  text-align: center !important;\n  box-shadow: 2px 2px 3px rgba(0,0,0,0.4) !important;\n  position: absolute !important;\n}\n.link_hint_match {\n  color: #666;\n}\n#command_bar {\n  position: fixed !important;\n  z-index: 2147483646 !important;\n  background-color: #1b1d1e !important;\n  color: #bbb !important;\n  display: none;\n  box-sizing: content-box !important;\n  box-shadow: 0 3px 3px rgba(0,0,0,0.4);\n  left: 0 !important;\n  width: 100% !important;\n  height: 20px !important;\n}\n\n#command_bar_mode {\n  display: inline-block;\n  vertical-align: middle;\n  box-sizing: border-box !important;\n  padding-left: 2px !important;\n  height: 100% !important;\n  width: 10px !important;\n  padding-top: 2px !important;\n  color: #888 !important;\n}\n#command_input {\n  background-color: #1b1d1e !important;\n  color: #bbb !important;\n  height: 100% !important;\n  right: 0 !important;\n  top: 0 !important;\n  width: calc(100% - 10px) !important;\n  position: absolute !important;\n}\n#command_search_results {\n  position: fixed;\n  width: 100% !important;\n  overflow: hidden;\n  z-index: 2147483647 !important;\n  left: 0;\n  box-shadow: 0 3px 3px rgba(0,0,0,0.4);\n  background-color: #383838;\n}\n.completion-item, .completion-item .full, .completion-item .left, .completion-item .right {\n  text-overflow: ellipsis;\n  padding: 1px;\n  display: inline-block;\n  box-sizing: border-box;\n  vertical-align: middle;\n  overflow: hidden;\n  white-space: nowrap;\n}\n\n.completion-item {\n  width: 100%; left: 0;\n  color: #fff;\n}\n.completion-item .full {\n}\n.completion-item .left {\n  color: #fff;\n  width: 47%;\n}\n.completion-item .right {\n  font-style: italic;\n  color: #888;\n  width: 47%;\n}'
};

chrome.runtime.onMessage.addListener(function (request, sender, response) {
  if (request.getSettings) {
    var settings = {};
    for (var key in settingsDefault) {
      if (localStorage[key]) {
        settings[key] = localStorage[key];
      } else {
        settings[key] = settingsDefault[key];
      }
    }
    response(settings);
  }
});
