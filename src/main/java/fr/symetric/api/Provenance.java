/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.symetric.api;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import fr.cnrs.ga2prov.GHistAPI_v2;
import fr.cnrs.ga2prov.GHistFactory;
import fr.inria.edelweiss.kgram.core.Mappings;
import fr.inria.edelweiss.kgraph.core.Graph;
import fr.inria.edelweiss.kgraph.query.QueryProcess;
import fr.inria.edelweiss.kgtool.load.Load;
import fr.inria.edelweiss.kgtool.print.JSOND3Format;
import fr.inria.edelweiss.kgtool.print.JSONFormat;
import fr.symetric.data.GalaxyCredential;
import fr.symetric.server.models.DAOFactory;
import fr.symetric.server.models.ProvMetrics;
import fr.symetric.server.models.ProvMetricsRepositoryDAO;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Iterator;
import java.util.Map;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import org.apache.commons.lang.time.StopWatch;
import org.apache.log4j.Logger;
import org.mongodb.morphia.query.Query;

/**
 *
 * @author Alban Gaignard <alban.gaignard@cnrs.fr>
 */
@Path("provenance")
public class Provenance {

    private Logger logger = Logger.getLogger(Provenance.class);
    private String headerAccept = "Access-Control-Allow-Origin";

    @GET
    @Path("/usage")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getUsage() {

        StringBuilder response = new StringBuilder();

        ProvMetricsRepositoryDAO dao = DAOFactory.getProvMetricsDAO();
        
        Query<ProvMetrics> query = dao.createQuery();
        query.order("timeSlot");
        Iterator it = query.iterator();
        
        String xAxis = "[";
        String y1 = "[";
        String y2 = "[";
        while (it.hasNext()) {
            ProvMetrics p = (ProvMetrics) it.next();
            xAxis += "'" + p.getTimeSlot() + "', ";
            y1 += p.getNbProvTriples() + ", ";
            y2 += p.getNbProvGen() + ", ";
        }
        xAxis = xAxis.substring(0, xAxis.lastIndexOf(","));
        y1 = y1.substring(0, y1.lastIndexOf(","));
        y2 = y2.substring(0, y2.lastIndexOf(","));
        xAxis += "]";
        y1 += "]";
        y2 += "]";

        String jsonTpl = "{\n"
                + "        chart: {\n"
                + "            zoomType: 'xy'\n"
                + "        },\n"
                + "        title: {\n"
                + "            text: 'Galaxy PROV usage'\n"
                + "        },\n"
                + "        xAxis: [{\n"
                + "            categories: " + xAxis + ",\n"
                + "            crosshair: true\n"
                + "        }],\n"
                + "        yAxis: [{ \n"
                + "            labels: {\n"
                + "                format: '{value}',\n"
                + "                style: {\n"
                + "                    color: \"#434348\"\n"
                + "                }\n"
                + "            },\n"
                + "            title: {\n"
                + "                text: 'PROV generations',\n"
                + "                style: {\n"
                + "                    color: \"#434348\"\n"
                + "                }\n"
                + "            }\n"
                + "        }, { \n"
                + "            title: {\n"
                + "                text: 'PROV triples generated',\n"
                + "                style: {\n"
                + "                    color: \"#7cb5ec\"\n"
                + "                }\n"
                + "            },\n"
                + "            labels: {\n"
                + "                format: '{value} triples',\n"
                + "                style: {\n"
                + "                    color: \"#7cb5ec\"\n"
                + "                }\n"
                + "            },\n"
                + "            opposite: true\n"
                + "        }],\n"
                + "        tooltip: {\n"
                + "            shared: true\n"
                + "        },\n"
                + "        legend: {\n"
                + "            layout: 'vertical',\n"
                + "            align: 'left',\n"
                + "            x: 120,\n"
                + "            verticalAlign: 'top',\n"
                + "            y: 100,\n"
                + "            floating: true,\n"
                + "            backgroundColor: '#FFFFFF'\n"
                + "        },\n"
                + "        series: [{\n"
                + "            name: 'PROV triples',\n"
                + "            type: 'column',\n"
                + "            yAxis: 1,\n"
                + "            data: " + y1 + ",\n"
                + "            tooltip: {\n"
                + "                valueSuffix: ' triples'\n"
                + "            }\n"
                + "\n"
                + "        }, {\n"
                + "            name: 'Runs',\n"
                + "            type: 'column',\n"
                + "            data: " + y2 + ",\n"
                + "            tooltip: {\n"
                + "                valueSuffix: ' runs'\n"
                + "            }\n"
                + "        }]\n"
                + "    }";

        Gson gson = new Gson();
        try {
            Object o = gson.fromJson(jsonTpl, Object.class);
//            logger.debug(new GsonBuilder().setPrettyPrinting().create().toJson(o));
            response.append(new GsonBuilder().setPrettyPrinting().create().toJson(o));
        } catch (Exception e) {
            e.printStackTrace();
            logger.error("invalid json format");
        }

        return Response.status(200).header("Access-Control-Allow-Origin", "*").entity(response).build();
    }

    @POST
    @Path("/histories")
    @Produces(MediaType.APPLICATION_JSON)
    public Response listHistories(GalaxyCredential cred) {
        GHistFactory.init(cred.getInstanceUrl(), cred.getApiKey());
        try {
            StringBuilder response = new StringBuilder();
            response.append("{ \"histories\" : [");

            GHistAPI_v2 gAPI = GHistFactory.getInstance();
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
        GHistFactory.init(cred.getInstanceUrl(), cred.getApiKey());
        try {
            GHistAPI_v2 gAPI = GHistFactory.getInstance();

            StopWatch sw = new StopWatch();
            sw.start();
            String provTTL = gAPI.getProv(hid);
            sw.stop();
            logger.debug("PROV triples retrieved in " + sw.getTime() + " ms");

            Graph graph = Graph.create(false);
            Load ld = Load.create(graph);
            InputStream inputStream = new ByteArrayInputStream(provTTL.getBytes(StandardCharsets.UTF_8));
            ld.load(inputStream, ".ttl");
            logger.info("Loaded " + graph.size() + " rdf statements.");
            ProvMetricsRepositoryDAO dao = DAOFactory.getProvMetricsDAO();
            dao.traceInsertedTriples(graph.size(), dao.getTimeSlot());

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
        //TODO remove mappings from JSON sended, only keep D3 graph
        GHistFactory.init(cred.getInstanceUrl(), cred.getApiKey());
        try {
            GHistAPI_v2 gAPI = GHistFactory.getInstance();

            StopWatch sw = new StopWatch();
            sw.start();
            String provTTL = gAPI.getProv(hid);
            sw.stop();
            logger.info("PROV triples retrieved in " + sw.getTime() + " ms");

            sw.reset();
            sw.start();
//            GraphStore graph = GraphStore.create(false);
            Graph graph = Graph.create(false);
            QueryProcess exec = QueryProcess.create(graph);
            Load ld = Load.create(graph);
            InputStream inputStream = new ByteArrayInputStream(provTTL.getBytes(StandardCharsets.UTF_8));
            ld.load(inputStream, ".ttl");
            logger.info("Loaded " + graph.size() + " rdf statements.");
            ProvMetricsRepositoryDAO dao = DAOFactory.getProvMetricsDAO();
            dao.traceInsertedTriples(graph.size(), dao.getTimeSlot());

            Mappings maps = null;

            String filterQuery = "PREFIX prov:<http://www.w3.org/ns/prov#>\n"
                    + "CONSTRUCT {\n"
                    + "	?xL ?p ?yL .\n"
                    //                    + " ?x rdfs:label ?xL .\n"
                    //                    + " ?y rdfs:label ?yL .\n"
                    + "} WHERE {\n"
                    + "	?x ?p ?y .\n"
                    + " OPTIONAL {?x rdfs:label ?xL} .\n"
                    + " OPTIONAL {?y rdfs:label ?yL} .\n"
                    //                        + "	FILTER (?p NOT IN (rdf:type, prov:wasGeneratedBy, prov:qualifiedAssociation, prov:hadPlan, prov:agent, rdfs:comment)) \n"
                    //                            + "	FILTER (?p IN (prov:wasDerivedFrom, rdfs:label, prov:wasAttributedTo, prov:startedAtTime, prov:endedAtTime )) \n"
                    + "	FILTER (?p IN (prov:wasDerivedFrom, prov:wasAttributedTo)) \n"
                    + "} ";
            maps = exec.query(filterQuery);

            Graph g = (Graph) maps.getGraph();

            String mapsProvJson = "{ \"mappings\" : "
                    + JSONFormat.create(maps).toString()
                    + " , "
                    + "\"d3\" : "
                    + JSOND3Format.create(g).toString()
                    + " }";

//            String mapsProvJson = "{ \"mappings\" : "
//                    + "\"d3\" : "
//                    + JSOND3Format.create(g).toString()
//                    + " }";
//            Gson gson = new Gson();
//            try {
//                Object o = gson.fromJson(mapsProvJson, Object.class);
//                logger.debug(new GsonBuilder().setPrettyPrinting().create().toJson(o));
//            } catch (Exception e) {
//                logger.error("invalid json format");
//            }
            sw.stop();
            logger.info("Filtered PROV graph and D3 data formatting in " + sw.getTime() + " ms");

            /////////////////////////////////////////////         
            ///// TO BE REMOVED !! 
//            String htmlOut = Util.genHtmlViz(mapsProvJson);
//            java.nio.file.Path pathHtml = Files.createTempFile("provenanceDisplay-", ".html");
//            Files.write(pathHtml, htmlOut.getBytes(), StandardOpenOption.WRITE);
//            logger.info("HTML visualization written in " + pathHtml.toString());
//            java.nio.file.Path pathProv = Files.createTempFile("provenanceRDF-", ".ttl");
//            Files.write(pathProv, provTTL.getBytes(), StandardOpenOption.WRITE);
//            logger.info("RDF provenance written in " + pathProv.toString());
            /////////////////////////////////////////////         
            return Response.status(200).header("Access-Control-Allow-Origin", "*").entity(mapsProvJson).build();
        } catch (Exception ex) {
            logger.error("An error occured while connecting to the Galaxy server. Please check the Galaxy server URL and your API key.");
            ex.printStackTrace();
            return Response.status(500).header(headerAccept, "*").entity("Error while retrieving Galaxy Histories").build();
        }
    }
}
