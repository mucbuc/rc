#!/usr/bin/env node

var assert = require( 'assert' )
  , events = require( 'events' )
  , path = require( 'path')
  , CD_Agent = require( '../lib/cd_agent' ).CD_Agent;

assert( typeof CD_Agent !== 'undefined' );

testCD();

function testCD() {
	var e = new events.EventEmitter()
	  , agent = new CD_Agent( e )
	  , passedCount = 0
	  , expectedCount = 0;

	process.on( 'exit', function() {
		assert( passedCount == expectedCount );
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

	// test cd folder
	expectPath( path.join( __dirname, 'sample' ) );
	agent.process( ['cd', 'sample'], __dirname );

	function expectPath(expected) {	
		e.once( 'cwd', function(path) { 
			assert( path == expected );
			++passedCount;
		});
		++expectedCount;
	}
	
	function expectCWD() {	
		expectPath( __dirname );
		e.once( 'ls', function(list) {
			assert( list.indexOf( 'test.js' ) != -1 );
		});
	}
}

