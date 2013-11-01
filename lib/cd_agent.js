var fs = require( 'fs' )
	, path = require( 'path' )
	, js3 = require( 'mucbuc-jsthree' );

function CD_Agent( emitter ) {

	var instance = this
	  , root = process.cwd();

	this.process = function(args, cwd) {

		switch(args[0]) {
			case 'cd':
				if (args.length >= 2) {
					if (args[1] == '~') {
						sendPathInfo( root );
					}
					else if (args[1] == '/') {
						sendPathInfo( '/' );
					}
				}

				var p = relativePath( cwd, args[1] );
				fs.exists( p, function( exist ) {
					if (exist) {
						sendPathInfo( p );
					}
				} );
			return true;
		}
	};

	function sendPathInfo( dir ) {
		emitter.emit( 'cwd', dir );
		js3.DirScout.getList( emitter, dir );
	}

	function relativePath( cwd, join ) {
		if (typeof join === 'undefined') { 
			return root;			//root
		}
		else if (	 join == '/'
						|| join == '\\') {
			return join;						//relative
		}
		else if (typeof cwd === 'undefined') {
			cwd = root;	
		}
		return path.join( cwd, join );		//absolute
	}
};

exports.CD_Agent = CD_Agent;

