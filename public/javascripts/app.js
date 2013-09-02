function MainCtrl( $scope )
{
	var socket = io.connect()
	  , emitter = new EventStream()
	  , cl = new CommandLine( document.getElementById( 'command' ), emitter )
	  , history = []
	  , searchIndex = 0;
	
	$scope.kill = function() {};

	$scope.socket = socket;
	$scope.output = ''; 
	$scope.command = ''; 
	$scope.cwd = '';
	$scope.path = '';

	// need to test these 
	emitter.on( 'auto', function( command ) { console.log( 'auto:', command ); } );
	emitter.on( 'eval', function( command ) { console.log( 'eval:', command ); } );
	emitter.on( 'previous', function() { console.log( 'previous' ); } );
	emitter.on( 'next', function() { console.log( 'next' ); } );

	tick();

	emitter.on( 'eval', function( command ) {
		$scope.evaluate(command);
		searchIndex = 0;
	});


	emitter.on( 'previous', function() {
		if (searchIndex < history.length) {
			applyHistory( ++searchIndex );
		}
	} );

	emitter.on( 'next', function() {
		if (searchIndex > 0) {
			applyHistory( --searchIndex ); 
		}
	} );

	function tick() {
		emitter.tick();
		setTimeout( tick, 100 );
	}

	function applyHistory( index ) {
		$scope.command = history[ history.length - index ];
		$scope.$apply();
	}

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
			//com.disabled = true;

			socket.emit( 'evaluate', $scope.cwd, cm.trim() );
		}
		history.push( $scope.command );
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
}