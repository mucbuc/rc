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
		assert( passedCount >= 3);
		console.log( 'cd_agent test passed' );
	});

	// test cd
	expectCWD();
	agent.process( ['cd'] );

	// test cd ~
	expectCWD();
	agent.process( ['cd', '~'] ); 
	
	// test cd /
	expectPath( '/' );
	agent.process( ['cd', '/'] );

	function expectPath(expected) {	
		e.once( 'cwd', function(path) { 
			assert( path == expected );
			++passedCount;
		});
	}
	
	function expectCWD() {	
		expectPath(__dirname );
		e.once( 'ls', function(list) {
			assert( list.indexOf( 'test.js' ) != -1 );
		});
	}
}

