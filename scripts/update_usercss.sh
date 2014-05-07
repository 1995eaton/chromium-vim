#!/bin/sh

# Converts the user-editable CSS in the ./background_scripts directory to
# the JavaScript ./background_scripts/options.js file

cd $(dirname $0)/..

case $1 in
  -f)
    cat ./background_scripts/options.js | grep CSS | grep -Eo "'.*'" | head -c-2 | cut -c2- | sed 's/\(\\n\)\+$//g' | sed 's/\\n/\n/g' > ./background_scripts/user.css
    ;;
  -p)
    cat ./background_scripts/options.js | sed "s/.*commandBarCSS.*/$(echo -n \ \ \ \ commandBarCSS: \'$(cat ./background_scripts/user.css | tr "\n" "|" | sed 's/|/\\\\n/g')\')/" | sed 's/\\n$//' > temp.js && mv temp.js ./background_scripts/options.js
    ;;
  *)
    echo -e "OPTIONS
    -f    fetch the options.js default CSS string
    -p    push the user.css CSS to options.js"
    ;;
esac

cd -
