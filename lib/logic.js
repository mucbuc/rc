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
  , CD_Agent = require( 'cd-agent' )
  , execProcess = require( './p_agent' ).execProcess
  , Stack = require( 'micro-box' );

assert( typeof config !== 'undefined' );
assert( typeof macros !== 'undefined' );

var Logic = { 
	init: function( server ) { 
		var io = socketio.listen( server );
		
		io.sockets.on( 'connection', function( socket ) {
			
			var localIP = ''
			  , cd_agent = new CD_Agent( socket )
			  , stack = new Stack( socket );

			cd_agent.process( ['cd'] );

			js3.Network.getLocalIP( function( ip ) { 
				localIP = ip; 
				socket.emit( 'ip', localIP ); 
			} );
			
			socket.once( 'evaluate', execute );

			socket.on( 'ls', function( base, join ) {
				cd_agent.listContents( path.join( base, join ) );
			}); 

			socket.emit( 'macros', macros );

			function execute( cwd, data ) {
				stack.request( { 
					params: data.toString(), 
					cwd: cwd 
				}, function(req, res) {
					socket.once( 'evaluate', execute );
				} ); 
			}
		} );
	}
};

exports.Logic = Logic; 
