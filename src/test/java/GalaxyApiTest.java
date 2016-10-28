/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

import com.github.jmchilton.blend4j.galaxy.GalaxyInstance;
import com.github.jmchilton.blend4j.galaxy.GalaxyInstanceFactory;
import com.github.jmchilton.blend4j.galaxy.HistoriesClient;
import com.github.jmchilton.blend4j.galaxy.ToolsClient;
import com.github.jmchilton.blend4j.galaxy.beans.History;
import com.github.jmchilton.blend4j.galaxy.beans.HistoryContents;
import com.github.jmchilton.blend4j.galaxy.beans.HistoryContentsProvenance;
import com.sun.jersey.api.client.Client;
import com.sun.jersey.api.client.ClientResponse;
import com.sun.jersey.api.client.WebResource;
import com.sun.jersey.api.client.config.ClientConfig;
import com.sun.jersey.api.client.config.DefaultClientConfig;
import com.sun.jersey.api.json.JSONConfiguration;
import com.sun.jersey.core.util.MultivaluedMapImpl;
import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URI;
import java.net.URISyntaxException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.List;
import java.util.Map;
import javax.ws.rs.core.MultivaluedMap;
import org.apache.log4j.Logger;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.junit.After;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Ignore;
import org.junit.Test;

/**
 *
 * @author Alban Gaignard <alban.gaignard@cnrs.fr>
 */
public class GalaxyApiTest {

    private static Logger logger = Logger.getLogger(GalaxyApiTest.class);

    public GalaxyApiTest() {
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

//    private static String gURL = "http://galaxy-bird.univ-nantes.fr";
//    private static String gApiKey = "5f5c875829e4ac6afae64ba31225cdee";
    private static String gURL = "http://galaxy-bird.univ-nantes.fr/galaxy";
    private static String gApiKey = "dd3b7fce727d53ac00512ea19a8f5d4f";

//    private static String gURL_local = "http://localhost:8080";
//    private static String gApiKey_local = "a6309f84ad5d4c39bfd41758efce4aaf";
    // TODO add test methods here.
    // The methods must be annotated with annotation @Test. For example:
    //
    @Test
    @Ignore
    public void hello() throws JSONException {
        //my API Key 5f5c875829e4ac6afae64ba31225cdee
//        GalaxyInstance galaxyInstance = GalaxyInstanceFactory.get(gURL, gApiKey,true);
        GalaxyInstance galaxyInstance = GalaxyInstanceFactory.get(gURL, gApiKey, false);
//        GalaxyInstance galaxyInstance = GalaxyInstanceFactory.get(gURL_local, gApiKey_local);
//        LibrariesClient lib = galaxyInstance.getLibrariesClient();
//        for (Library l : lib.getLibraries()) {
//            System.out.println(l.getName());
//        }

        ToolsClient toolsClient = galaxyInstance.getToolsClient();

        HistoriesClient historiesClient = galaxyInstance.getHistoriesClient();

        for (History history : historiesClient.getHistories()) {
            String name = history.getName();
            String historyId = history.getId();
            String message = String.format("Found history with name %s and id %s", name, historyId);
            System.out.println(message);
        }

        StringBuilder sb = new StringBuilder();
        SimpleDateFormat fmt = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssX");

        sb.append("@base         <http://fr.symetric> .\n"
                + "@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .\n"
                + "@prefix foaf: <http://xmlns.com/foaf/0.1/> .\n"
                + "@prefix sioc: <http://rdfs.org/sioc/ns#> .\n"
                + "@prefix prov: <http://www.w3.org/ns/prov#> .\n"
                + "@prefix sym:   <http://fr.symetric/vocab#> .\n"
                + "@prefix dcterms: <http://purl.org/dc/terms/> .\n"
                + "\n"
                + "<> \n"
                + "   a prov:Bundle, prov:Entity;\n"
                + "   prov:wasAttributedTo <#galaxy2prov>;\n"
                + "   prov:generatedAtTime \"" + fmt.format(Calendar.getInstance().getTime()) + "\"^^xsd:dateTime;\n"
                + ".");

        for (History history : historiesClient.getHistories()) {
            String name = history.getName();
            String historyId = history.getId();
            if (historyId.equals("7e91ce908ccda17a")) {
                List<HistoryContents> hCont = historiesClient.showHistoryContents(historyId);
                System.out.println("*******************************");
                for (HistoryContents c : hCont) {
//                    System.out.println("HISTCONTENT " + c.getName() + " :: TYPE " + c.getHistoryContentType() + " :: STATE " + c.getState());
                    String datasetId = c.getId();
                    HistoryContentsProvenance hProv = historiesClient.showProvenance(historyId, datasetId);
//                    System.out.println("\t produced by tool " + hProv.getToolId());
//                    System.out.println("\t produced during job " + hProv.getJobId());

                    sb.append("<#" + hProv.getJobId() + ">\n"
                            + "    a prov:Activity;\n"
                            + "    prov:used <#" + c.getId() + ">;\n"
                            + "    prov:wasAssociatedTo <#" + hProv.getToolId() + ">.\n\n");

                    sb.append("<#" + c.getId() + ">\n"
                            + "    a prov:Entity;\n"
                            + "    prov:wasGeneratedBy <#" + hProv.getJobId() + ">;\n"
                            + "    prov:wasAttributedTo <#" + hProv.getToolId() + ">;\n"
                            + "    rdfs:label \"" + c.getName() + "\";\n");

//                    System.out.println("\t with parameters : ");
                    Map<String, Object> params = hProv.getParameters();
                    for (String k : params.keySet()) {
//                        System.out.println("\t\t " + k + " : " + params.get(k).toString());
                        if (k.contains("input")) {
                            String jsonString = params.get(k).toString();
                            if (jsonString.startsWith("{")) {
                                JSONObject json = new JSONObject(jsonString);
                                sb.append("    prov:wasDerivedFrom <#" + json.get("id") + ">;\n");
                            }
                        }
                    }
                    sb.append(".\n");
//                    System.out.println("");
//                System.out.println("\t" + hProv.getStandardOutput());
//                System.out.println("\t" + hProv.getStandardError());
                }
            }
        }
//        System.out.println("");
        System.out.println("");
        System.out.println(sb.toString());
    }

    @Test
    public void galaxyRestConnect() throws URISyntaxException, MalformedURLException, IOException {
        //http://galaxy.readthedocs.io/en/master/lib/galaxy.webapps.galaxy.api.html#module-galaxy.webapps.galaxy.api.histories

        String gURL = "http://galaxy-bird.univ-nantes.fr/galaxy/";
        String gKey = "dd3b7fce727d53ac00512ea19a8f5d4f";

        ClientConfig config = new DefaultClientConfig();
        Client client = Client.create(config);
        config.getFeatures().put(JSONConfiguration.FEATURE_POJO_MAPPING, Boolean.TRUE);
        WebResource service = client.resource(new URI(gURL));

//        MultivaluedMap<String, String> params = new MultivaluedMapImpl();
//        params.add("key", gKey);

        ClientResponse responseHist = service.path("/api/histories").queryParam("key", gKey).accept("application/json").type("application/json").get(ClientResponse.class);
        System.out.println("----------");
        System.out.println(responseHist.getEntity(String.class));
        System.out.println("----------");
        
        ClientResponse responseJob = service.path("/api/jobs/2773e5acaa7ffd7f").queryParam("key", gKey).accept("application/json").type("application/json").get(ClientResponse.class);
        System.out.println("----------");
        System.out.println(responseJob.getEntity(String.class));
        System.out.println("----------");
        
        ClientResponse responseJobIn = service.path("/api/jobs/2773e5acaa7ffd7f/inputs").queryParam("key", gKey).accept("application/json").type("application/json").get(ClientResponse.class);
        System.out.println("----------");
        System.out.println(responseJobIn.getEntity(String.class));
        System.out.println("----------");
        
        ClientResponse responseJobOut = service.path("/api/jobs/2773e5acaa7ffd7f/outputs").queryParam("key", gKey).accept("application/json").type("application/json").get(ClientResponse.class);
        System.out.println("----------");
        System.out.println(responseJobOut.getEntity(String.class));
        System.out.println("----------");
        
        ClientResponse responseDS = service.path("/api/datasets/694ed270b1759660").queryParam("key", gKey).accept("application/json").type("application/json").get(ClientResponse.class);
        System.out.println("----------");
        System.out.println(responseDS.getEntity(String.class));
        System.out.println("----------");
    }
}