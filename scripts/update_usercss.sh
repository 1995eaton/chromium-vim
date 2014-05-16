#!/bin/sh

# Converts the user-editable CSS in the ./background_scripts directory to
# the JavaScript ./background_scripts/options.js file

cd $(dirname $0)/..

case $1 in
  -f)
    cat -s ./background_scripts/options.js | grep CSS | tr "\"" "'" | sed "s/.*BarCSS: '\|'$//g" | sed 's/\(\\n\)\+$//' | sed 's/}\(\\n\)\+/}\\n\\n/g' | sed 's/\\n/\n/g' | sed 's/^\s\+/  /g' > ./background_scripts/user.css
    ;;
  -p)
    cat ./background_scripts/options.js | sed "s/.*commandBarCSS:.*/$(echo "    commandBarCSS: \\\"$(cat ./background_scripts/user.css | tr "\n" "|" | sed 's/|/\\\n/g' | sed 's/\(\\n\)\+$//')\"" | tr "\n" "|" | sed 's/|/\\n/g')/" > temp.js && mv temp.js ./background_scripts/options.js
    ;;
  *)
    echo -e "OPTIONS
    -f    fetch the options.js default CSS string
    -p    push the user.css CSS to options.js"
    ;;
esac

cd -
