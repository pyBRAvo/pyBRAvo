from typing import List, Any

from IPython.display import display, Markdown, Latex
from rdflib import Graph, RDF, RDFS, Namespace
from SPARQLWrapper import SPARQLWrapper, JSON
from string import Template

import sys, os
fullpath = os.path.abspath(os.path.dirname(sys.argv[0])) + '/'

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
CHUNKS_SIZE = 50  # type: int
MAX_DEPTH = 2 # type: int
SKIP_SMALL_MOLECULES = True # type: Bool
#DATA_SOURCES = ['pid', 'humancyc', 'panther', 'msigdb']
DATA_SOURCES = []  # type: List[str]

DECOMPOSE_COMPLEXES = False
EXTEND_WITH_SYNONYMS = False
EXTEND_WITH_SUFFIXES = False
VERBOSE = False

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


def init_gene_synonyms_cache():
    """

    :return:
    """
    index_syn = {}
    index_std = {}
    with open(fullpath + 'Homo_sapiens.gene_info', newline='') as csvfile:
        reader = csv.reader(csvfile, delimiter='\t', quotechar='|')
        for row in reader:
            index_std[row[2]] = row[4].split('|')

            index_syn[row[2]] = row[2]
            for syn in row[4].split('|'):
                index_syn[syn] = row[2]
    return index_std, index_syn

#print('--- Memory foot print cache ---')
index_std, index_syn = init_gene_synonyms_cache()
#print('index_syn size : ' + str(len(index_syn.keys()) * 2))
#s = 0
#for key, value in index_std.items():
#    s += 1 + len(value)
#print('index_std size : ' + str(s))


tpl_select_reg_query = """
PREFIX bp: <http://www.biopax.org/release/biopax-level3.owl#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> 

SELECT DISTINCT ?controllerName ?controlType ?controlledName ?source WHERE {
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

def fast_get_std_name(n, index_syn):
    """

    :param n:
    :param index_syn:
    :return:
    """
    return index_syn[n]

def fast_get_synonyms(n, index_std, index_syn):
    """

    :param n:
    :param index_std:
    :param index_syn:
    :return:
    """
    try:
        std = index_syn[n]
    except:
        std = None
    try:
        synonyms = index_std[std]
    except:
        synonyms = []

    all_names = []
    if std != None:
        all_names = [std] + synonyms
    else:
        all_names = synonyms
    if n in all_names:
        all_names.remove(n)
    return all_names

def fast_are_synonyms(n, m, index_syn):
    """

    :param n:
    :param m:
    :param index_syn:
    :return:
    """
    try:
        index_syn[n]
    except:
        return False
    try:
        index_syn[m]
    except:
        return False
    return (index_syn[n] == index_syn[m])


def expandGeneNames(toBeExplored):
    """

    :param toBeExplored:
    :return:
    """
    expansion_suffixes = [' mRna', ' protein']
    new_names = []
    for gene in toBeExplored:
        for suf in expansion_suffixes:
            new_names.append(str(gene+suf))
    return (toBeExplored+new_names)

def removeSuffixForUnification(name):
    """

    :param name:
    :return:
    """
    expansion_suffixes = [' mRna', ' protein', ' mRNA', ' mutant form', ' complex', ' modified form']
    for suf in expansion_suffixes:
        if suf in name:
            print('\t\tremoving suffix '+str(suf)+' for '+str(name))
            name = name.replace(suf, '')
            print('\t\t\t\t --> ' + str(name))
    return name


def get_gene_alias(gene_name):
    """
    """
    res = []
    with open(fullpath + 'Homo_sapiens.gene_info', newline='') as csvfile:
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

def gen_chunks_values_constraint(chunks):
    """
    Generation of a SPARQL VALUES clause to restrict gene/protein/etc. names
    Produces something like
        VALUES ?controlledName {"hsa-miR-6079"^^xsd:string "hsa-miR-4452"^^xsd:string "hsa-miR-6512-5p"^^xsd:string "RBPJ"^^xsd:string "NICD"^^xsd:string}
    """
    filter_clause = ''
    if len(chunks) > 0 :
        filter_clause = 'VALUES ?controlledName { \n'
        for g in chunks :
            filter_clause += '"' + g + '"^^xsd:string '
        k = filter_clause.rfind(" ")
        filter_clause = filter_clause[:k]
        filter_clause += ' } .'
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

def fast_reg_network_unification(graph, index_syn):
    H = graph.copy()
    cpt = 0
    nodes_size = len(H.nodes())
    for n in H.nodes():
        #print('for each ' + str(n))
        for m in H.nodes():
            if n not in m:
                #print('\tfor each ' + str(m))
                if (fast_are_synonyms(n,m, index_syn=index_syn)):
                    key = index_syn[n]
                    if n not in key:
                        #print('\t\t' + str(n) + ' is synonym with ' + str(m))
                        print('\t\t' + 'merging node ' + str(n) + ' into node ' + str(key))
                        try:
                            H = nx.contracted_nodes(H, key, n)
                        except:
                            continue
                    if m not in key:
                        print('\t\t' + 'merging node ' + str(m) + ' into node ' + str(key))
                        try:
                            H = nx.contracted_nodes(H, key, m)
                        except:
                            continue
    return H


def upstream_regulation(to_be_explored, max_depth = 1, data_sources = [], already_explored = [], sif_network = [], current_depth = 0, explored_reg = 0):
    """
    Recursive exploration with two stopping criteria:
        - nothing new to explore
        - the maximum exploration depth is reached
    """

    if max_depth is None:
        global HAS_MAX_DEPTH
        HAS_MAX_DEPTH = False

    MAX_DEPTH = max_depth
    DATA_SOURCES = data_sources

    """ 1st stopping criteria """
    if len(to_be_explored) == 0:
        print("Exploring done")
        return sif_network

    """ 2nd stopping criteria """
    if (HAS_MAX_DEPTH and (current_depth >= MAX_DEPTH)):
        print("Exploring halted due to maximum depth")
        return sif_network

    print()
    print('exploration depth ' + str(current_depth))
    print('to be explored ' + str(to_be_explored))
    print()

    """"""
    """ Decomposing protein complexes """
    """"""
    if DECOMPOSE_COMPLEXES:
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
    if EXTEND_WITH_SYNONYMS:
        new_to_be_explored = []
        for name in to_be_explored:
            synonyms = fast_get_synonyms(name, index_std=index_std, index_syn=index_syn)
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
    if EXTEND_WITH_SUFFIXES:
        new_to_be_explored = expandGeneNames(to_be_explored)
        for new in new_to_be_explored:
            if new not in to_be_explored:
                    to_be_explored.append(new)

    """"""
    """ Grouping genes into chunks to be processed remotely by block """
    """"""
    chunks = gen_chunks(to_be_explored)
    to_be_explored = []

    """"""
    """ Network reconstruction """
    """"""
    for regulators in chunks :
        print('exploring ' + str(regulators))
        query = Template(tpl_select_reg_query)

        fds = gen_data_source_filter(DATA_SOURCES)
        fchunks = gen_chunks_values_constraint(regulators)
        ssm = gen_small_mol_filter(SKIP_SMALL_MOLECULES)

        q = query.substitute(filter_DataSources = fds,
                    filter_SkipSmallMollecules = ssm,
                    filter_Chunks = fchunks)

        if VERBOSE:
            print("======= PathwayCommons v9 query =======")
            print(q)
            print("=====================")

        sparql = SPARQLWrapper(SPARQL_ENDPOINT)
        sparql.setQuery(q)
        sparql.setReturnFormat(JSON)
        results = sparql.query().convert()

        already_explored.extend(regulators)
        #print('already explored ' + str(already_explored))

        for result in results["results"]["bindings"]:

            source, reg_type, target, provenance = result["controllerName"]["value"], result["controlType"]["value"], \
                                                   result["controlledName"]["value"], result["source"]["value"]

            source = removeSuffixForUnification(source)
            target = removeSuffixForUnification(target)

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
    upstream_regulation(to_be_explored, max_depth = max_depth, data_sources = data_sources, already_explored = already_explored, sif_network = sif_network, current_depth = current_depth, explored_reg = explored_reg)

    return sif_network
