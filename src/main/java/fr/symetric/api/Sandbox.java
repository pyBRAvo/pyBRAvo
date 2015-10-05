package fr.symetric.api;

import com.google.code.morphia.query.Query;
import fr.symetric.data.MyJsonData;
import fr.symetric.data.UserCredential;
import fr.symetric.server.DatahubUtils;
import fr.symetric.server.annotations.Audit;
import fr.symetric.server.models.DAOFactory;
import fr.symetric.server.models.Session;
import fr.symetric.server.models.SessionRepositoryDAO;
import fr.symetric.server.models.User;
import fr.symetric.server.models.UserRepositoryDAO;
import java.util.Date;
import java.util.UUID;
import javax.annotation.security.RolesAllowed;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import org.apache.log4j.Logger;
import org.jasypt.digest.StandardStringDigester;

/**
 * Sandbox REST APIs, including auditing and access control
 *
 * @author alban.gaignard@univ-nantes.fr
 */
@Path("sandbox")
public class Sandbox {

    @Context
    private HttpServletRequest httpRequest;
    private Logger logger = Logger.getLogger(Sandbox.class);
    StandardStringDigester digester = null;

    public Sandbox() {
        digester = new StandardStringDigester();
        digester.setAlgorithm("SHA-1");   // optionally set the algorithm
        digester.setIterations(50000); // increase security by performing 50000 hashing iterations
        digester.setSaltSizeBytes(8);
    }

    @GET
    @Path("/sayHello/{label}")
    @Produces(MediaType.APPLICATION_JSON)
    public MyJsonData produceJSON(@PathParam("label") String label) {
        String id = UUID.randomUUID().toString();
        MyJsonData d = new MyJsonData();
        d.setId(id);
        d.setLabel(label);
        return d;
    }

    @POST
    @Path("/sendJson")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response consumeJSON(MyJsonData data) {
        String output = data.toString();
        logger.info(output);
        return Response.status(200).entity(output).build();
    }

    @POST
    @Path("/signin")
    @Audit
    @Consumes(MediaType.APPLICATION_JSON)
    public Response signin(UserCredential cred) {
        UserRepositoryDAO userRep = DAOFactory.getUserDAO();
        
        logger.info("Registering user + " + cred.getEmail());
        if (userRep.get(cred.getEmail()) != null) {
            logger.info("User + " + cred.getEmail()+ " already exists");
            return Response.status(403).entity("User already exists").build();
        }
        
        User u = new User();
        u.setEmail(cred.getEmail());

        // password encryption
        String digest = digester.digest(cred.getPassword());
        u.setPassword(digest);
        u.getRoles().add(User.Role.user);

        userRep.save(u);

        // storing and returning an authentication token
        Session session = new Session();
        session.setUserId(u.getEmail());
        session.setActive(true);
        session.setSecure(true);
        session.setSessionId(UUID.randomUUID().toString());
        session.setCreateTime(new Date());
        session.setLastAccessedTime(new Date());

        SessionRepositoryDAO sessionRep = DAOFactory.getSessionDAO();
        sessionRep.save(session);

        return Response.status(200).entity(session.getSessionId()).build();
    }

    @POST
    @Path("/login")
    @Consumes(MediaType.APPLICATION_JSON)
    @SuppressWarnings("unchecked")
    @Audit
    public Response login(UserCredential cred) {

        logger.info("Authenticating user + " + cred.getEmail());
        UserRepositoryDAO userRep = DAOFactory.getUserDAO();
        User u = userRep.get(cred.getEmail());
        if (u == null) {
            logger.debug("Unregistered user");
            return Response.status(403).entity("unregistered user").build();
        } else {
            if (!digester.matches(cred.getPassword(), u.getPassword())) {
                logger.debug("Wrong password");
                return Response.status(403).entity("wrong password").build();
            }
        }

        logger.info("User + " + cred.getEmail() + " authenticated");

        // Check if a session exists
        SessionRepositoryDAO sessionRep = DAOFactory.getSessionDAO();
        Query q = sessionRep.createQuery().field("userId").equal(cred.getEmail());
        Session session = DAOFactory.getSessionDAO().findOne(q);
        if (session != null) {
            session.setActive(true);
            session.setLastAccessedTime(new Date());
            sessionRep.save(session);
            return Response.status(200).entity(session.getSessionId()).build();
        } else {
            // No session found, creating a new one
            session = new Session();
            session.setUserId(u.getEmail());
            session.setActive(true);
            session.setSecure(true);
            session.setSessionId(UUID.randomUUID().toString());
            session.setCreateTime(new Date());
            session.setLastAccessedTime(new Date());
            sessionRep.save(session);

            return Response.status(200).entity(session.getSessionId()).build();
        }
    }

    @GET
    @Path("/logout")
    @Audit
    public Response logout() {

        String sid = httpRequest.getHeader("session-id");
        logger.info("Disconnecting user with session id " + sid);

        if (sid != null) {
            SessionRepositoryDAO sessionRep = DAOFactory.getSessionDAO();
            Query q = sessionRep.createQuery().field("sessionId").equal(sid);
            Session session = DAOFactory.getSessionDAO().findOne(q);
            if (session == null) {
                return Response.status(500).build();
            } else {
                session.setLastAccessedTime(new Date());
                session.setActive(false);
                sessionRep.save(session);
                return Response.status(200).build();
            }
        } else {
            logger.error("Can't find any session ID attached to the HTTP request.");
            return Response.status(500).build();
        }
    }

    @GET
    @Path("/isactive")
    public Response isActive() {
        DatahubUtils.tagExpiredSessions();
        DatahubUtils.deleteExpiredSessions();

        String sid = httpRequest.getHeader("session-id");
        logger.info("Checking validity of session id " + sid);

        if (sid != null) {
            SessionRepositoryDAO sessionRep = DAOFactory.getSessionDAO();
            Query q = sessionRep.createQuery().field("sessionId").equal(sid);
            Session session = DAOFactory.getSessionDAO().findOne(q);
            if (session != null) {
                logger.debug("Building isactive response for session id "+sid+" ; active = "+session.isActive());
                return Response.status(200).entity(session.isActive()).build();
            } else {
                logger.error("Can't find any session for id "+sid);
                return Response.status(200).entity(false).build();
            }
        } else {
            logger.error("Can't find any session ID attached to the HTTP request.");
            return Response.status(500).build();
        }
    }

    @GET
    @Path("/admin")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed({"admin"})
    @Audit
    public MyJsonData produceAdminJSON() {
        String id = UUID.randomUUID().toString();
        MyJsonData d = new MyJsonData();
        d.setId(id);
        d.setLabel("Anything only for admins");
        return d;
    }

    @GET
    @Path("/helloauth")
    @Produces(MediaType.TEXT_PLAIN)
    @RolesAllowed({"user"})
    @Audit
    public String helloAuth() {
        Date now = new Date();
        String sessionId = httpRequest.getHeader("session-id");
        if (sessionId != null) {
            Session s = DAOFactory.getSessionDAO().get(sessionId);
            s.setLastAccessedTime(now);
            DAOFactory.getSessionDAO().save(s);
            logger.debug("Session " + sessionId + " last accessed : " + now);
        }
        return "hello";
    }

    @GET
    @Path("/hellopublic")
    @Produces(MediaType.TEXT_PLAIN)
    @Audit
    public String hello() {
        return "hello";
    }
}
