#!/usr/bin/env node

var assert = require( 'assert' )
  , events = require( 'events' )
  , CD_Agent = require( '../lib/cd_agent' ).CD_Agent;

assert( typeof CD_Agent !== 'undefined' );

testCD();

function testCD() {
	var e = new events.EventEmitter()
	  , agent = new CD_Agent( e )
	  , passed = false;

	process.on( 'exit', function() {
		assert( passed == true );
		console.log( 'cd_agent test passed' );
	});

	e.on( 'cwd', function(path) { 
		assert( path == __dirname );
		passed = true;
	});

	e.on( 'ls', function(list) {
		assert( list.indexOf( 'test.js' ) != -1 );
	});

	agent.process( ['cd'] );
}

