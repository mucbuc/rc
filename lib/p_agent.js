var js3 = require( 'mucbuc-jsthree' )
	, events = require( 'events' );

function execProcess( params, socket ) {

	var e = new events.EventEmitter()
	  , p = new js3.Processor( params, e ); 

	e.on( 'stdout', read );
	e.on( 'stderr', read );
	e.on( 'child_error', function( data ) {
		if (data)
			socket.emit( 'feedback', data.toString() + '\n' );
	} ); 

	e.on( 'close', function(code, signal) {
		socket.removeListener( 'evaluate', write );
		socket.removeListener( 'kill', kill );
		socket.emit( 'exit', code, signal );	// would be nice to rename 'exit' to 'close' for consistency
	} );

	socket.on( 'evaluate', write );
	socket.on( 'kill', kill );

	// execute
	socket.emit( 'enter', params.cmd + ' ' + params.args.join( ' ' ) );
	e.emit( 'execute' );

	return e;

	function kill() {
		e.emit( 'kill' );
	}

	function write( cwd, data ) {
		e.emit( 'write', data.toString() + '\n' );
	}

	function read( data ) {
		socket.emit( 'feedback', data.toString() );
	}
}

exports.execProcess = execProcess;