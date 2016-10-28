/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.symetric.server;

import fr.symetric.server.models.User;
import fr.symetric.server.models.Session;
import java.security.Principal;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.SecurityContext;
import org.apache.log4j.Logger;

/**
 *
 * @author Alban Gaignard <alban.gaignard@cnrs.fr>
 */
public class SymetricSecurityContext implements SecurityContext {

    private final User user;
    private final Session session;
    
    private static Logger logger = Logger.getLogger(SymetricSecurityContext.class);

    public SymetricSecurityContext(Session session, User user) {
        this.session = session;
        this.user = user;
    }

    @Override
    public Principal getUserPrincipal() {
        return user;
    }

    @Override
    public boolean isUserInRole(String role) {
        if (null == session || !session.isActive()) {
            // Forbidden
            logger.warn("Permission denied !");
            Response denied = Response.status(Response.Status.FORBIDDEN).entity("Permission Denied").build();
            throw new WebApplicationException(denied);
        }

        try {
            // this user has this role?
            if (user.getRoles().contains(User.Role.valueOf(role))) {
                logger.warn("Authorized access !");
                return true;
            } else {
                logger.warn("Permission denied !");
                return false;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return false;
    }

    @Override
    public boolean isSecure() {
        return (null != session) ? session.isSecure() : false;
    }

    @Override
    public String getAuthenticationScheme() {
        return SecurityContext.BASIC_AUTH;
    }

}
