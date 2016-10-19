/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.symetric.api;

import fr.cnrs.ga2prov.GHistAPI;
import fr.cnrs.ga2prov.GHistFactory;
import fr.cnrs.ga2prov.Util;
import fr.inria.edelweiss.kgram.core.Mappings;
import fr.inria.edelweiss.kgraph.core.Graph;
import fr.inria.edelweiss.kgraph.core.GraphStore;
import fr.inria.edelweiss.kgraph.query.QueryProcess;
import fr.inria.edelweiss.kgtool.load.Load;
import fr.inria.edelweiss.kgtool.print.JSOND3Format;
import fr.inria.edelweiss.kgtool.print.JSONFormat;
import fr.symetric.data.GalaxyCredential;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.StandardOpenOption;
import java.util.Map;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import org.apache.commons.lang.time.StopWatch;
import org.apache.log4j.Logger;

/**
 *
 * @author Alban Gaignard <alban.gaignard@cnrs.fr>
 */
@Path("provenance")
public class Provenance {

    private Logger logger = Logger.getLogger(Provenance.class);
    private String headerAccept = "Access-Control-Allow-Origin";

    @POST
    @Path("/histories")
    @Produces(MediaType.APPLICATION_JSON)
    public Response listHistories(GalaxyCredential cred) {
        GHistFactory.initInstance(cred.getInstanceUrl(), cred.getApiKey());
        try {
            StringBuilder response = new StringBuilder();
            response.append("{ \"histories\" : [");

            GHistAPI gAPI = GHistFactory.getInstance();
            Map<String, String> histories = gAPI.listHistories();
            for (String id : histories.keySet()) {
                response.append("{ \"id\":\"" + id + "\", \"label\":\"" + histories.get(id) + "\"},");
            }

            response.deleteCharAt(response.lastIndexOf(","));
            response.append("] }");

            logger.debug(response);

            return Response.status(200).header("Access-Control-Allow-Origin", "*").entity(response).build();
        } catch (Exception ex) {
            logger.error("An error occured while connecting to the Galaxy server. Please check the Galaxy server URL and your API key.");
            ex.printStackTrace();
            return Response.status(500).header(headerAccept, "*").entity("Error while retrieving Galaxy Histories").build();
        }
    }

    @POST
    @Path("/genProv/{hid}")
    @Produces(MediaType.TEXT_PLAIN)
    public Response genProv(GalaxyCredential cred, @PathParam("hid") String hid) {
        GHistFactory.initInstance(cred.getInstanceUrl(), cred.getApiKey());
        try {
            GHistAPI gAPI = GHistFactory.getInstance();

            StopWatch sw = new StopWatch();
            sw.start();
            String provTTL = gAPI.getProv(hid);
            sw.stop();
            logger.debug("PROV triples retrieved in " + sw.getTime() + " ms");

//            StringBuilder response = new StringBuilder();
//            response.append("{ \"prov_triples_ttl\" : \""+provTTL+"\"}");
//            logger.debug(response);
            return Response.status(200).header("Access-Control-Allow-Origin", "*").entity(provTTL).build();
        } catch (Exception ex) {
            logger.error("An error occured while connecting to the Galaxy server. Please check the Galaxy server URL and your API key.");
            ex.printStackTrace();
            return Response.status(500).header(headerAccept, "*").entity("Error while retrieving Galaxy Histories").build();
        }
    }

    @POST
    @Path("/visProv/{hid}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response visProv(GalaxyCredential cred, @PathParam("hid") String hid) {
        GHistFactory.initInstance(cred.getInstanceUrl(), cred.getApiKey());
        try {
            GHistAPI gAPI = GHistFactory.getInstance();

            StopWatch sw = new StopWatch();
            sw.start();
            String provTTL = gAPI.getProv(hid);
            sw.stop();
            logger.info("PROV triples retrieved in " + sw.getTime() + " ms");

            sw.reset();
            sw.start();
            GraphStore graph = GraphStore.create(false);
            QueryProcess exec = QueryProcess.create(graph);
            Load ld = Load.create(graph);
            InputStream inputStream = new ByteArrayInputStream(provTTL.getBytes(StandardCharsets.UTF_8));
            ld.load(inputStream, ".ttl");
            logger.info("Loaded " + graph.size() + " rdf statements.");

            Mappings maps = null;

            String filterQuery = "PREFIX prov:<http://www.w3.org/ns/prov#>\n"
                    + "CONSTRUCT {\n"
                    + "	?x ?p ?y .\n"
                    + " ?x rdfs:label ?xL .\n"
                    + " ?y rdfs:label ?yL .\n"
                    + "} WHERE {\n"
                    + "	?x ?p ?y .\n"
                    + " OPTIONAL {?x rdfs:label ?xL} .\n"
                    + " OPTIONAL {?y rdfs:label ?yL} .\n"
                    //                        + "	FILTER (?p NOT IN (rdf:type, prov:wasGeneratedBy, prov:qualifiedAssociation, prov:hadPlan, prov:agent, rdfs:comment)) \n"
                    //                            + "	FILTER (?p IN (prov:wasDerivedFrom, rdfs:label, prov:wasAttributedTo, prov:startedAtTime, prov:endedAtTime )) \n"
                    + "	FILTER (?p IN (prov:wasDerivedFrom, rdfs:label, prov:wasAttributedTo)) \n"
                    + "} ";
            maps = exec.query(filterQuery);

            Graph g = (Graph) maps.getGraph();

            String mapsProvJson = "{ \"mappings\" : "
                    + JSONFormat.create(maps).toString()
                    + " , "
                    + "\"d3\" : "
                    + JSOND3Format.create(g).toString()
                    + " }";
            sw.stop();
            logger.info("Filtered PROV graph and D3 data formatting in " + sw.getTime() + " ms");

            /////////////////////////////////////////////         
            ///// TO BE REMOVED !! 
            String htmlOut = Util.genHtmlViz(mapsProvJson);
            java.nio.file.Path pathHtml = Files.createTempFile("provenanceDisplay-", ".html");
            Files.write(pathHtml, htmlOut.getBytes(), StandardOpenOption.WRITE);
            logger.info("HTML visualization written in " + pathHtml.toString());
            java.nio.file.Path pathProv = Files.createTempFile("provenanceRDF-", ".ttl");
            Files.write(pathProv, provTTL.getBytes(), StandardOpenOption.WRITE);
            logger.info("RDF provenance written in " + pathProv.toString());
            /////////////////////////////////////////////         

            return Response.status(200).header("Access-Control-Allow-Origin", "*").entity(mapsProvJson).build();
        } catch (Exception ex) {
            logger.error("An error occured while connecting to the Galaxy server. Please check the Galaxy server URL and your API key.");
            ex.printStackTrace();
            return Response.status(500).header(headerAccept, "*").entity("Error while retrieving Galaxy Histories").build();
        }
    }

}
