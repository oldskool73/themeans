#!/bin/bash

grunt dist;
grunt build:subbower;
grunt publish:subbower;
if [ -z $1 ]
then
	for dir in ./out/clones/subbower/*;
	do (cd "$dir" && git push && git push --tags);
	done
else
	cd ./out/clones/subbower/$1;
	git push && git push --tags;
fi