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
  , Stack = require( 'micro-box' );

assert( typeof config !== 'undefined' );
assert( typeof macros !== 'undefined' );

var Logic = { 
  init: function( server ) { 
    var io = socketio.listen( server );
      
    io.sockets.on( 'connection', function( socket ) {
      
      var stack = new Stack( socket )
        , localIP = '';
      
      js3.Network.getLocalIP( function( ip ) { 
        localIP = ip; 
        socket.emit( 'ip', localIP ); 
      } );

      socket.on( 'stdout data', function(data) {
        socket.emit( 'cwd', data );
      });
        
      updateCWD();
      
      socket.once( 'evaluate', execute );
      socket.emit( 'macros', macros );
      
      function updateCWD() {
        stack.request( 
          { params: 'pwd', stdout: 'pipe' }
        );
      }
      
      function execute( cwd_TOBEREMOVED, data ) {
        stack.request( { 
          params: data.toString(),
          stdout: 'pipe',
        }, function(req, res) {
          updateCWD();
          socket.once( 'evaluate', execute );
        } ); 
      }
    } );
  }
};

exports.Logic = Logic; 
