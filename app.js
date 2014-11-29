#!/usr/bin/env node

/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , assert = require( 'assert' )
  , logger = require( 'morgan' )
  , Logic = require( './lib/logic.js' ).Logic
  , upload = require( './routes/upload' ).upload
  , config = require( './config.json' )
  , methodOverride = require('method-override')
  , bodyParser = require('body-parser')
  , errorHandler = require('errorhandler')
  , multer = require('multer')
  , server;

assert( typeof config !== 'undefined' );

var app = express();

// all environments
app.set('port', process.env.PORT || process.argv[2] || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(logger('dev'));
app.use(methodOverride());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(multer());

if (config.username.length || config.password.length) {
	app.use(express.basicAuth( config.username, config.password ));
}
  
app.use(express.static(__dirname));

// development only
if ('development' == app.get('env')) {
  app.use(errorHandler());
}

app.get('/', routes.index);

if (config.upload) {
	app.post('/*', upload );
}

server = app.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

Logic.init( server );
