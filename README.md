

### Usage directions:

This was tested on Ubuntu 16.04.4 (with VMWare Fusion 8 and Mac OS X Sierra).

Install Neo4J via Terminal:
1. Get a key so the Neo4j repository will be trusted by the system: `wget -O - https://debian.neo4j.org/neotechnology.gpg.key \ | sudo apt-key add -`
2. Add the Neo4J repository to the list of repositories to be searched: `echo 'deb http://debian.neo4j.org/repo stable/' \ | sudo tee -a /etc/apt/sources.list.d/neo4j.list`
3. Check if there are any new versions of packages existing on the machine: `sudo apt-get update`
4. Fetch those new versions: `sudo apt-get upgrade`
5. Install Neo4J `sudo apt-get install neo4j`
6. Run `which neo4j` to verify installation.

Use Neo4J:
1. Start Neo4J via Terminal: `sudo neo4j start`. You may see the warning `WARNING: Max 1024 open files allowed, minimum of 40000 recommended.` This is just a warning, not an error, and can either be [repaired](https://stackoverflow.com/questions/20924596/neo4j-warning-max-1024-open-files-allowed-minimum-of-40-000-recommended-see-t?noredirect=1&lq=1) or ignored. 

Build database:
1. Shut down the server: `sudo neo4j stop`
2. Delete the active database: `sudo rm -r /var/lib/neo4j/data/databases/graph.db`
3. Switch to the `./data` directory and add movies, actors, and roles data to a new database:

```
sudo neo4j-admin import \
	--mode=csv \
	--nodes movies.csv \
	--nodes actors.csv \
	--relationships roles.csv
````

You should receive output indicating that 6 nodes, 9 relationships, and 18 properties have been imported.

4. Add locations data: `sudo cp -p locations.csv /var/lib/neo4j/import/`
6. Open a web browser and browse to `localhost:7474`.
7. Authenticate the connection by entering the default password `neo4j`. You will then be prompted to set your own password.
8. Enter the following script into Neo4J:

```
LOAD CSV WITH HEADERS FROM 'file:///locations.csv'
as line
WITH split(line.locations,";")
as locations, line.title as title
UNWIND locations AS location
MERGE (x:Location {name:location})
MERGE (m:Movie {title:title})
MERGE (m)-[:FILMED_IN]->(x)
```

You should receive output indicating that 3 labels, 3 nodes, 3 properties, and 6 relationships have been created.

Set the password in app.js on line __ to your neo4j password. 

To install other dependencies listed in `package.json`: `npm install`.

Run the app: `node app`.


