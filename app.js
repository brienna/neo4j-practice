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

// Global variable
var path;
var person1;
var person2;
var movie1;
var movie2;

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
				// Set movie id and details
				movieDict[title] = {id: "", details: []};
				movieDict[title].year = year;
				movieDict[title].details.push(detail);
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
						persons: personDict,
						path: path,
						person1: person1,
						person2: person2,
						movie1: movie1,
						movie2: movie2
					});
				});
		}).catch(function(err) {
			console.log(err);
		});
});

// Action to take when user submits form to add movie
app.post('/movie/add', function(req, res) {
	var title = req.body.title; // from html input
	var year = parseInt(req.body.year); // from html input
	
	// Connect to database, create movie with title and year
	session
		.run('CREATE (n:Movie {title: {titleParam}, released:{yearParam}}) RETURN n.title, n.released',
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

// Remove a movie when user clicks "Remove" next to movie item
app.get('/movie/remove', function(req, res) {
	title = req.query.title;
	year = parseInt(req.query.year);
	session
		.run('MATCH (n:Movie) where n.title = {titleParam} and n.released = {yearParam} detach delete n', {titleParam: title, yearParam: year})
		.then(function(result) {
			res.redirect('/');
			session.close();
		})
		.catch(function(err) {
			console.log(err);
		});
});

// Remove a person when user clicks "Remove" next to person item
app.get('/person/remove', function(req, res) {
	name = req.query.name;

	session
		.run('MATCH (n:Person) where n.name = {nameParam} detach delete n', {nameParam: name})
		.then(function(result) {
			res.redirect('/');
			session.close();
		})
		.catch(function(err) {
			console.log(err);
		})
});

// Finds the shortest path between two persons
app.post('/person/find_shortest_path', function(req, res) {
	path = "";
	person1 = req.body.person1;
	person2 = req.body.person2;
	
	session
		.run('MATCH (m:Person { name: {nameParam1}}),(n:Person { name: {nameParam2} }), p = shortestPath((m)-[*]-(n)) RETURN p', {nameParam1: person1, nameParam2: person2})
		.then(function(result) {
			var segments = result.records[0]._fields[0].segments;
			for (var i = 0; i < segments.length; i++) {
				if (segments[i].start.properties.name) {
					path = path + segments[i].start.properties.name + " > ";
				} 
				if (segments[i].start.properties.title) {
					path = path + segments[i].start.properties.title + " > ";
				}
			}
			path = path + person2;
			res.redirect('/');
			session.close();
		})
		.catch(function(err) {
			console.log(err);
		});
});

// Finds the shortest path between two movies
app.post('/movie/find_shortest_path', function(req, res) {
	path = "";
	movie1 = req.body.movie1;
	movie2 = req.body.movie2;
	
	session
		.run('MATCH (m:Movie { title: {titleParam1}}),(n:Movie { title: {titleParam2} }), p = shortestPath((m)-[*]-(n)) RETURN p', {titleParam1: movie1, titleParam2: movie2})
		.then(function(result) {
			var segments = result.records[0]._fields[0].segments;
			for (var i = 0; i < segments.length; i++) {
				if (segments[i].start.properties.name) {
					path = path + segments[i].start.properties.name + " > ";
				} 
				if (segments[i].start.properties.title) {
					path = path + segments[i].start.properties.title + " > ";
				}
			}
			path = path + movie2;
			res.redirect('/');
			session.close();
		})
		.catch(function(err) {
			console.log(err);
		});
});

// MATCH (m:Person { name: 'Tom Hanks'}),(n:Person { name: 'John Cusack' }), p = shortestPath((m)-[*]-(n)) RETURN p

// Serve app on port 3000
app.listen(7000);
console.log('Server started on port 7000');

module.exports = app;