/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.symetric.api;

import fr.inria.acacia.corese.exceptions.EngineException;
import fr.inria.acacia.corese.triple.parser.Dataset;
import fr.inria.edelweiss.kgram.core.Mappings;
import fr.inria.edelweiss.kgraph.core.Graph;
import fr.inria.edelweiss.kgraph.core.GraphStore;
import fr.inria.edelweiss.kgraph.query.QueryProcess;
import fr.inria.edelweiss.kgtool.load.Load;
import fr.inria.edelweiss.kgtool.print.JSOND3Format;
import fr.inria.edelweiss.kgtool.print.JSONFormat;
import java.io.File;
import java.util.List;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
//import org.apache.jena.query.QueryExecution;
//import org.apache.jena.query.QueryExecutionFactory;
//import org.apache.jena.query.QueryFactory;
//import org.apache.jena.query.ResultSet;
//import org.apache.jena.query.ResultSetFormatter;
//import org.apache.jena.rdf.model.Model;
//import org.apache.jena.rdf.model.ModelFactory;
//import org.apache.jena.riot.RDFDataMgr;
import org.apache.log4j.Logger;

/**
 *
 * @author Alban Gaignard <alban.gaignard@cnrs.fr>
 */
@Path("query")
public class QueryAPI {

    @Context
    private HttpServletRequest httpRequest;
    private Logger logger = Logger.getLogger(QueryAPI.class);

    // Init RDF graph with RDFS entailments
    private static GraphStore graph = GraphStore.create(true);
    private static QueryProcess exec = QueryProcess.create(graph);

    private String headerAccept = "Access-Control-Allow-Origin";

//    Model model = ModelFactory.createDefaultModel();

    public QueryAPI() {

    }

//    @GET
//    @Path("/jena")
//    @Produces(MediaType.APPLICATION_JSON)
////    @RolesAllowed({"user"})
////    @Audit
//    public Response jenaQuery(@QueryParam("query") String queryString) {
//
//        org.apache.jena.query.QueryAPI query = QueryFactory.create(queryString);
//
//        try (QueryExecution qexec = QueryExecutionFactory.create(query, model)) {
//            ResultSet results = qexec.execSelect();
//            ResultSetFormatter.outputAsJSON(System.out, results);
//        }
//
//        return Response.status(200).build();
//    }

    @GET
    @Path("/sparql")
    @Produces(MediaType.APPLICATION_JSON)
//    @RolesAllowed({"user"})
//    @Audit
    public Response sparql(@QueryParam("query") String query) {

//        Date now = new Date();
//        String sessionId = httpRequest.getHeader("session-id");
//        if (sessionId != null) {
//            Session s = DAOFactory.getSessionDAO().get(sessionId);
//            s.setLastAccessedTime(now);
//            DAOFactory.getSessionDAO().save(s);
//            logger.debug("Session " + sessionId + " last accessed : " + now);
//        }
        try {
            Mappings map = exec.query(query);
            return Response.status(200).entity(JSONFormat.create(map).toString()).build();
        } catch (EngineException ex) {

            ex.printStackTrace();

            String message = "Error while querying Corese/KGRAM with query\n" + query;
            logger.error(message);
            return Response.status(500).entity(message).build();
        }
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/d3")
    public Response getTriplesJSONForGetWithGraph(@QueryParam("query") String query,
            @QueryParam("default-graph-uri") List<String> defaultGraphUris,
            @QueryParam("named-graph-uri") List<String> namedGraphUris) {
        try {

            Mappings m = exec.query(query, createDataset(defaultGraphUris, namedGraphUris));

            String mapsD3 = "{ \"mappings\" : "
                    + JSONFormat.create(m).toString()
                    + " , "
                    + "\"d3\" : "
                    + JSOND3Format.create((Graph) m.getGraph()).toString()
                    + " }";

//            System.out.println(mapsD3);
            return Response.status(200).header("Access-Control-Allow-Origin", "*").entity(mapsD3).build();

        } catch (Exception ex) {
            logger.error("Error while querying the remote KGRAM engine");
            ex.printStackTrace();
            return Response.status(500).header(headerAccept, "*").entity("Error while querying the remote KGRAM engine").build();
        }
    }

    @GET
    @Path("/init")
//    @Produces(MediaType.APPLICATION_JSON)
//    @RolesAllowed({"user"})
//    @Audit
    public Response init() {
        try {
            graph = GraphStore.create(false);
            exec = QueryProcess.create(graph);

            Load ld = Load.create(graph);
            ld.load("/Users/gaignard-a/Documents/Projets/Region-SyMeTRIC/Demonstrateurs/Demonstrateur-SemWeb/csv-cepidc-I35-44/rdf");
            logger.debug(graph.size() + " triples loaded");
//            File d = new File("/Users/gaignard/Documents/Projets/Region-SyMeTRIC/Demonstrateurs/Demonstrateur-SemWeb/csv-cepidc-I35-44/rdf");
//            if (d.isDirectory()) {
//                for (File f : d.listFiles()) {
//                    if (!f.getName().startsWith(".")) {
////                    model = RDFDataMgr.loadModel(f.getAbsolutePath());
//                        if (f.getAbsolutePath().endsWith("owl")) {
//                            model.read(f.getAbsolutePath(), "RDF/XML");
//                            logger.debug("loaded " + f.getAbsolutePath());
//                            logger.debug("loaded " + model.size() + " triples");
//                        } else if (f.getAbsolutePath().endsWith("ttl")) {
//                            model.read(f.getAbsolutePath(), "TTL");
//                            logger.debug("loaded " + f.getAbsolutePath());
//                            logger.debug("loaded " + model.size() + " triples");
//                        }
//                    }
//                }
//            }

            return Response.status(200).build();
        } catch (Exception ex) {
            ex.printStackTrace();
            String message = "Error while initializing the Corese/KGRAM engine";
            logger.error(message);
            return Response.status(500).entity(message).build();
        }
    }

    /**
     * Creates a Corese/KGRAM Dataset based on a set of default or named graph
     * URIs. For *strong* SPARQL compliance, use dataset.complete() before
     * returning the dataset.
     *
     * @param defaultGraphUris
     * @param namedGraphUris
     * @return a dataset if the parameters are not null or empty.
     */
    private Dataset createDataset(List<String> defaultGraphUris, List<String> namedGraphUris) {
        return createDataset(defaultGraphUris, namedGraphUris, null);
    }

    private Dataset createDataset(List<String> defaultGraphUris, List<String> namedGraphUris, fr.inria.acacia.corese.triple.parser.Context c) {
        if (c != null
                || ((defaultGraphUris != null) && (!defaultGraphUris.isEmpty()))
                || ((namedGraphUris != null) && (!namedGraphUris.isEmpty()))) {
            Dataset ds = Dataset.instance(defaultGraphUris, namedGraphUris);
            ds.setContext(c);
            return ds;
        } else {
            return null;
        }
    }
}
