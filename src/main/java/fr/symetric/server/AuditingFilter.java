/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.symetric.server;

import fr.symetric.server.models.SessionRepositoryDAO;
import fr.symetric.server.models.UserRepositoryDAO;
import fr.symetric.server.models.User;
import fr.symetric.server.models.Session;
import com.google.common.collect.ImmutableSet;
import com.sun.jersey.spi.container.ContainerRequest;
import com.sun.jersey.spi.container.ContainerRequestFilter;
import com.sun.jersey.spi.container.ContainerResponseFilter;
import com.sun.jersey.spi.container.ResourceFilter;
import fr.symetric.server.models.Activity;
import fr.symetric.server.models.ActivityRepositoryDAO;
import fr.symetric.server.models.DAOFactory;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Set;
import javax.ws.rs.core.HttpHeaders;
import javax.ws.rs.ext.Provider;
import org.apache.log4j.Logger;
import org.mongodb.morphia.query.Query;

/**
 *
 * @author Alban Gaignard <alban.gaignard@cnrs.fr>
 */
/**
 * Filter all incoming requests, look for possible session information and use
 * that to create and load a SecurityContext to request.
 *
 * @author "Animesh Kumar <animesh@strumsoft.com>"
 *
 */
@Provider    // register as jersey's provider
public class AuditingFilter implements ResourceFilter, ContainerRequestFilter {

    private static Logger logger = Logger.getLogger(AuditingFilter.class);
    private final static Set<String> REDACTED_HEADERS = ImmutableSet.of(HttpHeaders.AUTHORIZATION);

    private SessionRepositoryDAO sessionRepository = DAOFactory.getSessionDAO();  // DAO to access Sessions
    private UserRepositoryDAO userRepository = DAOFactory.getUserDAO();  // DAO to access Users
    private ActivityRepositoryDAO activityRepositoryDAO = DAOFactory.getActivityDAO();

    private String kind;

    public AuditingFilter() {
    }

    AuditingFilter(String kind) {
        this.kind = kind;
    }

    @Override
    public ContainerRequest filter(ContainerRequest request) {
        // Get session id from request header
        final String sessionId = request.getHeaderValue("session-id");

        final StringBuilder builder = new StringBuilder();
        builder.append("\nAUDITED RESOURCE ACCESS\n");

        builder.append(kind + "\n");
//        builder.append("  Resource : " + resource.getClass() + "\n");

//        if (requireRemoteIPAddressInformation && !request.getRequestHeaders().keySet().contains(HttpHeaders.X_FORWARDED_FOR)) {
//            throw new RuntimeException("Header " + HttpHeaders.X_FORWARDED_FOR + " is required but was not found in the request");
//        }
        for (Map.Entry<String, List<String>> entry : request.getRequestHeaders().entrySet()) {
            if (!REDACTED_HEADERS.contains(entry.getKey())) {
                builder.append("  Header   : " + entry.getKey() + " = " + entry.getValue() + "\n");
            }
        }
        builder.append("  Method   : " + request.getMethod() + "\n");
        builder.append("  URI      : " + request.getRequestUri() + "\n");
        for (Map.Entry<String, List<String>> entry : request.getQueryParameters(true).entrySet()) {
            final String name = entry.getKey();
            final List<String> value = entry.getValue();
            builder.append("  Param    : " + name + " = " + value + " \n");
        }
        logger.info(builder.toString());

        /////
        User user = null;
        Session session = null;

        if (sessionId != null && sessionId.length() > 0) {
            // Load session object from repository
            session = sessionRepository.get(sessionId);

            // Load associated user from session
            if (session != null) {
                Query q = userRepository.createQuery().field("email").equal(session.getUserId());
                user = userRepository.findOne(q);
                Date d = new Date();
                session.setLastAccessedTime(d);
                sessionRepository.save(session);

                Activity a = new Activity(kind, session.getUserId(), d);
                activityRepositoryDAO.save(a);
            } else {
                logger.warn("null session");
            }
        } else {
            logger.warn("null session id");
        }

        // Set security context
        request.setSecurityContext(new SymetricSecurityContext(session, user));
        return request;
    }

    @Override
    public ContainerRequestFilter getRequestFilter() {
        return this;
    }

    @Override
    public ContainerResponseFilter getResponseFilter() {
        return null;
    }

}
