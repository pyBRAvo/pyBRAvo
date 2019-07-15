from typing import List, Any
from SPARQLWrapper import SPARQLWrapper, JSON
from string import Template
from flask import Flask, request, render_template, abort, Response

import requests

import bravo.util as util
import bravo.config as config

app = Flask("pyBravo")

tpl_select_reg_query = """
PREFIX bp: <http://www.biopax.org/release/biopax-level3.owl#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> 

SELECT DISTINCT ?controllerName ?controlType ?controlledName ?source WHERE {
    $filter_Chunks
    $filter_SkipSmallMollecules
    $filter_DataSources
    $filter_Unknown

    {{?participant bp:displayName ?controlledName .} 
    UNION
    {?participant bp:standardName ?controlledName .}}
    UNION
    {?participant bp:name ?controlledName .}

    ?participant rdf:type ?controlledType . 

    {{?controller bp:displayName ?controllerName .} 
    UNION
    {?controller bp:standardName ?controllerName .}}
    UNION
    {?controller bp:name ?controllerName .}
    ?controller rdf:type ?controllerType .

    ?controlled bp:participant ?participant .

    ?tempReac a bp:TemplateReactionRegulation ; 
        bp:controlled ?controlled ; 
        bp:controller ?controller ;  
        bp:dataSource/bp:displayName ?source . 
        
    OPTIONAL {?tempReac bp:controlType ?controlType}
} 
"""

tpl_select_reg_query_fast = """
PREFIX bp: <http://www.biopax.org/release/biopax-level3.owl#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> 

SELECT DISTINCT ?controllerName ?controlType ?controlledName ?source WHERE {
    $filter_Chunks
    $filter_SkipSmallMollecules
    $filter_DataSources
    $filter_Unknown

    ?participant bp:displayName ?controlledName . 
    ?participant rdf:type ?controlledType .  

    ?controller bp:displayName ?controllerName . 
    ?controller rdf:type ?controllerType . 

    ?controlled bp:participant ?participant . 

    ?tempReac a bp:TemplateReactionRegulation ; 
        bp:controlled ?controlled ; 
        bp:controller ?controller ;  
        bp:dataSource/bp:displayName ?source . 
    
    OPTIONAL {?tempReac bp:controlType ?controlType}
} 
"""

@app.route('/upstream_regulation')
def upstream_regulation_api():
    return "Upstream regulation"

def upstream_regulation(to_be_explored, already_explored = [], sif_network = [], current_depth = 0, explored_reg = 0):
    """
    Recursive exploration with two stopping criteria:
        - nothing new to explore
        - the maximum exploration depth is reached
    """

    """ 1st stopping criteria """
    if len(to_be_explored) == 0:
        print("Exploring done")
        return sif_network

    """ 2nd stopping criteria """
    if (config.HAS_MAX_DEPTH and (current_depth >= config.MAX_DEPTH)):
        print("Exploring halted due to maximum depth")
        return sif_network

    print()
    print('exploration depth ' + str(current_depth))
    print('to be explored ' + str(to_be_explored))
    print()

    """"""
    """ Decomposing protein complexes """
    """"""
    if config.DECOMPOSE_COMPLEXES:
        new_to_be_explored = []
        for name in to_be_explored:
            splits = name.split('/')
            if len(splits) > 1 :
                print(name + ' decomposed into ' + str(splits))
                new_to_be_explored.extend(splits)
                for s in splits:
                    sif_network.append({"source": s, "relation": "PART_OF", "target": name, "provenance": "PathwayCommons"})

        for new in new_to_be_explored:
            if new not in to_be_explored:
                    to_be_explored.append(new)
        print('to be explored after complex decomposition ' + str(to_be_explored))

    """"""
    """ Expanding the list with synonyms """
    """"""
    if config.EXTEND_WITH_SYNONYMS:
        new_to_be_explored = []
        for name in to_be_explored:
            synonyms = util.fast_get_synonyms(name, index_std=util.index_std, index_syn=util.index_syn)
            for s in synonyms:
                if s not in "-":
                    new_to_be_explored.append(s)
        if len(new_to_be_explored) > 0:
            print('new synonmys to be explored:' + str(new_to_be_explored))
        for new in new_to_be_explored:
            if new not in to_be_explored:
                    to_be_explored.append(new)

    """"""
    """ Expanding the list with [' mRna', ' protein'] """
    """"""
    if config.EXTEND_WITH_SUFFIXES:
        new_to_be_explored = util.expandGeneNames(to_be_explored)
        for new in new_to_be_explored:
            if new not in to_be_explored:
                    to_be_explored.append(new)

    """"""
    """ Grouping genes into chunks to be processed remotely by block """
    """"""
    chunks = util.gen_chunks(to_be_explored)
    to_be_explored = []

    """"""
    """ Network reconstruction """
    """"""
    for regulators in chunks :
        print('exploring ' + str(regulators))
        if config.FAST == True:
            query = Template(tpl_select_reg_query_fast)
        else:
            query = Template(tpl_select_reg_query)

        fds = util.gen_data_source_filter(config.DATA_SOURCES)
        fchunks = util.gen_chunks_values_constraint(regulators, '?controlledName')
        ssm = util.gen_small_mol_filter(config.SKIP_SMALL_MOLECULES)
        funk = util.gen_unknown_filter(config.UNKNOWN)

        q = query.substitute(filter_DataSources = fds,
                    filter_SkipSmallMollecules = ssm,
                    filter_Chunks = fchunks,
                    filter_Unknown = funk)

        if config.VERBOSE:
            print("======= PathwayCommons v9 query =======")
            print(q)
            print("=====================")

        sparql = SPARQLWrapper(config.SPARQL_ENDPOINT)
        sparql.setQuery(q)
        sparql.setReturnFormat(JSON)
        results = sparql.query().convert()

        # q_test = 'PREFIX bp:<http://www.biopax.org/release/biopax-level3.owl%23> SELECT * WHERE {?x ?p ?y} LIMIT 1'
        # r = requests.get('http://rdf.pathwaycommons.org/sparql?query='+q, headers={"Accept": "application/json"})

        #print(r.url)
        #print(r.status_code)
        #print(r.text)
        #results = r.json()
        #print(results)

        already_explored.extend(regulators)
        #print('already explored ' + str(already_explored))

        for result in results["results"]["bindings"]:

            if "controlType" in result.keys():
                source, reg_type, target, provenance = result["controllerName"]["value"], result["controlType"]["value"], \
                                                   result["controlledName"]["value"], result["source"]["value"]
            else:
                source, target, provenance = result["controllerName"]["value"], \
                                                       result["controlledName"]["value"], result["source"]["value"]
                reg_type = "UNKNOWN"

            source = util.removeSuffixForUnification(source)
            target = util.removeSuffixForUnification(target)

            sif_network.append({"source": source, "relation": reg_type, "target": target, "provenance": provenance})

            #print(source + ' --- ' + reg_type + ' --> ' + target)

            if source not in already_explored:
                if source not in to_be_explored:
                    to_be_explored.append(source)
                    explored_reg += 1
                    #print('Adding ' + source + ', in to_be_explored')
            #else:
                #print('skipping ' + source + ', already_explored')

        print()
        print('Explored ' + str(explored_reg)+ ' regulators')

    current_depth += 1
    # upstream_regulation(to_be_explored, already_explored, sif_network, current_depth, explored_reg)
    upstream_regulation(to_be_explored, already_explored = already_explored, sif_network = sif_network, current_depth = current_depth, explored_reg = explored_reg)

    return sif_network
