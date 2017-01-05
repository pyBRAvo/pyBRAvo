package fr.symetric.test;

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
import com.sun.jersey.client.urlconnection.HTTPSProperties;
import com.sun.jersey.spi.container.servlet.ServletContainer;
import fr.symetric.data.MyJsonData;
import fr.symetric.data.UserCredential;
import fr.symetric.server.EmbeddedJettyServer;
import fr.symetric.server.DatahubUtils;
import fr.symetric.server.models.DAOFactory;
import fr.symetric.server.models.User;
import java.io.IOException;
import java.net.InetAddress;
import java.net.MalformedURLException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.security.KeyManagementException;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.security.cert.X509Certificate;
import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSession;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
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
import org.mortbay.jetty.security.SslSelectChannelConnector;
import org.mortbay.jetty.servlet.Context;
import org.mortbay.jetty.servlet.ServletHolder;

/**
 *
 * @author gaignard
 */
public class SslRestEndpointTest {

    private static Logger logger = Logger.getLogger(EmbeddedJettyServer.class);
    private static Server server;
    private static Client client;
    private static Process mongoDB_server = null;

    public SslRestEndpointTest() {
    }

    @BeforeClass
    public static void setUpClass() throws FileSystemException, URISyntaxException, Exception {

        TrustManager[] trustAllCerts = {new X509TrustManager() {
            @Override
            public X509Certificate[] getAcceptedIssuers() {
                return null;
            }

            @Override
            public void checkClientTrusted(X509Certificate[] certs, String authType) {
            }

            @Override
            public void checkServerTrusted(X509Certificate[] certs, String authType) {
            }
        }};

        SSLContext ctx = SSLContext.getInstance("SSL");
        ctx.init(null, trustAllCerts, new SecureRandom());

        ClientConfig config = new DefaultClientConfig();
        config.getProperties().put(HTTPSProperties.PROPERTY_HTTPS_PROPERTIES, new HTTPSProperties(
                new HostnameVerifier() {
            @Override
            public boolean verify(String s, SSLSession sslSession) {
                logger.info(s);
                logger.info(sslSession);
                return true;
            }
        }, ctx)
        );
        config.getFeatures().put(JSONConfiguration.FEATURE_POJO_MAPPING, Boolean.TRUE);
        client = Client.create(config);

        /////////
//        ProcessBuilder pb = new ProcessBuilder("mongod");
        ProcessBuilder pb = new ProcessBuilder("/usr/local/Cellar/mongodb/3.0.1/bin/mongod");
        pb.redirectErrorStream(true);
        mongoDB_server = pb.start();
//
        URI webappUri = EmbeddedJettyServer.extractResourceDir("web", true);
        server = new Server();

        SslSelectChannelConnector connector = new SslSelectChannelConnector();
        connector.setReuseAddress(false);
        URL keystoreUrl = EmbeddedJettyServer.class.getClassLoader().getResource("keystore.jks");
        connector.setKeystore(keystoreUrl.toString());
        connector.setKeystoreType("JKS");
        connector.setKeyPassword("symetric");
        connector.setPassword("symetric");
        connector.setPort(DatahubUtils.getServerPort());
        server.addConnector(connector);

        ServletHolder jerseyServletHolder = new ServletHolder(ServletContainer.class);
        jerseyServletHolder.setInitParameter("com.sun.jersey.config.property.resourceConfigClass", "com.sun.jersey.api.core.PackagesResourceConfig");
        jerseyServletHolder.setInitParameter("com.sun.jersey.config.property.packages", "fr.symetric.api");
        jerseyServletHolder.setInitParameter("requestBufferSize", "8192");
        jerseyServletHolder.setInitParameter("headerBufferSize", "8192");
        jerseyServletHolder.setInitParameter("com.sun.jersey.api.json.POJOMappingFeature", "true");
        jerseyServletHolder.setInitParameter("com.sun.jersey.spi.container.ResourceFilters", "fr.symetric.server.ResourceFilterFactory");
        Context servletCtx = new Context(server, "/", Context.SESSIONS);
        servletCtx.addServlet(jerseyServletHolder, "/*");

        ResourceHandler resource_handler = new ResourceHandler();
        resource_handler.setWelcomeFiles(new String[]{"index.html"});
        resource_handler.setResourceBase(webappUri.getRawPath());
//            resource_handler.setResourceBase("/Users/gaignard-a/Documents/Dev/symetric-api-server/src/main/resources/web");
        ContextHandler staticContextHandler = new ContextHandler();
        staticContextHandler.setContextPath("/");
        staticContextHandler.setHandler(resource_handler);
        logger.info("----------------------------------------------");
        logger.info("SyMeTRIC sandbox webapp UI started on https://" + InetAddress.getLocalHost().getHostAddress() + ":" + DatahubUtils.getServerPort());
        logger.info("----------------------------------------------");

        HandlerList handlers = new HandlerList();
        handlers.setHandlers(new Handler[]{staticContextHandler, servletCtx});
        server.setHandler(handlers);

        server.start();
//        server.join();
    }

    @AfterClass
    public static void tearDownClass() throws Exception {
        //clean old sessions
        DatahubUtils.tagExpiredSessions();
        DatahubUtils.deleteExpiredSessions();
        
        DAOFactory.getUserDAO().deleteById("zebulon@univ-nantes.fr");

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
    public void sayHello() throws URISyntaxException, MalformedURLException, IOException, NoSuchAlgorithmException, KeyManagementException {

        WebResource service = client.resource(new URI("https://localhost:" + DatahubUtils.getServerPort() + "/sandbox"));

        String param = "Marcel";
        String response = service.path("sayHello").path(param).get(String.class).toString();
        logger.info(response);
        Assert.assertTrue(response.contains("\"label\":\"" + param + "\""));
    }

    @Test
    public void sendJson() throws URISyntaxException, MalformedURLException, IOException {
        WebResource service = client.resource(new URI("https://localhost:" + DatahubUtils.getServerPort() + "/sandbox/sendJson"));

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

    @Test
    public void auditedSayHello() throws URISyntaxException, MalformedURLException, IOException {
        WebResource service = client.resource(new URI("https://localhost:" + DatahubUtils.getServerPort() + "/sandbox"));

        String response = service.path("hellopublic").header("X-Forwarded-For", "127.0.0.1").get(String.class).toString();
        logger.info(response);
    }

    @Test
    public void signIn() throws URISyntaxException, MalformedURLException, IOException {
        WebResource service = client.resource(new URI("https://localhost:" + DatahubUtils.getServerPort() + "/sandbox"));

        UserCredential uCred = new UserCredential();
        uCred.setEmail("zebulon@univ-nantes.fr");
        uCred.setPassword("SonSecret");

        ClientResponse response = service.path("/signin").accept("application/json").type("application/json").post(ClientResponse.class, uCred);
        if (response.getStatus() != 200) {
            throw new RuntimeException("Failed : HTTP error code : "
                    + response.getStatus());
        }

        String sessionId = response.getEntity(String.class);

        //assert that non admin user cannot access the resource
        String errorMessage = "";
        try {
            service.path("admin").header("X-Forwarded-For", "127.0.0.1").header("session-id", sessionId).get(String.class).toString();
        } catch (Exception e) {
            errorMessage = e.getMessage();
            logger.error(errorMessage);
        }
        Assert.assertTrue(errorMessage.toLowerCase().contains("forbidden"));

        //grant admin role to user zebulon
        User u = DAOFactory.getUserDAO().get("zebulon@univ-nantes.fr");
        u.getRoles().add(User.Role.admin);
        DAOFactory.getUserDAO().save(u);

        //assert that zebulon can access the protected resource
        String response3 = service.path("admin").header("X-Forwarded-For", "127.0.0.1").header("session-id", sessionId).get(String.class).toString();
        logger.info(response3);

        DAOFactory.getUserDAO().delete(u);
    }

    @Test
    public void loginTest() throws URISyntaxException, MalformedURLException, IOException {
        WebResource service = client.resource(new URI("https://localhost:" + DatahubUtils.getServerPort() + "/sandbox"));

        UserCredential uCred = new UserCredential();
        uCred.setEmail("zebulon@univ-nantes.fr");
        uCred.setPassword("SonSecret");

        // registering test user
        ClientResponse responseSI = service.path("/signin").accept("application/json").type("application/json").post(ClientResponse.class, uCred);
        if (responseSI.getStatus() != 200) {
            throw new RuntimeException("Failed : HTTP error code : " + responseSI.getStatus());
        }

        // testing login with wrong password
        uCred.setPassword("sonsecret");
        String errorMessage = "";
        try {
            ClientResponse response = service.path("/login").accept("application/json").type("application/json").post(ClientResponse.class, uCred);
            if (response.getStatus() != 200) {
                throw new RuntimeException("Failed : HTTP error code : " + response.getStatus());
            }
        } catch (Exception e) {
            errorMessage = e.getMessage();
        }
        Assert.assertTrue(errorMessage.contains("403"));

        uCred.setPassword("SonSecret");
        String sessionId = null;
        try {
            ClientResponse response4 = service.path("/login").accept("application/json").type("application/json").post(ClientResponse.class, uCred);
            if (response4.getStatus() != 200) {
                throw new RuntimeException("Failed : HTTP error code : " + response4.getStatus());
            }
            sessionId = response4.getEntity(String.class);
            logger.info(sessionId);
        } catch (Exception e) {
            errorMessage = e.getMessage();
        }
        DAOFactory.getUserDAO().deleteById("zebulon@univ-nantes.fr");
        
        Assert.assertNotNull(sessionId);
    }

    @Test
    public void testAuthVsPublic() throws URISyntaxException {
        WebResource service = client.resource(new URI("https://localhost:" + DatahubUtils.getServerPort() + "/sandbox"));

        //check public access
        String response = service.path("hellopublic").get(String.class).toString();
        logger.info(response);

        //check login required
        try {
            String response2 = service.path("helloauth").get(String.class).toString();
            logger.info(response);
        } catch (Exception e) {
            Assert.assertTrue(e.getMessage().contains("403"));
        }

        // and after a sign-in (fictive user)
        UserCredential uCred = new UserCredential();
        uCred.setEmail("zebulon@univ-nantes.fr");
        uCred.setPassword("SonSecret");

        String sessionId = null;
        ClientResponse cResponse = service.path("/signin").accept("application/json").type("application/json").post(ClientResponse.class, uCred);
        if (cResponse.getStatus() != 200) {
            logger.error("Unexpected error, please contact the support team");
            throw new RuntimeException("Failed : HTTP error code : " + cResponse.getStatus());
        }
        String session = cResponse.getEntity(String.class);
        logger.info("User successfully registered : " + sessionId);
        
        String response3 = service.path("helloauth").header("session-id", session).get(String.class).toString();
        logger.info(response3);
        DAOFactory.getUserDAO().deleteById("zebulon@univ-nantes.fr");
        
        Assert.assertTrue(response3.contains("hello"));
    }

    @Test
    public void logout() throws URISyntaxException {
        WebResource service = client.resource(new URI("https://localhost:" + DatahubUtils.getServerPort() + "/sandbox"));

        // Create a fictive user
        UserCredential uCred = new UserCredential();
        uCred.setEmail("zebulon@univ-nantes.fr");
        uCred.setPassword("SonSecret");

        String sessionId = null;
        ClientResponse response = service.path("/signin").accept("application/json").type("application/json").post(ClientResponse.class, uCred);
        if (response.getStatus() != 200) {
            logger.error("Unexpected error, please contact the support team");
            throw new RuntimeException("Failed : HTTP error code : " + response.getStatus());
        }
        String session = response.getEntity(String.class);
        logger.info("User successfully registered : " + sessionId);

        // LOGOUT
        response = service.path("/logout").header("session-id", session).accept("application/json").type("application/json").get(ClientResponse.class);
        if (response.getStatus() != 200) {
            logger.error("Unexpected error, please contact the support team");
            DAOFactory.getUserDAO().deleteById("zebulon@univ-nantes.fr");
            Assert.fail("Failed from server response");
        } else {
            DAOFactory.getUserDAO().deleteById("zebulon@univ-nantes.fr");
            logger.info("Logout successful.");
        }
    }
}
