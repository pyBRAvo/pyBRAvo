/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.symetric.server.exceptions;

import java.io.Serializable;

/**
 *
 * @author Alban Gaignard <alban.gaignard@cnrs.fr>
 */
public class SecurityException extends Exception implements Serializable {
    private static final long serialVersionUID = 983876554340987L;
    
    public SecurityException() {
        
    }
}
