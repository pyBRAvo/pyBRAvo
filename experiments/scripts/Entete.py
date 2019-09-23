
# coding: utf-8

# # Entete

# In[1]:

from __future__ import print_function

def is_interactive():
    import __main__ as main
    return not hasattr(main, '__file__')

Param_SBMLfile = "../data/iLiverCancer1715.xml"
Param_Pourcentage = 1.1
Param_RNASeqFilename = "../data/LiverCancerTCGA_male.csv"
Param_MaxIndegreeInRRG = 18
Param_Drug = "Sorafenib (USAN/INN)"
Param_NumberOfSample = 100
debugon = True
Param_DoReconstruction = True
WithRef=False
BIF_file = ""
must_save_bif = True

if not is_interactive():
    import sys,getopt

    optlist, args = getopt.getopt(sys.argv[1:], 'i:p:r:m:d:s:vRwP:Q:b:', ["input", "percentage","rna","maxdegree","drug","samples","verbose","with-reconstruction","with-ref","probas","probasref","bif"])

    for o,v in optlist:
        if  o in ("-i","--input"):
            Param_SBMLfile = v
    
        if o in ("-r","--rna"):
            Param_RNASeqFilename = v
    
        if o in ("-p","--percentage"):
            Param_Pourcentage = float(v)
    
        if o in ("-m","--maxdegree"):
            Param_MaxIndegreeInRRG = int(v)
    
        if o in ("-d","--drug"):
            Param_Drug = v
        
        if o in ("-s","--samples"):
            Param_NumberOfSample = int(v)
    
        if o in ("-v","--verbose"):
            debugon = True
            
        if o in ("-R","--with-reconstruction"):
            Param_DoReconstruction = True

        if o in ("-w","--with-ref"):
            WithRef = True

        if  o in ("-P","--probas"):
            Param_ProbaReactionsFilename = v
            
        if  o in ("-Q","--probasref"):
            Param_ProbaReactionsREFFilename = v

        if o in ("-b","--bif"):
            BIF_file = v

# internal variables
#import shutils
#shutils.copy(Param_SBMLfile,"../tmp")
import os

Param_SBMLfileBN = "../tmp/"+os.path.basename(Param_SBMLfile)
if BIF_file=="":
    BIF_file = Param_SBMLfileBN.replace(".xml",".bif")



PC_Endpoint = "http://rdf.pathwaycommons.org/sparql"
RXN_EC_file = Param_SBMLfileBN.replace(".xml",".rxn")
BIF_file = Param_SBMLfileBN.replace(".xml",".bif")
Param_RRGFilename = Param_SBMLfileBN.replace(".xml",".rrg")
Param_ProbaReactionsFilename = Param_SBMLfileBN.replace(".xml",".prob")
#whichsolver = "gurobi"
whichsolver = "cglpk"


filenameCorrespondanceEnsemblGenenames = "../tables/Correspondance_Ensembl_genename.txt"
filenameCorrespondanceEnsemblEnzymes = "../tables/Correspondance_Enzymes_genenames.txt"
filenameCorrespondanceEnsemblTransporters = "../tables/Correspondance_Transporters_genenames.txt"
filenameKEGGDrugsGenes = "../tables/Public_KEGGDRUG_Targets.csv"
filenameCorrespondanceEnsemblMeanLength = "../tables/Correspondance_Ensembl_MeanTranscriptSize.txt"
filenameCorrespondanceHMREnsembl = "../tables/Correspondance_HMR_Ensembl.csv"
Param_ProbaReactionsREFFilename = Param_SBMLfileBN.replace(".xml",".prob_ref")
Param_TargetFilename = Param_SBMLfileBN.replace(".xml",".target")


# internal function can be edited
def Binarized(x,m,s,gene="null"):
    x=log(0.0001+x)
    InfBoundCoeff=0 #0.46 #0.46
    SupBoundCoeff=10000000 # 0.46
    if (x<m-InfBoundCoeff*s):
        return 0
    if (x>m+SupBoundCoeff*s):
        return 1
    return 1


def Binarized1(x,m,s,gene="null"):
    InfBoundCoeff=0.1
    m=AllGeneMeans.get(gene)
    if (m):
        if (m !=0):
            if (x/m<InfBoundCoeff):
                return 0
            else:
                return 1
    return 0

def Binarized3(x,m,s,gene="null"):
    InfBoundCoeff=1
#    m=AllGeneMeans.get(gene)
    m=1
    if (m):
        if (m !=0):
            if (x/m<InfBoundCoeff):
                return 0
            else:
                return 1
    return 0


# Tous les includes

# In[2]:

import optlang # NB : due to a bug in cobrapy, optlang must be imported before cobra
import cobra
from cobra.flux_analysis import flux_variability_analysis

from timeit import default_timer as timer
import csv
from SPARQLWrapper import SPARQLWrapper, JSON
import networkx as nx
from math import log
import numpy as np
import pandas as pd

from pgmpy.models import BayesianModel
from pgmpy.estimators import MaximumLikelihoodEstimator, BayesianEstimator
from pgmpy.factors.discrete import State
from pgmpy.sampling import BayesianModelSampling
from pgmpy.readwrite import BIFReader, BIFWriter


#from optlang import Model,Variable,Constraint,Objective

import sys




# a few definition to print on stderr
def eprint(*args, **kwargs):
    if debugon:
        print(*args, file=sys.stderr, **kwargs)

