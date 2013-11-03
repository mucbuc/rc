#!/usr/bin/env node

/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , assert = require( 'assert' )
  , Logic = require( './lib/logic.js' ).Logic
  , upload = require( './routes/upload' ).upload
  , config = require( './config.json' );

assert( typeof config !== 'undefined' );

var app = express();

// all environments
app.set('port', process.env.PORT || process.argv[2] || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());

if (config.username.length || config.password.length) {
	app.use(express.basicAuth( config.username, config.password ));
}

app.use(app.router);
app.use(express.static(__dirname));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);

if (config.upload) {
	app.post('/*', upload );
}

server = http.createServer(app);

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

Logic.init( server );
