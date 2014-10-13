all:
	./scripts/compile.sh
	./scripts/create_pages.js

release:
	./scripts/build.sh

clean:
	rm -r release*
