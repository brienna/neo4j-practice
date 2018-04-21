// Specify dependencies
var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var neo4j = require('neo4j-driver').v1;

// Initialize app
var app = express();

// Set up view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

// Connect to neo4j
var driver = neo4j.driver('bolt://localhost', neo4j.auth.basic('neo4j', 'neirage')); // ENTER YOUR PASSWORD HERE, 'STUDENT' FOR LAB COMPUTERS
var session = driver.session();

// Set a route to home page
app.get('/', function(req, res) {
	// Get movies
	session
		.run('MATCH(n:Movie) RETURN n LIMIT 25')
		.then(function(result) {
			var movieArr = [];
			result.records.forEach(function(record) {
				movieArr.push({
					id: record._fields[0].identity.low,
					title: record._fields[0].properties.title,
					year: record._fields[0].properties.released
				});
			});
			// Get persons
			session
				.run('MATCH (n:Person) RETURN n LIMIT 25')
				.then(function(result2) {
					var personArr = [];
					result2.records.forEach(function(record) {
						personArr.push({
							id: record._fields[0].identity.low,
							name: record._fields[0].properties.name
						});
					});

					// Render view with movies and persons
					res.render('index', {
						movies: movieArr,
						persons: personArr
					});
				});
		}).catch(function(err) {
			console.log(err);
		});
});

// Serve app on port 3000
app.listen(5000);
console.log('Server started on port 5000');

module.exports = app;