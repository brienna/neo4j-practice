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
var driver = neo4j.driver('bolt://localhost', neo4j.auth.basic('neo4j', 'neirage'));
var session = driver.session();

// Set a route to home page
app.get('/', function(req, res) {
	// Connect to database, get movies
	session
		.run('MATCH (p:Movie)-[r]-(q) return p, type(r), q')
		.then(function(result) {
			var movieDict = {};
			result.records.forEach(function(record) {
				// Get each movie's title, relationship, and person
				var title = record._fields[0].properties.title;
				var year = record._fields[0].properties.released;
				var relationship = record._fields[1];
				var person = record._fields[2].properties.name;
				var detail = person + " " + relationship;

				// Add person info to obj
				if (title in movieDict) {
					movieDict[title].push(detail);
				} else {
					movieDict[title] = [detail];
				}
			});
			// Connect to database, get persons
			session
				.run('MATCH (p:Person)-[r]-(q) return p,type(r),q')
				.then(function(result2) {
					var personDict = {};
					result2.records.forEach(function(record) {
						// Get person's name and relationship
						var name = record._fields[0].properties.name;
						var relationship = record._fields[1];
						
						// Get details based on type of relationship
						var detail;
						if (relationship == "FOLLOWS") {
							detail = relationship + " " + record._fields[2].properties.name;
						} else {
							detail = relationship + " " + record._fields[2].properties.title;
						}

						// Add person info to obj
						if (name in personDict) {
							personDict[name].push(detail);
						} else {
							personDict[name] = [detail];
						}
					});

					// Render view with movies and persons
					res.render('index', {
						movies: movieDict,
						persons: personDict
					});
				});
		}).catch(function(err) {
			console.log(err);
		});
});

// Action to take when user submits form to add movie
app.post('/movie/add', function(req, res) {
	var title = req.body.title; // from html input
	var year = req.body.year; // from html input
	
	// Connect to database, create movie with title and year
	session
		.run('CREATE (n:Movie {title: {titleParam}, released:{yearParam}}) RETURN n.title',
			{ titleParam: title, yearParam: year })
		.then(function(result) {
			res.redirect('/');
			session.close();
		})
		.catch(function(err) {
			console.log(err);
		});
});

// Action to take when user submits form to add person
app.post('/person/add', function(req, res) {
	var name = req.body.name; // from html input
	
	// Connect to database, create movie with title and year
	session
		.run('CREATE (n:Person {name: {nameParam}}) RETURN n.name',
			{ nameParam: name })
		.then(function(result) {
			res.redirect('/');
			session.close();
		})
		.catch(function(err) {
			console.log(err);
		});
});

/*
 * Action to take when user submits form to set actor
 *
 * Tested by setting 'Tom Hanks' as an actor in 'The Matrix'
 * Both nodes already existed in the database
 * Checked in Neo4j browser with the query
 * MATCH (p:Person {name: 'Tom Hanks'})--(q) return p,q
 */
app.post('/movie/actor/add',function(req,res) { 
	var title = req.body.title;
	var name = req.body.name;
	session
	.run('MATCH (p:Person {name:{nameParam}}),(m:Movie{title:{titleParam}}) MERGE (p)-[:ACTED_IN]-(m) RETURN p,m', { titleParam: title, nameParam: name })
	.then(function(result) { 
		res.redirect('/');
		session.close();
	})
	.catch(function(err) { 
		console.log(err)
	});
});

/* 
 * Action to take when user submits form to set director
 *
 * Tested by setting 'Tom Hanks' as director of 'Cloud Atlas' 
 * Both nodes already existed in the database
 * Checked in Neo4j browser with the query 
 * MATCH (p:Person {name: 'Tom Hanks'})--(q) return p,q
 */
app.post('/movie/director/add',function(req,res) { 
	var title = req.body.title;
	var name = req.body.name;
	session
	.run('MATCH (p:Person {name:{nameParam}}),(m:Movie{title:{titleParam}}) MERGE (p)-[:DIRECTED]-(m) RETURN p,m', { titleParam: title, nameParam: name })
	.then(function(result) { 
		res.redirect('/');
		session.close();
	})
	.catch(function(err) { 
		console.log(err)
	});
});

// Serve app on port 3000
app.listen(7000);
console.log('Server started on port 7000');

module.exports = app;