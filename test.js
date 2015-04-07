'use strict';

//Node application

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http,{ resource: '/dev/socket.io' });
var connection  = require('express-myconnection');
var PythonShell = require('python-shell');
var mysql = require('mysql');
var java = require("java");
java.classpath.push("java/slash.jar");
var slash = java.newInstanceSync("main.Slash");

http.listen(4000, function(){
  console.log('Express server listening on port %d in %s mode',http.address().port, app.settings.env);
});


var sessionsConnections = {};


//Express Middleware
var 
  morgan = require('morgan'),
  bodyParser = require('body-parser'),
  methodOverride = require('method-override'),
    cookieParser = require('cookie-parser'),
    session = require('express-session');
  

  app.use(morgan('combined'));
  //app.use(bodyParser.json());
  app.use(methodOverride('X-HTTP-Method-Override'));
var passport = require('passport');
var flash    = require('connect-flash');

require('./routes/passport')(passport); // pass passport for configuration



    // set up our express application
    app.use(cookieParser()); // read cookies (needed for auth)
    app.use(bodyParser.urlencoded() ); // get information from html forms

    //app.set('view engine', 'ejs'); // set up ejs for templating
    //
    // required for passport
    app.use(session({
        secret: 'keyboard cat'
    })); // session secret
    app.use(passport.initialize());
    app.use(passport.session()); // persistent login sessions
    app.use(flash()); // use connect-flash for flash messages stored in session
    //app.use(connection(mysql,{
    //    host: 'localhost',
    //    user: 'root',
    //    password : '',
    //    port : 3306, //port mysql
    //    database:'CLASH'
    //},'request'));




// routes ======================================================================
require('./routes/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport


  morgan('combined',{
  	skip: function(req,res) {return res.statusCode < 400} 
  });

	app.set('views', __dirname + '/views');
	app.engine('html', require('ejs').renderFile);

	app.set('view engine', 'ejs');

  
  app.get( '/', function ( request, response ) {
      response.render('index.html');
});

  //test2.html
  app.get('/test2.html', function (request, response){
    response.render('index.html');
  });

    // open public folder
    app.use(express.static(__dirname + '/public'));

//Socket.IO and python-shell

io.on('connection', function(socket) {
    sessionsConnections[socket.handshake.sessionID] = socket;

    console.log('connected to client -======================');

    socket.on('text', function(msg) {
        var options = {
            args: [msg]
        };

        PythonShell.run( 'parse_pos.py', options, function(err, results) {
            if (err) {
                console.log('error from python: ' + err.stack);
                console.log(results);
                socket.emit('response', err);
            } else {
                // results is an array consisting of messages collected during execution
                console.log("from python: "+results);
				/**
				 * read nltkInput and perform slash based on the algorithm, exception, and minimal, maximum token length.
				 * 
				 * @param nltkInput
				 * 			input return from parse_pos.py, in formate
				 * 			[	
				 * 				[ //paragraph level
				 * 					[ // sentence level
				 * 						"word1","pos1",
				 * 						"word2","pos2",
				 * 						...
				 * 					],
				 * 					[// sentence 2
				 * 						...
				 * 					],
				 * 						.....
				 * 				],
				 * 				[ //paragraph 2
				 * 					...
				 * 				],
				 * 				....
				 * 			]
				 * @param exceptionList
				 * 			Exception List is a string with multiple token, separated by ';'
				 * 			i.e.:
				 * 				from day to day;from year to year;
				 * @param minLength  [3, 10]
				 * 			minimum length of a token, 
				 * 			this is a suggestion value, 
				 * 			the algorithm do not guaranteed the length will always be large than minLength
				 * @param maxLength , [7,12]
				 * 			maximum length of a token,   # currently has no effect.
				 * 			this is a suggestion value, 
				 * 			the algorithm do not guaranteed the length will always be less than maxLength
				 * @return
				 * 			
				 */
                slash.parseSlash(results[0], 'from day to day;from year to year',2,7, function(error, data) {
                    if (error) {
                        console.log('err from java: ' + error);
                        socket.emit('response', error);
                    } else {
                        socket.emit('response', data);
                    }
                });
            }
        });
    });
});







