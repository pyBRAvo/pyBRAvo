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
public class GalaxyCredential {
    private String instanceUrl;
    private String apiKey;
    
    public GalaxyCredential(){
        
    }

    public String getInstanceUrl() {
        return instanceUrl;
    }

    public void setInstanceUrl(String instanceUrl) {
        this.instanceUrl = instanceUrl;
    }

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    @Override
    public String toString() {
        return "GalaxyCredential{" + "instanceUrl=" + instanceUrl + ", apiKey=" + apiKey + '}';
    }
    
}
