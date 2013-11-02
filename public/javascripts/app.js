function MainCtrl( $scope )
{
	var socket = io.connect()
	  , element = document.getElementById( 'command' )
	  , selection = document.getElementById( 'fileSelection' )
	  , button = document.getElementById( 'upload' )
	  , emitter = new EventStream()
	  , cl = new CommandLine( element, emitter )
	  , getTime = getTimeHHMMSS
	  , serverIP = ''
	  , cwd = '';

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

	emitter.on( 'cd', function() {
		
		var ind = element.value.lastIndexOf( ' ' )
		  , end = element.value.substr( ind + 1 );

		socket.emit( 'ls', cwd, end ); 
	}); 

	tick();

	emitter.on( 'eval', function( command ) {
		$scope.evaluate(command);
	});

	$scope.evaluate = function( command ) { 
		
		socket.once( 'cwd', function (data) {
			cwd = data;
			location.hash = data;
		} );

		cwd = getCWD();
		socket.emit( 'evaluate', cwd, command.trim() );
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

	socket.once( 'cwd', function (data) {
		cwd = data;
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