/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.symetric.cli;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.FileReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.URLConnection;
import java.util.ArrayList;
import java.util.List;
import javax.ws.rs.core.UriBuilderException;
import org.apache.commons.cli.CommandLine;
import org.apache.commons.cli.CommandLineParser;
import org.apache.commons.cli.DefaultParser;
import org.apache.commons.cli.HelpFormatter;
import org.apache.commons.cli.Option;
import org.apache.commons.cli.Options;
import org.apache.commons.cli.ParseException;
import org.apache.commons.lang3.time.StopWatch;
import org.apache.jena.query.Query;
import org.apache.jena.query.QueryExecution;
import org.apache.jena.query.QueryExecutionFactory;
import org.apache.jena.query.QueryFactory;
import org.apache.jena.query.QuerySolution;
import org.apache.jena.query.ResultSet;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.ModelFactory;
import org.apache.jena.rdf.model.RDFNode;
import org.apache.jena.riot.Lang;
import org.apache.jena.riot.RDFDataMgr;
import org.apache.log4j.Logger;

/**
 * Workflow of SPARQL queries
 * @author Marie Lefebvre
 */
public class Main {
    static Logger logger = Logger.getLogger(Main.class); // initialize log
    
    public static void main(String[] args) throws IOException {;
        
        // Set options of .jar
        // input file ; output file ; type of network assembly
        Options options = new Options();

        Option input = new Option("i", "input", true, "input csv file name");
        input.setRequired(true);
        options.addOption(input);

        Option output = new Option("o", "output", true, "output file name");
        output.setRequired(true);
        options.addOption(output);
        
        Option format = new Option("f", "format", true, "output file format");
        format.setRequired(true);
        options.addOption(format);
        
        Option regulation = new Option("r", "regulation", false, "build regulation network");
        regulation.setRequired(false);
        options.addOption(regulation);
        
        Option signaling = new Option("s", "signaling", false, "build signaling network");
        signaling.setRequired(false);
        options.addOption(signaling);
        
        Option id = new Option("d", "id", false, "input data are ids");
        id.setRequired(false);
        options.addOption(id);
        
        Option name = new Option("n", "name", false, "input data are names");
        name.setRequired(false);
        options.addOption(name);
        
        Option direction = new Option("w", "way", false, "way of reconstruction {'Up' | 'Down'} - default is set to 'Up'");
        direction.setRequired(false);
        options.addOption(direction);

        CommandLineParser parser = new DefaultParser();
        HelpFormatter formatter = new HelpFormatter();
        CommandLine cmd;

        try {
            cmd = parser.parse(options, args);
        } catch (ParseException e) {
            logger.error(e.getMessage());
            formatter.printHelp("utility-name", options);
            System.exit(1);
            return;
        }

        String inputFilePath = cmd.getOptionValue("input");
        String outputFilePath = cmd.getOptionValue("output");
        String formatOut = cmd.getOptionValue("format");
        
        if ( cmd.hasOption("id") && cmd.hasOption("name") ) {
            logger.error("Set id (-d) OR name (-n) option");
            formatter.printHelp("utility-name", options);
            System.exit(1);
            return;
        } else if ( !cmd.hasOption("id") && !cmd.hasOption("name") ){
            logger.error("Set id (-d) OR name (-n) option");
            formatter.printHelp("utility-name", options);
            System.exit(1);
            return;
        }
        if ( cmd.hasOption("regulation") && cmd.hasOption("signaling") ) {
            logger.error("Set regulation (-r) OR signaling (-s) network assembly option");
            formatter.printHelp("utility-name", options);
            System.exit(1);
            return;
        } else if ( !cmd.hasOption("regulation") && !cmd.hasOption("signaling") ){
            logger.error("Set regulation (-r) OR signaling (-s) network assembly option");
            formatter.printHelp("utility-name", options);
            System.exit(1);
            return;
        }
        if ( !cmd.hasOption("format") ) {
            logger.error("Set output file format (-f) : turtle or rdf");
            formatter.printHelp("utility-name", options);
            System.exit(1);
            return;
        }
        String way = "";
        if ( !cmd.hasOption("direction") ) {
            // Default value
            way = "Up";
        }else if (cmd.hasOption("direction") && cmd.hasOption("signaling")){
            // Direction sets to Up when signaling reconstruction
            way = "Up";
        }else {
            way = cmd.getOptionValue("direction");
        }
        StopWatch sw = new StopWatch();        
        sw.start();
        Model network = ModelFactory.createDefaultModel();
        List geneDone = new ArrayList<String>();
        if ( cmd.hasOption("signaling") ) {
            // Initial graph with Transcription Factors (TFs)
            Object[] initialResults = initialConstruct(inputFilePath, way, "signaling");
            System.out.println("Initial graph : DONE");
            Model initialModel = (Model)initialResults[0];
            geneDone = (List)initialResults[1];
            // Next level of signaling network
            System.out.println("Run signaling network construction");
            network = signalingConstruct(initialModel, initialModel, geneDone);
        }else if ( cmd.hasOption("regulation") ){
            // Initial graph with Transcription Factors (TFs)
            Object[] initialResults = initialConstruct(inputFilePath, way, "regulation");
            System.out.println("Initial graph : DONE");
            Model initialModel = (Model)initialResults[0];
            geneDone = (List)initialResults[1];
            // Next level of regulation network
            System.out.println("Run regulation network construction");
            network = regulationConstruct(initialModel, initialModel, geneDone, way);
        }else{
            logger.error("Wrong type of network");
            System.exit(1);
            return;
        }
        System.out.println("Next level : DONE");
        // Save graph as source/target format 
        saveRegulationGraph(network, outputFilePath, formatOut);
        System.out.println("With file " + inputFilePath
                + "\nResults file written :"
                + "\n------Reconstruction :" + way
                + "\n------Nodes :" + geneDone.size());
        sw.stop();        
        System.out.println("------Execution time " + sw.getTime() + " ms");
    }
    
    /**
     * Initial SPARQL query - First level of regulation (e.g. Transcription Factor)
     * @author Marie Lefebvre
     * @param filename input file
     * @param direction set direction of reconstruction {Up, Down}
     * @param type
     * @return Object with JENA Model and List of genes
     * @throws java.io.IOException
     */
    public static Object[] initialConstruct(String filename, String direction, String type) throws IOException {
        String line;
        String splitBy = ";";  
        
        Model modelDefault = ModelFactory.createDefaultModel();
        Model modelResult = ModelFactory.createDefaultModel();
        List<String> geneDone = new ArrayList<String>();
        try {
            BufferedReader br = new BufferedReader(new FileReader(filename));
            while((line = br.readLine()) != null){
                StringBuilder result = new StringBuilder();
                String[] b = line.split(splitBy);
                geneDone.add(b[0]);
                String queryStringC = "";
                if ( type.equals("regulation")) {
                    if( direction.equals("Up") ) {
                        // SPARQL Query to get all transcription factors for a gene
                        queryStringC = "PREFIX bp: <http://www.biopax.org/release/biopax-level3.owl#>\n"
                            +"PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n"
                            +"PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \n"
                            +"CONSTRUCT {\n"
                            +"  ?tempReac rdf:type ?type ; bp:controlled ?controlled ; bp:controller ?controller ; bp:dataSource ?source ; bp:controlType ?controlType .\n"
                            +"  ?controlled a ?controlledType ; bp:displayName ?controlledName ; bp:dataSource ?controlledsource .\n"
                            +"  ?controller a ?controllerType ; bp:displayName ?controllerName ; bp:dataSource ?controllersource ."
                            +"} WHERE{ \n"
                            + "FILTER( (?controlledName = '"+b[0]+"'^^xsd:string) "
                                + "and (?controllerName != '"+b[0]+"'^^xsd:string)"
                                + "and (str(?source) != 'http://pathwaycommons.org/pc2/mirtarbase') ) .\n"
                            +"?tempReac a bp:TemplateReactionRegulation .\n"
                            +"?tempReac rdf:type ?type ; bp:controlled ?controlled ; bp:controller ?controller ; bp:controlType ?controlType ; bp:dataSource ?source .\n"
                            +"?controlled bp:participant ?participant ; bp:dataSource ?controlledsource .\n"
                            +"?participant bp:displayName ?controlledName; rdf:type ?controlledType ."
                            +"?controller bp:displayName ?controllerName ; rdf:type ?controllerType ; bp:dataSource ?controllersource .\n "
                            +"}";
                    }else if(direction.equals("Down")) {
                        // SPARQL Query to get all genes regulated by the given genes
                        queryStringC = "PREFIX bp: <http://www.biopax.org/release/biopax-level3.owl#>\n"
                            +"PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n"
                            +"PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \n"
                            +"CONSTRUCT {\n"
                            +"  ?tempReac rdf:type ?type ; bp:controlled ?controlled ; bp:controller ?controller ; bp:dataSource ?source ; bp:controlType ?controlType .\n"
                            +"  ?controlled a ?controlledType ; bp:displayName ?controlledName ; bp:dataSource ?controlledsource .\n"
                            +"  ?controller a ?controllerType ; bp:displayName ?controllerName ; bp:dataSource ?controllersource ."
                            +"} WHERE{ \n"
                            + "FILTER( (?controlledName != '"+b[0]+"'^^xsd:string) "
                                + "and (?controllerName = '"+b[0]+"'^^xsd:string)"
                                + "and (str(?source) != 'http://pathwaycommons.org/pc2/mirtarbase') ) .\n"
                            +"?tempReac a bp:TemplateReactionRegulation .\n"
                            +"?tempReac rdf:type ?type ; bp:controlled ?controlled ; bp:controller ?controller ; bp:controlType ?controlType ; bp:dataSource ?source .\n"
                            +"?controlled bp:participant ?participant ; bp:dataSource ?controlledsource .\n"
                            +"?participant bp:displayName ?controlledName; rdf:type ?controlledType ."
                            +"?controller bp:displayName ?controllerName ; rdf:type ?controllerType ; bp:dataSource ?controllersource .\n "
                            +"}";
                    }
                }else{
                    // SPARQL Query to get all entities that have reaction link with the given genes
                    queryStringC = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n" +
                        "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n" +
                        "PREFIX owl: <http://www.w3.org/2002/07/owl#>\n" +
                        "PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\n" +
                        "PREFIX bp: <http://www.biopax.org/release/biopax-level3.owl#>" +
                        "CONSTRUCT {\n" +
                        "  ?reaction rdf:type ?type ; bp:right ?right ; bp:controller ?controller ; " +
                            "bp:left ?participant ; bp:dataSource ?source .\n" +
                        "  ?right a ?rightType ; bp:displayName ?rightName ; bp:dataSource ?rightSource .\n" +
                        "  ?participant a ?participantType ; bp:displayName ?participantName ; bp:dataSource ?participantSource .\n" +
                        "  ?controller a ?controllerType ; bp:displayName ?controllerName ; bp:dataSource ?controllerSource; bp:controlType ?controlType  ." +
                        "}WHERE{\n" +
                        "  OPTIONAL { \n" +
                        "    ?catalysis bp:controller ?controller ; bp:controlType ?controlType .\n" +
                        "    ?controller bp:displayName ?controllerName ; rdf:type ?controllerType ; bp:dataSource ?controllerSource ." +
                        "  }\n" +
                        "  FILTER (str(?source) != 'http://pathwaycommons.org/pc2/mirtarbase')" +
                        "  ?catalysis bp:controlled* ?reaction .\n" +
                        "  ?reaction bp:right ?right ; bp:dataSource ?source ; rdf:type ?type .\n" +
                        "  ?reaction bp:left|bp:right ?participant .\n" +
                        "  ?participant bp:displayName ?participantName ; rdf:type ?participantType ; bp:dataSource ?participantSource .\n" +
                        "  ?right bp:displayName ?rightName ; rdf:type ?rightType ; bp:dataSource ?rightSource ." +
                        "  VALUES ?rightName { '"+b[0]+"'^^xsd:string }\n" +
                        "}order by ?catalysis";
                }
                
                            //+"GROUP BY ?controlledName ?controllerName";
                String contentType = "application/json";
                // URI of the SPARQL Endpoint
                String accessUri = "http://rdf.pathwaycommons.org/sparql";

                URI requestURI = javax.ws.rs.core.UriBuilder.fromUri(accessUri)
                           .queryParam("query", "{query}")
                           .queryParam("format", "{format}")
                           .build(queryStringC, contentType);
                URLConnection con = requestURI.toURL().openConnection();
                con.addRequestProperty("Accept", contentType);
                InputStream in = con.getInputStream();

                // Read result
                BufferedReader reader = new BufferedReader(new InputStreamReader(in));

                String lineResult;
                while((lineResult = reader.readLine()) != null) {
                    result.append(lineResult);
                }
                // Prepare model
                ByteArrayInputStream bais = new ByteArrayInputStream(result.toString().getBytes());
                modelResult.read(bais, null, "RDF/JSON");
            } // End While
            br.close();
        }catch (IOException | IllegalArgumentException | UriBuilderException e){
            logger.error(e.getMessage());
            System.exit(1);
        }
        return new Object[]{modelResult, geneDone};
    }
    
    /**
     * Stoping criterion : list of transcription factors empty
     * 
     * if listModel is empty { return tempModel; STOP }
     * listController = SelectQuery(on listModel);
     * for each controller in listController {
     *      if (controller not in geneDone) {
     *          geneDone.add(controller)
     *          Model m = Construct(controller);
     *          resultTemp.add(m);
     *      }
     * }
     * tempModel.add(resultTemp);
     * modelFinal = regulationConstruct(resultTemp, tempModel, geneDone);
     * return modelFinal
     * 
     * -> update ? to navigate in the local Jena Model, use API "navigation" instead of SPARQL querying (e.g. m.listObjectOfProperty(p))
     * https://jena.apache.org/documentation/javadoc/jena/org/apache/jena/rdf/model/Model.html
     * 
     * @param listModel {Model} 
     * @param tempModel {Model}
     * @param genesDone {ArrayList}
     * @param direction {String}
     * @return {Model}
     * @throws java.io.IOException
     */
    public static Model regulationConstruct(Model listModel, Model tempModel, List genesDone, String direction) throws IOException {
        
        // No next regulators
        if(listModel.isEmpty()){
            return tempModel;
        }
        Model resultTemp = fr.symetric.api.SparqlQuery.upstreamRegulationConstructQuery(listModel, tempModel, genesDone, direction);
        tempModel.add(resultTemp);
        Model finalModel= regulationConstruct(resultTemp, tempModel, genesDone, direction);
        return finalModel;
    }
    
    /**
     * Build signaling graph
     * @param listModel
     * @param tempModel
     * @param genesDone
     * @return
     * @throws IOException
     */
    public static Model signalingConstruct(Model listModel, Model tempModel, List genesDone) throws IOException {
        
        // No next regulators
        if(listModel.isEmpty()){
            return tempModel;
        }
        System.out.println("Select");
        // SPARQL Query to get left participant of a model - do not take controller
        String queryStringS = "PREFIX bp: <http://www.biopax.org/release/biopax-level3.owl#>\n" +
            "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n" +
            "SELECT DISTINCT ?name\n" +
            "WHERE{ ?x bp:left ?left .\n" +
            "    ?left bp:displayName ?name" +
            "}" ;
        // Create query
        Query queryS = QueryFactory.create(queryStringS) ;
        QueryExecution qex = QueryExecutionFactory.create(queryS, listModel);
        // Execute select
        ResultSet TFs = qex.execSelect();
        
        Model resultTemp = ModelFactory.createDefaultModel();
        // For each regulators
        for ( ; TFs.hasNext() ; ){
            QuerySolution soln = TFs.nextSolution() ;
            RDFNode TF = soln.get("name") ;       // Get a result variable by name (e.g. gene)
            // Research not done yet
            if( !genesDone.contains(TF) && !TF.toString().contains("'") && !TF.toString().contains("?") ){
                genesDone.add(TF);
                StringBuilder result = new StringBuilder();
                
                String contentType = "application/json";
                // URI of the SPARQL Endpoint
                String accessUri = "http://rdf.pathwaycommons.org/sparql";
             
                String conversionQuery = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n" +
                        "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n" +
                        "PREFIX owl: <http://www.w3.org/2002/07/owl#>\n" +
                        "PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\n" +
                        "PREFIX bp: <http://www.biopax.org/release/biopax-level3.owl#>" +
                        "CONSTRUCT {\n" +
                        "  ?reaction rdf:type ?type ; bp:right ?right ; bp:controller ?controller ; " +
                            "bp:left ?participant ; bp:dataSource ?source .\n" +
                        "  ?right a ?rightType ; bp:displayName ?rightName ; bp:dataSource ?rightSource .\n" +
                        "  ?participant a ?participantType ; bp:displayName ?participantName ; bp:dataSource ?participantSource .\n" +
                        "  ?controller a ?controllerType ; bp:displayName ?controllerName ; bp:dataSource ?controllerSource ; bp:controlType ?controlType ." +
                        "}WHERE{\n" +
                        "  OPTIONAL { \n" +
                        "    ?catalysis bp:controller ?controller ; bp:controlType ?controlType .\n" +
                        "    ?controller bp:displayName ?controllerName ; rdf:type ?controllerType ; bp:dataSource ?controllerSource ." +
                        "  }\n" +
                        "  FILTER (str(?source) != 'http://pathwaycommons.org/pc2/mirtarbase')" +
                        "  ?catalysis bp:controlled* ?reaction .\n" +
                        "  ?reaction bp:right ?right ; bp:dataSource ?source ; rdf:type ?type .\n" +
                        "  ?reaction bp:left|bp:right ?participant .\n" +
                        "  ?participant bp:displayName ?participantName ; rdf:type ?participantType ; bp:dataSource ?participantSource .\n" +
                        "  ?right bp:displayName ?rightName ; rdf:type ?rightType ; bp:dataSource ?rightSource ." +
                        "  VALUES ?rightName { '"+TF.toString().toUpperCase()+"'^^xsd:string }\n" +
                        "}order by ?catalysis";
                
                URI requestURI = javax.ws.rs.core.UriBuilder.fromUri(accessUri)
                            .queryParam("query", "{query}")
                            .queryParam("format", "{format}")
                            .build(conversionQuery, contentType);
                 URLConnection con = requestURI.toURL().openConnection();
                 con.addRequestProperty("Accept", contentType);
                 InputStream in = con.getInputStream();

                 // Read result
                 BufferedReader reader = new BufferedReader(new InputStreamReader(in));

                 String line;
                 while((line = reader.readLine()) != null) {
                     result.append(line);
                 }
                 // Prepare model
                 ByteArrayInputStream bais = new ByteArrayInputStream(result.toString().getBytes());
                 resultTemp.read(bais, null, "RDF/JSON");
            }
        } // End for loop
        //qex.close(); // Close select query execution
        System.out.println("Add to temp model");
        tempModel.add(resultTemp);
        Model finalModel= signalingConstruct(resultTemp, tempModel, genesDone);
        return finalModel;
    }
    
    /**
     * Save graph as CSV file
     * @author Marie Lefebvre
     * @param constructModel : initial graphe
     * @param outputFilePath
     * @param format
     * @throws java.io.FileNotFoundException
     */
    public static void saveRegulationGraph(Model constructModel, String outputFilePath, String format) throws FileNotFoundException {
        try{
        String fileName = outputFilePath;
        if (format.equals("turtle")){
            RDFDataMgr.write(new FileOutputStream(fileName), constructModel, Lang.TTL);
        }else if (format.equals("rdf")){
            // Write model in JSON format to render as data
            RDFDataMgr.write(new FileOutputStream(fileName), constructModel, Lang.RDFXML);
        }
        } catch (FileNotFoundException e) {
            System.out.println("Save as file error");
            logger.error(e);
        }
    }
}
