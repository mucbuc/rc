#!/usr/bin/env node

/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , js3 = require( 'mucbuc-jsthree' )
  , socketio = require( 'socket.io' )
  , fs = require( 'fs' )
  , io
  , server
  , exec = js3.exec
  , walk = js3.walk
  , os = require( 'os' )
  , localIP = ''; 

var app = express();

// all environments
app.set('port', process.env.PORT || process.argv[2] || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(__dirname));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);

server = http.createServer(app);

io = socketio.listen( server );

io.sockets.on( 'connection', function( socket ) {

	var cwd = process.cwd();

	sendLocalIP();

	socket.emit( 'cwd', cwd );
	sendList( cwd );

	socket.on( 'cd', function( cwd, data ) {
		if (typeof cwd === 'undefined') { 
			cwd = process.cwd();
			data = '';
		}
		var result = path.join( cwd, data );
		fs.exists( result, function( exist ) {
			if (exist) {
				socket.emit( 'cwd', result );
				sendList( result );
			}
			else {
				socket.emit( 'feedback', 'not changed dir' );
			}
		} );
	} );

	socket.once( 'evaluate', execute );

	function sendList( dir ) {

		var pathList = [];

		try {
			walk( dir, onDone, onDir, onFile, onError ); 
		} 
		catch( err ) {
			console.log( err );
		}

		function onError( error ) {
			console.log( error );
			socket.emit( 'err', error );
		}

		function onDir( dir, dec ) {
			pathList.push( path.basename( dir ) );
			dec();
		}

		function onFile( dir ) {
			pathList.push( path.basename( dir ) );
		}

		function onDone() {
			socket.emit( 'ls', pathList );
		}
	}

	function execute( cwd, data ) {
		var p;
		
		p = exec( data, function( code, signal ) {
			socket.emit( 'exit', code, signal );
			socket.removeListener( 'evaluate', write );
			socket.once( 'evaluate', execute );
		}, cwd );
		
		p.stdout.on( 'data', function( data ) { 
			socket.emit( 'feedback', data ); 
		} );

		socket.on( 'kill', function() {
			p.kill();
			socket.removeListener( 'evaluate', write );
		} );

		socket.on( 'evaluate', write );
		
		function write( cwd, data ) {
			console.log( data );
			p.stdin.write( data + '\n' );
		}
 	}

 	function sendLocalIP() {
 		socket.emit( 'ip', localIP );
 	}
} );

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

getLocalIP(); 

function getLocalIP() {
	var interfaces = os.networkInterfaces();  
	for( var iface in interfaces) {
		interfaces[ iface ].forEach( function( details ) { 
			if (details.family=='IPv4') {
				var address = details.address;
				if (address != '127.0.0.1') {
					localIP = address;	
				}
			}
		} );
	}
}

