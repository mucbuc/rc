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
  , lastWD = '';

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

	js3.Network.getLocalIP( function( ip ) { 
		socket.emit( 'ip', ip ); 
	} );
	
	socket.emit( 'cwd', cwd );
	sendPathList( cwd );

	socket.on( 'cd', function( cwd, data ) {
		
		var t = typeof data == 'undefined' ? cwd : getCwd( cwd, data );
		changeCwd( t );

		function changeCwd( p ) {
			fs.exists( p, function( exist ) {
				if (exist) {
					lastWD = p;
					socket.emit( 'cwd', p );
					sendPathList( lastWD );
				}
				else {
					socket.emit( 'feedback', 'did not change dir\n' );
				}
			} );
		}

		function getCwd( cwd, data ) {
			if (typeof cwd === 'undefined') { 
				return process.cwd();			//root
			}
			else if (data == '/') {
				return '/';						//relative
			}
			else if (data == '\\') {
				return '\\'; 					//relative
			}
			return path.join( cwd, data );		//absolute
		}
	
	} );

	socket.once( 'evaluate', execute );

	app.post('/', function( req, res ) {

		var files = getFiles( req );

		files.forEach( function( file ) {
			fs.readFile( file.path, function( err, data ) {

				check( err );

				var p = path.join( lastWD, file.name );
				console.log( 'writing to path: ', p );
				fs.writeFile( p, data, function(err) {
					check( err );
					socket.emit( 'feedback', 'upload complete: ' + p + '\n' ); 
					sendPathList( lastWD );
				} );
			
				function check(err) {
					if (err) {
						console.log( err );
						throw err;
					}
				}
			} );
		} );

		function processFile( file ) {
			fs.readFile( file.path, function( err, data ) {

				if (err) {
					console.log( err ); 
					return;
				}

				var p = path.join( lastWD, file.name );
				console.log( 'writing to path: ', p );
				fs.writeFile( p, data, function(err) {
					if (err) {
						console.log( err ); 
						return;
					}
				} );
			} );
		}

		function getFiles( req ) {
			var result = [];
			if (req.files.displayImage instanceof Array) {
				for (var i = 0; i < req.files.displayImage.length; ++i) {
					result.push( req.files.displayImage[i] );
				}
			}
			else {
				result.push( req.files.displayImage );
			}
			return result;
		}

	} );

	function sendPathList( dir ) {

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
} );

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
