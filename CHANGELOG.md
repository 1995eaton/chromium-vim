# cVim Changelog
# [Like cVim? Consider donating! https://www.paypal.me/1995eaton](https://www.paypal.me/1995eaton)

## 1.2.99 (2017-12-17)
 * Updated list of `chrome://` completion URLs when `:chrome` is used
 * Fixed issue with `openPasteTab` [#573](https://github.com/1995eaton/chromium-vim/issues/573)
 * Allow global site matches in cVimrc. For example, the following will unmap `j` on all sites:
```
site '*://*' {
  unmap j
}
```
 * Fix issue with certain hints not showing up (like the GitHub profile icon in the top-right corner of the page).

## 1.2.98 (2017-10-13)
 * Fix [#569](https://github.com/1995eaton/chromium-vim/issues/569) (mappings like `map <C-A-M-i> nextTab` would work, but `map <C-M-A-i> nextTab` wouldn't)
 * Let `@"` represent the paste buffer in command bar commands (e.g. `tabnew wikipedia "@` would search Wikipedia for whatever is in the paste buffer)

## 1.2.97 (2017-09-20)
 * Make `^` go to beginning of line when in insert mode

## 1.2.96 (2017-08-31)
 * Fix vulnerability where sites are able to trigger keyboard events that would be interpreted by cVim ([#572](https://github.com/1995eaton/chromium-vim/issues/572))

## 1.2.95 (2017-08-16)
 * Redesign options page and fixed CSS issues for smaller screens

## 1.2.94 (2017-08-13)
 * Add dates to changelog

## 1.2.93 (2017-07-19)
 * Fix exception being thrown on React.js input forms

## 1.2.92 (2017-07-06)
 * Fix corrupted zip file issue with last release

## 1.2.91
 * [Implement jumplist feature](https://github.com/1995eaton/chromium-vim/issues/553) (`previousScrollPosition` is `<C-o>` and `nextScrollPosition` is `<C-i>`).

## 1.2.90 (2017-06-29)
 * Re-implement editWithVim

## 1.2.89 (2017-06-20)
 * If you are currently running an old version of the [cvim_server.py](https://github.com/1995eaton/chromium-vim/blob/master/cvim_server.py) script (keeping it up to date locally), please update to the latest version (in the link above)! For the time being, the `editWithVim` feature has been disabled due to a security concern.
 * Bug fixes

## 1.2.88
 * Fix issue with `:buffer` command

## 1.2.87 (2017-03-23)
 * Fix input box issues with new versions of Chrome

## 1.2.86 (2017-02-17)
 * Add `openQuickMarkWindowed` command

## 1.2.85 (2016-06-22)
 * Bug fixes

## 1.2.84 (2016-04-22)
 * Bug fixes

## 1.2.83 (2016-04-19)
 * Fix bug in Chrome 50+

## 1.2.82 (2016-04-02)
 * Fix `:new`/`:winopen` bug
 * Fix scrolling bug when experimental JavaScript features are enabled
 * Fix several insert mapping bugs
 * Allow multiple unmaps using a single statement (e.g. `unmap h j k l`)
 * Added new window modifier for `:tabnew` and related commands

## 1.2.81 (2015-12-20)
 * Smooth scrolling is now disabled by default (add `set smoothscroll` to your settings to get it back)
 * Bug fixes

## 1.2.80 (2015-10-06)
 * Scrolling improvements
 * Bug fixes

## 1.2.79 (2015-07-09)
 * Content scripts will now be reloaded if they lose connection to the
   background scripts (e.g. restarting the extension)

## 1.2.78
 * Default completion engines are now only `["google", "duckduckgo", "wikipedia", "amazon"]`.
   The other engines still exist, but you'll need to enable them with the `completionengines` option.
   * See [mappings.html#completion-engines](./mappings.html#completion-engines) for more info.
 * Added "themoviedb" to completion engines

## 1.2.77 (2015-06-09)
 * Bug fixes
 * Add support for local ".cvimrc" files

## 1.2.76 (2015-05-01)
 * Fixed issue with buffer switching. Partially breaks fix from last version

## 1.2.75 (2015-04-29)
 * Fixed issue where cVim sometimes stops responding after opening the command bar

## 1.2.74 (2015-04-07)
 * Bug fixes
 * Added `sortlinkhints` setting

## 1.2.73 (2015-02-28)
 * Link hint / command bar redesign (may need to reset CSS for this to take effect)
 * Improved autocompletion matching
 * Several bugfixes

## 1.2.72 (2015-02-12)
 * Fix an issue with command bar z-index on YouTube: [#237](https://github.com/1995eaton/chromium-vim/issues/237)
 * Fix an issue with tab completion with the `:buffer` command: [#238](https://github.com/1995eaton/chromium-vim/issues/238)

## 1.2.71
 * Fix incompatibilities with some non-American keyboard layouts

## 1.2.70
 * Fix a cncpcompletion bug
 * Added the `createScriptHint` command
 * Multiple bugfixes

## 1.2.69
 * Fix a bug with text areas ([#231](https://github.com/1995eaton/chromium-vim/issues/231))

## 1.2.68
 * Bug fixes from iframe addition in 1.2.68
 * Added code block feature

## 1.2.67
 * Moved command bar to separate frame (issue [#85](https://github.com/1995eaton/chromium-vim/issues/85)).
 * Several security patches

## 1.2.66
 * Added `nativelinkeorder`, `vimcommand`, and `vimport` options
 * `cvim_socket.py` is now `cvim_server.py`
 * Bug fixes

## 1.2.65
 * Better smooth scrolling performance
 * Fix a URI encoding bug with search engines

## 1.2.64
 * Improved cVimrc parsing (with [PEG.js](http://pegjs.majda.cz/))
  * The options page will now report errors on which line has improper syntax.
You can check Chrome's JavaScript console for more info on what the error was
and why it occurred.
 * Better history searching
 * Several bug fixes

## 1.2.63
 * Fix for Google search and the `:` key (and some others)

## 1.2.62
 * Added autoupdategist option
 * Added lastUsedTab command
 * The goToSource command is now `:viewsource&<CR>`
 * Removed the mapping blacklist feature for the blacklists array (e.g. `let blacklists = ["*://*.reddit.com/* <Up> <Down>])
  * The syntax for an extended version of this feature can now be found [here](https://github.com/1995eaton/chromium-vim#site-specific-configuration)

## 1.2.61
 * Minor bug fixes from last update
 * Fix issue [#120](https://github.com/1995eaton/chromium-vim/issues/120)

## 1.2.60
 * Removed the toggleImages command
 * Remove the `:date` command
 * Performance optimizations + bugfixes

## 1.2.59
 * Various bug fixes
 * Improved smooth-scrolling

## 1.2.58
 * Fixed issues with certain keys not working with certain keyboard layouts
 * `<C-a>` insert mapping is now `<C-i>`

## 1.2.57
 * Miscellaneous bug fixes

## 1.2.56
 * **Important!** The behavior of commands that open links (`:open`, `:tabnew`, `:history`, etc) has changed. See [the mappings page](./mappings.html#tabs) for more information.
 * Awesome new feature! It's now possible to use Vim to edit text boxes. All that is needed is a python script that can be found [here](https://github.com/1995eaton/chromium-vim/blob/master/cvim_server.py)
  * To get things running, just run the script: `python cvim_socket.py` and press `<C-i>` inside a text box.
 * As a result of the above, the insert mapping `<C-i>` (beginningOfLine) is now `<C-a>`.
 * Smoother scrolling
 * Added `:tabattach` command
 * Settings defined via the command bar (e.g. `:set nosmoothscroll`) will become active in all other tabs and all new tabs until either the browser is restarted or the settings is flipped
 * Page searches are now synced with other tabs
 * Performance enhancements

## 1.2.55
 * In order to make cVim as "vim-like" as possible, some commands have been added, and others have changed (the old ones will continue to work). `:tabopen` is now `:tabnew` and `:closetab` is now `:quit`
 * The `C-z` toggleCvim mapping is now `A-z` due to conflicts with the default undo-text Chrome shortcut.
 * Added `goToLastInput` command (`gI`)
 * The yank-link hint mode binding has changed from `Y` to `gy`
 * Yank link hint mode will now copy text box values/placeholders in addition to link URLs.

## 1.2.54
 * The ```ignorediacritics``` option has been removed due to its large performance impact
 * Added the ```*``` modifier to the open group of commands (e.g. ```:tabopen http://www.google.com*``` will open Google in a pinned state)
   * This can be used in addition to the ```&``` modifier (e.g. ```:tabopen http://www.google.com*&``` or ```:tabopen http://www.google.com&*``` will open Google in a pinned background tab
 * Fixed a CSS style injection bug on some sites
 * Improved keyboard key support
 * Added experimental GitHub autocomplete search engine (e.g. ```:tabopen github @1995eaton/```)

## 1.2.53
 * **Important!** cVimrc blacklists are now a part of the cVimrc. Previous blacklists should carry over to the cVimrc text area. New blacklists can be declared like this:
```vim
let blacklists = ["https://www.google.com"]
```
 * When defining custom search engines, you can now add the string ```%s``` somewhere inside the URL to indicate that the query should be inserted in this place. This is useful for search engines with URLs that have non-standard structures. For instance:

```vim
" If you search for 'test' using this engine, cVim
" will open this link -> http://www.example.com/test?type=search
let searchengine example = "http://www.example.com/%s?type=search"

" In the case below, '%s' is optional. If it is not included, your search query will be appended to the URL
let searchengine example = "http://www.example.com/search?query="
let searchengine example = "http://www.example.com/search?query=%s" "This is no different from the above case
```
 * Added lastScrollPosition ```''```, goToMark ```'<*>```, and setMark ```;<*>``` mappings
 * Find-mode is much, much faster (outperforms Google's search mode when looking for the letter 'a' in a text copy of *The Great Gatsby*)
 * Several bugfixes
 * Added searchalias and locale variables (see help file ```:help```)

## 1.2.52
 * Added the ```file``` command
 * Added the ```date``` command
 * Improved link hint performance
 * The reverseImageSearch mapping can now parse base64 images (thanks to Google's "Search by Image" extension)
 * Added the closeTab command to the chrome://extensions -&gt; Keyboard Shortcuts page
 * Improved cVim response time on initial page load
 * Minor bugfixes

## 1.2.51
 * **Important!** cVimrc setting are now stricter. You must use 'let' instead of set when using options requiring an equal symbol. For example:
```vim
set hintcharacters = abc123 "Incorrect!
let hintcharacters = "abc123" "Correct
```
 * Added completionengines option to cVimrc (choose which completion engines to display). For example:
```vim
let completionengines = ["google", "imdb"] "Only these engines will appear in the search autocomplete menu
```
 * Added autohidecursor option (useful for Linux operating systems, which don't automatically hide the mouse cursor when a key is pressed). You can test this out by running the command ```:set autohidecursor``` and scrolling with j/k (might have to nudge mouse cursor then scroll to see it disappear initially).
 * Bug fixes

## 1.2.50
 * ```map``` automatically unmaps the existing binding if a conflict occurs (e.g. same key mapped to multiple functions). ```unmap``` is no longer necessary unless you wish to disable a default mapping
 * ```map``` can now point to other mappings as a reference (e.g. ```map j k```)
 * Improved mapping key compatibility
 * Minor CSS tweaks in the options page

## 1.2.49
 * Reworked domain blacklists engine. See https://developer.chrome.com/extensions/match_patterns for a description of the new URL match syntax
 * Fixed some iframe bugs

## 1.2.48
 * Fixed an issue where quickmarks wouldn't save
 * Minor bugfixes
 * Added basic support for Visual Line mode (V)
 * Updated DuckDuckGo search engine for completion
 * Added a restart chrome shortcut (zr). The same could be accomplished with the config ```map zr :chrome://restart&<CR>```
 * reloadAllTabs is still available for mapping, but the key binding ```cr``` now defaults to reloadAllButCurrent

## 1.2.47
 * Several bugfixes
 * Added reloadAllTabs (cr), toggleImages (ci), zoomPageIn (zi), zoomPageOut (zo), zoomOrig (z0), zoomImage (z&lt;Enter&gt;), and toggleCvim (&lt;C-z&gt;) mappings

## 1.2.46
 * Fixed a bug where bookmarks would be displayed multiple times on some sites

## 1.2.45
 * Fixed a CSS issue with the default font (if your font looks ugly, reset cVim to see changes).

## 1.2.44
 * Tiny bugfix

## 1.2.43
 * Added this changelog
 * Minor bugfixes
 * Fixed conflicting CSS styles
