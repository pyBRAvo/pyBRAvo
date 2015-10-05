/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

import fr.symetric.api.Query;
import org.junit.After;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;

/**
 *
 * @author Alban Gaignard <alban.gaignard@cnrs.fr>
 */
public class TestARQ {
    
    String myQuery = "PREFIX oboInOwl:<http://www.geneontology.org/formats/oboInOwl#> \n" +
" PREFIX om: <http://bio2rdf.org/omim_vocabulary:> \n" +
" PREFIX b: <http://bio2rdf.org/bio2rdf_vocabulary:> \n" + 
" PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> \n" +
" PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> \n" +
" PREFIX owl: <http://www.w3.org/2002/07/owl#> \n" +
" \n" +
" SELECT DISTINCT (?reg as ?area) \n" +
"     (SUM(?nb) AS ?cases) \n" +
"     (group_concat(distinct ?icd10; separator=\", \") AS ?ICD)  \n" +
"     (group_concat(distinct ?label; separator=\", \") AS ?labels) \n" +
"     (group_concat(distinct ?ncit; separator=\", \") AS ?omimRefs) \n" +
"     (group_concat(distinct ?gs; separator=\", \") AS ?geneIds)  WHERE { \n" +
"     ?doidClass rdfs:label ?label . \n" +
"     FILTER regex(?label, \"stenos\") . \n" +
"     ?doidClass oboInOwl:id ?doid . \n" +
"     OPTIONAL { \n" +
"         ?doidClass oboInOwl:hasDbXref ?ncit . \n" +
"         FILTER strstarts(str(?ncit), \"OMI\") . \n" +
"     } \n" +
"     \n" +
"     ?t owl:sameAs ?doidClass . \n" +
"     ?x rdf:type ?t . \n" +
"     \n" +
"     ?x <http://cepidc.data.symetric.org/has-icd10-cause> ?icd10 . \n" +
"     ?x <http://cepidc.data.symetric.org/refers-to-gender> \"T\" . \n" +
"     ?x <http://cepidc.data.symetric.org/refers-to-period> \"2007\" . \n" +
"     ?x <http://cepidc.data.symetric.org/has-value-for-all-ages> ?nb . \n" +
"     FILTER (?nb > 0) . \n" +
"     ?x <http://cepidc.data.symetric.org/refers-to-geographical-area> ?reg . \n" +
"     \n" +
"     BIND(URI(LCASE(CONCAT(\"http://bio2rdf.org/\",?ncit))) as ?s) . \n" +
"     #OPTIONAL {\n" +
"     #    SERVICE <http://omim.bio2rdf.org/sparql> { \n" +
"     #        ?s om:phenotype-map ?map . \n" +
"     #        ?map om:geneSymbols/b:identifier ?gs . \n" +
"     #    } \n" +
"     #}\n" +
" } GROUP BY ?reg #?icd10";
    
    public TestARQ() {
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
     
         Query qService = new Query();
         qService.init();
         qService.jenaQuery(myQuery);
     
     }
}
