
package fr.symetric.api;

import fr.symetric.data.MyJsonData;
import java.util.List;
import java.util.UUID;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import org.apache.log4j.Logger;

/**
 * KGRAM engine exposed as a rest web service. The engine can be remotely
 * initialized, populated with an RDF file, and queried through SPARQL requests.
 *
 * @author Eric TOGUEM, eric.toguem@uy1.uninet.cm
 * @author Alban Gaignard, alban.gaignard@cnrs.fr
 * @author Olivier Corby
 */
@Path("sandbox")
public class Sandbox {

    private Logger logger = Logger.getLogger(Sandbox.class);
    
    public Sandbox(){
    }

    // DQP query for triple store index
    @GET
    @Produces("application/sparql-results+xml")
    public Response getTriplesXMLForGet(@QueryParam("query") String query,
            @QueryParam("default-graph-uri") List<String> defaultGraphUris,
            @QueryParam("named-graph-uri") List<String> namedGraphUris) {
        try {
            //System.out.println("Rest: " + query);
//            Mappings map = getQueryProcess().query(query, createDataset(defaultGraphUris, namedGraphUris));
//            System.out.println("Rest: " + map);
//            System.out.println("Rest: " + map.size());
//            return Response.status(200).header(headerAccept, "*").entity(
//                    ResultFormat.create(map).toString()).build();
        } catch (Exception ex) {
            logger.error("Error while querying the remote KGRAM engine");
            ex.printStackTrace();
//            return Response.status(500).header(headerAccept, "*").entity("Error while querying the remote KGRAM engine").build();
        }
        return  null;
    }

    @GET
    @Path("/sayHello/{label}")
    @Produces(MediaType.APPLICATION_JSON)
    public MyJsonData produceJSON( @PathParam("label") String label ) {
        String id = UUID.randomUUID().toString();
        MyJsonData d = new MyJsonData();
        d.setId(id);
        d.setLabel(label);
        return d;
    }
    
    @POST
    @Path("/sendJson")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response consumeJSON( MyJsonData data) {
        String output = data.toString();
        logger.info(output);
        return Response.status(200).entity(output).build();
    }

    
}
