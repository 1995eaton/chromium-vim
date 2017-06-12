function TabFrames(tabId) {
  this.tabId = tabId;
  this.frames = {};
  this.focusedId = 0;
}
TabFrames.prototype = {
  addFrame: function(port, isCommandFrame) {
    this.frames[port.sender.frameId] = port;
    this.port = port;
    if (isCommandFrame)
      this.commandFrameId = port.sender.frameId;
  },

  removeFrame: function(frameId) {
    delete this.frames[frameId];
  },

  focus: function(frameId, disableAnimation) {
    if (!this.frames.hasOwnProperty(frameId))
      return;
    this.focusedId = frameId;
    this.frames[frameId].postMessage({
      type: 'focusFrame',
      disableAnimation: !!disableAnimation,
    });
  },

  focusNext: function() {
    if (this.frames.length <= 0)
      return;
    var ids = Object.getOwnPropertyNames(this.frames)
      .sort((a, b) => a - b);
    var curIdx = Math.max(0, ids.indexOf(this.focusedId));
    var id = ids[(curIdx + 1) % ids.length];
    if (id === this.commandFrameId)
      id = ids[(curIdx + 2) % ids.length];
    this.focus(id, false);
  },
};

Frames = {
  tabFrames: {},

  add: function(tabId, port, isCommandFrame) {
    this.tabFrames[tabId] = this.tabFrames[tabId] || new TabFrames(tabId);
    this.tabFrames[tabId].addFrame(port, isCommandFrame);
  },

  remove: function(tabId) {
    delete this.tabFrames[tabId];
  },

  removeFrame: function(tabId, frameId) {
    var frame = this.get(tabId);
    if (!frame)
      return false;
    if (frameId === 0)
      return this.remove(tabId);
    frame.removeFrame(frameId);
    return true;
  },

  get: function(tabId) {
    return this.tabFrames[tabId];
  },
};
