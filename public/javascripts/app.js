function MainCtrl( $scope )
{
	var socket = io.connect()
	  , emitter = new EventStream()
	  , element = document.getElementById( 'command' )
	  , cl = new CommandLine( element, emitter )
	  , autoComplete
	  , pathList = []
	  , serverIP = ''
	  , cwd = ''
	  , selection = document.getElementById( 'fileSelection' )
	  , button = document.getElementById( 'upload' );

	selection.onchange = function() {
		selection.form.submit();
	};

	button.onclick = function() {
		selection.click();
	};
	
	$scope.kill = function() {};

	socket.on( 'disconnect', function() {
		$scope.output += 'connection lost\n';
		$scope.$apply();		
	} );


	$scope.socket = socket;
	$scope.output = ''; 
	$scope.command = ''; 
	$scope.address = '';

	cl.on( 'Ctrl+c', function() { 
		$scope.kill();
	} );

	cl.on( 'Backspace', function() {
		autoComplete = null;
	} ); 

	element.addEventListener( 
		'textInput', 
		function() { 
			autoComplete = null;
		}
	); 

	tick();

	emitter.on( 'eval', function( command ) {
		$scope.evaluate(command);
		autoComplete = null;
	});

	emitter.on( 'auto', function( command ) {
		
		if (!autoComplete && command.length) {
			autoComplete = initAutoComplete( command );

			if (autoComplete) {
				autoComplete.index = autoComplete.options.length - 1;
			}
		}

		if (autoComplete && autoComplete.options.length) {
			++autoComplete.index;
			autoComplete.index %= autoComplete.options.length;

			applyAuto( command );
		}
	} );

	emitter.on( 'reverse auto', function( command ) {
		
		console.log( 'reverse auto' );

		if (!autoComplete && command.length) {
			autoComplete = initAutoComplete( command );
		}

		if (autoComplete && autoComplete.options.length) {
			if (autoComplete.index) {
				--autoComplete.index;
			}
			else {
				autoComplete.index = autoComplete.options.length - 1;	
			}

			applyAuto( command );
		}
	} );

	function initAutoComplete( command ) {

		var ind = command.lastIndexOf( ' ' )
		  , accept = []
		  , end = command.substr( ind + 1 )
		  , re = new RegExp( '^' + end, "i" );		// case insensitive
	
		pathList.forEach( function( e ) {
			if (re.test( e )) {
			  accept.push( e );
			}
		} ); 

		return { index: 0, options: accept, position: ind };
	}

	function tick() {
		emitter.tick();
		setTimeout( tick, 100 );
	}

	function applyAuto( command ) {
		console.log( 'autoComplete.index', autoComplete.index );

		command = command.substr( 0, autoComplete.position );
		$scope.command = command + ' ' + autoComplete.options[autoComplete.index];
		$scope.$apply();
	}

	$scope.appendPath = function( path ) {
		var com = document.getElementById( 'command' );
		com.focus();
		$scope.command += ' ' + path + ' ';
		$scope.path = '';
	}; 

	$scope.evaluate = function( command ) { 
		if (command == 'cd') {
			socket.emit( 'cd' ); 
		}
		else if (command.indexOf( 'cd ') == 0) {
			var arg = command.substr( 3 ).trim();
			if (	arg[0] == '/' 
				|| 	arg.indexOf( ':' ) != -1) {
				socket.emit( 'cd', arg ); 					// absolute
			}
			else {
				socket.emit( 'cd', cwd, arg ); 			// relative
			}
		}
		else {
			var com = document.getElementById( 'command' );
			socket.emit( 'evaluate', cwd, command.trim() );
		}
		$scope.output += $scope.address + '$' + ' ' + $scope.command + '\n';
		$scope.output += $scope.address + ' => time: ' + getTime() + '\n';
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
		$scope.output += $scope.address + '\n';
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