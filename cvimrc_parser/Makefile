all:
	./node_modules/pegjs/bin/pegjs -e RCParser parser.peg

test: all
	node ./test/test.js

clean:
	rm -f parser.js
