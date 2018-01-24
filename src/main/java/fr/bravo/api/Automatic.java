/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.bravo.api;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.StringWriter;
import java.net.URI;
import java.net.URLConnection;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.FormParam;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.ModelFactory;
import org.apache.log4j.Logger;
import org.codehaus.jettison.json.JSONArray;


/**
 *
 * @author Marie Lefebvre
 */
@Path("automatic")
public class Automatic {
    
    private Logger logger = Logger.getLogger(Automatic.class);
    private String headerAccept = "Access-Control-Allow-Origin";
    
    /**
     *  Run batch command for automatic network assembly
     *  
     * @param genes
     * @param queryType
     * @return
     */
    @POST
    @Path("/upstream")
    @Produces(MediaType.APPLICATION_JSON)
    public Response automaticUpstreamNetwork(@FormParam("genes") String genes, @FormParam("type") String queryType, 
            @DefaultValue("all") @FormParam("format") String format ) {
        try {
            // initial list of biological entities
            JSONArray genesList = new JSONArray(genes);
            
            // Use of IDs 
            if ("id".equals(queryType)) {
                JSONArray idList = genesList;
                genesList = fr.bravo.api.SparqlQuery.IdToNameQuery(idList);
            }
            
            // initial model with direct interaction, first level of regulation
            Object[] initialResults = initialUpstreamConstruct(genesList);
            System.out.println("Initial graph : DONE");
            Model initialModel = (Model)initialResults[0];
            // List of gene already done
            List geneDone = (List)initialResults[1];
            Model network = ModelFactory.createDefaultModel();
            // Final model
            network = upstreamRegulationConstruct(initialModel, initialModel, geneDone, "Up", true);
            HashMap<String, String> scopes = new HashMap<>();
            // Render JSON and RDF format
            if(format.equals("all")){
                final StringWriter writer = new StringWriter(); 
                final StringWriter swriter = new StringWriter(); 
                network.write(writer, "RDF/JSON");
                network.write(swriter, "RDF/XML");
                scopes.put("json", writer.toString());
                scopes.put("rdf", swriter.toString());
            } else {
                final StringWriter writer = new StringWriter();
                network.write(writer, "RDF/JSON");
                scopes.put("json", writer.toString());
            }
            System.out.println("Results will be send");
            return Response.status(200).header("Access-Control-Allow-Origin", "*").entity(scopes).build(); 
        } catch (Exception ex) {
            logger.error(ex);
            return Response.status(500).header(headerAccept, "*").entity("Error while processing automatic network assembly "+ex).build();
        }
    }
    
    /**
     * Initial SPARQL query - First level of regulation (e.g. Transcription Factor)
     * @author Marie Lefebvre
     * @param genes list of biological entities
     * @return Object with JENA Model and List of genes
     * @throws java.io.IOException
     */
    public static Object[] initialUpstreamConstruct(JSONArray genes) throws IOException {
        
        Model modelResult = ModelFactory.createDefaultModel();
        List<String> geneDone = new ArrayList<String>();
        try {
            for(int i=0; i < genes.length(); i++){
                StringBuilder result = new StringBuilder();
                String gene = genes.get(i).toString().toUpperCase();
                geneDone.add(gene);
                // SPARQL Query to get all transcription factors for a gene
                String queryString = fr.bravo.api.SparqlQuery.initialUpRegulationQuery(gene, true);
                            //+"GROUP BY ?controlledName ?controllerName";
                String contentType = "application/json";
                // URI of the SPARQL Endpoint
                String accessUri = "http://rdf.pathwaycommons.org/sparql";

                URI requestURI = javax.ws.rs.core.UriBuilder.fromUri(accessUri)
                           .queryParam("query", "{query}")
                           .queryParam("format", "{format}")
                           .build(queryString, contentType);
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
        }catch (Exception e){
            System.err.println(e.getMessage());
            System.exit(1);
        }
        return new Object[]{modelResult, geneDone};
    }
    
    /**
     * 
     * @param listModel {Model} 
     * @param tempModel {Model}
     * @param genesDone {ArrayList}
     * @param direction {String}
     * @param smolecule
     * @return {Model}
     * @throws java.io.IOException
     */
    public static Model upstreamRegulationConstruct(Model listModel, Model tempModel, List genesDone, String direction, Boolean smolecule) throws IOException {
        
        // No next regulators
        if(listModel.isEmpty()){
            return tempModel;
        }
//        Model resultTemp = fr.bravo.api.SparqlQuery.upstreamRegulationConstructQueryOptimized(listModel, tempModel, genesDone, direction);
        Model resultTemp = fr.bravo.api.SparqlQuery.upstreamRegulationConstructQuery(listModel, tempModel, genesDone, direction, smolecule);
        tempModel.add(resultTemp);
        Model finalModel= upstreamRegulationConstruct(resultTemp, tempModel, genesDone, direction, smolecule);
        return finalModel;
    }
}


