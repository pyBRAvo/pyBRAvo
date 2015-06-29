/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.symetric.server.models;

import com.google.code.morphia.Morphia;
import com.google.code.morphia.dao.BasicDAO;
import com.mongodb.Mongo;

/**
 *
 * @author Alban Gaignard <alban.gaignard@cnrs.fr>
 */
public class SessionRepositoryDAO extends BasicDAO<Session, String> {

    public SessionRepositoryDAO(Class<Session> entityClass, Mongo mongo, Morphia morphia, String dbName) {
        super(entityClass, mongo, morphia, dbName);
    }
    
}
