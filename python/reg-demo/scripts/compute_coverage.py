# Marie LEFEBVRE

import sys, os
import csv

"""
Command example:
> python3 compute_coverage.py md10-pyBravo_sign_syn_decomplex.sif input-910.csv
"""

fullpath = os.getcwd()

# Load the list of synonyms
# index_syn = associates each synonym to a standard name
# index_std = associates each standard name to a list of synonyms
def init_gene_synonyms_cache():
    """

    :return:
    """
    index_syn = {}
    index_std = {}
    
    if len(sys.argv) > 3:
        gene_info_path = sys.argv[3]
    else:
        gene_info_path = fullpath + '/Homo_sapiens.gene_info'
    
    with open(gene_info_path, newline='') as csvfile:
        reader = csv.reader(csvfile, delimiter='\t')
        next(reader)   # Skip first line
        for row in reader:
            index_std[row[2]] = row[4].split('|')

            index_syn[row[2]] = row[2]
            for syn in row[4].split('|'):
                index_syn[syn] = row[2]
    return index_std, index_syn


index_std, index_syn = init_gene_synonyms_cache()

# Return all synonyms of a given standard name n
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

# Load the SIF file
def get_nodes(path):
    """

    :param path: path to sif file
    :return:
    """
    nodes = []
    with open(path, newline='\n') as file:
        # iterate over line
        for line in file:
            # split line to obtain column
            split_line = line.strip().split("\t")
#            print(split_line)
            if len(split_line) > 0:
                left = split_line[0]
                # test existence
                if left not in nodes:
                    # do not keep PC link
                    if left.startswith( 'http' ):
                        pass
                    else:
                        nodes.append(left)
            if len(split_line) > 2:
                right = split_line[2]
                if right not in nodes:
                    if right.startswith( 'http' ):
                        pass
                    else:
                        nodes.append(right)
    return nodes

# Load the initial list of genes
def get_ref(path):
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

# sif file
bravo_file = fullpath + "/" + sys.argv[1]
to_be_explored = get_nodes(bravo_file)
# csv file
ref_file = fullpath + "/" + sys.argv[2]
ref = get_ref(ref_file)

# Extended list of gene names to explore (includes synonyms)
new_to_be_explored = []

# Gather all synonyms from the SIF file
for name in to_be_explored:
    synonyms = fast_get_synonyms(name, index_std=index_std, index_syn=index_syn)
    for s in synonyms:
        if s not in "-":
            new_to_be_explored.append(s)

# Add to the list to be explored
#if len(new_to_be_explored) > 0:
#    print('new synonmys are explored')
for new in new_to_be_explored:
    if new not in to_be_explored:
            to_be_explored.append(new)

# Count genes present
count = 0
for node in ref:
    if node in to_be_explored:
        count = count + 1
print(str(count) + " genes are present over " + str(len(ref)))

