#!/bin/sh

if [[ $1 == "-c" ]]; then
  rm -r release*
else
  if [[ ! -e release ]]; then
    mkdir release
    cp -r `find . -maxdepth 1 | egrep -v "^\.$|\.git"` release
    zip -r release.zip release
  fi
fi
