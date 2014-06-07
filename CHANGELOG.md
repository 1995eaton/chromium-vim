#cVim Changelog

## 1.2.53
 * **Important!** cVimrc blacklists are now a part of the cVimrc. See the help guide for the new syntax.

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
```viml
set hintcharacters = abc123 "Incorrect!
let hintcharacters = "abc123" "Correct
```
 * Added completionengines option to cVimrc (choose which completion engines to display). For example:
```viml
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
