var fs = require( 'fs' )
	, path = require( 'path' )
	, js3 = require( 'mucbuc-jsthree' );

var CD_Agent = {
	root: process.cwd(),
	init: function(socket) {
			socket.emit( 'cwd', CD_Agent.root );
			CD_Agent.sendPathList( CD_Agent.root, socket );

			socket.on( 'ls', function( cwd, data ) {
				var p = CD_Agent.relativePath( cwd, data );
				fs.exists( p, function( exist ) {
					if (exist) {
						CD_Agent.sendPathList( p, socket );
					}
				} );
			} ); 
		},
	process: function(args, cwd, socket) {
			switch(args[0]) {
				case 'cd':
				var p = CD_Agent.relativePath( cwd, args[1] );
						fs.exists( p, function( exist ) {
							if (exist) {
								socket.emit( 'cwd', p );
								CD_Agent.sendPathList( p, socket );
							}
						} );
					return true;
			}
		},
	relativePath: function( cwd, join ) {
			if (typeof join === 'undefined') { 
				return CD_Agent.root;			//root
			}
			else if (	 join == '/'
							|| join == '\\') {
				return join;						//relative
			}
			return path.join( cwd, join );		//absolute
		},
	sendPathList:	function( dir, socket ) {
			js3.DirScout.getList( socket, dir );
		}
};

exports.CD_Agent = CD_Agent;