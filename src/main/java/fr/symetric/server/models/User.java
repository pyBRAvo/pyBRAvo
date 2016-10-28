/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.symetric.server.models;

import java.security.Principal;
import java.util.HashSet;
import java.util.Set;
import org.mongodb.morphia.annotations.Entity;
import org.mongodb.morphia.annotations.Id;

/**
 *
 * @author Alban Gaignard <alban.gaignard@cnrs.fr>
 */
@Entity
public class User implements Principal {

    // Role
    public enum Role {
        admin, user
    };

    @Id
    private String email;    // email
    private String name;            // name
    private String password;            // name

    private Set<Role> roles;        // roles

    @Override
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Set<Role> getRoles() {
        if (roles == null) {
            roles = new HashSet<Role>();
        }
        return roles;
    }

    public void setRoles(Set<Role> roles) {
        this.roles = roles;
    }

}
