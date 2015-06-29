package fr.symetric.api;

import com.google.code.morphia.query.Query;
import fr.symetric.data.MyJsonData;
import fr.symetric.data.UserCredential;
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
    @Consumes(MediaType.APPLICATION_JSON)
    public Response signin(UserCredential cred) {

        logger.info("Registering user + " + cred.getEmail());
        User u = new User();
        u.setEmail(cred.getEmail());

        // password encryption
        String digest = digester.digest(cred.getPassword());
        u.setPassword(digest);
        u.getRoles().add(User.Role.user);

        UserRepositoryDAO userRep = DAOFactory.getUserDAO();
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
    public Response login(UserCredential cred) {

        logger.info("Authenticating user + " + cred.getEmail());
        UserRepositoryDAO userRep = DAOFactory.getUserDAO();
        User u = userRep.get(cred.getEmail());
        if (u == null) {
            logger.debug("Unkown user");
            return Response.status(403).entity("Unkown user").build();
        } else {
            logger.debug("user cred " + cred.getPassword() + " =? " + u.getPassword());
            if (!digester.matches(cred.getPassword(), u.getPassword())) {
                logger.debug("Wrong password");
                return Response.status(403).entity("Wrong password").build();
            }
        }

        logger.info("User + " + cred.getEmail() + " authenticated");

        // Check if a session exists
        SessionRepositoryDAO sessionRep = DAOFactory.getSessionDAO();
        Query q = sessionRep.createQuery().field("userId").equal(cred.getEmail());
        Session session = DAOFactory.getSessionDAO().findOne(q);
        if (session != null) {
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
    @Path("/admin")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed({"admin"})
    @Audit("adminsitration action")
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
    @Audit("helloAuth")
    public String helloAuth() {
        Date now = new Date();
        String sessionId = httpRequest.getHeader("session-id");
        if (sessionId != null) {
            Session s = DAOFactory.getSessionDAO().get(sessionId);
            s.setLastAccessedTime(now);
            DAOFactory.getSessionDAO().save(s);
            logger.debug("Session "+sessionId+" last accessed : " + now);
        }
        return "hello";
    }

    @GET
    @Path("/hellopublic")
    @Produces(MediaType.TEXT_PLAIN)
    @Audit("hello")
    public String hello() {
        return "hello";
    }
}
