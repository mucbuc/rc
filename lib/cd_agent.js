var fs = require( 'fs' );

var CD_Agent = {

	process: function(args, cwd) {
			switch(args[0]) {
				case 'cd':
				/*	
					var p = args.length == 1 ? CD_Agent.root : getCwd( cwd, args[1] );
					fs.exists( p, function( exist ) {
						if (exist) {
							socket.emit( 'ip', localIP ); 
							socket.emit( 'cwd', p );
							socket.once( 'evaluate', execute );
							sendPathList( p );
						}
					} );
				*/
					return true;
			}
		},
	root: process.cwd()


};

exports.CD_Agent = CD_Agent;