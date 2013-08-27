function MainCtrl( $scope )
{
	$scope.socket = io.connect();
	$scope.output = ''; 
	$scope.command = ''; 
	$scope.cwd = '';
	
	$scope.evaluate = function( command ) { 
		
		var cm = command;
		if (cm == 'cd') {
			$scope.socket.emit( 'cd' ); 
		}
		else if (cm.indexOf( 'cd ') == 0) {
			$scope.socket.emit( 'cd', $scope.cwd, cm.substr( 3 ) ); 
		}
		else {
			var com = document.getElementById( 'command' );
			com.disabled = true;

			$scope.socket.emit( 'evaluate', $scope.cwd, cm );
		}
		$scope.command = '';
		$scope.kill = function() {
			$scope.socket.emit( 'kill' );
			console.log( 'kill' );
		};
	};

	$scope.socket.on( 'feedback', function( data ) {
		$scope.output += data;
		$scope.$apply();
	} );

	$scope.socket.on( 'cwd', function( data ) {
		console.log( 'got path' + data );

		$scope.cwd = data;
		$scope.$apply();
	} );

	$scope.socket.on( 'exit', function( code, signal ) {
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
}