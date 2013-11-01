var fs = require( 'fs' )
	, path = require( 'path' )
	, js3 = require( 'mucbuc-jsthree' );

function CD_Agent( emitter ) {

	var instance = this
	  , root = process.cwd();

	this.process = function(args, cwd) {

		switch(args[0]) {
			case 'cd':
				if (args.length == 1) {
					sendPathInfo( root );
					return true;
				}
				else if (args.length >= 2) {
					if (args[1] == '~') {
						sendPathInfo( root );
						return true;
					}
					else if (args[1] == '/') {
						sendPathInfo( '/' );
						return true;
					}
					else {
						var base = typeof cwd === 'undefined' ? root : cwd
							, trail = args.length >= 2 ? args[1] : ''
							, abs = path.join( base, trail );

						fs.exists( abs, function( exist ) {
							if (exist) {
								sendPathInfo( abs );
							}
						} );
		
						return true;
					}
				}
		}

		return false;
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

