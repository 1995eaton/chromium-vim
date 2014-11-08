all:
	./scripts/create_pages.js
	cd ./cvimrc_parser && make

release:
	./scripts/build.sh

clean:
	rm -r release*
