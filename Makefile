all:
	./scripts/create_pages.js

release: all
	./scripts/build.sh

clean:
	rm -rf release*
