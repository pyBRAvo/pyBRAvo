
# coding: utf-8

# # Un scénario complet

# Quelques informations et paramètres pour commencer 

# In[3]:

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

# In[4]:

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

# from pgmpy.models import BayesianModel
# from pgmpy.estimators import MaximumLikelihoodEstimator, BayesianEstimator
# from pgmpy.factors.discrete import State
# from pgmpy.sampling import BayesianModelSampling
# from pgmpy.readwrite import BIFReader, BIFWriter


#from optlang import Model,Variable,Constraint,Objective

import sys




# a few definition to print on stderr
def eprint(*args, **kwargs):
    if debugon:
        print(*args, file=sys.stderr, **kwargs)


# In[5]:




# Chargement des listes de correspondances

# In[13]:

eprint("Importing all the correspondance tables")
# Tables 1 et 2: correspondance Ensembl <-> GeneNames (à refaire en SPARQL ?)

filename = filenameCorrespondanceEnsemblGenenames

EnsemblToGeneNames = dict()
GeneNamesToEnsembl = dict()

EnsemblToGeneNamesList = dict()
GeneNamesToEnsemblList = dict()


fd = open(filename,"r")

lines = fd.readlines()
for l in lines:
    t=l.split(";")
    t[2]=t[2].replace("\n","")
    EnsemblToGeneNames[t[0]]=t[2]
    GeneNamesToEnsembl[t[2]]=t[0]
    if (not EnsemblToGeneNamesList.get(t[0])):
        EnsemblToGeneNamesList[t[0]]=list()
    if (not GeneNamesToEnsemblList.get(t[2])):
        GeneNamesToEnsemblList[t[2]]=list()
    EnsemblToGeneNamesList[t[0]].append(t[2])
    GeneNamesToEnsemblList[t[2]].append(t[0])
    
fd.close()

# Missing genename associations
GeneNamesToEnsembl["TGIF"]=GeneNamesToEnsembl["TGIF1"]
GeneNamesToEnsembl["CART1"]=GeneNamesToEnsembl["ALX1"]
EnsemblToGeneNames["ENSG00000122718"]="OR2S2"
EnsemblToGeneNames["ENSG00000155640"] = "C10orf12"
GeneNamesToEnsembl["C10orf12"]="ENSG00000155640"
EnsemblToGeneNames["ENSG00000168260"] = "C14orf183"
GeneNamesToEnsembl["C14orf183"]="ENSG00000168260"
EnsemblToGeneNames["ENSG00000168787"] = "OR12D2"
EnsemblToGeneNames["ENSG00000170803"] = "OR2AG1"
EnsemblToGeneNames["ENSG00000171484"] = "OR1B1"
EnsemblToGeneNames["ENSG00000172381"] = "OR6Q1"




# Tables 3 et 4 : Correspondance (Enzymes,Transporters) <-> Ensembl

filename = filenameCorrespondanceEnsemblEnzymes

ECTCDBToEnsembl = dict()
fd = open(filename,"r")

lines = fd.readlines()
for l in lines:
    t=l.split(";")
    L=t[1].replace("\n","").split(",")
    ECTCDBToEnsembl[t[0]]=list()
    for g in L:
        if (GeneNamesToEnsembl.get(g)):
            ECTCDBToEnsembl[t[0]].append(GeneNamesToEnsembl.get(g))
fd.close()


filename = filenameCorrespondanceEnsemblTransporters

fd = open(filename,"r")

lines = fd.readlines()
for l in lines:
    t=l.split(";")
    L=t[1].replace("\n","").split(",")
    ECTCDBToEnsembl[t[0]]=list()
    for g in L:
        if (GeneNamesToEnsembl.get(g)):
            ECTCDBToEnsembl[t[0]].append(GeneNamesToEnsembl.get(g))
fd.close()

# Table 5 : Second filter, the genes present in the RRG must possess a RNASeq value. List of genes having a RNASeq value

#Request = """curl -o /dev/stdout "http://bgee.org/?page=gene&gene_id=%%GENEID%%" -q | grep "Name" | awk -F "<td>|</td>|<th>|</th>" '{for(i=1;i<NF;i++) {if ($i == "Ensembl ID") {printf("%s;;",$(i+2));}; if ($i == "Name") {printf("%s\\n",$(i+2));};          }    }'>>~/Downloads/missing.csv"""

#fout=open("/Users/jeremiebourdon/Downloads/requete.sh","w")

filename = Param_RNASeqFilename
fd = open(filename,"r")
l=fd.readline()
RNASeqlistofgenes=list()
#missing=""
for l in fd:
    l=l.replace('"','').replace('\n','')
    t=l.split(",")
    geneid=t[0].split(".")[0]
#    if not (EnsemblToGeneNames.get(geneid)):
#        print(geneid)
#        missing=(Request.replace("%%GENEID%%",geneid))
#        fout.write(missing+"\n")
    if (EnsemblToGeneNames.get(geneid)):
#        RNASeqlistofgenes.append(GeneNamesToEnsembl[EnsemblToGeneNames[geneid]]) # a conversion Ensembl->Gene->Ensembl to get a unique Ensemble Id for a given gene name
        RNASeqlistofgenes.append(geneid)
#    else:
#        eprint("Missing",geneid)
fd.close()

#fout.close()


# Table 6 : Drug targets
fd=open(filenameKEGGDrugsGenes ,"r")

lines = fd.readlines()

Allmeds=dict()

for l in lines:
    t=l.split(";")
    t[len(t)-1]=t[len(t)-1].replace("\n","")
    completeTargets=t[2].split('|')+t[3].replace("Enzyme:","").split(',')+t[4].split('|')
    completeTargets=[x.strip().split(" ")[0] for x in completeTargets if len(x)>2]
    completeTargetsEnsembl=[GeneNamesToEnsembl.get(x) for x in completeTargets if (GeneNamesToEnsembl.get(x) != None)]
    Allmeds[t[1].strip()]={'KeggId': t[0], 'TargetsGenes': completeTargets, 'TargetsGenesEnsembl': completeTargetsEnsembl }

fd.close()

# Table 6 : Mean Transcript length

fd = open(filenameCorrespondanceEnsemblMeanLength,"r")

lines=fd.readlines()

AllGeneMeans = dict()
for g in lines:
    t=g.split(";")
    t[1]=float(t[1].replace("\n",""))
    AllGeneMeans[t[0]]=t[1]
    
fd.close()




# Table 7 : HMR to Ensembl correspondance

fd = open(filenameCorrespondanceHMREnsembl,"r")

lines=fd.readlines()

HMR_to_Ensembl = dict()
for g in lines:
    t=g.split(";")
    t[1]=(t[1].replace("\n",""))
    HMR_to_Ensembl[t[0]]=t[1].split("|")
    
fd.close()








# In[14]:

for g in EnsemblToGeneNamesList:
    EnsemblToGeneNamesList[g]=list(set(EnsemblToGeneNamesList.get(g)))
    EnsemblToGeneNamesList.get(g).sort()
    if (len(EnsemblToGeneNamesList.get(g))>1):
        print(g,EnsemblToGeneNamesList.get(g).sort())


# In[15]:

import json, io

# Read JSON file
with open('../tables/Correspondance_Ensembl_GeneNames_by_SPARQL.json') as data_file:
    genelist = json.load(data_file)


GenenameToEnsembl=dict()
for gid in genelist:
    genename=genelist[gid][0]
    if not (GenenameToEnsembl.get(genename)):
        GenenameToEnsembl[genename]=list()
        GenenameToEnsembl[genename].append(gid)

GeneAltNameToName=dict()
for gid in genelist:
    genename=genelist[gid][0]
    GeneAltNameToName[genename]=genename
    for i in range(1,len(genelist[gid])):
        GeneAltNameToName[genelist[gid][i]]=genename


# In[16]:




# In[ ]:




# In[ ]:




# In[ ]:




# In[ ]:




# In[ ]:




# In[ ]:




# In[ ]:




# In[ ]:




# In[ ]:




# In[ ]:




# In[ ]:




# In[ ]:



