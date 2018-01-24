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
import java.net.MalformedURLException;
import java.net.URI;
import java.net.URLConnection;
import java.util.ArrayList;
import java.util.List;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.ModelFactory;
import org.apache.log4j.Logger;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;


/**
 *
 * @author Marie Lefebvre
 */
@Path("systemic")
public class Systemic {
    
    private Logger logger = Logger.getLogger(Systemic.class);
    private String headerAccept = "Access-Control-Allow-Origin";
    
    /**
     *  Transcription of Gene names or IDs
     *  See use of BioPAX for PathwayCommons
     * @param genes
     * @param queryType
     * @return
     * @throws JSONException, IOException
     * @throws java.net.MalformedURLException
     */
    @GET
    @Path("/network")
    @Produces(MediaType.APPLICATION_JSON)
    public Response searchNetwork(@QueryParam("genes") String genes, 
            @QueryParam("type") String queryType) throws JSONException, MalformedURLException, IOException {
        
        JSONArray genesList = new JSONArray(genes);
        Model transcriptorModel = ModelFactory.createDefaultModel();
        Model finalModel = ModelFactory.createDefaultModel();
        List<String> idToNameList = new ArrayList<String>();
        
        // Use of IDs 
        if ("id".equals(queryType)) {
            JSONArray idList = genesList;
            genesList = fr.bravo.api.SparqlQuery.IdToNameQuery(idList);
        }
        try {
            for(int i=0; i < genesList.length(); i++){
                if (genesList.get(i) != "" && genesList.get(i) != " ") {
                    StringBuilder result = new StringBuilder();

                    // Construct new graphe
                    // Filter on Trancription Factor and wihtout miRNA
                    String filterQuery = fr.bravo.api.SparqlQuery.initialUpRegulationQuery(genesList.get(i).toString(), true);
                    System.out.println("Query created");

                    // Parsing json is more simple than XML
                    String contentType = "application/json";
                    // URI of the SPARQL Endpoint
                    String accessUri = "http://rdf.pathwaycommons.org/sparql";
                    URI requestURI = javax.ws.rs.core.UriBuilder.fromUri(accessUri)
                               .queryParam("query", "{query}")
                               .queryParam("format", "{format}")
                               .build(filterQuery, contentType);
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
                    transcriptorModel.read(bais, null, "RDF/JSON");

                }
            } // End For Loop
            
            finalModel.add(transcriptorModel);
            final StringWriter writer = new StringWriter(); 
            // Write model in JSON format to render as data
            finalModel.write(writer, "RDF/JSON");
            return Response.status(200).header("Access-Control-Allow-Origin", "*").entity(writer.toString()).build(); 
        } catch (IOException ex) {
            logger.error(ex);
            return Response.status(500).header(headerAccept, "*").entity("Error while querying PathwayCommons endpoint").build();
        }
    }
    
    /**
     *  Signaling network of Gene names or IDs
     *  
     * @param genes
     * @return
     * @throws JSONException
     */
    @GET
    @Path("/network-signaling")
    @Produces(MediaType.APPLICATION_JSON)
    public Response searchSignalingNetwork(@QueryParam("genes") String genes) throws JSONException {
        
        JSONArray genesList = new JSONArray(genes);
        Model transcriptorModel = ModelFactory.createDefaultModel();
        Model finalModel = ModelFactory.createDefaultModel();
        
        try {
            // Iterate over biological entites (input)
            for(int i=0; i < genesList.length(); i++){
                if (genesList.get(i) != "" && genesList.get(i) != " ") {
                    StringBuilder result = new StringBuilder();
                    
                    // Construct new graphe
                    String filterQuery = fr.bravo.api.SparqlQuery.initialSignalingQuery(genesList.get(i).toString(), true);

                    // Parsing json is more simple than XML
                    String contentType = "application/json";
                    // URI of the SPARQL Endpoint
                    String accessUri = "http://rdf.pathwaycommons.org/sparql";

                    URI requestURI = javax.ws.rs.core.UriBuilder.fromUri(accessUri)
                               .queryParam("query", "{query}")
                               .queryParam("format", "{format}")
                               .build(filterQuery, contentType);
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
                    transcriptorModel.read(bais, null, "RDF/JSON");
                }
            } // End For Loop
            
            finalModel.add(transcriptorModel);
            final StringWriter writer = new StringWriter(); 
            finalModel.write(writer, "RDF/JSON");
            return Response.status(200).header("Access-Control-Allow-Origin", "*").entity(writer.toString()).build(); 
        } catch (Exception ex) {
            logger.error(ex);
            return Response.status(500).header(headerAccept, "*").entity("Error while querying PathwayCommons endpoint").build();
        }
    }
}


