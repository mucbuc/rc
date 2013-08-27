function MainCtrl( $scope )
{
	$scope.socket = io.connect();
	$scope.output = ''; 
	$scope.command = ''; 
	$scope.cwd = '';
	$scope.title = '';

	$scope.evaluate = function( command ) { 
		
		var cm = command;

		if (cm.indexOf( 'cd ') == 0) {
			$scope.socket.emit( 'cd', $scope.cwd, cm.substr( 3 ) ); 
		}
		else {
			$scope.socket.emit( 'evaluate', $scope.cwd, cm );
		}
		$scope.command = '';
	};

	$scope.socket.on( 'feedback', function( data ) {
		$scope.output += data;
		$scope.$apply();
	} );

	$scope.socket.on( 'cwd', function( data ) {
		console.log( 'got path' );

		$scope.cwd = data;
		$scope.title = $scope.cwd;
		$scope.$apply();
	} );
}