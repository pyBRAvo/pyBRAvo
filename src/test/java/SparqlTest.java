/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

import com.sun.jersey.api.client.Client;
import com.sun.jersey.api.client.ClientResponse;
import com.sun.jersey.api.client.WebResource;
import com.sun.jersey.api.client.config.ClientConfig;
import com.sun.jersey.api.client.config.DefaultClientConfig;
import com.sun.jersey.api.json.JSONConfiguration;
import com.sun.jersey.api.uri.UriComponent;
import java.io.UnsupportedEncodingException;
import java.net.URI;
import java.net.URISyntaxException;
import org.apache.log4j.Logger;
import org.junit.After;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;

/**
 *
 * @author Alban Gaignard <alban.gaignard@cnrs.fr>
 */
public class SparqlTest {

    private static Logger logger = Logger.getLogger(SparqlTest.class);

    String q1 = "PREFIX foaf: <http://xmlns.com/foaf/0.1/>"
                + "SELECT distinct ?x ?p ?y WHERE"
                + "{"
                + "     ?x ?p ?y ."
                + "}"
                + "     LIMIT 10";
    
    String query = "PREFIX oboInOwl:<http://www.geneontology.org/formats/oboInOwl#>"
            + "PREFIX om: <http://bio2rdf.org/omim_vocabulary:>"
            + "PREFIX b: <http://bio2rdf.org/bio2rdf_vocabulary:>"
            + ""
            + "SELECT DISTINCT ?y ?nb ?icd10 ?reg ?label ?ncit ?gs  WHERE {"
            + "	?doidClass rdfs:label ?label ."
            + "    FILTER regex( ?label, 'stenosis') ."
            + "    ?doidClass oboInOwl:id ?doid ."
            + "    OPTIONAL {"
            + "   	    ?doidClass oboInOwl:hasDbXref ?ncit ."
            + "    	FILTER strstarts(str(?ncit), 'OMI') ."
            + "	}"
            + "	"
            + "	?t owl:sameAs ?doidClass ."
            + "	?x rdf:type ?t ."
            + "  "
            + "	?x <http://cepidc.data.symetric.org/has-icd10-cause> ?icd10 ."
            + "    ?x <http://cepidc.data.symetric.org/refers-to-gender> 'T' ."
            + "    ?x <http://cepidc.data.symetric.org/refers-to-period> ?y ."
            + "    ?x <http://cepidc.data.symetric.org/has-value-for-all-ages> ?nb ."
            + "    FILTER (?nb > 0) ."
            + "    ?x <http://cepidc.data.symetric.org/refers-to-geographical-area> ?reg ."
            + ""
            + "#    service <http://omim.bio2rdf.org/sparql> {"
            + "#        ?s rdf:type om:Phenotype ."
            + "#        FILTER regex(?s, str(?ncit), 'i') ."
            + "#        ?s om:phenotype-map ?map ."
            + "#        ?map om:geneSymbols/b:identifier ?gs ."
            + "#    }"
            + "}";

    public SparqlTest() {
    }

    @BeforeClass
    public static void setUpClass() {
    }

    @AfterClass
    public static void tearDownClass() {
    }

    @Before
    public void setUp() {
    }

    @After
    public void tearDown() {
    }

    // TODO add test methods here.
    // The methods must be annotated with annotation @Test. For example:
    //
    @Test
    public void testSparql() throws URISyntaxException, UnsupportedEncodingException {
        ClientConfig config = new DefaultClientConfig();
        config.getFeatures().put(JSONConfiguration.FEATURE_POJO_MAPPING, Boolean.TRUE);
        Client client = Client.create(config);
        WebResource service = client.resource(new URI("http://localhost:8080"));

//        System.out.println(query);
//        System.out.println(URLEncoder.encode(query, "UTF-8"));
        System.out.println(q1);
        String encoded = UriComponent.encode(q1, UriComponent.Type.QUERY_PARAM);
        System.out.println(encoded);
        
        
        ClientResponse response = service.path("/sparql").queryParam("query", q1).accept("application/sparql-results+json").get(ClientResponse.class);
        if (response.getStatus() != 200) {
            logger.warn("Error from SPARQL endpoint.");
        } else {
            logger.info("Successful SPARQL querying.");
            String output = response.getEntity(String.class);
            System.out.println(output);
            logger.info(output);
        }
    }
}
