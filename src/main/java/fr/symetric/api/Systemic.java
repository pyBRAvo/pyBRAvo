/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.symetric.api;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.StringWriter;
import java.net.URI;
import java.net.URLConnection;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import org.apache.jena.query.Query;
import org.apache.jena.query.QueryExecution;
import org.apache.jena.query.QueryExecutionFactory;
import org.apache.jena.query.QueryFactory;
import org.apache.jena.query.QuerySolution;
import org.apache.jena.query.ResultSet;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.ModelFactory;
import org.apache.jena.rdf.model.RDFNode;
import org.apache.log4j.Logger;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;


/**
 *
 * @author Marie Lefebvre
 */
@Path("systemic")
public class Systemic {
    
    private Logger logger = Logger.getLogger(Systemic.class);
    private String headerAccept = "Access-Control-Allow-Origin";
    
    @GET
    @Path("/network")
    @Produces(MediaType.APPLICATION_JSON)
    public Response searchNetwork(@QueryParam("genes") String genes) throws JSONException {
        
        JSONArray genesList = new JSONArray(genes);
        
        Model transcriptorModel = ModelFactory.createDefaultModel();
        Model finalModel = ModelFactory.createDefaultModel();
        
        try {
            for(int i=0; i < genesList.length(); i++){
                if (genesList.get(i) != "" && genesList.get(i) != " ") {
                    StringBuilder result = new StringBuilder();
//                    logger.info(genesList.get(i));
                    // Construct new graphe
                    // Filter on Trancription Factor and wihtout miRNA
                    String filterQuery = "PREFIX bp: <http://www.biopax.org/release/biopax-level3.owl#>\n"
                        +"PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n"
                        +"CONSTRUCT {\n"
                        +"?tempReac bp:displayName ?type ; bp:controlled ?controlledName ; bp:controller ?controllerName ; bp:dataSource ?source .\n"
                        +"} WHERE{ \n"
                        +"FILTER( ( regex(?controlledName, ' "+genesList.get(i)+"$', 'i') ) && !regex(?source, 'mirtar', 'i') ) .\n"
                        +"?tempReac a bp:TemplateReactionRegulation .\n"
                        +"?tempReac bp:displayName ?reacName ; bp:controlled ?controlled ; bp:controller ?controller ; bp:controlType ?type ; bp:dataSource ?source .\n"
                        +"?controlled bp:displayName ?controlledName .\n"
                        +"?controller bp:displayName ?controllerName .\n "
                        +"}"
                        +"GROUP BY ?controlledName ?controllerName";
                    System.out.println("Query created");

                    // Parsing json is more simple than XML
                    String contentType = "application/json";
                    // URI of the SPARQL Endpoint
                    String accessUri = "http://192.54.201.50/sparql";

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
            
            //System.out.println("Send second Query");
            //Model mtemp = selectQuery(transcriptorModel);
            finalModel.add(transcriptorModel);
            //finalModel.add(mtemp);
            //RDFDataMgr.write(System.out, mtemp, Lang.RDFJSON) ;
            final StringWriter writer = new StringWriter(); 
            finalModel.write(writer, "RDF/JSON");
            return Response.status(200).header("Access-Control-Allow-Origin", "*").entity(writer.toString()).build(); 
        } catch (Exception ex) {
            logger.error(ex);
            return Response.status(500).header(headerAccept, "*").entity("Error while querying PathwayCommons endpoint").build();
        }
    }
    
    /**
     * Next levels of regulation
     * @author Marie Lefebvre
     * @param constructModel : initial graphe
     */
    public Model selectQuery(Model constructModel) {
        // SPARQL Query to get controller of a model
        String queryStringS = "PREFIX bp: <http://www.biopax.org/release/biopax-level3.owl#>\n" +
            "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n" +
            "SELECT DISTINCT ?controller\n" +
            "WHERE{ ?x bp:controller ?controller }" ;
        Model finalModel = ModelFactory.createDefaultModel();
        finalModel.add(constructModel);
        
        // Create query
        Query queryS = QueryFactory.create(queryStringS) ;
        try (QueryExecution qex = QueryExecutionFactory.create(queryS, constructModel)) {
            // Execute select
            ResultSet results = qex.execSelect();
            for ( ; results.hasNext() ; ){
                QuerySolution soln = results.nextSolution() ;
                RDFNode x = soln.get("controller") ;       // Get a result variable by name.
                //System.out.println("Gene --------- "+x);
                Model tempModel = ConstuctRecursiveQuery(x);
                finalModel.add(tempModel);
            }
            qex.close(); // close select query execution
            
            
        } catch (Exception e) {
            logger.error(e);
        }
        return finalModel;
    }
    
    /**
     * Next levels of regulation
     * @author Marie Lefebvre
     * @param gene : String - controller of initial network regulation
     * @return finalModel : Model - network regulation of the gene
     */
    public Model ConstuctRecursiveQuery(RDFNode gene) throws IOException {
        // SPARQL Query to get controller of a model
        String queryString = "PREFIX bp: <http://www.biopax.org/release/biopax-level3.owl#>\n"
            +"  PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n"
            +"  CONSTRUCT {\n"
            +"      ?tempReac bp:displayName ?type ; bp:controlled ?controlledName ; bp:controller ?controllerName ; bp:dataSource ?source .\n"
            +"  } WHERE { \n"
            +"      FILTER( ( regex(?controlledName, ' "+gene+"$', 'i') ) && !regex(?source, 'mirtar', 'i') ) .\n"
            +"      ?tempReac a bp:TemplateReactionRegulation .\n"
            +"      ?tempReac bp:displayName ?reacName ; bp:controlled ?controlled ; bp:controller ?controller ; bp:controlType ?type ; bp:dataSource ?source .\n"
            +"      ?controlled bp:displayName ?controlledName .\n"
            +"      ?controller bp:displayName ?controllerName .\n "
            +"  }";
        Model finalModel = ModelFactory.createDefaultModel();
        // Create query
        Query query = QueryFactory.create(queryString) ;
        String contentType = "application/json";
        // URI of the SPARQL Endpoint
        String accessUri = "http://rdf.pathwaycommons.org/sparql";
        StringBuilder result = new StringBuilder();

        URI requestURI = javax.ws.rs.core.UriBuilder.fromUri(accessUri)
                   .queryParam("query", "{query}")
                   .queryParam("format", "{format}")
                   .build(query, contentType);
        URLConnection con;
        try {
            con = requestURI.toURL().openConnection();
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
            finalModel.read(bais, null, "RDF/JSON");
        } catch (Exception ex) {
            logger.error(ex);
        }
        System.out.println("Final Model en cours");
        return finalModel;
    }
}


