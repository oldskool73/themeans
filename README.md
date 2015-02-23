# The Means Core Library

```
          ▄▄▄▄▄▄▄             ▄▓▀                                               
    ▄▓▓▓▓▓▓▓███▀▀▀▀████▓▓▓▓▓▓▓▓▌    ▄▀▓▓▓                                       
  ▄▓▓▓▓▓█▀             ▓▓▓▓▓▓▓▓   ▄▓▓▓▓▓                                        
 ▓▓▓▓▓▓  ▐▓▄▓▌   ▄▄   ▓▓▓▓▀▓▓▓▌ ▄▓▓▓▓▓▓     ▄▄     ▄▓▓▓▄    ▄▓▓▓  ▄▓▌   ▄▄▓▓▓▓▄ 
▐▓▓▓▓▓   ▓▓ ▓▀▓▌▓▌▀  ▓▓▓▓▌▐▓▓▓▄▓▓ ▓▓▓▓▌  ▄▓▓▓▓▓  ▓▓▓▓█▓▓▓ ▄▓▓▓▓▓▓▓▓▓  ▄▓▓▓█▀▀▓▓▓
▓▓▓▓▓▓   ▓▌▐▓▐█ ▀   ▓▓▓▓▓ ▓▓▓▓▓▀ ▓▓▓▓▓  ▓▓▓▀▀▓▓ ▓▓▓▌  ▓▓▓▓█▓▓▓▓▓█▓▓  ▓▓▓▀▄▓▄▄▓▓▓
▓▓▓▓▓▓             ▐▓▓▓▓  ▓▓▓▓▀ ▐▓▓▓▓  ▓▓▀  ▓▓▀▐▓▓▓ ▄▓▓▓▓▌▐▓▓▓▓ ▐▓▓ ▓▓▓▓ ▓▓▓▓▓▓▀
▐▓▓▓▓▓▓▓▄▄         ▓▓▓▓▌  ▓▓▓▌  ▓▓▓▓▓ ▓▓▓ ▄▓▓▀  ▓▓▓▓▓▀▐▓▓ ▓▓▓▓  ▓▓▓ ▓▓▓▓▓▄▀██▀  
 ▀▓▓▓▓▓▓▓▀         ▓▓▓▓▌  ▐▓▓  ▐▓▓▓▓▌ ▓▓▓▓▓▀▄▓▓▓ ▄▓▌  ▓▓▓ ▀▓▓▓  █▓▓ ▐▓▓▓▓▓▓▓▄   
    ▀██▀          ▐▓▓▓▓▌       ▓▓▓▓▓░ ▓▓▓▀  ▓▓▓▀ ▓▓ ▄▓▓▓▓▌ ▓▓▓▄  ▓▓▌  ▀█▓▓▓▓▓▓▓ 
                  ▐▓▓▓▓▌       ▓▓▓▓▓▌ ▓▓▓▓▓▓▓▓▀ ▐▓▓▓▓▓▓▓▓▌ ▀▓▓▓▌ ▓▓▓▌     ▓▓▓▓▓▌
                  ▐▓▓▓▓▓       ▓▓▓▓▓▓  █▓▓▓▓█    ▀█▀▀  ███  ▀▀▀   ▓▓▓▓▓▓▓▓▓▓▓▓▓ 
                   █▓▓▓▓▓▄      ▓▓▓▓▓▓▄▄                           ▀█▓▓▓▓▓▓▓█▀  
                     ▀▀▀▀        █▓▓▓▓▓▓                                        
                                   ▀▀▀                                          
```

## Bower
### Installing a module in a project
`bower install --save https://github.com/themeans/themeans.git#name-of-module-git-hash`

### To add a module
Creat a new branch to add a match the module name

`git checkout -b bower-[module-name]`

Push the new branch (this branch will be used by the code to checkout then commit the new module)

### Update a module
`grunt dist`
`grunt build:subbower`
`grunt publish:subbower`
`cd out/clones/subbower/[moduleName]`
`git push`

If you're adding a module also run
`git push --tags`

## NPM
### Installing a package
`npm install --save https://github.com/themeans/themeans.git#name-of-module-git-hash`

### To add a module
Creat a new branch to add a match the module name

`git checkout -b npm-[module-name]`

Push the new branch (this branch will be used by the code to checkout then commit the new module)

### Update a module
`grunt dist`
`grunt build:subpackage`
`grunt publish:subpackage`
`cd out/clones/subpackage/[moduleName]`
`git push`

If you're adding a package also run
`git push --tags`

## Documentation
[TODO]

## Development
[TODO - Needs update]
1. `git checkout gh-pages`
	1. run `npm install && bower install`
	2. write your code then run `grunt`
	3. git commit your changes
2. copy over core files (.js and .css/.less for directives) to master branch
	1. `git checkout master`
	2. `git checkout gh-pages .js .min.js .less .css .min.css`
3. update README, CHANGELOG, bower.json, and do any other final polishing to prepare for publishing
	1. git commit changes
	2. git tag with the version number, i.e. `git tag v1.0.0`
4. create github repo and push
	1. [if remote does not already exist or is incorrect] `git remote add origin [github url]`
	2. `git push origin master --tags` (want to push master branch first so it is the default on github)
	3. `git checkout gh-pages`
	4. `git push origin gh-pages`
5. (optional) register bower component
	1. `bower register utils [git repo url]`
