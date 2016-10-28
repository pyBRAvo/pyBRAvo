/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

import com.sun.jersey.api.client.Client;
import com.sun.jersey.api.client.ClientResponse;
import com.sun.jersey.api.client.WebResource;
import com.sun.jersey.api.client.config.ClientConfig;
import com.sun.jersey.api.client.config.DefaultClientConfig;
import com.sun.jersey.api.json.JSONConfiguration;
import com.sun.jersey.spi.container.servlet.ServletContainer;
import fr.symetric.data.MyJsonData;
import fr.symetric.data.UserCredential;
import fr.symetric.server.EmbeddedJettyServer;
import fr.symetric.server.DatahubUtils;
import fr.symetric.server.models.DAOFactory;
import fr.symetric.server.models.User;
import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URI;
import java.net.URISyntaxException;
import org.apache.commons.vfs.FileSystemException;
import org.apache.log4j.Logger;
import org.junit.After;
import org.junit.AfterClass;
import org.junit.Assert;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Ignore;
import org.junit.Test;
import org.mortbay.jetty.Handler;
import org.mortbay.jetty.Server;
import org.mortbay.jetty.handler.ContextHandler;
import org.mortbay.jetty.handler.HandlerList;
import org.mortbay.jetty.handler.ResourceHandler;
import org.mortbay.jetty.servlet.Context;
import org.mortbay.jetty.servlet.ServletHolder;

/**
 *
 * @author gaignard
 */
public class RestProvTest {

    private static Logger logger = Logger.getLogger(RestProvTest.class);
    private static Server server;
    private static Process mongoDB_server = null;

    public RestProvTest() {
    }

    @BeforeClass
    public static void setUpClass() throws FileSystemException, URISyntaxException, Exception {

//        ProcessBuilder pb = new ProcessBuilder("mongod");
        ProcessBuilder pb = new ProcessBuilder("/usr/local/Cellar/mongodb/3.0.1/bin/mongod");
        pb.redirectErrorStream(true);
        mongoDB_server = pb.start();

        URI webappUri = EmbeddedJettyServer.extractResourceDir("webapp", true);
        logger.info("Extracted server code to " + webappUri);
        server = new Server(DatahubUtils.getServerPort());

        ServletHolder jerseyServletHolder = new ServletHolder(ServletContainer.class);
        jerseyServletHolder.setInitParameter("com.sun.jersey.config.property.resourceConfigClass", "com.sun.jersey.api.core.PackagesResourceConfig");
        jerseyServletHolder.setInitParameter("com.sun.jersey.config.property.packages", "fr.symetric.api");
        jerseyServletHolder.setInitParameter("requestBufferSize", "8192");
        jerseyServletHolder.setInitParameter("headerBufferSize", "8192");
        jerseyServletHolder.setInitParameter("com.sun.jersey.api.json.POJOMappingFeature", "true");
        jerseyServletHolder.setInitParameter("com.sun.jersey.spi.container.ResourceFilters", "fr.symetric.server.ResourceFilterFactory");
        Context servletCtx = new Context(server, "/", Context.SESSIONS);
        servletCtx.addServlet(jerseyServletHolder, "/*");
        logger.info("----------------------------------------------");
        logger.info("SyMeTRIC sandbox API started on http://localhost:" + DatahubUtils.getServerPort() + "/sandbox");
        logger.info("----------------------------------------------");

        ResourceHandler resource_handler = new ResourceHandler();
        resource_handler.setWelcomeFiles(new String[]{"index.html"});
//            resource_handler.setResourceBase("/Users/gaignard/Documents/Dev/svn-kgram/Dev/trunk/kgserver/src/main/resources/webapp");
        resource_handler.setResourceBase(webappUri.getRawPath());
        ContextHandler staticContextHandler = new ContextHandler();
        staticContextHandler.setContextPath("/");
        staticContextHandler.setHandler(resource_handler);
        logger.info("----------------------------------------------");
        logger.info("SyMeTRIC sandbox webapp UI started on http://localhost:" + DatahubUtils.getServerPort());
        logger.info("----------------------------------------------");

        HandlerList handlers = new HandlerList();
        handlers.setHandlers(new Handler[]{staticContextHandler, servletCtx});
        server.setHandler(handlers);

        try {
            server.start();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @AfterClass
    public static void tearDownClass() throws Exception {
        //clean old sessions
        DatahubUtils.tagExpiredSessions();
        DatahubUtils.deleteExpiredSessions();

        if (server != null) {
            server.stop();
            server.destroy();
            server = null;
        }

        if (mongoDB_server != null) {
            mongoDB_server.destroy();
            mongoDB_server = null;
        }
    }

    @Before
    public void setUp() {
    }

    @After
    public void tearDown() {
    }

    @Test
    @Ignore
    public void listHistories() throws URISyntaxException, MalformedURLException, IOException {

        ClientConfig config = new DefaultClientConfig();
        Client client = Client.create(config);
        config.getFeatures().put(JSONConfiguration.FEATURE_POJO_MAPPING, Boolean.TRUE);
        WebResource service = client.resource(new URI("http://localhost:" + DatahubUtils.getServerPort() + "/provenance/histories"));

        // sending a JSON string
        String cred = "{\"instanceUrl\":\"http://galaxy-bird.univ-nantes.fr/galaxy/\",\"apiKey\":\"dd3b7fce727d53ac00512ea19a8f5d4f\"}";
        ClientResponse response = service.accept("application/json").type("application/json").post(ClientResponse.class, cred);

        logger.info(response.getEntity(String.class));
    }

    @Test
    @Ignore
    public void genProv() throws URISyntaxException, MalformedURLException, IOException {

        ClientConfig config = new DefaultClientConfig();
        Client client = Client.create(config);
        config.getFeatures().put(JSONConfiguration.FEATURE_POJO_MAPPING, Boolean.TRUE);
        WebResource service = client.resource(new URI("http://localhost:" + DatahubUtils.getServerPort() + "/provenance"));

        // sending a JSON string
        String cred = "{\"instanceUrl\":\"http://galaxy-bird.univ-nantes.fr/galaxy/\",\"apiKey\":\"dd3b7fce727d53ac00512ea19a8f5d4f\"}";
        String historyId = "491a45f0d6ea6596";
        ClientResponse response = service.path("genProv").path(historyId).accept("text/plain").type("application/json").post(ClientResponse.class, cred);

//        logger.info(response.getEntity(String.class));
    }

    @Test
    @Ignore
    public void visProv() throws URISyntaxException, MalformedURLException, IOException {

        ClientConfig config = new DefaultClientConfig();
        Client client = Client.create(config);
        config.getFeatures().put(JSONConfiguration.FEATURE_POJO_MAPPING, Boolean.TRUE);
        WebResource service = client.resource(new URI("http://localhost:" + DatahubUtils.getServerPort() + "/provenance"));

        // sending a JSON string
        String cred = "{\"instanceUrl\":\"http://galaxy-bird.univ-nantes.fr/galaxy/\",\"apiKey\":\"dd3b7fce727d53ac00512ea19a8f5d4f\"}";
        String historyId = "491a45f0d6ea6596";
        ClientResponse response = service.path("visProv").path(historyId).accept("application/json").type("application/json").post(ClientResponse.class, cred);

//        logger.info(response.getEntity(String.class));
    }

    
}
