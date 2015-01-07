// package/lib is a dependency we require
// var lib = require( "package/lib" );

// behavior for our module
function foo(){
    console.log( "hello world!" );
}

// export (expose) foo to other modules as foobar
exports.foobar = foo;