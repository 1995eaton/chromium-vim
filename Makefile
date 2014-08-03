all:
	./scripts/compile.sh

release:
	./scripts/build.sh

clean:
	rm -r release*
