set nosmoothscroll
set nodimhintcharacters
set noautofocus
set cncpcompletion
set nohud
set typelinkhints
let scrollduration = 250
let homedirectory = '/home/jake'
let searchlimit = 25

let completionengines = [
      \ 'google',  'wikipedia', 'imdb',
      \ 'amazon', 'wolframalpha', 'duckduckgo'
      \ ]
let qmark
      \ a = ['http://www.reddit.com/r/learnjavascript/new', 'http://www.reddit.com/r/learnpython/new/', 'http://www.reddit.com/r/learnprogramming/new']
imap <C-o> editWithVim
map <C-o> :duplicate<CR>
map af createTabbedHint
map xx closeTab
map $ lastTab

"

map 0 firstTab
map g0 scrollToLeft
map g$ scrollToRight
map gS :viewsource&<CR>
map qq closeTab
map gs fullImageHint
map <Space> l
map <S-Space> h
map <A-r> nextTab
map <A-e> previousTab
map gq :restore<Space>
map a<Space> z<Enter>
map ab :bookmarks&<Space>
map <C-k> nextTab
map <C-j> previousTab
map cn :execute nzz<CR>
map cN :execute Nzz<CR>
map <C-d> :file ~/
map <C-e> scrollUp
map <C-s> openLastHint
map <C-g> :set smoothscroll!<CR>
map <C-h> :nohl<CR>
map cc :set hud!<CR>
map aa :tabopen g<Space>
map T :tabopen<CR>
map , :set numerichints!<CR>
map ga :settings<CR>
unmap j k h l
let @@a = 3

site '*://*/*' {
  call :script [].slice.call(document.querySelectorAll('*[accesskey]')).forEach(function(e){e.removeAttribute('accesskey')});
  call :script console.log(3);
}

let blacklists = ["http://localhost/*","http://lo-th.github.io/*"]

f(x) -> {{
  console.log(x);
}}

command refresh open @%

-> {{
  console.log();
}}

" Comment 1
"
" Comment 2

let array = [0, [0, 1, 123], 2]
let array_elem = array[1 ][ 2]
