var fs = require( 'fs' )
	, path = require( 'path' )
	, js3 = require( 'mucbuc-jsthree' );

function CD_Agent( emitter ) {

	var instance = this
	  , root = process.cwd();
	
  // this seems wrong/misplaced (pull, not push)
  init();

	function init() {
		emitter.emit( 'cwd', root );
		
		sendPathList( root );

		emitter.on( 'ls', function( cwd, data ) {
			var p = relativePath( cwd, data );
			fs.exists( p, function( exist ) {
				if (exist) {
					sendPathList( p );
				}
			} );
		} );
	}

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
