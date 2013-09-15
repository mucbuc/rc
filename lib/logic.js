#!/usr/bin/env node

/**
 * Module dependencies.
 */

var path = require('path')
  , socketio = require( 'socket.io' )
  , fs = require( 'fs' )
  , os = require( 'os' )
  , js3 = require( 'mucbuc-jsthree' )
  , exec = js3.exec
  , walk = js3.walk
  , lastWD = ''
  , macros = require('./../macros.json' ); 

var Logic = { 
	init: function( server, express ) { 
		var io = socketio.listen( server );
		io.sockets.on( 'connection', function( socket ) {
			
			var cwd = process.cwd();

			console.log( 'got connection' );
			
			socket.on( 'disconnect', function() {
				console.log( 'lost connection' );
			} );

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

			socket.once( 'evaluate', function( cwd, data ) {

				var args = data.split( ' ' );

				args.forEach( function( arg, index ) {
					console.log( '***' + arg ); 			
					if (macros.hasOwnProperty(arg)) {
						args[ index ] = macros[arg];
					}
				} );

				console.log( args.join(' ') );
				execute( cwd, args.join(' ') );
			} );

			express.post('/', function( req, res ) {

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
				var p = exec( data, function( code, signal ) {
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
	}
}

exports.Logic = Logic; 

/*




*/