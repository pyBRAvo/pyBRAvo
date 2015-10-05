/* 
* @Author: gaignard
* @Date:   2015-09-02 11:15:50
* @Last Modified by:   gaignard
* @Last Modified time: 2015-09-02 11:41:52
*/

'use strict';



var epidemioQueries = [
'PREFIX oboInOwl:<http://www.geneontology.org/formats/oboInOwl#> \n \
PREFIX om: <http://bio2rdf.org/omim_vocabulary:> \n \
PREFIX b: <http://bio2rdf.org/bio2rdf_vocabulary:> \n \
\n \
SELECT DISTINCT (?reg as ?area) \n \
    (SUM(?nb) AS ?cases) \n \
    (group_concat(distinct ?icd10; separator=", ") AS ?ICD)  \n \
    (group_concat(distinct ?label; separator=", ") AS ?labels) \n \
    (group_concat(distinct ?ncit; separator=", ") AS ?omimRefs) \n \
    (group_concat(distinct ?gs; separator=", ") AS ?geneIds)  WHERE { \n \
    ?doidClass rdfs:label ?label . \n \
    FILTER regex(?label, "{{label}}") . \n \
    ?doidClass oboInOwl:id ?doid . \n \
    OPTIONAL { \n \
        ?doidClass oboInOwl:hasDbXref ?ncit . \n \
        FILTER strstarts(str(?ncit), "OMI") . \n \
    } \n \
    \n \
    ?t owl:sameAs ?doidClass . \n \
    ?x rdf:type ?t . \n \
    \n \
    ?x <http://cepidc.data.symetric.org/has-icd10-cause> ?icd10 . \n \
    ?x <http://cepidc.data.symetric.org/refers-to-gender> "T" . \n \
    ?x <http://cepidc.data.symetric.org/refers-to-period> "{{year}}" . \n \
    ?x <http://cepidc.data.symetric.org/has-value-for-all-ages> ?nb . \n \
    FILTER (?nb > 0) . \n \
    ?x <http://cepidc.data.symetric.org/refers-to-geographical-area> ?reg . \n \
    \n \
    BIND(URI(LCASE(CONCAT("http://bio2rdf.org/",?ncit))) as ?s) . \n \
    #OPTIONAL {\n \
    #    SERVICE <http://omim.bio2rdf.org/sparql> { \n \
    #        ?s om:phenotype-map ?map . \n \
    #        ?map om:geneSymbols/b:identifier ?gs . \n \
    #    } \n \
    #}\n \
} \n\
GROUP BY ?area #?icd10 \n\
ORDER BY DESC(?cases)',

'PREFIX oboInOwl:<http://www.geneontology.org/formats/oboInOwl#> \n '
+ 'PREFIX om: <http://bio2rdf.org/omim_vocabulary:> \n '
+ 'PREFIX b: <http://bio2rdf.org/bio2rdf_vocabulary:> \n ' 
+ '\n '
+ 'CONSTRUCT { \n '
+ '    \n '
+ '    ?t owl:sameAs ?doidClass . \n '
+ '    ?doidClass rdfs:label ?label . \n '
+ '    ?x rdf:type ?t . \n '
+ '    \n '
+ '    ?x <http://cepidc.data.symetric.org/has-value-for-all-ages> ?nb . \n '
+ '    ?x <http://cepidc.data.symetric.org/refers-to-geographical-area> ?reg . \n '
+ '    \n '
+ '} WHERE { \n '
+ '    ?doidClass rdfs:label ?label . \n '
+ '  FILTER regex(?label, \"{{label}}\") . \n '
+ '    ?doidClass oboInOwl:id ?doid . \n '
+ '    OPTIONAL { \n '
+ '        ?doidClass oboInOwl:hasDbXref ?ncit . \n '
+ '        FILTER strstarts(str(?ncit), \"OMI\") . \n '
+ '    } \n '
+ '    \n '
+ '    ?t owl:sameAs ?doidClass . \n '
+ '    ?x rdf:type ?t . \n '
+ '\n '    
+ '    ?x <http://cepidc.data.symetric.org/has-icd10-cause> ?icd10 . \n '
+ '    ?x <http://cepidc.data.symetric.org/refers-to-gender> "T" . \n '
+ '    ?x <http://cepidc.data.symetric.org/refers-to-period> "{{year}}" . \n '
+ '    ?x <http://cepidc.data.symetric.org/has-value-for-all-ages> ?nb . \n '
+ '    FILTER (?nb > 0) . \n '
+ '    ?x <http://cepidc.data.symetric.org/refers-to-geographical-area> ?reg . \n '
+ '    \n '
+ '    BIND(URI(LCASE(CONCAT("http://bio2rdf.org/",?ncit))) as ?s) . \n '
+ '    #OPTIONAL { \n '
+ '    #    SERVICE <http://omim.bio2rdf.org/sparql> { \n '
+ '    #        ?s om:phenotype-map ?map . \n '
+ '    #        ?map om:geneSymbols/b:identifier ?gs . \n '
+ '    #    } \n '
+ '    #}\n '
+ '}\n '
];

var fedQueries = [
    'PREFIX idemo:<http://rdf.insee.fr/def/demo#> \n \
PREFIX igeo:<http://rdf.insee.fr/def/geo#> \n \
SELECT ?nom ?popTotale WHERE { \n \
    ?region igeo:codeRegion "24" .\n \
    ?region igeo:subdivisionDirecte ?departement .\n \
    ?departement igeo:nom ?nom .\n \
    ?departement idemo:population ?popLeg .\n \
    ?popLeg idemo:populationTotale ?popTotale .\n \
} ORDER BY ?popTotale',
    'PREFIX semehr: <http://www.mnemotix.com/ontology/semEHR#> \n \
SELECT ?codePostal (count(*) as ?total) WHERE { \n \
    ?cv semehr:value "BHGSA5B0"^^xsd:string . \n \
    ?patient semehr:hasMedicalBag ?bag .\n \
    ?bag semehr:hasMedicalEvent ?evt .\n \
    ?evt semehr:hasClinicalVariable ?cv . \n \
    ?patient semehr:address ?addr .\n \
    ?addr semehr:postalCode ?codePostal . \n \
} GROUP BY ?codePostal ORDER BY desc(?total)',
    'PREFIX semehr: <http://www.mnemotix.com/ontology/semEHR#> \n \
SELECT ?codePostal (count(*) as ?total) WHERE { \n \
    ?cv semehr:value "BHGSA5B0"^^xsd:string . \n \
    ?patient semehr:hasMedicalBag/semehr:hasMedicalEvent/semehr:hasClinicalVariable ?cv . \n \
    ?patient semehr:address/semehr:postalCode ?codePostal . \n \
} GROUP BY ?codePostal ORDER BY desc(?total)',
    'PREFIX semehr: <http://www.mnemotix.com/ontology/semEHR#> \n \
PREFIX dbpedia-owl: <http://dbpedia.org/ontology/> \n \
SELECT (count(distinct ?patient) as ?nbPatients)  (sum(?pop) as ?totalPop) ?postalCode (count(distinct ?patient)*10000/sum(?pop) as ?occurencePer10k) WHERE { \n \
    ?cv semehr:value "BHGSA5B0"^^xsd:string . \n \
    ?patient semehr:hasMedicalBag/semehr:hasMedicalEvent/semehr:hasClinicalVariable ?cv . \n \
    ?patient semehr:address/semehr:postalCode ?postalCode . \n \
\n \
    SERVICE <http://fr.dbpedia.org/sparql> { \n \
        SELECT DISTINCT (str(?cp) as ?postalCode) ?pop WHERE { \n \
            ?s dbpedia-owl:region <http://fr.dbpedia.org/resource/Auvergne> .\n \
            ?s dbpedia-owl:postalCode ?cp . \n \
            ?s dbpedia-owl:populationTotal ?pop \n \
        } \n \
    } \n \
} GROUP BY  ?postalCode ORDER BY desc(?occurencePer10k)', 
'PREFIX idemo:<http://rdf.insee.fr/def/demo#>  \n \
PREFIX igeo:<http://rdf.insee.fr/def/geo#>  \n \
PREFIX dbpedia-owl:<http://dbpedia.org/ontology/> \n \
\n \
SELECT ?nom ?popMunicipaleINSEE ?popTotaleINSEE ?popDBpedia ?abstract WHERE { \n \
    ?region igeo:codeRegion "83" . \n \
    ?region igeo:subdivisionDirecte ?departement .\n \
    ?departement igeo:nom ?nom .\n \
    ?departement igeo:codeINSEE ?codeINSEE .\n \
\n \
    ?departement idemo:population ?popLeg .\n \
    ?popLeg idemo:populationTotale ?popTotaleINSEE .\n \
    ?popLeg idemo:populationMunicipale ?popMunicipaleINSEE .\n \
\n \
    SERVICE <http://fr.dbpedia.org/sparql> {\n \
        select distinct ?popDBpedia ?codeDBpedia ?abstract where {\n \
            ?s dbpedia-owl:region <http://fr.dbpedia.org/resource/Auvergne> .\n \
            ?s dbpedia-owl:department ?d .\n \
            ?d dbpedia-owl:inseeCode ?codeDBpedia . \n \
            OPTIONAL {?d dbpedia-owl:abstract ?abstract FILTER ( lang(?abstract) = "zh" )}\n \
            ?d <http://fr.dbpedia.org/property/population> ?popDBpedia \n \
        }\n \
    }\n \
\n \
FILTER(?codeDBpedia = xsd:integer(?codeINSEE))\n \
} ORDER BY ?popTotaleINSEE',
'PREFIX drugbank: <http://www4.wiwiss.fu-berlin.de/drugbank/resource/drugbank/> \n \
PREFIX drugbank-drugs:    <http://www4.wiwiss.fu-berlin.de/drugbank/resource/drugs/> \n \
PREFIX drugbank-category: <http://www4.wiwiss.fu-berlin.de/drugbank/resource/drugcategory/> \n \
PREFIX kegg: <http://bio2rdf.org/ns/kegg#> \n \
PREFIX bio2rdf: <http://bio2rdf.org/ns/bio2rdf#> \n \
\n \
SELECT ?drugDesc ?cpd ?equation WHERE { \n \
  ?drug drugbank:drugCategory drugbank-category:cathartics . \n \
  ?drug drugbank:keggCompoundId ?cpd . \n \
  ?drug drugbank:description ?drugDesc . \n \
  ?enzyme kegg:xSubstrate ?cpd . \n \
  ?enzyme rdf:type kegg:Enzyme . \n \
  ?reaction kegg:xEnzyme ?enzyme . \n \
  ?reaction kegg:equation ?equation . }',
    
    'PREFIX drugbank: <http://www4.wiwiss.fu-berlin.de/drugbank/resource/drugbank/> \n \
PREFIX drugbank-drugs:    <http://www4.wiwiss.fu-berlin.de/drugbank/resource/drugs/> \n \
PREFIX drugbank-category: <http://www4.wiwiss.fu-berlin.de/drugbank/resource/drugcategory/> \n \
PREFIX kegg: <http://bio2rdf.org/ns/kegg#> \n \
PREFIX bio2rdf: <http://bio2rdf.org/ns/bio2rdf#> \n \
 \n \
  SELECT ?drug ?transfo ?mass WHERE { \n \
  ?drug drugbank:affectedOrganism \x27Humans and other mammals\x27. \n \
  ?drug drugbank:casRegistryNumber ?cas . \n \
  ?keggDrug bio2rdf:xRef ?cas . \n \
  ?keggDrug bio2rdf:mass ?mass \n \
     FILTER ( xsd:decimal(?mass) < 100 ) \n \
     OPTIONAL { ?drug drugbank:biotransformation ?transfo . } }'
];


var remoteFilePaths = [
    "http://nyx.unice.fr/~gaignard/data/cog-2012.ttl",
    "http://nyx.unice.fr/~gaignard/data/popleg-2010.ttl",
    "http://nyx.unice.fr/~gaignard/data/creatis-ginseng-all.ttl",
    "http://nyx.unice.fr/~gaignard/data/i3s-ginseng-all.ttl",
    "http://nyx.unice.fr/~gaignard/data/in2p3-ginseng-all.ttl"
];

var validDataSources = [];
