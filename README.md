# DataHUB

## Synopsis
The SyMeTRIC Data Hub, is a web application for biomedical data integration and reuse.

## Requirements
- git
- maven
- java8
- mongodb

## Installation
Clone the repository

    git clone https://gitlab.univ-nantes.fr/gaignard-a/symetric-api-server.git

Install [https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/] and Run mondogb 

    sudo service mongod start
    
Build package with maven :

    cd symetric-api-server/
    mvn install -Dmaven.test.skip=true
    
Run the web appliation 

    java -jar target/datahub-api-1.0-SNAPSHOT-datahub-launcher.jar

If behind a proxy 

    java -Dhttp.proxyHost=<proxy> -Dhttp.proxyPort=<port> -jar target/datahub-api-1.0-SNAPSHOT-datahub-launcher.jar
   
See on http://localhost:8091/
