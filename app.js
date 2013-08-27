#!/usr/bin/env node

/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , exec = require( 'mucbuc-jsthree' ).exec
  , socketio = require( 'socket.io' )
  , fs = require( 'fs' )
  , io
  , server;

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);

server = http.createServer(app);

io = socketio.listen( server );

io.sockets.on( 'connection', function( socket ) {

	console.log( 'got connection' );

	socket.emit( 'cwd', process.cwd() );

	socket.on( 'cd', function( cwd, data ) {
		var result = path.join( cwd, data );
		fs.exists( result, function( exist ) {
			if (exist) {
				socket.emit( 'cwd', result );
			}
			else {
				socket.emit( 'feedback', 'not changed dir' );
			}
		} );
	} );

	socket.once( 'evaluate', execute );

	function execute( cwd, data ) {
		var p;
		console.log( data );
		socket.emit( 'feedback', 'execute: ' + data + '\n' );

		p = exec( data, function( code, signal ) {
			//socket.emit( 'feedback', code ? 'err:' + code : 'ok');			
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
			p.stdin.write( data );
		}
 	}

} );


server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
