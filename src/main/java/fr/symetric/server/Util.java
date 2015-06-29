/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.symetric.server;

import fr.symetric.server.models.DAOFactory;
import fr.symetric.server.models.Session;
import fr.symetric.server.models.SessionRepositoryDAO;
import java.util.Date;
import org.apache.log4j.Logger;

/**
 *
 * @author Alban Gaignard <alban.gaignard@cnrs.fr>
 */
public class Util {

    private static Logger logger = Logger.getLogger(EmbeddedJettyServer.class);

    public static void tagExpiredSessions() {
        SessionRepositoryDAO sessionRep = DAOFactory.getSessionDAO();

        Date now = new Date();

        for (String id : sessionRep.findIds()) {
            Session s = sessionRep.get(id);
            Date lastAccess = s.getLastAccessedTime();
            Date expirationDate = new Date();
            expirationDate.setTime(lastAccess.getTime() + 600000); //10mn = 600000 ms

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
}
