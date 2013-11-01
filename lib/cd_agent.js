var fs = require( 'fs' )
	, path = require( 'path' )
	, js3 = require( 'mucbuc-jsthree' );

function CD_Agent( emitter ) {

	var instance = this
	  , root = process.cwd();
	
	emitter.on( 'ls', function( cwd, data ) {
		var p = relativePath( cwd, data );
		fs.exists( p, function( exist ) {
			if (exist) {
				emitter.emit( 'cwd', p );
				sendPathList( p );
			}
		} );
	} );
	
	this.process = function(args, cwd) {

		switch(args[0]) {
			case 'cd':
			var p = relativePath( cwd, args[1] );
					fs.exists( p, function( exist ) {
						if (exist) {
							emitter.emit( 'cwd', p );
							sendPathList( p );
						}
					} );
				return true;
		}
	};

	function sendPathList( dir ) {
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
		return path.join( cwd, join );		//absolute
	}
};

exports.CD_Agent = CD_Agent;


/* 
	
		*/ 
