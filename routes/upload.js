var fs = require( 'fs' )
  , path = require('path');

exports.upload = function( req, res ) {

	getFiles( req ).forEach( upload );

	function upload( file ) {
		fs.readFile( file.path, function( err, data ) {
			if (err) throw err; 

			var p = path.join( req.url, file.name );

			console.log( 'writing to path: ', p );
			fs.writeFile( p, data, function(err) {
				if (err) throw err;
				//socket.emit( 'feedback', 'upload complete: ' + p + '\n' ); 
				//sendPathList( req.url );
				res.end( 'upload complete: ' + p + '\n' ); 
			} );
		} );
	}

	function getFiles( req ) {
		var result = [];
		if (req.files.displayImage instanceof Array) {
			for (var i = 0; i < req.files.displayImage.length; ++i) {
				result.push( req.files.displayImage[i] );
			}
		}
		else {
			result.push( req.files.displayImage );
		}
		return result;
	}
};