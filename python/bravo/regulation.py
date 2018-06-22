from typing import List, Any

from IPython.display import display, Markdown, Latex
from rdflib import Graph, RDF, RDFS, Namespace
from SPARQLWrapper import SPARQLWrapper, JSON
from string import Template

import networkx as nx
import matplotlib.pyplot as plt
#from nxpd import draw

import requests
import json
import io
import time
import csv


INPUT_GENES = ['JUN/FOS', 'SCN5A', 'HEY2']

SPARQL_ENDPOINT = "http://rdf.pathwaycommons.org/sparql"  # type: str
CHUNKS_SIZE = 30  # type: int
MAX_DEPTH = 2 # type: int
SKIP_SMALL_MOLECULES = True # type: Boolean
#DATA_SOURCES = ['pid', 'humancyc', 'panther', 'msigdb']
DATA_SOURCES = []  # type: List[str]

HAS_MAX_DEPTH = False
try:
  MAX_DEPTH
except NameError:
  HAS_MAX_DEPTH = False
else:
  HAS_MAX_DEPTH = True

HAS_DATA_SOURCES = False
try:
  DATA_SOURCES
except NameError:
  HAS_DATA_SOURCES = False
else:
  HAS_DATA_SOURCES = True


tpl_select_reg_query = """
PREFIX bp: <http://www.biopax.org/release/biopax-level3.owl#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> 

SELECT DISTINCT ?controllerName ?controlType ?controlledName ?ds WHERE {
    $filter_Chunks
    $filter_SkipSmallMollecules
    $filter_DataSources

    ?participant bp:displayName ?controlledName ;
        rdf:type ?controlledType .
    ?controller bp:displayName ?controllerName ;
        rdf:type ?controllerType . 

    ?controlled bp:participant ?participant .

    ?tempReac a bp:TemplateReactionRegulation ; 
        bp:controlled ?controlled ; 
        bp:controller ?controller ; 
        bp:controlType ?controlType ; 
        bp:dataSource ?source . 
} 
"""

def get_gene_alias(gene_name):
    """
    """
    res = []
    with open('Homo_sapiens.gene_info', newline='') as csvfile:
        reader = csv.reader(csvfile, delimiter='\t', quotechar='|')
        for row in reader:
            synonyms = []
            synonyms.append(row[2])
            synonyms.extend(row[4].split('|'))
            #print(row[2]+ " == " + str(row[4].split('|')))
            #print(synonyms)
            if gene_name in synonyms :
                res.extend(synonyms)
    res.remove(gene_name)
    return res

def gen_chunks(list_of_genes):
    """
    Splitting a list of genes based on `CHUNKS_SIZE`
    """
    chunks_list = []
    chunk = []
    cpt = 0
    for gene in list_of_genes:
        chunk.append(gene)
        cpt += 1
        if ((cpt % CHUNKS_SIZE) == 0):
            chunks_list.append(chunk)
            chunk = []
    if (len(chunk) > 0):
        chunks_list.append(chunk)
    return chunks_list

def gen_data_source_filter(data_sources):
    """
    Generation of a SPARQL Filter clause to restrict data sources
    Produces something like
        FILTER (?source IN (<http://pathwaycommons.org/pc2/pid>, <http://pathwaycommons.org/pc2/humancyc>))
    """
    filter_clause = ''
    if len(data_sources) > 0 :
        filter_clause = 'FILTER (?source IN ('
        for ds in data_sources :
            dsUri = '<http://pathwaycommons.org/pc2/' + ds.lower() + '>'
            filter_clause = filter_clause + dsUri + ', '
        k = filter_clause.rfind(", ")
        filter_clause = filter_clause[:k]
        filter_clause = filter_clause + ')) .'
    return filter_clause

def gen_chunks_filter(chunks):
    """
    Generation of a SPARQL Filter clause to restrict gene/protein/etc. names
    Produces something like
        FILTER (
            ((?controlledName = "JUN"^^xsd:string) && (?controllerName != "JUN"^^xsd:string))
            || ((?controlledName = "FOS"^^xsd:string) && (?controllerName != "FOS"^^xsd:string))
        )
    """
    filter_clause = ''
    if len(chunks) > 0 :
        filter_clause = 'FILTER ( \n'
        for g in chunks :
            filter_clause += '((?controlledName = "' + g + '"^^xsd:string) && (?controllerName != "' + g + '"^^xsd:string)) \n'
            filter_clause +=' || '
        k = filter_clause.rfind(" || ")
        filter_clause = filter_clause[:k]
        filter_clause += ' ) .'
    return filter_clause


def gen_small_mol_filter(skip_small_molecules = True):
    """
    Generation of a SPARQL Filter clause to exclude small molecules
    Produces something like
        FILTER( str(?controllerType) != "http://www.biopax.org/release/biopax-level3.owl#SmallMolecule")
    """
    if skip_small_molecules:
        return 'FILTER( str(?controllerType) != "http://www.biopax.org/release/biopax-level3.owl#SmallMolecule")  .'
    else:
        return ''


def upstream_regulation(to_be_explored, max_depth = 1, data_sources = [], already_explored = [], sif_network = [], current_depth = 0, explored_reg = 0):
    """
    Recursive exploration with two stopping criteria:
        - nothing new to explore
        - the maximum exploration depth is reached
    """

    if max_depth is None:
        HAS_MAX_DEPTH = False

    MAX_DEPTH = max_depth
    DATA_SOURCES = data_sources

    """ 1st stopping criteria """
    if len(to_be_explored) == 0:
        print("Exploring done")
        return sif_network

    """ 2nd stopping criteria """
    if (HAS_MAX_DEPTH and (current_depth >= MAX_DEPTH)):
        print("Exploring alted due to maximum depth")
        return sif_network

    print()
    print('exploration depth ' + str(current_depth))
    print('to be explored ' + str(to_be_explored))

    """ Decomposing protein complexes """
    new_to_be_explored = []
    for name in to_be_explored:
        splits = name.split('/')
        if len(splits) > 1 :
            print(name + ' decomposed into ' + str(splits))
            new_to_be_explored.extend(splits)
            for s in splits:
                sif_network.append({"source":s, "relation":"PART_OF", "target":name})

    for new in new_to_be_explored:
        if new not in to_be_explored:
                to_be_explored.append(new)
    print('to be explored after complex decomposition ' + str(to_be_explored))

    """  """
    chunks = gen_chunks(to_be_explored)
    to_be_explored = []

    for regulators in chunks:
        print('exploring ' + str(regulators))
        query = Template(tpl_select_reg_query)

        # fds = gen_data_source_filter(data_sources)
        fds = gen_data_source_filter(DATA_SOURCES)
        fchunks = gen_chunks_filter(regulators)
        ssm = gen_small_mol_filter(SKIP_SMALL_MOLECULES)

        q = query.substitute(filter_DataSources=fds,
                             filter_SkipSmallMollecules=ssm,
                             filter_Chunks=fchunks)

        sparql = SPARQLWrapper(SPARQL_ENDPOINT)
        sparql.setQuery(q)
        sparql.setReturnFormat(JSON)
        results = sparql.query().convert()

        already_explored.extend(regulators)
        # print('already explored ' + str(already_explored))

        for result in results["results"]["bindings"]:
            source, reg_type, target = result["controllerName"]["value"], result["controlType"]["value"], \
                                       result["controlledName"]["value"]
            sif_network.append({"source": source, "relation": reg_type, "target": target})
            # print(source + ' --- ' + reg_type + ' --> ' + target)

            if source not in already_explored:
                if source not in to_be_explored:
                    to_be_explored.append(source)
                    explored_reg += 1
                    # print('Adding ' + source + ', in to_be_explored')
            # else:
            # print('skipping ' + source + ', already_explored')

        print()
        #print('Explored ' + str(explored_reg) + ' regulators')

    current_depth += 1
    upstream_regulation(to_be_explored, max_depth, data_sources, already_explored, sif_network, current_depth, explored_reg)

    return sif_network