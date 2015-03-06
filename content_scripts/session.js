/**
 * Stores session information that is accessed via mutiple scopes.
 */
window.Session = {
  // Accessed for use in indexing document.title
  ignoreTitleUpdate: false, tabIndex: null,

  isRootFrame: self === top
};
