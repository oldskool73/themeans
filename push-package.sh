grunt dist;
grunt build:subpackage;
grunt publish:subpackage;
for dir in ./out/clones/subpackage/*;
do (cd "$dir" && git push);
done
