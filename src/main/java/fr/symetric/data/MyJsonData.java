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
public class MyJsonData {
    private String id;
    private String label;
    
    public MyJsonData(){
        
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    @Override
    public String toString() {
        return "MyJsonData{" + "id=" + id + ", label=" + label + '}';
    }
    
}
