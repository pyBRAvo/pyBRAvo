/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.symetric.data;

/**
 *
 * @author Alban Gaignard <alban.gaignard@cnrs.fr>
 */
public class UserCredential {
    private String email;
    private String password;
    
    public UserCredential(){
        
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

    @Override
    public String toString() {
        return "UserCredential{" + "login=" + email + ", password=" + password + '}';
    }
    
}
