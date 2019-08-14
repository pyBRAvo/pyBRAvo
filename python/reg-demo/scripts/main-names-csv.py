# Based on script compute_coverage.py by Marie LEFEBVRE
# Replace all gene names by the main name in a CSV file (first column, skip header line)

import sys, os
import csv

"""
Usage:
> python3 main-names-csv.py <gene synonyms file> <CSV file>
Command example:
> python3 main-names-csv.py Homo_sapiens.gene_info my_file.csv
"""

fullpath = os.getcwd()

# index_syn = associates each synonym to a standard name
### index_std = associates each standard name to a list of synonyms
# list_clashes = list of synonyms associated to at least two different standard names

# Load the list of synonyms
def init_gene_synonyms_cache():
    index_syn = {}
#    index_std = {}
    clashes = set()
    
    gene_info_path = sys.argv[1]
    if not gene_info_path.startswith('/'):
        gene_info_path = fullpath + "/" + gene_info_path
    
    with open(gene_info_path, newline='') as csvfile:
        reader = csv.reader(csvfile, delimiter='\t')
        next(reader)   # Skip first line
        for row in reader:
            std = row[2]
            syn_list = row[4].split('|')
            # List of synonyms of std
#            index_std[std] = syn_list
            
            # std is a synonym for std
            if std in index_syn:
                if index_syn[std] != std:
                    clashes.add(std)
            else:
                index_syn[std] = std
            
            # All in syn_list are synonyms for std
            for syn in syn_list:
                if syn in index_syn:
                    if index_syn[syn] != std:
                        clashes.add(std)
                else:
                    index_syn[syn] = std
    return index_syn, clashes


index_syn, clashes = init_gene_synonyms_cache()

# Get main name from synonym
def get_main_name(syn, index_syn, clashes):
    res = syn
    if syn in index_syn:
        res = index_syn[syn]
    return res, syn in clashes

# csv file
if len(sys.argv) > 2:
    csv_file_name = sys.argv[2]
    if not csv_file_name.startswith('/'):
        csv_file_name = fullpath + "/" + csv_file_name
    csvfile = open(csv_file_name, newline = '')
else:
    csvfile = sys.stdin
clashesfound = []
reader = csv.reader(csvfile, delimiter = '\t')
row = next(reader)   # Skip first line
print('\t'.join(row))   # Print first line

for row in reader:
    newrow = row
    if len(row) > 0:
        newrow[0], isclashed = get_main_name(newrow[0], index_syn = index_syn, clashes = clashes)
        print('\t'.join(newrow))
        if isclashed:
            clashesfound.append(row[0])

csvfile.close()

if clashesfound != []:
    print('{} clash(es) when searching for synonyms: {}'.format(len(clashesfound), ' '.join(clashesfound)), file = sys.stderr)

