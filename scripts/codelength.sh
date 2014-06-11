#!/bin/sh

cd `dirname $0`/..

info=(`grep . background_scripts/*.js content_scripts/*.js pages/*.js | wc`)
echo -e "${info[0]} lines\n${info[1]} words\n${info[2]} letters" | column -t -s" "

cd - &> /dev/null
