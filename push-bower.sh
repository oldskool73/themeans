grunt dist;
grunt build:subbower;
grunt publish:subbower;
for dir in ./out/clones/subbower/*;
do (cd "$dir" && git push && git push --tags);
done