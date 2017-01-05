/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.symetric.server.models;

import com.mongodb.MongoClient;
import fr.symetric.util.MongoUtil;
import org.mongodb.morphia.Morphia;

/**
 *
 * @author Alban Gaignard <alban.gaignard@cnrs.fr>
 */
public class DAOFactory {
    private static MongoClient mongo = MongoUtil.getMongo();
    private static Morphia morphia = new Morphia();
    private static final String DB_NAME = "symetric_datahub_db";
    
    private static SessionRepositoryDAO sessionDao = null;
    private static UserRepositoryDAO userDao = null;
    private static ActivityRepositoryDAO activityDao = null;
    private static ProvMetricsRepositoryDAO provMetricsDao = null;
    
    public static synchronized SessionRepositoryDAO getSessionDAO() {
        if (sessionDao == null) {
            sessionDao = new SessionRepositoryDAO(Session.class, mongo, morphia, DB_NAME);
            return sessionDao;
        } else {
            return sessionDao;
        }
    }
    
    public static synchronized UserRepositoryDAO getUserDAO() {
        if (userDao == null) {
            userDao = new UserRepositoryDAO(User.class, mongo, morphia, DB_NAME);
            return userDao;
        } else {
            return userDao;
        }
    }
    
    public static synchronized ActivityRepositoryDAO getActivityDAO() {
        if (activityDao == null) {
            activityDao = new ActivityRepositoryDAO(Activity.class, mongo, morphia, DB_NAME);
            return activityDao;
        } else {
            return activityDao;
        }
    }
    
    public static synchronized ProvMetricsRepositoryDAO getProvMetricsDAO() {
        if (provMetricsDao == null) {
            provMetricsDao = new ProvMetricsRepositoryDAO(ProvMetrics.class, mongo, morphia, DB_NAME);
            return provMetricsDao;
        } else {
            return provMetricsDao;
        }
    }
}
