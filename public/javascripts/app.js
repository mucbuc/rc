function MainCtrl( $scope )
{
	var socket = io.connect()
	  , emitter = new EventStream()
	  , element = document.getElementById( 'command' )
	  , cl = new CommandLine( element, emitter )
	  , serverIP = ''
	  , selection = document.getElementById( 'fileSelection' )
	  , button = document.getElementById( 'upload' )
	  , cwd = ''; 

	selection.onchange = function() {
		selection.form.submit();
	};

	button.onclick = function() {
		selection.form.action = cwd;
		selection.click();
	};
	
	$scope.kill = function() {};

	socket.on( 'disconnect', function() {
		$scope.output += '<' + getTime() + '> connection lost\n';
		$scope.address = '';
		$scope.$apply();		
	} );


	$scope.socket = socket;
	$scope.output = ''; 
	$scope.command = ''; 
	$scope.address = '';

	cl.on( 'Ctrl+c', function() { 
		$scope.kill();
	} );

	tick();

	emitter.on( 'eval', function( command ) {
		$scope.evaluate(command);
	});

	function tick() {
		emitter.tick();
		setTimeout( tick, 100 );
	}

	$scope.appendPath = function( path ) {
		var com = document.getElementById( 'command' );
		com.focus();
		$scope.command += ' ' + path + ' ';
		$scope.path = '';
	}; 

	$scope.evaluate = function( command ) { 

		var cwd = getCWD();
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

			socket.emit( 'evaluate', getCWD(), command.trim() );
						
			$scope.kill = function() {
				socket.emit( 'kill' );
				console.log( 'kill' );
			};
		}
		
		$scope.$apply();
	};

	socket.on( 'enter', function( command ) {
		$scope.output += $scope.address + ' <' + getTime() + '> $' + ' ' + command + '\n';  
	} );

	socket.on( 'ip', function( IP ) {
		serverIP = IP;
	} );

	socket.on( 'feedback', function (data) {
		$scope.output += data;
		$scope.$apply();
		allign();
	} );

	socket.on( 'cwd', function (data) {
		location.hash = data;
	} );

	window.addEventListener( 'hashchange', function() {
		cwd = getCWD();
		$scope.address = serverIP + ' ' + cwd;
		$scope.$apply();
		allign();
	}, false );

	socket.on( 'ls', function( data ) { 
		cl.registerAutoComplete( data );
	} ); 

	socket.on( 'exit', function( code, signal ) {
		
		if (code) {
			$scope.output += 'code: ' + code + '\n';
		}
		if (signal) {
			$scope.output += 'signal: ' + signal + '\n';
		}
		$scope.output += '<' + getTime() + '>\n\n';
		$scope.kill = function() {};
		$scope.$apply();
		allign();
	} );

	function getTime() {
		var t = new Date()
		  , h = t.getHours()
		  , m = t.getMinutes()
		  , s = t.getSeconds()
		  , result = h < 10 ? '0' + h : h;
		result += ':' + (m < 10 ? '0' + m : m);
		result += ':' + (s < 10 ? '0' + s : s);
		return result; 
	}

	function allign() {
		var com = document.getElementById( 'command' );
		com.scrollIntoView();
	}

	function getCWD() {
		return location.hash.slice(1);
	}

}