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
var shortestPath;
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
                var year;
                if (record._fields[0].properties.released.low) {
					year = record._fields[0].properties.released.low;
                } else {
                	year = record._fields[0].properties.released;
                }
                var relationship = record._fields[1];
                var person = record._fields[2].properties.name;
                var detail = person + " " + relationship;
                // Set movie id and details
                if (title in movieDict) {
                	movieDict[title].details.push(detail);
                } else {
                	movieDict[title] = {details: [detail]};
                }
                movieDict[title].year = year;
            });
            // Connect to database, get persons
            session
                .run('MATCH (p:Person)-[r]-(q) return p,type(r),q')
                .then(function(result2) {
                    var personDict = {};
                    result2.records.forEach(function(record) {
                        // Get person's info and relationship
                        var person = record._fields[0].properties.name;
                        var relationship = record._fields[1];
                        var yob = record._fields[0].properties.born;
                        // Get details based on type of relationship
                        var detail;
                        if (relationship == "FOLLOWS") {
                            detail = relationship + " " + record._fields[2].properties.name;
                        } else {
                            detail = relationship + " " + record._fields[2].properties.title;
                        }
                        // Add person info to obj
                        if (person in personDict) {
                            personDict[person].details.push(detail);
                        } else {
                            personDict[person] = {details: [detail]};
                        }
                        personDict[person].yob = yob;
                    });

                    // Render view with movies and persons
                    res.render('index', {
                        movies: movieDict,
                        persons: personDict,
                        shortestPath: shortestPath,
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
    shortestPath = "";
    person1 = req.body.person1.trim();
    person2 = req.body.person2.trim();
    
    session
        .run('MATCH (m:Person { name: {nameParam1}}),(n:Person { name: {nameParam2} }), p = shortestPath((m)-[*]-(n)) RETURN p', {nameParam1: person1, nameParam2: person2})
        .then(function(result) {
            var segments = result.records[0]._fields[0].segments;
            for (var i = 0; i < segments.length; i++) {
                if (segments[i].start.properties.name) {
                    shortestPath = shortestPath + segments[i].start.properties.name + " > ";
                } 
                if (segments[i].start.properties.title) {
                    shortestPath = shortestPath + segments[i].start.properties.title + " > ";
                }
            }
            shortestPath = shortestPath + person2;
            res.redirect('/');
            session.close();
        })
        .catch(function(err) {
            console.log(err);
        });
});

// Finds the shortest path between two movies
app.post('/movie/find_shortest_path', function(req, res) {
    shortestPath = "";
    movie1 = req.body.movie1.trim();
    movie2 = req.body.movie2.trim();
    
    session
        .run('MATCH (m:Movie { title: {titleParam1}}),(n:Movie { title: {titleParam2} }), p = shortestPath((m)-[*]-(n)) RETURN p', {titleParam1: movie1, titleParam2: movie2})
        .then(function(result) {
            var segments = result.records[0]._fields[0].segments;
            for (var i = 0; i < segments.length; i++) {
                if (segments[i].start.properties.name) {
                    shortestPath = shortestPath + segments[i].start.properties.name + " > ";
                }
                if (segments[i].start.properties.title) {
                    shortestPath = shortestPath + segments[i].start.properties.title + " > ";
                }
            }
            shortestPath = shortestPath + movie2;
            res.redirect('/');
            session.close();
        })
        .catch(function(err) {
            console.log(err);
        });
});

// Update a person 
app.post('/person/update', function(req, res) {
    var personToUpdate = req.body.name;
    var newDate = req.body.yob;
    console.log(personToUpdate + " " + newDate);
    
    session
        .run('MATCH (n:Person {name: {nameParam}}) SET n.born = {updateParam} RETURN n', {nameParam: personToUpdate, updateParam: newDate})
        .then(function(result) {
            // Do nothing, just redirect, user will be able to see changes in list
            res.redirect('/');
            session.close();
        })
        .catch(function(err) {
            console.log(err);
        });
});

// Update a movie 
app.post('/movie/update', function(req, res) {
    var movieToUpdate = req.body.movie;
    var newDate = parseInt(req.body.year);
    console.log(movieToUpdate + ' ' + newDate);
    
    session
        .run('MATCH (n:Movie {title: {titleParam}}) SET n.released = {updateParam} RETURN n', {titleParam: movieToUpdate, updateParam: newDate})
        .then(function(result) {
        	console.log(result.records[0]._fields[0]);
            // Do nothing, just redirect, user will be able to see changes in list
            res.redirect('/');
            session.close();
        })
        .catch(function(err) {
            console.log(err);
        });
});

// Serve app on port 3000
app.listen(7000);
console.log('Server started on port 7000');

module.exports = app;