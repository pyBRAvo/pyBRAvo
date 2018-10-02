import sys, os

import networkx as nx
import matplotlib.pyplot as plt
#from nxpd import draw

import requests
import json
import io
import time
import csv

import bravo.config as config
from IPython.display import display, Markdown, Latex
from rdflib import Graph, RDF, RDFS, Namespace

fullpath = os.path.abspath(os.path.dirname(sys.argv[0])) + '/'

def init_gene_synonyms_cache():
    """

    :return:
    """
    index_syn = {}
    index_std = {}
    with open(fullpath + 'Homo_sapiens.gene_info', newline='') as csvfile:
        reader = csv.reader(csvfile, delimiter='\t')
        next(reader)   # Skip first line
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
        reader = csv.reader(csvfile, delimiter='\t')
        next(reader)   # Skip first line
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
        if ((cpt % config.CHUNKS_SIZE) == 0):
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

def gen_chunks_values_constraint(chunks, variable_name):
    """
    Generation of a SPARQL VALUES clause to restrict gene/protein/etc. names
    Produces something like
        VALUES ?controlledName {"hsa-miR-6079"^^xsd:string "hsa-miR-4452"^^xsd:string "hsa-miR-6512-5p"^^xsd:string "RBPJ"^^xsd:string "NICD"^^xsd:string}
    """
    filter_clause = ''
    if len(chunks) > 0 :
        filter_clause = 'VALUES ' + variable_name + '{ \n'
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
