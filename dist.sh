#!/bin/sh

cd $(dirname $0)

if [[ -e release ]]; then
  rm -r release*
fi

./pages/create_mappings_page.sh &&
mkdir release &&
cp -r `find . -maxdepth 1 | egrep -v "^\.$|\.git|release"` release &&
zip -r release.zip release
