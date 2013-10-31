function MainCtrl( $scope )
{
	var socket = io.connect()
	  , emitter = new EventStream()
	  , element = document.getElementById( 'command' )
	  , cl = new CommandLine( element, emitter )
	  , serverIP = ''
	  , selection = document.getElementById( 'fileSelection' )
	  , button = document.getElementById( 'upload' )
	  , cwd = ''
	  , getTime = getTimeHHMMSS;

	emitter.on( 'cd', function() {
		socket.emit( 'ls', element.value );
	} );

	selection.onchange = function() {
		selection.form.submit();
	};

	button.onclick = function() {
		selection.form.action = cwd;
		selection.click();
	};
		
	socket.on( 'disconnect', function() {
		$scope.output += '<' + getTime() + '> connection lost\n';
		$scope.address = '';
		$scope.$apply();		
	} );

	socket.on( 'macros', function(data) {
		cl.macros = data; 
	});

	$scope.socket = socket;
	$scope.output = ''; 
	$scope.command = ''; 
	$scope.address = '';

	$scope.kill = function() {
		socket.emit( 'kill' );
	};

	cl.on( 'Ctrl+c', function() { 
		$scope.kill();
	} );

	tick();

	emitter.on( 'eval', function( command ) {
		$scope.evaluate(command);
	});

	$scope.evaluate = function( command ) { 
		socket.emit( 'evaluate', getCWD(), command.trim() );
	};

	socket.on( 'enter', function( command ) {
		$scope.output += $scope.address + ' <' + getTime() + '> $' + ' ' + command + '\n';  
		$scope.$apply();
	} );

	socket.on( 'ip', function( IP ) {
		serverIP = IP;

		cwd = getCWD();
		$scope.address = serverIP + ' ' + cwd;
		$scope.$apply();
	} );

	socket.on( 'feedback', function (data) {
		$scope.output += data;
		$scope.$apply();
		allign();
	} );

	socket.on( 'cwd', function (data) {
		location.hash = data;
	} );

	window.addEventListener( 'load', onRefresh );
	window.addEventListener( 'hashchange', onRefresh );

	socket.on( 'ls', function( data ) { 

/*
		var current = cl.getAutoComplete(); 
		if (current.length) {
			autoStack.push( current );
		}

		cl.on( ' ', function() {

			if (autoStack.length) {
				cl.registerAutoComplete( autoStack[0] );
				while(autoStack.length) {
					autoStack.pop();
				}
			}
		});
*/

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
		$scope.$apply();
		allign();
	} );

	function tick() {
		emitter.tick();
		setTimeout( tick, 100 );
	}

	function onRefresh() {
		cwd = getCWD();
		$scope.address = serverIP + ' ' + cwd;
		$scope.$apply();
		allign();
	}

	function allign() {
		var com = document.getElementById( 'command' );
		com.scrollIntoView();
	}

	function getCWD() {
		return location.hash.slice(1);
	}

}