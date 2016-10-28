/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.symetric.server.models;

import com.mongodb.MongoClient;
import java.util.Iterator;
import java.util.regex.Pattern;
import org.mongodb.morphia.Morphia;
import org.mongodb.morphia.dao.BasicDAO;

/**
 *
 * @author Alban Gaignard <alban.gaignard@cnrs.fr>
 */
public class UserRepositoryDAO extends BasicDAO<User, String> {

    public UserRepositoryDAO(Class<User> entityClass, MongoClient mongo, Morphia morphia, String dbName) {
        super(entityClass, mongo, morphia, dbName);
    }

    public Iterator<User> findByName(String name) {
        Pattern regExp = Pattern.compile(name + ".*", Pattern.CASE_INSENSITIVE);
        return ds.find(entityClazz).filter("name", regExp).iterator();
    }
}
