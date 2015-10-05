/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.symetric.server.models;

import com.google.code.morphia.Morphia;
import com.mongodb.Mongo;
import fr.symetric.util.MongoUtil;

/**
 *
 * @author Alban Gaignard <alban.gaignard@cnrs.fr>
 */
public class DAOFactory {
    private static Mongo mongo = MongoUtil.getMongo();
    private static Morphia morphia = new Morphia();
    private static final String dbname = "symetric_user_db";
    
    private static SessionRepositoryDAO sessionDao = null;
    private static UserRepositoryDAO userDao = null;
    private static ActivityRepositoryDAO activityDao = null;
    
    public static synchronized SessionRepositoryDAO getSessionDAO() {
        if (sessionDao == null) {
            sessionDao = new SessionRepositoryDAO(Session.class, mongo, morphia, dbname);
            return sessionDao;
        } else {
            return sessionDao;
        }
    }
    
    public static synchronized UserRepositoryDAO getUserDAO() {
        if (userDao == null) {
            userDao = new UserRepositoryDAO(User.class, mongo, morphia, dbname);
            return userDao;
        } else {
            return userDao;
        }
    }
    
    public static synchronized ActivityRepositoryDAO getActivityDAO() {
        if (activityDao == null) {
            activityDao = new ActivityRepositoryDAO(Activity.class, mongo, morphia, dbname);
            return activityDao;
        } else {
            return activityDao;
        }
    }
}
