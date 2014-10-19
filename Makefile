all:
	./scripts/create_pages.js

release:
	./scripts/build.sh

clean:
	rm -r release*
