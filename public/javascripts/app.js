function MainCtrl( $scope )
{
	var socket = io.connect()
	  , emitter = new EventStream()
	  , cl = new CommandLine( document.getElementById( 'command' ), emitter )
	  , history = []
	  , searchIndex = 0
	  , autoComplete
	  , pathList = []
	  , serverIP = ''
	  , cwd = ''; 
	
	$scope.kill = function() {};

	$scope.socket = socket;
	$scope.output = ''; 
	$scope.command = ''; 
	$scope.address = '';

	// need to test these 
	emitter.on( 'auto', function( command ) { console.log( 'auto:', command ); } );
	emitter.on( 'eval', function( command ) { console.log( 'eval:', command ); } );
	emitter.on( 'previous', function() { console.log( 'previous' ); } );
	emitter.on( 'next', function() { console.log( 'next' ); } );

	cl.on( 'Ctrl+c', function() { 
		$scope.kill();
	} );

	cl.on( 'Backspace', function() {
		autoComplete = null;
	} ); 

	tick();

	emitter.on( 'eval', function( command ) {
		$scope.evaluate(command);
		searchIndex = 0;
		autoComplete = null;
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

	emitter.on( 'auto', function( command ) {
		
		if (!autoComplete && command.length) {
			var ind = command.lastIndexOf( ' ' )
			  , accept = []
			  , end = command.substr( ind + 1 )
			  , re = new RegExp( '^' + end, "i" );		// case insensitive
		
			pathList.forEach( function( e ) {
				if (re.test( e )) {
				  accept.push( e );
				}
			} ); 

			autoComplete = { index: 0, options: accept, position: ind };
		}

		if (autoComplete) {
			var pre = command.substr( 0, autoComplete.position );
			applyAuto( autoComplete.index, pre + ' ' );
			++autoComplete.index;
			autoComplete.index %= autoComplete.options.length;
		}
	} );

	function tick() {
		emitter.tick();
		setTimeout( tick, 100 );
	}

	function applyAuto( index, command ) {
		console.log( command );
		$scope.command = command + autoComplete.options[autoComplete.index];
		$scope.$apply();
	}

	function applyHistory( index ) {
		$scope.command = history[ history.length - index ];
		$scope.$apply();
	}

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
			socket.emit( 'cd', cwd, cm.substr( 3 ).trim() ); 
		}
		else {
			var com = document.getElementById( 'command' );
			socket.emit( 'evaluate', cwd, cm.trim() );
		}
		$scope.output += $scope.address + '$' + ' ' + $scope.command + '\n';
		$scope.output += $scope.address + ' => time: ' + getTime() + '\n';
		history.push( $scope.command );
		$scope.command = '';
		
		$scope.kill = function() {
			socket.emit( 'kill' );
			console.log( 'kill' );
		};

		$scope.$apply();
	};

	socket.on( 'ip', function( IP ) {
		serverIP = IP;
	} );

	socket.on( 'feedback', function (data) {
		$scope.output += data;
		$scope.$apply();
		allign();
	} );

	socket.on( 'cwd', function (data) {
		cwd = data;
		$scope.address = serverIP + ' ' + cwd;
		$scope.$apply();
		allign();
	} );

	socket.on( 'ls', function( data ) { 
		pathList = data;
	} ); 

	socket.on( 'exit', function( code, signal ) {
		if (code) {
			$scope.output += $scope.address + ' => code: ' + code + '\n';
		}
		if (signal) {
			$scope.output += $scope.address + ' => signal: ' + signal + '\n';
		}
		$scope.output += $scope.address + ' => time: ' + getTime() + '\n';
		$scope.kill = function() {};
		$scope.$apply();
		allign();
	} );

	function getTime() {
		var t = new Date();
		return t.getHours() + ':' + t.getMinutes() + ':' + t.getSeconds(); 
	}

	function allign() {
		var com = document.getElementById( 'command' );
		com.scrollIntoView();
	}
}