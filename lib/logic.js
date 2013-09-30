#!/usr/bin/env node

/**
 * Module dependencies.
 */

/*

objectvie: 
	manage paths (cd, sendPathlist)
	manage uploads
	manage process's

wif: 
-sendPathlist( dir )
-execute( cwd, command ) => agent? 

*/ 

var path = require('path')
  , socketio = require( 'socket.io' )
  , fs = require( 'fs' )
  , os = require( 'os' )
  , js3 = require( 'mucbuc-jsthree' )
  , lastWD = ''; 

var Logic = { 
	init: function( server, express ) { 
		var io = socketio.listen( server );
		
		io.sockets.on( 'connection', function( socket ) {
			
			var root = process.cwd();

			js3.Network.getLocalIP( function( ip ) { 
				socket.emit( 'ip', ip ); 
			} );
			
			socket.emit( 'cwd', root );
			sendPathList( root );

			socket.on( 'cd', function( cwd, data ) {
				
				var t = typeof data == 'undefined' ? root : getCwd( cwd, data );
				changeCwd( t );

				function changeCwd( p ) {

					fs.exists( p, function( exist ) {
						if (exist) {
							lastWD = p;
							socket.emit( 'cwd', p );
							sendPathList( lastWD );
						}
					} );
				}

				function getCwd( cwd, data ) {
					if (typeof cwd === 'undefined') { 
						return root;					//root
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

			express.post('/', function( req, res ) {

				getFiles( req ).forEach( upload );

				function upload( file ) {
					fs.readFile( file.path, function( err, data ) {

						check( err );

						var p = path.join( lastWD, file.name );
						console.log( 'writing to path: ', p );
						fs.writeFile( p, data, function(err) {
							check( err );
							socket.emit( 'feedback', 'upload complete: ' + p + '\n' ); 
							sendPathList( lastWD );
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
				js3.DirScout.getList( socket, dir );
			}

			function execute( cwd, data ) {

				var args = data.split( ' ' );

				fs.readFile( 'macros.json', function( err, data ) {
					args.forEach( function( arg, index ) {		
						check(err);
						var macros = JSON.parse( data );
						if (macros.hasOwnProperty(arg)) {
							args[ index ] = macros[arg];
						}
						if (index == args.length - 1) {
							
							var command = args.join( ' ' );
							
							socket.emit( 'enter', command );
							
							var p = js3.exec( command, onExit, cwd );

							p.stdout.on( 'data', function( data ) { 
								socket.emit( 'feedback', data ); 
							} );

							socket.on( 'kill', function() {
								p.kill();
								socket.removeListener( 'evaluate', write );
							} );

							socket.on( 'evaluate', write );
							
							function onExit(code, signal) {
								socket.emit( 'exit', code, signal );
								socket.removeListener( 'evaluate', write );
								socket.once( 'evaluate', execute );
							}

							function write( cwd, data ) {
								console.log( data );
								p.stdin.write( data + '\n' );
							}
					 	}
					} );
				} );
			}

			function check(err) {
				if (err) {
					console.log( err );
					throw err;
				}
			}

		} );
	}
};

exports.Logic = Logic; 

/*




*/