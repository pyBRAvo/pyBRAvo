/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.symetric.test;

import java.util.Arrays;
import java.util.List;
import org.junit.After;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;

/**
 *
 * @author Alban Gaignard <alban.gaignard@univ-nantes.fr>
 */
public class FilterDataSourceTest {

    public FilterDataSourceTest() {
    }

    @BeforeClass
    public static void setUpClass() {
    }

    @AfterClass
    public static void tearDownClass() {
    }

    @Before
    public void setUp() {
    }

    @After
    public void tearDown() {
    }

    // TODO add test methods here.
    // The methods must be annotated with annotation @Test. For example:
    //
    @Test
    public void hello() {
        List<String> dataSources = Arrays.asList("KEGG", "PID");
        
        StringBuilder filterDataSources = new StringBuilder();
        filterDataSources.append("FILTER (?source IN (");
        if (dataSources.size() > 0) {
            for (String ds : dataSources) {
                String dsUri = "<http://pathwaycommons.org/pc2/"+ds.toLowerCase()+">";
                filterDataSources.append(dsUri + ", ");
            }
            int i = filterDataSources.lastIndexOf(", ");
            filterDataSources.deleteCharAt(i);
            filterDataSources.append(")) . \n");
        }
        
        System.out.println(filterDataSources);

    }
}
