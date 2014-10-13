#!/bin/sh

scripts=(
'utils'
'messenger'
'hints'
'bookmarks'
'keys'
'clipboard'
'complete'
'mappings'
'find'
'cursor'
'status'
'hud'
'visual'
'command'
'scroll'
'search'
'frames'
)

cd `dirname $0`
cd ..

echo 'function init() {' > compiled.js

for i in ${scripts[*]}; do
  echo $i
  cat "content_scripts/$i".js >> compiled.js
done

echo '}' >> compiled.js
