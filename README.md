# Neomovies

A simple application that lists nodes and relationships in a graph database and offers the following functionality:
- Insert movies and persons
- View details for each movie and person
- Set a person as an actor and/or director
- Delete items
- Update items
- Find the shortest paths between two persons or two movies

To install dependencies: `npm install`.

Configure the following authentication info in app.js to use your \*Neo4j password:
```
// Connect to neo4j
var driver = neo4j.driver('bolt://localhost', neo4j.auth.basic('neo4j', 'YOUR_PASSWORD_HERE'));
```

\*This application assumes that Neo4j is running and that the sample movie database is already loaded. If this is not the case, please follow the instructions below.

Run the app: `node app`.

## Instructions

This was tested on Ubuntu 16.04.4 (with VMWare Fusion 8 and Mac OS X Sierra).

### Install Neo4j via Terminal:

1. Get a key so the Neo4j repository will be trusted by the system: `wget -O - https://debian.neo4j.org/neotechnology.gpg.key \ | sudo apt-key add -`
2. Add the Neo4J repository to the list of repositories to be searched: `echo 'deb http://debian.neo4j.org/repo stable/' \ | sudo tee -a /etc/apt/sources.list.d/neo4j.list`
3. Check if there are any new versions of packages existing on the machine: `sudo apt-get update`
4. Fetch those new versions: `sudo apt-get upgrade`
5. Install Neo4j `sudo apt-get install neo4j`
6. Run `which neo4j` to verify installation.

### Run Neo4j:

7. Start Neo4j via Terminal: `sudo neo4j start`. You may see the warning `WARNING: Max 1024 open files allowed, minimum of 40000 recommended.` This is just a warning, not an error, and can either be [repaired](https://stackoverflow.com/questions/20924596/neo4j-warning-max-1024-open-files-allowed-minimum-of-40-000-recommended-see-t?noredirect=1&lq=1) or ignored. 
8. Open a web browser and browse to `localhost:7474`
9. Authenticate the connection. The first time you do this, enter the default password `neo4j`. You will be prompted to set your own password. 

### Load the sample movie database:

10. In the Neo4j editor, clear the graph: `MATCH (n) DETACH DELETE n`
11. Enter `:play Movies` to bring up the sample movie database. 
12. There should be a prompt telling you to click on the boxed code, bringing it into the editor. Play the create statements, creating 38 movie nodes and 131 person nodes. 