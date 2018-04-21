
### Usage directions:

Install Neo4J via Terminal:
1. Get a key so the Neo4j repository will be trusted by the system: `wget -O - https://debian.neo4j.org/neotechnology.gpg.key \ | sudo apt-key add -`
2. Add the Neo4j repository to the list of repositories to be searched: `echo 'deb http://debian.neo4j.org/repo stable/' \ | sudo tee -a /etc/apt/sources.list.d/neo4j.list`
3. Check if there are any new versions of packages existing on the machine: `sudo apt-get update`
4. Fetch those new versions: `sudo apt-get upgrade`
5. Install Neo4j `sudo apt-get install neo4j`



