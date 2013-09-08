
/*
 * GET home page.
 */

exports.index = function(req, res){

	if (	req
		&& 	req.files
		&& 	req.files.displayImage
		&& 	req.files.displayImage.path) {
	
		alert( req.files.displayImage.path ); 
	//	console.log( req.files.displayImage.path );
	}

	//res.end( 'hello' );
	res.render('index', { title: 'Express' });
};