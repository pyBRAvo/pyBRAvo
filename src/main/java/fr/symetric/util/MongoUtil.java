/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.symetric.util;

import com.mongodb.MongoClient;
import com.mongodb.MongoException;
import org.apache.log4j.Logger;

/**
 *
 * @author Alban Gaignard <alban.gaignard@cnrs.fr>
 */
public class MongoUtil {

    private final static Logger logger = Logger.getLogger(MongoUtil.class);

    private static final int port = 27017;
    private static final String host = "localhost";
    private static MongoClient mongo = null;

    public static MongoClient getMongo() {
        if (mongo == null) {
            try {
                mongo = new MongoClient(host, port);
                logger.debug("New Mongo created with [" + host + "] and [" + port + "]");
                
            } catch (MongoException e) {
                logger.error(e.getMessage());
            }
        }
        return mongo;
    }

}
