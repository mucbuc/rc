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

var assert = require( 'assert' )
  , path = require('path')
  , socketio = require( 'socket.io' )
  , fs = require( 'fs' )
  , os = require( 'os' )
  , js3 = require( 'mucbuc-jsthree' )
  , events = require( 'events' )
  , config = require( '../config.json' )
  , macros = require( '../macros.json' );

assert( typeof config !== 'undefined' );
assert( typeof macros !== 'undefined' );

var Logic = { 
	init: function( server, express ) { 
		var io = socketio.listen( server );
		
		io.sockets.on( 'connection', function( socket ) {
			
			var root = process.cwd()
			  , localIP = '';

			js3.Network.getLocalIP( function( ip ) { 
				localIP = ip; 
			} );
			
			socket.emit( 'ip', localIP ); 
			socket.emit( 'cwd', root );
			sendPathList( root );
			socket.emit( 'macros', macros );
			
			socket.on( 'ls', function( cwd, data ) {
				var p = typeof data == 'undefined' ? root : getCwd( cwd, data );
				fs.exists( p, function( exist ) {
					if (exist) {
						sendPathList( p );
					}
				} );
			} ); 

			socket.once( 'evaluate', execute );

			express.post('/*', function( req, res ) {
				
				getFiles( req ).forEach( upload );

				function upload( file ) {
					fs.readFile( file.path, function( err, data ) {

						check( err );

						var p = path.join( req.url, file.name );

						console.log( 'writing to path: ', p );
						fs.writeFile( p, data, function(err) {
							check( err );
							//socket.emit( 'feedback', 'upload complete: ' + p + '\n' ); 
							//sendPathList( req.url );
							res.end( 'upload complete: ' + p + '\n' ); 
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

			function filterCommand( command, pass, fail ) {

				for (var r in config.include) {
					var re = new RegExp( config.include[r] );
					
					console.log( re, command );

					if (re.test( command )) {
						pass();
						return;
					}
				}
				fail();
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

			function sendPathList( dir ) {
				js3.DirScout.getList( socket, dir );
			}

			function execute( cwd, data ) {

				var args = data.toString().split( ' ' )
				 
				filterCommand( args[0], doit, block );

				function block() {
					socket.emit( 'feedback', "'" + args[0] + "'" + " is blocked\n" );
					socket.once( 'evaluate', execute );
				}

				function doit() {
					
					if (args[0] == 'cd') {
						var p = args.length == 1 ? root : getCwd( cwd, args[1] );
						fs.exists( p, function( exist ) {
							if (exist) {
								socket.emit( 'ip', localIP ); 
								socket.emit( 'cwd', p );
								sendPathList( p );
								socket.once( 'evaluate', execute );
							}
						} );
					}
					else {
						launchProcess( { cmd: args[0], args: args.slice(1, args.length), cwd: cwd } );
					}
					
					function launchProcess( params ) {

						var e = new events.EventEmitter()
						  , p = new js3.Processor( params, e ); 

						e.on( 'read', read );
						e.on( 'error_read', read );
						e.on( 'child_error', function( data ) {
							if (data)
								socket.emit( 'feedback', data.toString() + '\n' );
						} ); 

						e.on( 'close', function(code, signal) {
							socket.removeListener( 'evaluate', write );
							socket.removeListener( 'kill', kill );
							socket.once( 'evaluate', execute );
							socket.emit( 'exit', code, signal );	// would be nice to rename 'exit' to 'close' for consistency
						} );

						socket.on( 'evaluate', write );
						socket.on( 'kill', kill );

						// execute
						socket.emit( 'enter', params.cmd + ' ' + params.args.join( ' ' ) );
						e.emit( 'execute' );

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
				}
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
