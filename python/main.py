import time
import argparse
import csv
import networkx as nx
import bravo.regulation as bravo

parser = argparse.ArgumentParser(description="""
    BRAvo upstream regulation network reconstruction. 

    Sample Usage :

    """)
parser.add_argument('-md', '--max_depth', metavar='max_depth', type=int, help='the maximum exploration depth',
                    dest='md', required=False)
parser.add_argument('-i', '--input_genes', nargs='+', required=True, help='the input gene list', dest='i')

# parser = argparse.ArgumentParser(description="""
# JSON import tool for the NeuBIAS Bise.eu registry.
#
# Sample Usage :
#     python biseEU_importer.py -u <USERNAME> -p <PASSWORD> -td http://dev-bise2.pantheonsite.io -px http://cache.ha.univ-nantes.fr:3128 -d ../data/small_set/
#     python biseEU_importer.py -u <USERNAME> -p <PASSWORD> -td http://dev-bise2.pantheonsite.io -px http://cache.ha.univ-nantes.fr:3128 -i ../data/small_set/node3.json
#                                  """)
# parser.add_argument('-px', '--proxy', metavar='proxy', type=str, help='your proxy URL, including the proxy port',
#                     dest='px', required=False)
# parser.add_argument('-td', '--target_drupal_url', metavar='target_drupal_url', type=str, help='the target drupal url',
#                     dest='td', required=True)
# parser.add_argument('-u', '--username', metavar='username', type=str, help='username', dest='u', required=True)
# parser.add_argument('-p', '--password', metavar='password', type=str, help='password', dest='p', required=True)
# parser.add_argument('-i', '--input_file', metavar='input_directory', type=str, help='the JSON file to be imported',
#                     dest='i',
#                     required=False)
# parser.add_argument('-d', '--input_directory', metavar='input_directory', type=str,
#                     help='the JSON file directory to be imported', dest='d', required=False)

def main(args = []):
    args = parser.parse_args(args)
    if args.md is None:
        print('please fill the -md or --max_depth parameter')
        parser.print_help()
        exit(0)

    if args.i is None:
        print('please fill the -i or --input_genes parameter')
        parser.print_help()
        exit(0)

    data_sources = ['bind', 'biogrid', 'corum',
                               'ctd', 'dip', 'drugbank', 'hprd', 'humancyc', 'inoh',
                               'intact', 'kegg', 'mirtarbase', 'netpath', 'panther',
                               'pid', 'psp', 'reactome', 'reconx', 'smpdb', 'wp',
                               'intact_complex', 'msigdb']
    exclude_data_source = ['mirtarbase']

    for ds in exclude_data_source:
        data_sources.remove(ds)

    print(data_sources)

    start_time = time.time()
    # reconstructed_network = bravo.upstream_regulation(["JUN/FOS", "SCN5A"], max_depth=1)
    # reconstructed_network = bravo.upstream_regulation(["JUN/FOS", "SCN5A"], max_depth=2, data_sources = data_sources)
    reconstructed_network = bravo.upstream_regulation(args.i, args.md, data_sources=data_sources)
    elapsed_time = round((time.time() - start_time), 2)

    print("--- Upstream regulation network in %s seconds ---" % elapsed_time)

    G = nx.DiGraph()
    for e in reconstructed_network:
        #    print(e['source'] + ' --- ' + e['regulation'] + ' --> ' + e['target'])
        G.add_edge(e['source'], e['target'],
                   color='g' if (e['regulation'] in 'ACTIVATION') else 'r',
                   label=e['regulation'])

    print('Number of nodes = ' + str(len(G.nodes())))
    print('Number of edges = ' + str(len(G.edges())))

    filename = "out.sif"
    with open(filename, 'w', newline='') as csvfile:
        sif_writer = csv.writer(csvfile, delimiter='\t')
        for e in G.edges(data='label'):
            sif_writer.writerow([e[0], e[2], e[1]])
    print('SIF network written to ' + filename)


if __name__ == "__main__":
    args = ['--input_genes', 'JUN/FOS', 'SCN5A', '-md', '1']
    # args = []
    main(args = args)
