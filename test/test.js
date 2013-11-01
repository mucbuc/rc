#!/usr/bin/env node

var assert = require( 'assert' )
  , events = require( 'events' )
  , CD_Agent = require( '../lib/cd_agent' ).CD_Agent;

assert( typeof CD_Agent !== 'undefined' );

testCD();

function testCD() {
	var e = new events.EventEmitter()
	  , agent = new CD_Agent( e )
	  , passedCount = 0;

	process.on( 'exit', function() {
		console.log( passedCount );
		assert( passedCount >= 2 );
		console.log( 'cd_agent test passed' );
	});

	e.on( 'cwd', function(path) { 
		assert( path == __dirname );
		++passedCount;
	});

	e.on( 'ls', function(list) {
		assert( list.indexOf( 'test.js' ) != -1 );
	});

	agent.process( ['cd'] );
	agent.process( ['cd', '~'] );
}

