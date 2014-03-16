#!/bin/sh

if [[ -e release ]]; then
  rm -r release*
fi

mkdir release
cp -r `find . -maxdepth 1 | egrep -v "^\.$|\.git|release"` release
zip -r release.zip release
