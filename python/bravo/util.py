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

#fullpath = os.path.abspath(os.path.dirname(sys.argv[0])) + '/'
fullpath = os.getcwd()

def init_gene_synonyms_cache():
    """

    :return:
    """
    index_syn = {}
    index_std = {}
    with open(fullpath + '/Homo_sapiens.gene_info', newline='') as csvfile:
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
    expansion_suffixes = [' mRna', ' protein', ' mRNA', ' mutant form', ' complex', ' modified form', ' protein complex', ' gene', ' tetramer']
    expansion_prefixes = ['expression of ']
    new_names = []
    for gene in toBeExplored:
        for suf in expansion_suffixes:
            new_names.append(str(gene+suf))
            if suf in [' mRna', ' mRNA']:
                for pre in expansion_prefixes:
                    new_names.append(str(pre+gene+suf))
    return (toBeExplored+new_names)

def removeSuffixForUnification(name):
    """

    :param name:
    :return:
    """
    remove_suffixes = [' mRna', ' protein', ' mRNA', ' mutant form', ' complex', ' modified form', ' protein complex', 'expression of ', ' gene', ' tetramer']
    for suf in remove_suffixes:
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
    generates a SPARQL Filter clause aimed at
    limiting the possible values of a ?source variable
    """
    filter_clause = ''
    if len(data_sources) > 0 :
        filter_clause = 'FILTER ( \n'
        for ds in data_sources :
            filter_clause += '    (str(lcase(?source)) = "' + ds.lower() + '" ) || \n'
        k = filter_clause.rfind("|| ")
        filter_clause = filter_clause[:k]
        filter_clause += '\n) .'
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


def gen_small_mol_filter(skip_small_molecules = True, networktype="regulation"):
    """
    Generation of a SPARQL Filter clause to exclude small molecules
    Produces something like
        FILTER( str(?controllerType) != "http://www.biopax.org/release/biopax-level3.owl#SmallMolecule")
    """
    if skip_small_molecules:
        if networktype=="regulation":
            return 'FILTER( str(?controllerType) != "http://www.biopax.org/release/biopax-level3.owl#SmallMolecule" and str(?controlledType) != "http://www.biopax.org/release/biopax-level3.owl#SmallMolecule")  .'
        else:
            return 'FILTER( str(?controllerType) != "http://www.biopax.org/release/biopax-level3.owl#SmallMolecule" and str(?rightType) != "http://www.biopax.org/release/biopax-level3.owl#SmallMolecule")  .'

    else:
        return ''

def gen_unknown_filter(skip_unknown = False):
    """
    Generation of a SPARQL Filter clause to exclude unknown edge type
    Produces something like 
        FILTER( ?controlType = "ACTIVATION"^^xsd:string || ?controlType = "INHIBITION"^^xsd:string)
    """
    if skip_unknown == True:
        return 'FILTER( ?controlType = "ACTIVATION"^^xsd:string || ?controlType = "INHIBITION"^^xsd:string)'
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

def get_sif_nodes(path):
    """

    :param path: path to sif file
    :return:
    """
    nodes = []
    with open(path, newline='\n') as file:
        # iterate over line
        for line in file:
            # split line to obtain column
            left = removeSuffixForUnification(line.replace("\r\n", "").split("\t")[0])
            # test existence
            if left not in nodes:
                # do not keep PC link
                if left.startswith( 'http' ):
                    pass
                else:
                    nodes.append(left)
            right = removeSuffixForUnification(line.replace("\r\n", "").split("\t")[2])
            if right not in nodes:
                if right.startswith( 'http' ):
                    pass
                else:
                    nodes.append(right)
    return nodes

def get_refs(path):
    """

    :param path: list of input genes
    :return: array of string
    """
    nodes = []
    with open(path, newline='\n') as file:
        # iterate over line
        for line in file:
            # remove \n
            node = line.replace("\n", "")
            if node not in nodes:
                nodes.append(node)
    return(nodes)

def compute_coverage(ref_file, node_file):
    # sif file from BRAvo
    bravo_path = fullpath + "/" + node_file
    to_be_explored = get_sif_nodes(bravo_path)
    # csv file
    ref_path = fullpath + "/" + ref_file
    ref = get_refs(ref_path)
    new_to_be_explored = []
    for name in to_be_explored:
        synonyms = fast_get_synonyms(name, index_std=index_std, index_syn=index_syn)
        for s in synonyms:
            if s not in "-":
                new_to_be_explored.append(s)
    if len(new_to_be_explored) > 0:
        print('new synonmys are explored')
    for new in new_to_be_explored:
        if new not in to_be_explored:
                to_be_explored.append(new)
    count = 0
    for node in ref:
        if node in to_be_explored:
            count = count + 1
    print(str(count) + " genes are present over " + str(len(ref)))