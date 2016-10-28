/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.symetric.server.models;

import java.io.Serializable;
import java.util.Date;
import java.util.UUID;
import org.mongodb.morphia.annotations.Id;

/**
 *
 * @author Alban Gaignard <alban.gaignard@cnrs.fr>
 */
public class Activity implements Serializable {

    private static final long serialVersionUID = 198778765654678790L;
    public static enum Kind {login, logout, admin};
    
    @Id
    private String id;
    private String kind ;
    private String userID ;
    private Date date;

    public Activity() {
    }

    public Activity(String kind, String userID, Date date) {
        this.id = UUID.randomUUID().toString();
        this.kind = kind;
        this.userID = userID;
        this.date = date;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getKind() {
        return kind;
    }

    public void setKind(String kind) {
        this.kind = kind;
    }

    public String getUserID() {
        return userID;
    }

    public void setUserID(String userID) {
        this.userID = userID;
    }

    public Date getDate() {
        return date;
    }

    public void setDate(Date date) {
        this.date = date;
    }

}
