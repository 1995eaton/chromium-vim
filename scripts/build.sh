#!/bin/sh

# Compiles the README.md into mappings.html
# Removes files unnecessary for release
# Zips release directory

cd $(dirname $0)/..

if [[ -e release ]]; then
  rm -r release*
fi

scripts/create_pages.js &&
mkdir release &&
cp -r `find . -maxdepth 1 | egrep -vE "^\.$|\.git|release|node_modules|^scripts|\.md|\.txt|\.jshintrc|LIC|READ|user.css"` release &&
zip -r release.zip release
