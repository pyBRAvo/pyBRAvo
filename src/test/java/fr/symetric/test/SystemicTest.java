/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.symetric.test;

import com.sun.jersey.api.client.Client;
import com.sun.jersey.api.client.ClientResponse;
import com.sun.jersey.api.client.WebResource;
import com.sun.jersey.api.client.config.ClientConfig;
import com.sun.jersey.api.client.config.DefaultClientConfig;
import com.sun.jersey.api.json.JSONConfiguration;
import com.sun.jersey.api.uri.UriComponent;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.UnsupportedEncodingException;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.net.URLConnection;
import java.nio.charset.StandardCharsets;
import org.apache.jena.query.Query;
import org.apache.jena.query.QueryExecution;
import org.apache.jena.query.QueryExecutionFactory;
import org.apache.jena.query.QueryFactory;
import org.apache.jena.query.ResultSet;
import org.apache.jena.query.ResultSetFormatter;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.ModelFactory;
import org.apache.jena.riot.Lang;
import org.apache.jena.riot.RDFDataMgr;
import org.apache.log4j.Logger;
import static org.junit.Assert.assertEquals;
import org.junit.Ignore;
import org.junit.Test;

/**
 *
 * @author Marie Lefebvre
 */
public class SystemicTest {

    static Logger logger = Logger.getLogger(SystemicTest.class);

    /*
    * Test Virtuoso URL
     */
    @Test
    @Ignore
    public void testVirtuosoURL() throws Exception {
        String strUrl = "http://172.18.253.113:9099/sparql";

        try {
            URL url = new URL(strUrl);
            HttpURLConnection urlConn = (HttpURLConnection) url.openConnection();
            urlConn.connect();

            assertEquals(HttpURLConnection.HTTP_OK, urlConn.getResponseCode());
        } catch (IOException e) {
            System.err.println("Error creating HTTP connection to Virtuoso SPARQL endpoint");
            e.printStackTrace();
            throw e;
        }
    }

    String q1 = "PREFIX bp: <http://www.biopax.org/release/biopax-level3.owl#>\n"
            + "SELECT * FROM <http://fr.symetric#PC>  WHERE { ?x ?p ?y .} LIMIT 10";

    @Test
    @Ignore
    public void testSparqlRemoteEndpoint() throws URISyntaxException, UnsupportedEncodingException {
        ClientConfig config = new DefaultClientConfig();
        config.getFeatures().put(JSONConfiguration.FEATURE_POJO_MAPPING, Boolean.TRUE);
        Client client = Client.create(config);
        WebResource service = client.resource(new URI("http://rdf.pathwaycommons.org/sparql"));
        System.out.println(q1);
        String encoded = UriComponent.encode(q1, UriComponent.Type.QUERY_PARAM);
        System.out.println(encoded);
        String contentType = "application/json";

        ClientResponse response = service.queryParam("query", "{q1}")
                .queryParam("format", "{contentType}")
                .accept(contentType)
                .get(ClientResponse.class);

        if (response.getStatus() != 200) {
            logger.warn("Error from SPARQL endpoint.");
        } else {
            logger.info("Successful SPARQL querying.");
            String output = response.getEntity(String.class);
            System.out.println(output);
            logger.info(output);
        }
    }

    @Test
    public void testSparqlLocalEndpoint() throws URISyntaxException, UnsupportedEncodingException {
        ClientConfig config = new DefaultClientConfig();
        config.getFeatures().put(JSONConfiguration.FEATURE_POJO_MAPPING, Boolean.TRUE);
        Client client = Client.create(config);
        WebResource service = client.resource(new URI("http://172.18.253.113:9099/sparql"));
        System.out.println(q1);
        String encoded = UriComponent.encode(q1, UriComponent.Type.QUERY);
        System.out.println(encoded);
//        String contentType = "application/json";
        String contentType = "text/turtle";

        ClientResponse response = service.queryParam("query", encoded)
                .queryParam("format", contentType)
                .accept(contentType)
                .get(ClientResponse.class);

        if (response.getStatus() != 200) {
            logger.warn("Error from SPARQL endpoint.");
            System.out.println(response.getEntity(String.class));
        } else {
            logger.info("Successful SPARQL querying.");
            String output = response.getEntity(String.class);
            InputStream is = new ByteArrayInputStream(output.getBytes(StandardCharsets.UTF_8));
            
            Model m = ModelFactory.createDefaultModel();
            RDFDataMgr.read(m, is, Lang.TTL);
            
            m.write(System.out, "NT");
        }
    }

    @Test
    @Ignore
    public void testJenaFederatedQuery() {
        String query = ""
                + "SELECT * WHERE { \n"
                + "     SERVICE <http://172.18.253.113:9099/sparql> { \n"
                + "         ?x ?p ?y . \n"
                + "     }  \n"
                + "} LIMIT 10";
        
        Model m = ModelFactory.createDefaultModel();
        Query queryC = QueryFactory.create(query);
        try (QueryExecution qexec = QueryExecutionFactory.create(queryC, m)) {
            // Execute construct
            ResultSet resultTemp = qexec.execSelect();
            System.out.println(ResultSetFormatter.asText(resultTemp));
            qexec.close(); // Close construct execution
        }
    }
}
