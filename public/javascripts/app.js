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
	  , cwd = ''
	  , dirtyLS = true;

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

	cl.on( 'Ctrl+c', function() { 
		socket.emit( 'kill' );
	} );

	emitter.on( 'cd', function() {
		var ind = element.value.lastIndexOf( ' ' )
		  , end = element.value.substr( ind + 1 );

		socket.emit( 'ls', cwd, end ); 
		dirtyLS = true;
	}); 

	cl.on( 'Space', function() {
		if (dirtyLS) {
			socket.emit( 'ls', cwd, '' );
			dirtyLS = false;
		}
	});

	tick();

	emitter.on( 'eval', function( command ) {
		$scope.evaluate(command);
	});

	$scope.evaluate = function( command ) { 
		dirtyLS = false;
		socket.once( 'cwd', setCWD );
		cwd = getCWD();
		socket.emit( 'evaluate', cwd, command.trim() );
	};

	socket.on( 'enter', function( command ) {
		$scope.output += $scope.address + ' <' + getTime() + '> $' + ' ' + command + '\n';  
		$scope.$apply();
	} );

	socket.on( 'ip', function( IP ) {
		serverIP = IP;
		onRefresh();
	} );

	socket.on( 'feedback', function (data) {
		$scope.output += data;
		$scope.$apply();
		allign();
	} );

	socket.once( 'cwd', setCWD );

	socket.on( 'ls', function( data ) { 
		cl.registerAutoComplete( data );
	} ); 

	socket.on( 'exit', function( code, signal ) {

		socket.removeListener( 'cwd', setCWD );
		
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

	window.addEventListener( 'load', onRefresh );
	window.addEventListener( 'hashchange', onRefresh );

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

	function setCWD( d ) {
		cwd = d;
		location.hash = d;
	}

	function getCWD() {
		return location.hash.slice(1);
	}

}