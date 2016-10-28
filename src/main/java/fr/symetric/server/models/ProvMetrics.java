/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.symetric.server.models;

//import com.google.code.morphia.annotations.Entity;

import org.mongodb.morphia.annotations.Entity;
import org.mongodb.morphia.annotations.Id;

//import com.google.code.morphia.annotations.Id;

/**
 *
 * @author Alban Gaignard <alban.gaignard@cnrs.fr>
 */
@Entity
public class ProvMetrics {

    @Id
    private String timeSlot;
    
    private int nbProvGen;
    private int nbProvTriples;

    public ProvMetrics() {
    }

    public ProvMetrics(String timeSlot, int nbProvGen, int nbProvTriples) {
        this.timeSlot = timeSlot;
        this.nbProvGen = nbProvGen;
        this.nbProvTriples = nbProvTriples;
    }

    public String getTimeSlot() {
        return timeSlot;
    }

    public void setTimeSlot(String timeSlot) {
        this.timeSlot = timeSlot;
    }

    public int getNbProvGen() {
        return nbProvGen;
    }

    public void setNbProvGen(int nbProvGen) {
        this.nbProvGen = nbProvGen;
    }

    public int getNbProvTriples() {
        return nbProvTriples;
    }

    public void setNbProvTriples(int nbProvTriples) {
        this.nbProvTriples = nbProvTriples;
    }

    @Override
    public String toString() {
        return "ProvMetrics{" + "timeSlot=" + timeSlot + ", nbProvGen=" + nbProvGen + ", nbProvTriples=" + nbProvTriples + '}';
    }

}
