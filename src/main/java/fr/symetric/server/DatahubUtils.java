/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.symetric.server;

import com.sun.jersey.api.client.Client;
import com.sun.jersey.api.client.ClientResponse;
import com.sun.jersey.api.client.WebResource;
import com.sun.jersey.api.client.config.ClientConfig;
import com.sun.jersey.api.client.config.DefaultClientConfig;
import com.sun.jersey.api.json.JSONConfiguration;
import fr.symetric.data.UserCredential;
import fr.symetric.server.models.DAOFactory;
import fr.symetric.server.models.Session;
import fr.symetric.server.models.SessionRepositoryDAO;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.Date;
import java.util.logging.Level;
import org.apache.log4j.Logger;

/**
 *
 * @author Alban Gaignard <alban.gaignard@cnrs.fr>
 */
public class DatahubUtils {

    private static Logger logger = Logger.getLogger(DatahubUtils.class);
    private static int serverPort = 8091;

    public static int getServerPort() {
        return serverPort;
    }

    public synchronized static void setServerPort(int serverPort) {
        DatahubUtils.serverPort = serverPort;
    }

    public static void tagExpiredSessions() {
        SessionRepositoryDAO sessionRep = DAOFactory.getSessionDAO();

        Date now = new Date();

        for (String id : sessionRep.findIds()) {
            Session s = sessionRep.get(id);
            Date lastAccess = s.getLastAccessedTime();
            Date expirationDate = new Date();
            expirationDate.setTime(lastAccess.getTime() + 60000*30); //30mn = 600000 ms

            if (now.after(expirationDate) && s.isActive()) {
                s.setActive(false);
                sessionRep.save(s);
                logger.info("Session " + id + " last accessed at " + lastAccess + " set expired");
            }
        }
    }

    public static void deleteExpiredSessions() {
        SessionRepositoryDAO sessionRep = DAOFactory.getSessionDAO();
        for (Session s : sessionRep.find(sessionRep.createQuery().field("active").equal(false)).asList()) {
            sessionRep.delete(s);
            logger.info("Inactive session " + s.getSessionId() + " deleted");
        }
    }

    @Deprecated
    public static String login(String email, String password) throws SecurityException, RuntimeException {
        try {
            ClientConfig config = new DefaultClientConfig();
            config.getFeatures().put(JSONConfiguration.FEATURE_POJO_MAPPING, Boolean.TRUE);
            Client client = Client.create(config);
            WebResource service = client.resource(new URI("https://localhost:" + DatahubUtils.serverPort + "/sandbox"));

            UserCredential uCred = new UserCredential();
            uCred.setEmail(email);
            uCred.setPassword(password);

            String sessionId = null;

            ClientResponse response = service.path("/login").accept("application/json").type("application/json").post(ClientResponse.class, uCred);
            if (response.getStatus() == 403) {
                logger.error("Wrong login or password");
                throw new SecurityException("Wrong login or password");
            } else if (response.getStatus() != 200) {
                logger.error("Unexpected error, please contact the support team");
                throw new RuntimeException("Failed : HTTP error code : " + response.getStatus());
            }
            sessionId = response.getEntity(String.class);
            logger.info("login successful  : " + sessionId);

            return sessionId;
        } catch (URISyntaxException ex) {
            ex.printStackTrace();
            return null;
        }
    }

    @Deprecated
    public static String signin(String email, String password) {
        try {
            ClientConfig config = new DefaultClientConfig();
            config.getFeatures().put(JSONConfiguration.FEATURE_POJO_MAPPING, Boolean.TRUE);
            Client client = Client.create(config);
            WebResource service = client.resource(new URI("https://localhost:" + DatahubUtils.serverPort + "/sandbox"));

            UserCredential uCred = new UserCredential();
            uCred.setEmail(email);
            uCred.setPassword(password);

            String sessionId = null;
            ClientResponse response = service.path("/signin").accept("application/json").type("application/json").post(ClientResponse.class, uCred);
            if (response.getStatus() != 200) {
                logger.error("Unexpected error, please contact the support team");
                throw new RuntimeException("Failed : HTTP error code : " + response.getStatus());
            }
            sessionId = response.getEntity(String.class);
            logger.info("User successfully registered : " + sessionId);

            return sessionId;
        } catch (URISyntaxException ex) {
            ex.printStackTrace();
            return null;
        }
    }

    @Deprecated
    public static void logout(String sid) throws SecurityException, RuntimeException {
        try {
            ClientConfig config = new DefaultClientConfig();
            config.getFeatures().put(JSONConfiguration.FEATURE_POJO_MAPPING, Boolean.TRUE);
            Client client = Client.create(config);
            WebResource service = client.resource(new URI("http://localhost:" + DatahubUtils.serverPort + "/sandbox"));
            
            ClientResponse response = service.path("/logout").header("session-id", sid).accept("application/json").type("application/json").get(ClientResponse.class);
            if (response.getStatus() != 200) {
                logger.error("Unexpected error, please contact the support team");
                throw new RuntimeException("Failed : HTTP error code : " + response.getStatus());
            } else {
                logger.info("Logout successful.");
            }
        } catch (URISyntaxException ex) {
            ex.printStackTrace();
        }
    }
}
