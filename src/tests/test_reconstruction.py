import unittest
import logging, sys
import bravo.util as util
import bravo.config as config
import bravo.regulation as regulation
import pyBravo as bravo_main
import time
import bravo.signaling as signaling

#logging.basicConfig(level=logging.ERROR, format='%(asctime)s - %(levelname)s: %(message)s', stream=sys.stdout)



config.MAX_DEPTH = 2
config.HAS_MAX_DEPTH = True
config.FAST = True
config.DECOMPOSE_COMPLEXES = True
config.EXTEND_WITH_SYNONYMS = True
config.EXTEND_WITH_SUFFIXES = True
config.UNKNOWN = True
config.VERBOSE = False

""" all possible data sources """
ds = ['bind', 'biogrid', 'corum',
                'ctd', 'dip', 'drugbank', 'hprd', 'humancyc', 'inoh',
                'intact', 'kegg', 'mirtarbase', 'netpath', 'panther',
                'pid', 'psp', 'reactome', 'reconx', 'smpdb', 'wp',
                'intact_complex', 'msigdb']

""" removing mirtarbase """
config.DATA_SOURCES = set(ds) - set(['mirtarbase'])

""" specifiyng inputs """
gene_list = ['SCN3A', 'SCN5A', 'HEY2']


class TestNetworkReconstruction(unittest.TestCase):

    logging.disable(logging.NOTSET)

    def test_regulation_network(self):
        start_time = time.time()
        reconstructed_network = regulation.upstream_regulation(gene_list,
                                                               already_explored=[],
                                                               sif_network=[],
                                                               current_depth=0,
                                                               explored_reg=0)
        elapsed_time = round((time.time() - start_time), 2)
        print("--- Upstream regulation network in %s seconds ---" % elapsed_time)

        G = bravo_main.build_nx_digraph(reconstructed_network)
        G_unified = util.fast_reg_network_unification(G, util.index_syn)
        print('Nodes after synonym-based unification = ' + str(len(G_unified.nodes())))
        print('Edges after synonym-based unification = ' + str(len(G_unified.edges())))

        self.assertEqual(10,len(G_unified.nodes()))
        self.assertEqual(10, len(G_unified.edges()))
        self.assertLessEqual(elapsed_time, 20)

        md = bravo_main.get_centrality_as_md(G_unified)
        print(md)

if __name__ == '__main__':
    unittest.main()