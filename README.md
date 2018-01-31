# BRAvo - Biological netwoRk Assembly

## Synopsis
BRAvo is a web application and command line tool for biomedical data integration and reuse.

## Requirements
- git
- maven
- java8
- mongodb

## Installation
1/ Clone and Install dependency 

    cd workspace/
    git clone https://github.com/albangaignard/galaxy-ld.git
    cd galaxy-ld/galaxy-PROV
    mvn clean install -Dmaven.test.skip=true

2/ Clone the repository

    cd workspace/
    git clone https://gitlab.univ-nantes.fr/gaignard-a/BRAvo.git

3/ Install [[see](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/)] and Run mondogb 

    sudo service mongod start
    
4/ Build package with maven :

    cd BRAvo/
    mvn install -Dmaven.test.skip=true
    
5/ Choose web app or command line :

Run the **web appliation** 

    java -jar target/BRAvo-1.0-SNAPSHOT-bin.jar

If behind a proxy 

    java -Dhttp.proxyHost=<proxy> -Dhttp.proxyPort=<port> -jar target/BRAvo-1.0-SNAPSHOT-bin.jar
   
See on http://localhost:8091/

Use it as **command line**

    java -cp target/BRAvo-1.0-SNAPSHOT-bin.jar fr.bravo.cli.Main -i <input_file> -o <output_file> -f ("rdf" | "turtle") (-n | -d) (-r | -s) -w ('Up' | 'Down')
         
             -d,--id                       Input data are ids
             -ds,--data_sources <arg>      A data sources among {bind, biogrid, corum,
                                           ctd, dip, drugbank, hprd, humancyc, inoh,
                                           intact, kegg, mirtarbase, netpath, panther,
                                           pid, psp, reactome, reconx, smpdb, wp,
                                           intact_complex, msigdb}. Multiple -ds
                                           parameters can be used.
             -f,--format <arg>             Supported output file format: sif, turtle,
                                           ttl, rdfxml, rdfjson, jsonld
             -i,--input <arg>              Input csv file name
             -md,--max_depth <arg>         Maximum exploration depth
             -n,--name                     Input data are names
             -o,--output <arg>             Output file name
             -r,--regulation               Build regulatory network
             -s,--signaling                Build signaling network (Downstreaming
                                           reconstruction soon available)
             -ssm,--skip_small_molecules   Skip small molecules
             -w,--way <arg>                Way of reconstruction {'Up' | 'Down'} -
                                           Default is set to 'Up' - Downstream signaling 
                                           reconstruction soon available



It can be used to build **upstream gene regulation network** with gene names : 

    java -cp target/BRAvo-1.0-SNAPSHOT-bin.jar fr.bravo.cli.Main -i input-name.csv -o output.rdf -f "rdf" -r -n -w 'Up'
    
Or it can be used to build upstream gene regulation network with gene IDs : 

    java -cp target/BRAvo-1.0-SNAPSHOT-bin.jar fr.bravo.cli.Main -i input-id.csv -o output.ttl -f "turtle" -r -d

Or it can be used to build **downstream** gene regulation network with gene names : 

    java -cp target/BRAvo-1.0-SNAPSHOT-bin.jar fr.bravo.cli.Main -i input-id.csv -o output.ttl -f "turtle" -r -n -w 'Down'
    
It can also be used to build **signaling network** with gene **names** (only upstream available): 

    java -cp target/BRAvo-1.0-SNAPSHOT-bin.jar fr.bravo.cli.Main -i input-name.csv -o output.rdf -f "rdf" -s -n -w 'Up'
