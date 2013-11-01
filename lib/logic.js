#!/usr/bin/env node

/**
 * Module dependencies.
 */

/*

objectvie: )
	manage process's

wif: 
-execute( cwd, command ) => agent? 

*/ 

var assert = require( 'assert' )
  , path = require('path')
  , socketio = require( 'socket.io' )
  , fs = require( 'fs' )
  , os = require( 'os' )
  , js3 = require( 'mucbuc-jsthree' )
  , config = require( '../config.json' )
  , macros = require( '../macros.json' )
  , CD_Agent = require( './cd_agent' ).CD_Agent
  , execProcess = require( './p_agent' ).execProcess;

assert( typeof config !== 'undefined' );
assert( typeof macros !== 'undefined' );

var Logic = { 
	init: function( server ) { 
		var io = socketio.listen( server );
		
		io.sockets.on( 'connection', function( socket ) {
			
			var localIP = ''
			  , cd_agent = new CD_Agent( socket );

			cd_agent.process( ['cd'] );

			js3.Network.getLocalIP( function( ip ) { 
				localIP = ip; 
				socket.emit( 'ip', localIP ); 
			} );
			
			socket.once( 'evaluate', execute );
			socket.emit( 'macros', macros );

			function execute( cwd, data ) {

				var args = data.toString().split( ' ' )
				 
				filterCommand( args[0], doit, block );

				function block() {
					socket.emit( 'feedback', "'" + args[0] + "'" + " is blocked\n" );
					socket.once( 'evaluate', execute );
				}

				function filterCommand( command, pass, fail ) {
					for (var r in config.include) {
						var re = new RegExp( config.include[r] );
						if (re.test( command )) {
							pass();
							return;
						}
					}
					fail();
				}

				function doit() {
					
					if (!cd_agent.process( args, cwd )) {
						var params = { cmd: args[0], args: args.slice(1, args.length), cwd: cwd }
						  , emitter = execProcess( params, socket );
						emitter.on('close', function() {	
							socket.once( 'evaluate', execute );
						} );
					}
					else {
						socket.once( 'evaluate', execute );
						socket.emit( 'ip', localIP );
					}
				}
			}
		} );
	}
};

exports.Logic = Logic; 
