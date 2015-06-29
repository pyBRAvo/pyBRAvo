/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.symetric.util;

import com.mongodb.Mongo;
import com.mongodb.MongoClient;
import com.mongodb.MongoException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Alban Gaignard <alban.gaignard@cnrs.fr>
 */
public class MongoUtil {

    private final static Logger logger = LoggerFactory.getLogger(MongoUtil.class);

    private static final int port = 27017;
    private static final String host = "localhost";
    private static Mongo mongo = null;

    public static Mongo getMongo() {
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
