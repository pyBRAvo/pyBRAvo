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
import com.google.code.morphia.query.Query;
import com.google.common.collect.ImmutableSet;
import com.sun.jersey.spi.container.ContainerRequest;
import com.sun.jersey.spi.container.ContainerRequestFilter;
import com.sun.jersey.spi.container.ContainerResponseFilter;
import com.sun.jersey.spi.container.ResourceFilter;
import fr.symetric.server.models.DAOFactory;
import java.util.List;
import java.util.Map;
import java.util.Set;
import javax.ws.rs.ext.Provider;
import org.mortbay.jetty.HttpHeaders;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

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

    private static Logger logger = LoggerFactory.getLogger(AuditingFilter.class);
    private boolean requireRemoteIPAddressInformation = true;
    private final static Set<String> REDACTED_HEADERS = ImmutableSet.of(HttpHeaders.AUTHORIZATION);

    private SessionRepositoryDAO sessionRepository = DAOFactory.getSessionDAO();  // DAO to access Session

    private UserRepositoryDAO userRepository = DAOFactory.getUserDAO();  // DAO to access User

    @Override
    public ContainerRequest filter(ContainerRequest request) {
        // Get session id from request header
        final String sessionId = request.getHeaderValue("session-id");

        
        
        final StringBuilder builder = new StringBuilder();
        builder.append("\nAUDITED RESOURCE ACCESS\n");
        
        
        builder.append("");
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
            if (null != session) {
                Query q = userRepository.createQuery().field("email").equal(session.getUserId());
                user = userRepository.findOne(q);
            }
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
