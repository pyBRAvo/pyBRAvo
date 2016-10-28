/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.symetric.server.models;

import java.io.Serializable;
import java.util.Date;
import org.mongodb.morphia.annotations.Entity;
import org.mongodb.morphia.annotations.Id;

/**
 *
 * @author Alban Gaignard <alban.gaignard@cnrs.fr>
 */
@Entity
public class Session implements Serializable {
    private static final long serialVersionUID = -948876251765276L;
    
    @Id
//    private ObjectId sessionId;   // id
    private String sessionId;   // id
    private String userId;      // user
    private boolean active;     // session active?
    private boolean secure;     // session secure?
 
    private Date createTime;    // session create time
    private Date lastAccessedTime;  // session last use time

    public Session() {
        
    }
    
    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public boolean isSecure() {
        return secure;
    }

    public void setSecure(boolean secure) {
        this.secure = secure;
    }

    public Date getCreateTime() {
        return createTime;
    }

    public void setCreateTime(Date createTime) {
        this.createTime = createTime;
    }

    public Date getLastAccessedTime() {
        return lastAccessedTime;
    }

    public void setLastAccessedTime(Date lastAccessedTime) {
        this.lastAccessedTime = lastAccessedTime;
    }
 
    
}
