var fs = require( 'fs' )
	, path = require( 'path' )
	, js3 = require( 'mucbuc-jsthree' );

function CD_Agent( emitter ) {

	var instance = this
	  , root = process.cwd();

	this.process = function(args, cwd) {

		//assert( args.length );

		if (args[0] != 'cd')
			return false;

		if (args.length == 1) {
			sendPathInfo( root );
		}
		else if (args.length >= 2) {
			if (args[1] == '~') {
				sendPathInfo( root );
			}
			else if (args[1] == '/') {
				sendPathInfo( '/' );
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
			}
		}
		return true;
	};

	this.listContents = function(dir) {
		sendPathInfo( dir );
	};

	function sendPathInfo( dir ) {
		emitter.emit( 'cwd', dir );
		js3.DirScout.getList( emitter, dir );
	}
};

exports.CD_Agent = CD_Agent;

