/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.symetric.server.models;


import com.mongodb.MongoClient;
import org.mongodb.morphia.Morphia;
import org.mongodb.morphia.dao.BasicDAO;

/**
 *
 * @author Alban Gaignard <alban.gaignard@cnrs.fr>
 */
public class ActivityRepositoryDAO extends BasicDAO<Activity, String> {

    public ActivityRepositoryDAO(Class<Activity> entityClass, MongoClient mongo, Morphia morphia, String dbName) {
        super(entityClass, mongo, morphia, dbName);
    }
    
}
