/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.symetric.server.models;

import com.mongodb.MongoClient;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import org.mongodb.morphia.Morphia;
import org.mongodb.morphia.dao.BasicDAO;

/**
 *
 * @author Alban Gaignard <alban.gaignard@cnrs.fr>
 */
public class ProvMetricsRepositoryDAO extends BasicDAO<ProvMetrics, String> {
    
    public ProvMetricsRepositoryDAO(Class<ProvMetrics> entityClass, MongoClient mongo, Morphia morphia, String dbName) {
        super(entityClass, mongo, morphia, dbName);
    }
    
    public String getTimeSlot() {
        SimpleDateFormat fmt = new SimpleDateFormat("yyyy-MM");
        String timeslot = fmt.format(Calendar.getInstance().getTime());
        return timeslot;
    }
    
    public synchronized ProvMetrics traceInsertedTriples(int triples, String timeSlot) {
        ProvMetricsRepositoryDAO dao = DAOFactory.getProvMetricsDAO();
        if (dao.get(timeSlot) == null) {
            ProvMetrics pm = new ProvMetrics(timeSlot, 1, triples);
            dao.save(pm);
            return pm;
        } else {
            ProvMetrics pm = dao.get(timeSlot);
            pm.setNbProvGen(pm.getNbProvGen()+1);
            pm.setNbProvTriples(pm.getNbProvTriples()+triples);
            dao.save(pm);
            return pm;
        }
    }
    
    public synchronized ProvMetrics traceInsertedTriples(int triples) {
        ProvMetricsRepositoryDAO dao = DAOFactory.getProvMetricsDAO();
        if (dao.get(getTimeSlot()) == null) {
            ProvMetrics pm = new ProvMetrics(getTimeSlot(), 1, triples);
            dao.save(pm);
            return pm;
        } else {
            ProvMetrics pm = dao.get(getTimeSlot());
            pm.setNbProvGen(pm.getNbProvGen()+1);
            pm.setNbProvTriples(pm.getNbProvTriples()+triples);
            dao.save(pm);
            return pm;
        }
    }
    
}
