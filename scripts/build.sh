#!/bin/sh

# Compiles the README.md into mappings.html
# Removes files unnecessary for release
# Zips release directory

cd $(dirname $0)/..

if [[ -e release ]]; then
  rm -r release*
fi

scripts/create_mappings_page.sh &&
mkdir release &&
cp -r `find . -maxdepth 1 | egrep -vE "^\.$|\.git|release|^scripts|\.jshintrc|LIC|READ|user.css"` release &&
zip -r release.zip release
