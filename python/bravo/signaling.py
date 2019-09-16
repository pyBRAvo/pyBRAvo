from SPARQLWrapper import SPARQLWrapper, JSON
from string import Template
from urllib import error
import time
import logging

import bravo.util as util
import bravo.config as config


tpl_select_signaling_query = """
PREFIX bp: <http://www.biopax.org/release/biopax-level3.owl#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> 

SELECT DISTINCT ?rightName ?leftName ?controlType ?controllerName ?reaction ?source WHERE {
    $filter_Chunks
    $filter_SkipSmallMollecules
    $filter_DataSources
    $filter_Unknown

    ?right bp:displayName ?rightName .
    ?right rdf:type ?rightType .

    ?reaction bp:right ?right ; 
        bp:dataSource/bp:displayName ?source .

    ?reaction bp:left ?left .
    ?left bp:displayName ?leftName .

    ?catalysis bp:controlled ?reaction .
    ?catalysis bp:controller ?controller .
    ?controller bp:displayName ?controllerName . 
    ?controller rdf:type ?controllerType .

    OPTIONAL {
        ?catalysis bp:controlType ?controlType .
    }
}
"""

### début Jérémie
def filterSmallMolecules(name):
    query="""
PREFIX bp: <http://www.biopax.org/release/biopax-level3.owl#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> 

select ?y where {
   ?x rdf:type <http://www.biopax.org/release/biopax-level3.owl#SmallMolecule>.
   ?x bp:displayName ?y.
   FILTER (?y = "$name"^^xsd:string).
   } limit 1""".replace("$name",name.replace('"', '').replace('\\\\', '\\'))
    sparql = SPARQLWrapper(config.SPARQL_ENDPOINT)
    sparql.setQuery(query)
    sparql.setReturnFormat(JSON)
    try:
        results = sparql.query().convert()
    except:
        time.sleep(3)
        results = sparql.query().convert()
    return len(results.get("results").get("bindings")) > 0
### fin Jérémie



# def upstream_regulation(to_be_explored, max_depth = 1, data_sources = [], already_explored = [], sif_network = [], current_depth = 0, explored_reg = 0):
def upstream_signaling(to_be_explored, already_explored = [], sif_network = [], current_depth = 0, explored_reg = 0):
    """
    """

    """"""
    """ 1st stopping criteria """
    """"""
    if len(to_be_explored) == 0:
        logging.info("Exploring done")
        return sif_network

    """"""
    """ 2nd stopping criteria """
    """"""
    if (config.HAS_MAX_DEPTH and (current_depth >= config.MAX_DEPTH)):
        logging.info("Exploring halted due to maximum depth")

        """"""
        """ Decomposing protein complexes """
        """"""
        if config.DECOMPOSE_COMPLEXES:
            new_to_be_explored = []
            for name in to_be_explored:
                ### Début Jérémie
                # different types of complexes
                if "Complex (" in name:
                    name = name.replace("Complex (", "").replace(")", "")
                lsplits = name.split('/')
                splits = []
                for s in lsplits:
                    splits = splits + s.split(':')  ## Jérémie,
                if len(splits) > 1:
                    logging.info(name + ' decomposed into ' + str(splits))
                    splits = [s.strip() for s in splits if not filterSmallMolecules(s.strip())]
                    logging.info(name + ' decomposed into ' + str(splits) + ' when removing small molecules')
                    if len(splits) == 0:
                        logging.info(name + ' is only composed by small molecules. It should be removed from the graph...')
                    ### Début Jérémie
                    new_to_be_explored.extend(splits)
                    for s in splits:
                        sif_network.append(
                            {"source": s, "relation": "PART_OF", "target": name, "provenance": "PathwayCommons"})

            for new in new_to_be_explored:
                if new not in to_be_explored:
                    to_be_explored.append(new)

        return sif_network




    """"""
    """ Decomposing protein complexes """
    """"""
    if config.DECOMPOSE_COMPLEXES:
        new_to_be_explored = []
        for name in to_be_explored:
            ### Début Jérémie
            # different types of complexes
            if "Complex (" in name:
                name=name.replace("Complex (","").replace(")","")
            lsplits = name.split('/')
            splits = []
            for s in lsplits:
                splits = splits + s.split(':')
            if len(splits) > 1 :
                logging.info(name + ' decomposed into ' + str(splits))
                splits = [s.strip() for s in splits if not filterSmallMolecules(s.strip())]
                logging.info(name + ' decomposed into ' + str(splits)+' when removing small molecules')
                if len(splits) == 0:
                    logging.info(name + ' is only composed by small molecules. It should be removed from the graph...')
                ### Début Jérémie
                new_to_be_explored.extend(splits)
                for s in splits:
                    sif_network.append({"source": s, "relation": "PART_OF", "target": name, "provenance": "PathwayCommons"})

        for new in new_to_be_explored:
            if new not in to_be_explored:
                to_be_explored.append(new)
        logging.info('to be explored after complex decomposition ' + str(to_be_explored))

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
           logging.info('new synonmys to be explored:' + str(new_to_be_explored))
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
    logging.info('exploration depth ' + str(current_depth))
    logging.info('to be explored ' + str(to_be_explored))
    for regulators in chunks:
        # print('exploring ' + str(regulators))
        query = Template(tpl_select_signaling_query)

        fds = util.gen_data_source_filter(config.DATA_SOURCES)
        fchunks = util.gen_chunks_values_constraint(regulators, '?rightName')
        ssm = util.gen_small_mol_filter(config.SKIP_SMALL_MOLECULES, networktype="signaling")
        funk = util.gen_unknown_filter(config.UNKNOWN)
        q = query.substitute(filter_DataSources=fds,
                             filter_SkipSmallMollecules=ssm,
                             filter_Chunks=fchunks,
                             filter_Unknown = funk)


        logging.debug("======= PathwayCommons v11 query =======")
        logging.debug(q)

        sparql = SPARQLWrapper(config.SPARQL_ENDPOINT)
        sparql.setQuery(q)
        sparql.setReturnFormat(JSON)

        try: 
            results = sparql.query().convert()
            already_explored.extend(regulators)
        except:
            ## TO BE REVISED
            ## Too much queries in a short time
            time.sleep(2)
            try:
                results = sparql.query().convert()
                already_explored.extend(regulators)
            except:
                # Query too long
                # Short the chunks to 1
                minichunks = util.gen_chunks(regulators, 1)
                results = {}
                results["results"] = {}
                results["results"]["bindings"] = []
                for minireg in minichunks:
                    minifchunks = util.gen_chunks_values_constraint(minireg, '?rightName')
                    q = query.substitute(filter_DataSources=fds,
                                 filter_SkipSmallMollecules=ssm,
                                 filter_Chunks=minifchunks,
                                 filter_Unknown = funk)

                    logging.debug("======= PathwayCommons v9 query =======")
                    logging.debug(q)

                    sparql = SPARQLWrapper(config.SPARQL_ENDPOINT)
                    sparql.setQuery(q)
                    sparql.setReturnFormat(JSON)
                    miniresults = sparql.query().convert()
                    for res in miniresults["results"]["bindings"]:
                        if not res:
                            pass
                        else:
                            results["results"]["bindings"].append(res)
                    already_explored.extend(minireg)

        
        # print('already explored ' + str(already_explored))

        # ?rightName ?controlType ?controllerName ?reaction ?reaction_type ?source
        for result in results["results"]["bindings"]:
            if "controlType" in result.keys():
                ctl, sign_type, reac, left, right, provenance = result["controllerName"]["value"], \
                                                    result["controlType"]["value"], \
                                                    result["reaction"]["value"], \
                                                    result["leftName"]["value"], \
                                                    result["rightName"]["value"], \
                                                    result["source"]["value"]
                if config.FINE_GRAINED_SIGNALING_SIF == True:
                    ctl = util.removeSuffixForUnification(ctl)
                    left = util.removeSuffixForUnification(left)
                    right = util.removeSuffixForUnification(right)
                    sif_network.append({"source": ctl, "relation": sign_type, "target": reac, "provenance": provenance})
                    #sif_network.append({"source": reac, "relation": "HAS_LEFT", "target": left, "provenance": provenance})
                    sif_network.append({"source": left, "relation": "IS_LEFT_OF", "target": reac, "provenance": provenance})
                    sif_network.append({"source": reac, "relation": "HAS_RIGHT", "target": right, "provenance": provenance})
                else:
                    ctl = util.removeSuffixForUnification(ctl)
                    right = util.removeSuffixForUnification(right)
                    sif_network.append({"source": ctl, "relation": sign_type, "target": right, "provenance": provenance})
            else:
                ctl, reac, left, right, provenance = result["controllerName"]["value"], \
                                         result["reaction"]["value"], \
                                         result["leftName"]["value"], \
                                         result["rightName"]["value"], \
                                         result["source"]["value"]
                if config.FINE_GRAINED_SIGNALING_SIF == True:
                    ctl = util.removeSuffixForUnification(ctl)
                    left = util.removeSuffixForUnification(left)
                    right = util.removeSuffixForUnification(right)
                    sif_network.append({"source": ctl, "relation": "CATALYSIS", "target": reac, "provenance": provenance})
                    #sif_network.append({"source": reac, "relation": "HAS_LEFT", "target": left, "provenance": provenance})
                    sif_network.append({"source": left, "relation": "IS_LEFT_OF", "target": reac, "provenance": provenance})
                    sif_network.append({"source": reac, "relation": "HAS_RIGHT", "target": right, "provenance": provenance})
                else:
                    ctl = util.removeSuffixForUnification(ctl)
                    right = util.removeSuffixForUnification(right)
                    sif_network.append({"source": ctl, "relation": "CATALYSIS", "target": right, "provenance": provenance})

            if ctl not in already_explored:
                if ctl not in to_be_explored:
                    to_be_explored.append(ctl)
                    explored_reg += 1
                    # print('Adding ' + source + ', in to_be_explored')
            # else:
            # print('skipping ' + source + ', already_explored')

        print('Explored ' + str(explored_reg) + ' regulators')

    current_depth += 1
    upstream_signaling(to_be_explored, already_explored, sif_network, current_depth, explored_reg)

    return sif_network