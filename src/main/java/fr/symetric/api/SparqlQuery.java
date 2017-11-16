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
import java.net.URI;
import java.net.URLConnection;
import java.util.ArrayList;
import java.util.List;
import javax.ws.rs.core.UriBuilderException;
import org.apache.jena.query.Query;
import org.apache.jena.query.QueryExecution;
import org.apache.jena.query.QueryExecutionFactory;
import org.apache.jena.query.QueryFactory;
import org.apache.jena.query.QuerySolution;
import org.apache.jena.query.ResultSet;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.ModelFactory;
import org.apache.jena.rdf.model.RDFNode;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

/**
 *
 * @author mlefebvre
 * 
 */
public class SparqlQuery {
    
    /**
     *
     * @param listModel
     * @param tempModel
     * @param genesDone
     * @param direction ; way of reconstruction
     * @return
     */
    public static Model upstreamRegulationConstructQuery(Model listModel, Model tempModel, List genesDone, String direction) {
        // SPARQL Query to get controller of a model (e.g. gene)
        String queryStringS = "PREFIX bp: <http://www.biopax.org/release/biopax-level3.owl#>\n" +
            "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n" +
            "SELECT DISTINCT ?name\n" +
            "WHERE{ " +
                "?x bp:controller ?controller .\n" +
                "?controller bp:displayName ?name" +
            " }" ;
        Model resultTemp = ModelFactory.createDefaultModel();
        // Create query
        Query queryS = QueryFactory.create(queryStringS) ;
        QueryExecution qex = QueryExecutionFactory.create(queryS, listModel);
        // Execute select
        ResultSet TFs = qex.execSelect();
        try {
            // For each regulators
            for ( ; TFs.hasNext() ; ){
                QuerySolution soln = TFs.nextSolution() ;
                StringBuilder result = new StringBuilder();
                RDFNode TF = soln.get("name") ;       // Get a result variable by name (e.g. gene)
                // Research not done yet
                if( !genesDone.contains(TF) ){
                    genesDone.add(TF);
                    // SPARQL Query to get all transcription factors for a gene
                    // An error will be sent if TF contains an apostrophe 
                    String queryStringC = "PREFIX bp: <http://www.biopax.org/release/biopax-level3.owl#>\n"
                            +"PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n"
                            +"PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \n"
                            +"CONSTRUCT {\n"
                            +"  ?tempReac rdf:type ?type ; bp:controlled ?controlled ; bp:controller ?controller ; bp:dataSource ?source ; bp:controlType ?controlType .\n"
                            +"  ?controlled a ?controlledType ; bp:displayName ?controlledName ; bp:dataSource ?controlledsource .\n"
                            +"  ?controller a ?controllerType ; bp:displayName ?controllerName ; bp:dataSource ?controllersource ."
                            +"} WHERE{ \n"
                            + "FILTER( (?controlledName = '"+TF+"'^^xsd:string) "
                                + "and (?controllerName != '"+TF+"'^^xsd:string)"
                                + "and (str(?source) != 'http://pathwaycommons.org/pc2/mirtarbase') ) .\n"
                            +"?tempReac a bp:TemplateReactionRegulation .\n"
                            +"?tempReac rdf:type ?type ; bp:controlled ?controlled ; bp:controller ?controller ; bp:controlType ?controlType ; bp:dataSource ?source .\n"
                            +"?controlled bp:participant ?participant ; bp:dataSource ?controlledsource .\n"
                            +"?participant bp:displayName ?controlledName; rdf:type ?controlledType .\n"
                            +"?controller bp:displayName ?controllerName ; rdf:type ?controllerType ; bp:dataSource ?controllersource .\n "
                            +"}"
                            + "GROUP BY ?controlledName ?controllerName";
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
                    resultTemp.read(bais, null, "RDF/JSON");
                }
            } // End for loop
        }catch(IOException | IllegalArgumentException | UriBuilderException e){
            System.err.println(e.getMessage());
        }
        return resultTemp;
    }
    
    /**
     *
     * @param b {String} Entity name
     * @return
     */
    public static String initialUpRegulationQuery(String b){
        String IURquery = "PREFIX bp: <http://www.biopax.org/release/biopax-level3.owl#>\n"
            +"PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n"
            +"PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \n"
            +"CONSTRUCT {\n"
            +"  ?tempReac rdf:type ?type ; bp:controlled ?controlled ; bp:controller ?controller ; bp:dataSource ?source ; bp:controlType ?controlType .\n"
            +"  ?controlled a ?controlledType ; bp:displayName ?controlledName ; bp:dataSource ?controlledsource .\n"
            +"  ?controller a ?controllerType ; bp:displayName ?controllerName ; bp:dataSource ?controllersource ."
            +"} WHERE{ \n"
            + "FILTER( (?controlledName = '"+b+"'^^xsd:string) "
                + "and (?controllerName != '"+b+"'^^xsd:string)"
                + "and (str(?source) != 'http://pathwaycommons.org/pc2/mirtarbase') ) .\n"
            +"?tempReac a bp:TemplateReactionRegulation .\n"
            +"?tempReac rdf:type ?type ; bp:controlled ?controlled ; bp:controller ?controller ; bp:controlType ?controlType ; bp:dataSource ?source .\n"
            +"?controlled bp:participant ?participant ; bp:dataSource ?controlledsource .\n"
            +"?participant bp:displayName ?controlledName; rdf:type ?controlledType ."
            +"?controller bp:displayName ?controllerName ; rdf:type ?controllerType ; bp:dataSource ?controllersource .\n "
            +"}";
        return IURquery;
    }
    
    /**
     *
     * @param b {String} Entity name
     * @return
     */
    public static String initialDownRegulationQuery(String b){
        String IDRquery = "PREFIX bp: <http://www.biopax.org/release/biopax-level3.owl#>\n"
            +"PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n"
            +"PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \n"
            +"CONSTRUCT {\n"
            +"  ?tempReac rdf:type ?type ; bp:controlled ?controlled ; bp:controller ?controller ; bp:dataSource ?source ; bp:controlType ?controlType .\n"
            +"  ?controlled a ?controlledType ; bp:displayName ?controlledName ; bp:dataSource ?controlledsource .\n"
            +"  ?controller a ?controllerType ; bp:displayName ?controllerName ; bp:dataSource ?controllersource ."
            +"} WHERE{ \n"
            + "FILTER( (?controlledName != '"+b+"'^^xsd:string) "
                + "and (?controllerName = '"+b+"'^^xsd:string)"
                + "and (str(?source) != 'http://pathwaycommons.org/pc2/mirtarbase') ) .\n"
            +"?tempReac a bp:TemplateReactionRegulation .\n"
            +"?tempReac rdf:type ?type ; bp:controlled ?controlled ; bp:controller ?controller ; bp:controlType ?controlType ; bp:dataSource ?source .\n"
            +"?controlled bp:participant ?participant ; bp:dataSource ?controlledsource .\n"
            +"?participant bp:displayName ?controlledName; rdf:type ?controlledType ."
            +"?controller bp:displayName ?controllerName ; rdf:type ?controllerType ; bp:dataSource ?controllersource .\n "
            +"}";
        return IDRquery;
    }
    
    /**
     *
     * @param b {String} Entity name
     * @return
     */
    public static String initialSignalingQuery(String b){
        String ISquery = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n" +
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
            "  VALUES ?rightName { '"+b+"'^^xsd:string }\n" +
            "}order by ?catalysis";
        return ISquery;
    }
    
    /**
     * Id to Name Query
     * @author Marie Lefebvre
     * @param genesList
     * @return model
     * @throws org.codehaus.jettison.json.JSONException
     * @throws java.io.IOException
     */
    public static JSONArray IdToNameQuery(JSONArray genesList) throws JSONException, IOException {
        List<String> idToNameList = new ArrayList<String>();
        JSONArray idList = genesList;
        for(int i=0; i < idList.length(); i++){
            // Retrieve corresponding name with given ID
            String idQuery = "PREFIX bp: <http://www.biopax.org/release/biopax-level3.owl#>\n" +
                "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n" +
                "PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \n" +
                "SELECT DISTINCT ?name\n" +
                "WHERE{\n" +
                "  ?a bp:id ?b .\n" +
                "  FILTER ( ?b = '"+idList.get(i).toString()+"'^^xsd:string )\n" +
                "  ?c ?d ?a .\n" +
                "  ?e ?f ?c .\n" +
                "  ?e bp:displayName ?name .\n" +
                "}\n";
            System.out.println("Query ID created");
            
            StringBuilder result = new StringBuilder();
            // Parsing json is more simple than XML
            String contentType = "application/json";
            // URI of the SPARQL Endpoint
            String accessUri = "http://rdf.pathwaycommons.org/sparql";
            URI requestURI = javax.ws.rs.core.UriBuilder.fromUri(accessUri)
                       .queryParam("query", "{query}")
                       .queryParam("format", "{format}")
                       .build(idQuery, contentType);
            URLConnection con = requestURI.toURL().openConnection();
            con.addRequestProperty("Accept", contentType);
            InputStream in = con.getInputStream();

            // Read result
            BufferedReader reader = new BufferedReader(new InputStreamReader(in));

            String line;
            while((line = reader.readLine()) != null) {
                result.append(line);
            }
            JSONObject jsonObj = new JSONObject(result.toString());
            JSONArray jsonAr = jsonObj.getJSONObject("results").getJSONArray("bindings");
            for (int j = 0 ; j < jsonAr.length(); j++) {
                JSONObject obj = jsonAr.getJSONObject(j).getJSONObject("name");
                idToNameList.add(obj.getString("value"));
            }
        }
        return new JSONArray(idToNameList);
    }
}
