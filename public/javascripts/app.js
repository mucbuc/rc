function MainCtrl( $scope )
{
	var socket = io.connect();

	$scope.pathList = [];

	$scope.appendPath = function( path ) {
		var com = document.getElementById( 'command' );
		com.focus();
		$scope.command += ' ' + path + ' ';
		$scope.path = '';
	}; 

	$scope.evaluate = function( command ) { 
		
		var cm = command;
		if (cm == 'cd') {
			socket.emit( 'cd' ); 
		}
		else if (cm.indexOf( 'cd ') == 0) {
			socket.emit( 'cd', $scope.cwd, cm.substr( 3 ).trim() ); 
		}
		else {
			var com = document.getElementById( 'command' );
			com.disabled = true;

			socket.emit( 'evaluate', $scope.cwd, cm.trim() );
		}
		$scope.command = '';
		$scope.kill = function() {
			socket.emit( 'kill' );
			console.log( 'kill' );
		};
	};

	socket.on( 'feedback', function( data ) {
		$scope.output += data;
		$scope.$apply();
	} );

	socket.on( 'cwd', function( data ) {
		console.log( 'got path' + data );
		$scope.cwd = data;
		$scope.$apply();
	} );

	socket.on( 'ls', function( data ) { 
		$scope.pathList = data;
		$scope.pathList.push( '..' );
		$scope.$apply();
	} ); 

	socket.on( 'exit', function( code, signal ) {
		var com = document.getElementById( 'command' );
		com.disabled = false;
		com.scrollIntoView();
		if (!code) {
			$scope.output += 'ok\n';
		}
		else {
			$scope.output += code + '\n';
			$scope.output += signal + '\n';
		}
		$scope.$apply();
		$scope.kill = function() {};
	} );

	$scope.kill = function() {};

	$scope.socket = socket;
	$scope.output = ''; 
	$scope.command = ''; 
	$scope.cwd = '';
	$scope.path = '';
}