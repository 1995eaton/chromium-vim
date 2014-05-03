#!/bin/sh

# Requires grip (https://github.com/joeyespo/grip)
# Installation: sudo pip2 install grip

command -v grip >/dev/null 2>&1 || {
  echo "Error: grip not found (sudo pip2 install grip)"
  exit 1
}

cd $(dirname $0)
grip --export ../README.md
mv ../README.html mappings.html
sed -i 's/<title>.*/<title>cVim - Mappings<\/title>/' mappings.html
