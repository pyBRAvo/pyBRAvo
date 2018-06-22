/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.bravo.api;

import java.util.ArrayList;
import java.util.List;

/**
 *
 * @author Alban Gaignard <alban.gaignard@univ-nantes.fr>
 */
public class Util {

    public static String SPARQL_ENDPOINT = "http://rdf.pathwaycommons.org/sparql"; //
//    public static String SPARQL_ENDPOINT = "http://localhost:3030/PC/query";
//    public static String SPARQL_ENDPOINT = "http://172.18.253.87:9001/sparql?default-graph-uri=http%3A%2F%2Flocal-PC"; //

    public static int SLICE_SIZE = 1;

    public static List<List<String>> groupGenes(List<String> geneList) {
        List<List<String>> results = new ArrayList<List<String>>();
        List<String> chunk = new ArrayList<String>();
        int cpt = 0;

        for (String gName : geneList) {
            chunk.add(gName);
            cpt++;

            if (cpt % Util.SLICE_SIZE == 0) {
                results.add(chunk);
                chunk = new ArrayList<String>();
            }
        }

        if (chunk.size() > 0) {
            results.add(chunk);
        }
        return results;
    }
}
