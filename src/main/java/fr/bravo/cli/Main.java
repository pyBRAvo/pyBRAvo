/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.bravo.cli;

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
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
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
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;

/**
 * Workflow of SPARQL queries
 *
 * @author Marie Lefebvre
 */
public class Main {

    static Logger logger = Logger.getLogger(Main.class); // initialize log

    public static void main(String[] args) throws IOException, JSONException {;

        // Set options of .jar
        // input file ; output file ; type of network assembly
        Options options = new Options();

        Option input = new Option("i", "input", true, "input csv file name");
        input.setRequired(true);
        options.addOption(input);

        Option output = new Option("o", "output", true, "output file name");
        output.setRequired(true);
        options.addOption(output);

        Option format = new Option("f", "format", true, "supported output file format: sif, turtle, ttl, rdfxml, rdfjson, jsonld");
        format.setRequired(true);
        options.addOption(format);
        
        Option smolecule = new Option("m", "molecule", false, "do not take into account small moleculed");
        smolecule.setRequired(false);
        options.addOption(smolecule);

        Option regulation = new Option("r", "regulation", false, "build regulatory network");
        regulation.setRequired(false);
        options.addOption(regulation);

        Option signaling = new Option("s", "signaling", false, "build signaling network (Downstreaming reconstruction soon available)");
        signaling.setRequired(false);
        options.addOption(signaling);

        Option id = new Option("d", "id", false, "input data are ids");
        id.setRequired(false);
        options.addOption(id);

        Option name = new Option("n", "name", false, "input data are names");
        name.setRequired(false);
        options.addOption(name);

        Option direction = new Option("w", "way", true, "way of reconstruction {'Up' | 'Down'} - default is set to 'Up'");
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

        if (cmd.hasOption("id") && cmd.hasOption("name")) {
            logger.error("Set id (-d) OR name (-n) option");
            formatter.printHelp("utility-name", options);
            System.exit(1);
            return;
        } else if (!cmd.hasOption("id") && !cmd.hasOption("name")) {
            logger.error("Set id (-d) OR name (-n) option");
            formatter.printHelp("utility-name", options);
            System.exit(1);
            return;
        }
        if (cmd.hasOption("regulation") && cmd.hasOption("signaling")) {
            logger.error("Set regulatory (-r) OR signaling (-s) network assembly option");
            formatter.printHelp("utility-name", options);
            System.exit(1);
            return;
        } else if (!cmd.hasOption("regulation") && !cmd.hasOption("signaling")) {
            logger.error("Set regulatory (-r) OR signaling (-s) network assembly option");
            formatter.printHelp("utility-name", options);
            System.exit(1);
            return;
        }
        if (!cmd.hasOption("format")) {
            logger.error("Set output file format (-f)");
            formatter.printHelp("utility-name", options);
            System.exit(1);
            return;
        }else{
            if ( cmd.getOptionValue("format").equals("sif") && cmd.hasOption("signaling") ){
                logger.error("SIF format is not available for signaling reconstruction yet. Please, use another format.");
                formatter.printHelp("utility-name", options);
                System.exit(1);
                return;
            }
        }
        String way = "";
        if (!cmd.hasOption("way")) {
            // Default value
            way = "Up";
        } else if (cmd.hasOption("way") && cmd.hasOption("signaling")) {
            // Direction sets to Up when signaling reconstruction
            way = "Up";
        } else {
            way = cmd.getOptionValue("way");
        }
        StopWatch sw = new StopWatch();
        sw.start();
        Model network = ModelFactory.createDefaultModel();
        List geneDone = new ArrayList<String>();
        Boolean molecule = true;
        if (cmd.hasOption("molecule")) {
            molecule = false;
            System.out.println("Do not consider small molecules");
        }else{
            molecule = true;
        }
        if (cmd.hasOption("signaling")) {
            // Initial graph with Transcription Factors (TFs)
            Object[] initialResults = initialConstruct(inputFilePath, way, "signaling", "name", molecule);
            System.out.println("Initial signaling graph : DONE");
            Model initialModel = (Model) initialResults[0];
            geneDone = (List) initialResults[1];
            // Next level of signaling network
            System.out.println("Run signaling network construction");
            network = signalingConstruct(initialModel, initialModel, geneDone);
        } else if (cmd.hasOption("regulation")) {
            if (cmd.hasOption("id")){
                // Initial graph with Transcription Factors (TFs)
                Object[] initialResults = initialConstruct(inputFilePath, way, "regulation", "id", molecule);
                System.out.println("Initial regulatory graph : DONE");
                Model initialModel = (Model) initialResults[0];
                geneDone = (List) initialResults[1];
                // Next level of regulation network
                System.out.println("Run regulatory network construction");
                network = fr.bravo.api.Automatic.upstreamRegulationConstruct(initialModel, initialModel, geneDone, way, molecule, Arrays.asList("KEGG", "PID", "reactome"));
            }else{
                // Initial graph with Transcription Factors (TFs)
                Object[] initialResults = initialConstruct(inputFilePath, way, "regulation", "name", molecule);
                System.out.println("Initial regulatory graph : DONE");
                Model initialModel = (Model) initialResults[0];
                geneDone = (List) initialResults[1];
                // Next level of regulation network
                System.out.println("Run regulatory network construction");
                network = fr.bravo.api.Automatic.upstreamRegulationConstruct(initialModel, initialModel, geneDone, way, molecule, Arrays.asList("KEGG", "PID", "reactome"));
            }
            
        } else {
            logger.error("Wrong type of network");
            System.exit(1);
            return;
        }
        System.out.println("Next level : DONE");
        // Save graph as source/target format 
        saveRegulationGraph(network, outputFilePath, formatOut);
        System.out.println("With file " + inputFilePath
                + "\nResults file written :"
                + "\n------ Reconstruction : " + way
                + "\n------ Nodes : " + geneDone.size());
        sw.stop();
        System.out.println("------ Execution time " + sw.getTime() + " ms");
    }

    /**
     * Initial SPARQL query - First level of regulation (e.g. Transcription
     * Factor)
     *
     * @author Marie Lefebvre
     * @param filename input file
     * @param direction set direction of reconstruction {Up, Down}
     * @param type
     * @param queryType
     * @param smolecule
     * @return Object with JENA Model and List of genes
     * @throws java.io.IOException
     * @throws org.codehaus.jettison.json.JSONException
     */
    public static Object[] initialConstruct(String filename, String direction, String type, String queryType, Boolean smolecule) throws IOException, JSONException {
        String line;
        String splitBy = ";";

        Model modelDefault = ModelFactory.createDefaultModel();
        Model modelResult = ModelFactory.createDefaultModel();
        List<String> geneDone = new ArrayList<String>();
        JSONArray genesList = new JSONArray();
        String queryStringC = "";
        
        try {
            // Use of IDs 
            if ("id".equals(queryType)) {
                BufferedReader br = new BufferedReader(new FileReader(filename));
                while ((line = br.readLine()) != null) {
                    String[] b = line.split(splitBy);
                    genesList.put(b[0]);
                }                
                JSONArray idList = genesList;
                genesList = fr.bravo.api.SparqlQuery.IdToNameQuery(idList);
                for(int i=0; i < genesList.length(); i++){
                    StringBuilder result = new StringBuilder();
                    geneDone.add(genesList.get(i).toString());
                    if (type.equals("regulation")) {
                        if (direction.equals("Up")) {
                            // SPARQL Query to get all transcription factors for a gene
                            queryStringC = fr.bravo.api.SparqlQuery.initialUpRegulationQuery(genesList.get(i).toString(), smolecule);
                        } else if (direction.equals("Down")) {
                            // SPARQL Query to get all genes regulated by the given genes
                            queryStringC = fr.bravo.api.SparqlQuery.initialDownRegulationQuery(genesList.get(i).toString(), smolecule);
                        }
                    } else {
                        // SPARQL Query to get all entities that have reaction link with the given genes (i.e. signaling)
                        queryStringC = fr.bravo.api.SparqlQuery.initialSignalingQuery(genesList.get(i).toString());
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
                    while ((lineResult = reader.readLine()) != null) {
                        result.append(lineResult);
                    }
                    // Prepare model
                    ByteArrayInputStream bais = new ByteArrayInputStream(result.toString().getBytes());
                    modelResult.read(bais, null, "RDF/JSON");
                }
            }else {
                BufferedReader br = new BufferedReader(new FileReader(filename));
                while ((line = br.readLine()) != null) {
                    StringBuilder result = new StringBuilder();
                    String[] b = line.split(splitBy);
                    geneDone.add(b[0]);
                    if (type.equals("regulation")) {
                        if (direction.equals("Up")) {
                            // SPARQL Query to get all transcription factors for a gene
                            queryStringC = fr.bravo.api.SparqlQuery.initialUpRegulationQuery(b[0], smolecule);
                        } else if (direction.equals("Down")) {
                            // SPARQL Query to get all genes regulated by the given genes
                            queryStringC = fr.bravo.api.SparqlQuery.initialDownRegulationQuery(b[0], smolecule);
                        }
                    } else {
                        // SPARQL Query to get all entities that have reaction link with the given genes (i.e. signaling)
                        queryStringC = fr.bravo.api.SparqlQuery.initialSignalingQuery(b[0]);
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
                    while ((lineResult = reader.readLine()) != null) {
                        result.append(lineResult);
                    }
                    // Prepare model
                    ByteArrayInputStream bais = new ByteArrayInputStream(result.toString().getBytes());
                    modelResult.read(bais, null, "RDF/JSON");
                } // End While
                br.close();
            }
        } catch (IOException | IllegalArgumentException | UriBuilderException e) {
            logger.error(e.getMessage());
            System.exit(1);
        }
        return new Object[]{modelResult, geneDone};
    }

    /**
     * Build signaling graph
     *
     * @param listModel
     * @param tempModel
     * @param genesDone
     * @return
     * @throws IOException
     */
    public static Model signalingConstruct(Model listModel, Model tempModel, List genesDone) throws IOException {

        // No next regulators
        if (listModel.isEmpty()) {
            return tempModel;
        }
        System.out.println("Select");
        // SPARQL Query to get left participant of a model - do not take controller
        String queryStringS = "PREFIX bp: <http://www.biopax.org/release/biopax-level3.owl#>\n"
                + "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n"
                + "SELECT DISTINCT ?name\n"
                + "WHERE{ ?x bp:left ?left .\n"
                + "    ?left bp:displayName ?name"
                + "}";
        // Create query
        Query queryS = QueryFactory.create(queryStringS);
        QueryExecution qex = QueryExecutionFactory.create(queryS, listModel);
        // Execute select
        ResultSet TFs = qex.execSelect();

        Model resultTemp = ModelFactory.createDefaultModel();
        // For each regulators
        for (; TFs.hasNext();) {
            QuerySolution soln = TFs.nextSolution();
            RDFNode TF = soln.get("name");       // Get a result variable by name (e.g. gene)
            // Research not done yet
            if (!genesDone.contains(TF) && !TF.toString().contains("'") && !TF.toString().contains("?")) {
                genesDone.add(TF);
                StringBuilder result = new StringBuilder();

                String contentType = "application/json";
                // URI of the SPARQL Endpoint
                String accessUri = "http://rdf.pathwaycommons.org/sparql";

                String conversionQuery = fr.bravo.api.SparqlQuery.initialSignalingQuery(TF.toString().toUpperCase());

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
                while ((line = reader.readLine()) != null) {
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
        Model finalModel = signalingConstruct(resultTemp, tempModel, genesDone);
        return finalModel;
    }

    /**
     * Save graph as CSV file
     *
     * @author Marie Lefebvre
     * @param constructModel : initial graphe
     * @param outputFilePath
     * @param format
     * @throws java.io.FileNotFoundException
     */
    public static void saveRegulationGraph(Model constructModel, String outputFilePath, String format) throws FileNotFoundException {
        try {
            String fileName = outputFilePath;
            if (format.equals("turtle") || format.equals("ttl")) {
                RDFDataMgr.write(new FileOutputStream(fileName), constructModel, Lang.TTL);
            } else if (format.equals("rdfxml")) {
                RDFDataMgr.write(new FileOutputStream(fileName), constructModel, Lang.RDFXML);
            } else if (format.equals("rdfjson")) {
                RDFDataMgr.write(new FileOutputStream(fileName), constructModel, Lang.RDFJSON);
            } else if (format.equals("jsonld")) {
                RDFDataMgr.write(new FileOutputStream(fileName), constructModel, Lang.JSONLD);
            } else if (format.equals("sif")) {
                convertToSIF(constructModel, outputFilePath);
            } else {
                RDFDataMgr.write(new FileOutputStream(fileName), constructModel, Lang.JSONLD);
            }
        } catch (FileNotFoundException e) {
            System.out.println("Save as file error");
            logger.error(e);
        }
    }

    public static void convertToSIF(Model constructModel, String outputFilePath) {
        Path path = Paths.get(outputFilePath);

        String querySIF = "PREFIX bp: <http://www.biopax.org/release/biopax-level3.owl#>\n"
                + "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n"
                + "SELECT DISTINCT ?left_name ?type ?right_name "
                + "WHERE{ "
                + "     ?reac bp:controller ?left .\n"
                + "     ?reac bp:controlled ?right .\n"
                + "     ?reac bp:controlType ?type .\n"
                + "     ?left bp:displayName ?left_name .\n"
                + "     ?right bp:displayName ?right_name .\n"
                + "}";
        // Create query
        Query queryS = QueryFactory.create(querySIF);
        QueryExecution qex = QueryExecutionFactory.create(queryS, constructModel);
        // Execute select
        ResultSet SIF = qex.execSelect();

        Model resultTemp = ModelFactory.createDefaultModel();
        // For each regulators
        StringBuilder lines = new StringBuilder();
        for (; SIF.hasNext();) {
            QuerySolution soln = SIF.nextSolution();
            lines.append(soln.get("left_name").toString() + "\t");
            lines.append(soln.get("type").toString() + "\t");
            lines.append(soln.get("right_name").toString());
            lines.append("\n");
        }
        try {
            Files.write(path, lines.toString().getBytes());
        } catch (IOException e) {
            System.out.println("error while saving file");
            logger.error(e);
        }
    }
}
