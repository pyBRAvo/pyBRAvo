import time
import argparse
from argparse import RawTextHelpFormatter
import operator
import csv
import networkx as nx
from bravo.regulation import upstream_regulation
from bravo.signaling import upstream_signaling
import bravo.config as config
import bravo.util as util

data_sources = ['bind', 'biogrid', 'corum',
                'ctd', 'dip', 'drugbank', 'hprd', 'humancyc', 'inoh',
                'intact', 'kegg', 'mirtarbase', 'netpath', 'panther',
                'pid', 'psp', 'reactome', 'reconx', 'smpdb', 'wp',
                'intact_complex', 'msigdb']

parser = argparse.ArgumentParser(description="""
BRAvo upstream regulation network reconstruction. 
Here are some possible command lines :
    
    python pyBravo.py --regulation --input_genes JUN/FOS SCN5A -md 2 -co -su -sy
    python pyBravo.py --regulation --input_genes JUN/FOS SCN5A -md 2 -excl mirtarbase -co -su -sy
    python pyBravo.py --regulation --input_file myGenes.csv -md 2 -incl pid panther msigdb kegg -co -su -sy
    
Please report any issue to alban.gaignard@univ-nantes.fr. 
""", formatter_class=RawTextHelpFormatter)
parser.add_argument('-reg', '--regulation', action='store_true', required=False, help='to assemble a regulation network', dest='reg')
parser.add_argument('-sig', '--signaling', action='store_true', required=False, help='to assemble a signaling network', dest='sig')
parser.add_argument('-sigd', '--signaling-detailed', action='store_true', required=False, help='to assemble a signaling network with detailed reactions', dest='sigd')
parser.add_argument('-md', '--max_depth', type=int, required=False, help='the maximum exploration depth', dest='md')
parser.add_argument('-sy', '--extend_with_synonyms', action='store_true', required=False, help='if specified, explore also synonyms', dest='s')
parser.add_argument('-su', '--extend_with_rna_protein_suffixes', action='store_true', required=False, help='if specified, explore also names suffixed with " rna" or " protein"', dest='su')
parser.add_argument('-co', '--decompose_complexes', required=False, action='store_true', help='if specified, decompose protein complexes', dest='c')
parser.add_argument('-fa', '--fast', required=False, action='store_true', help='if specified, only explore biopax display names', dest='fast')
parser.add_argument('-i', '--input_genes', nargs='+', required=False, help='the input gene list', dest='i')
parser.add_argument('-f', '--input_file', required=False, help='the input file, one gene per line', dest='f')
parser.add_argument('-o', '--output_file', required=False, help='the output files path and prefix', dest='o', default='out')
parser.add_argument('-incl', '--include_sources', nargs='+', required=False, help='the data sources to include', dest='incl')
parser.add_argument('-excl', '--exclude_sources', nargs='+', required=False, help='the data sources to exclude', dest='excl')
parser.add_argument('-v', '--verbose', action='store_true', required=False, help='print debug information', dest='v')

def read_input_genes(filename):
    """

    :param filename:
    :return:
    """
    res = []
    with open(filename, newline='') as csvfile:
        reader = csv.reader(csvfile, delimiter=' ', quotechar='|')
        for row in reader:
            res.append(''.join(row))
    return res

def write_to_SIF(G, filename):
    """

    :param graph:
    :param filename:
    :return:
    """
    with open(filename, 'w', newline='') as csvfile:
        sif_writer = csv.writer(csvfile, delimiter='\t')
        for e in G.edges(data='attr'):
            try:
                sif_writer.writerow([e[0], e[2]['label'], e[1]])
            except TypeError:
                print('Error for '+str(e))

    print('SIF network written to ' + filename)

def write_provenance(G, filename):
    """

    :param graph:
    :param filename:
    :return:
    """
    with open(filename, 'w', newline='') as csvfile:
        provenance_writer = csv.writer(csvfile, delimiter=',')
        for e in G.edges(data='attr'):
            reac = str(e[0]) + '\t' + str(e[2]['label']) + '\t' + str(e[1])
            p = e[2]['provenance']
            if 'http://pathwaycommons.org/pc2/' in p:
                p = p.split('http://pathwaycommons.org/pc2/')[1]
            provenance_writer.writerow([reac, p])
    print('Basic regulation reaction provenance written to ' + filename)

def get_centrality_as_md(G):
    """

    :param graph:
    :return:
    """
    centrality = nx.degree_centrality(G)
    # centrality = nx.closeness_centrality(G)
    # centrality = nx.betweenness_centrality(G)
    sorted_centrality = reversed(sorted(centrality.items(), key=operator.itemgetter(1)))
    sorted_centrality = list(sorted_centrality)
    cpt = 0
    md = """
| Node | Degree Centrality |
|------|------|
"""
    for g in sorted_centrality:
        md += "| " + g[0] + " | " + str(round(g[1], 3)) + " | \n"
        cpt += 1
        if cpt > 9:
            break
    return(md)

def build_nx_digraph(reconstructed_network):
    """

    :param reconstructed_network:
    :return:
    """
    G = nx.DiGraph()
    for e in reconstructed_network:
        # print(e)
        # print(e['source'] + ' --- ' + e['relation'] + ' --> ' + e['target'] + ' | ' + e['provenance'])
        G.add_edge(e['source'], e['target'],
                   color='g' if (e['relation'] in 'ACTIVATION') else 'r',
                   attr={'label': e['relation'], 'provenance': e['provenance']})
    print('Number of nodes = ' + str(len(G.nodes())))
    print('Number of edges = ' + str(len(G.edges())))
    return G

def main():
# def main(args):
    # args = parser.parse_args(args)
    args = parser.parse_args()

    if (args.sig is None) and (args.reg is None):
        print('please specify one of -reg (--regulation) or -sig (--signaling) option')
        parser.print_help()
        exit(0)

    if (args.i is None) and (args.f is None):
        print('please fill the -i (--input_genes) or -f (--input_file) parameter')
        parser.print_help()
        exit(0)

    if args.i and args.f:
        print('--input_genes and --input_file parameters are mutually exclusive : please provide only one of them')
        parser.print_help()
        exit(0)

    if args.sigd:
        config.FINE_GRAINED_SIGNALING_SIF = True
    else:
        config.FINE_GRAINED_SIGNALING_SIF = False

    input_genes_parameter = []
    if args.i:
        input_genes_parameter = args.i

    if args.f:
        input_genes_parameter = read_input_genes(args.f)

    if args.incl and args.excl:
        print('--include_sources and --exclude_sources parameters are mutually exclusive : please provide only one of them')
        parser.print_help()
        exit(0)

    if args.md:
        config.MAX_DEPTH = args.md
    else:
        config.MAX_DEPTH = 1

    if args.excl:
        for ds in args.excl:
            data_sources.remove(ds)
        config.DATA_SOURCES = data_sources
    if args.incl:
        config.DATA_SOURCES = args.incl

    print("BRAvo will explore the following data sources:\n" + str(config.DATA_SOURCES))

    if args.s:
        config.EXTEND_WITH_SYNONYMS = True
    else:
        config.EXTEND_WITH_SYNONYMS = False

    if args.su:
        config.EXTEND_WITH_SUFFIXES = True
    else:
        config.EXTEND_WITH_SUFFIXES = False

    if args.c:
        config.DECOMPOSE_COMPLEXES = True
    else:
        config.DECOMPOSE_COMPLEXES = False

    if args.fast:
        config.FAST = True
    else:
        config.FAST = False

    if args.v:
        config.VERBOSE = True
    else:
        config.VERBOSE = False



    if args.reg:
        start_time = time.time()
        # reconstructed_network = bravo.upstream_regulation(["JUN/FOS", "SCN5A"], max_depth=1)
        # reconstructed_network = bravo.upstream_regulation(["JUN/FOS", "SCN5A"], max_depth=2, data_sources = data_sources)
        # reconstructed_network = bravo.upstream_regulation(args.i, args.md, data_sources=data_sources)
        reconstructed_network = upstream_regulation(input_genes_parameter)
        elapsed_time = round((time.time() - start_time), 2)

        print("--- Upstream regulation network in %s seconds ---" % elapsed_time)

        G = build_nx_digraph(reconstructed_network)
        write_to_SIF(G, args.o + '.sif')
        write_provenance(G, args.o + '-provenance.csv')
        md = get_centrality_as_md(G)
        print(md)

        start_time = time.time()
        G_prime = util.fast_reg_network_unification(G, util.index_syn)
        elapsed_time = round((time.time() - start_time), 2)
        print("--- Network simplification in %s seconds ---" % elapsed_time)
        write_to_SIF(G_prime, args.o + '-unified.sif')
        write_provenance(G_prime, args.o + '-unified-provenance.csv')
        print('Nodes after simplification = ' + str(len(G_prime.nodes())))
        print('Edges after simplification = ' + str(len(G_prime.edges())))

        md = get_centrality_as_md(G_prime)
        print(md)

    elif args.sig:
        start_time = time.time()
        reconstructed_network = upstream_signaling(input_genes_parameter)

        elapsed_time = round((time.time() - start_time), 2)

        print("--- Upstream regulation network in %s seconds ---" % elapsed_time)

        G = build_nx_digraph(reconstructed_network)
        write_to_SIF(G, args.o + '.sif')
        write_provenance(G, args.o + '-provenance.csv')
        md = get_centrality_as_md(G)
        print(md)

        start_time = time.time()
        G_prime = util.fast_reg_network_unification(G, util.index_syn)
        elapsed_time = round((time.time() - start_time), 2)
        print("--- Network simplification in %s seconds ---" % elapsed_time)
        write_to_SIF(G_prime, args.o + '-unified.sif')
        write_provenance(G_prime, args.o + '-unified-provenance.csv')
        print('Nodes after simplification = ' + str(len(G_prime.nodes())))
        print('Edges after simplification = ' + str(len(G_prime.edges())))

        md = get_centrality_as_md(G_prime)
        print(md)

if __name__ == "__main__":
    # args = ['--input_genes', 'HEY2', 'SCN5A', 'SCN3A', '-md', '1']
    # args = ['--input_genes', 'HEY2', 'SCN5A', '-md', '2']
    # args = ['--input_genes', 'HEY2', 'SCN5A', '-md', '2', '-co', '-sy', '-su']
    #         '-excl', 'mirtarbase', 'kegg']
    # args = ['-f', '../test-complex.csv', '-md', '1',
    #         '-incl', 'pid', 'panther', 'msigdb', 'kegg']
    # args = ['-f', '../test-complex.csv',
    #         '-incl', 'pid', 'panther', 'kegg']
    # args = ['-f', '../test-complex.csv', '-excl', 'mirtarbase']
    # args = ['--input_genes', 'JUN/FOS', 'SCN5A', '-md', '1',
    #        '-incl', 'pid', 'msigdb']
    # main(args = args)
    main()
