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
import fr.symetric.server.EmbeddedJettyServer;
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
public class RestEndpointTest {

    private static Logger logger = Logger.getLogger(EmbeddedJettyServer.class);
    private static int port = 8091;
    private static Server server;

    public RestEndpointTest() {
    }

    @BeforeClass
    public static void setUpClass() throws FileSystemException, URISyntaxException, Exception {

        URI webappUri = EmbeddedJettyServer.extractResourceDir("webapp", true);
        server = new Server(port);

        ServletHolder jerseyServletHolder = new ServletHolder(ServletContainer.class);
        jerseyServletHolder.setInitParameter("com.sun.jersey.config.property.resourceConfigClass", "com.sun.jersey.api.core.PackagesResourceConfig");
        jerseyServletHolder.setInitParameter("com.sun.jersey.config.property.packages", "fr.symetric.api");
        jerseyServletHolder.setInitParameter("requestBufferSize", "8192");
        jerseyServletHolder.setInitParameter("headerBufferSize", "8192");
        jerseyServletHolder.setInitParameter("com.sun.jersey.api.json.POJOMappingFeature", "true");
        Context servletCtx = new Context(server, "/", Context.SESSIONS);
        servletCtx.addServlet(jerseyServletHolder, "/*");
        logger.info("----------------------------------------------");
        logger.info("SyMeTRIC sandbox API started on http://localhost:" + port + "/sandbox");
        logger.info("----------------------------------------------");

        ResourceHandler resource_handler = new ResourceHandler();
        resource_handler.setWelcomeFiles(new String[]{"index.html"});
//            resource_handler.setResourceBase("/Users/gaignard/Documents/Dev/svn-kgram/Dev/trunk/kgserver/src/main/resources/webapp");
        resource_handler.setResourceBase(webappUri.getRawPath());
        ContextHandler staticContextHandler = new ContextHandler();
        staticContextHandler.setContextPath("/");
        staticContextHandler.setHandler(resource_handler);
        logger.info("----------------------------------------------");
        logger.info("SyMeTRIC sandbox webapp UI started on http://localhost:" + port);
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
        if (server != null) {
            server.stop();
            server.destroy();
            server = null;
        }
    }

    @Before
    public void setUp() {
    }

    @After
    public void tearDown() {
    }

    @Test
    public void sayHello() throws URISyntaxException, MalformedURLException, IOException {

        ClientConfig config = new DefaultClientConfig();
        Client client = Client.create(config);
        WebResource service = client.resource(new URI("http://localhost:" + RestEndpointTest.port + "/sandbox"));

        String param = "Marcel";
        String response = service.path("sayHello").path(param).get(String.class).toString();
        logger.info(response);
        Assert.assertTrue(response.contains("\"label\":\"" + param + "\""));
    }

    @Test
    public void sendJson() throws URISyntaxException, MalformedURLException, IOException {

        ClientConfig config = new DefaultClientConfig();
        config.getFeatures().put(JSONConfiguration.FEATURE_POJO_MAPPING, Boolean.TRUE);
        Client client = Client.create(config);
        WebResource service = client.resource(new URI("http://localhost:" + RestEndpointTest.port + "/sandbox/sendJson"));
        
        // sending a JSON string
        String jsonData = "{\"id\":\"1234\",\"label\":\"MyLabel\"}";

        ClientResponse response = service.accept("application/json").type("application/json").post(ClientResponse.class, jsonData);

        if (response.getStatus() != 200) {
            throw new RuntimeException("Failed : HTTP error code : "
                    + response.getStatus());
        }
        String output = response.getEntity(String.class);
        Assert.assertEquals("MyJsonData{id=1234, label=MyLabel}", output);
        

        // sending a java object
        MyJsonData d = new MyJsonData();
        d.setId("zzz");
        d.setLabel("zebulon");
        
        response = service.accept("application/json").type("application/json").post(ClientResponse.class, d);
        if (response.getStatus() != 200) {
            throw new RuntimeException("Failed : HTTP error code : "
                    + response.getStatus());
        }
        
        logger.info(output);
        output = response.getEntity(String.class);
        Assert.assertEquals("MyJsonData{id=zzz, label=zebulon}", output);
    }
}
