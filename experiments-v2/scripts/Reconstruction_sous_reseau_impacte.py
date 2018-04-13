
# coding: utf-8

# # Un scénario complet

# Quelques informations et paramètres pour commencer

# In[1]:

from Entete import *


# Tous les includes

# In[2]:

#Param_SBMLfile = "/Users/jeremiebourdon/Downloads/Hep-G2.xml"


# In[3]:

## DEBUG ONLY
begintotal = timer()
eprint("Testing",Param_SBMLfile,"for",Param_Drug)

## END DEBUG ONLY


# Chargement des listes de correspondances

# In[5]:

#from AllTables import *
from AllTables import *


# In[ ]:




# In[6]:

Param_Pourcentage = 0.95


# Construction de la liste des cibles

# In[7]:

# étape 1 : construction du fichier d'association Reactions <-> EC numbers

# obsolete : La liste RXN -> liste gènes est désormais récupérée directement depuis HMRDatabase

# dictionnaire HMR_to_Ensembl


eprint("Entering : Association RxN <-> Enzymes list construction")

SBMLfile = Param_SBMLfile

#SBMLfile = raw_input("Enter the SBML filename ? ")

def ConstructAssociationList(SBMLfile, RXN_EC_file="/tmp/RXN_EC.txt"):

    import os
    os.system("../scripts/Construct_List_RXN_Enzymes.sh "+SBMLfile+" "+RXN_EC_file)
    fd = open(RXN_EC_file,"r")
    lines = fd.readlines()

    genes = dict()
    for l in lines:
        t=l.split(" ")
        cum=''
        for i in range(1,len(t)-1):
            cum=cum+t[i]+" "
        genes[t[0]]=cum
    return genes

# genes=ConstructAssociationList(SBMLfile,RXN_EC_file)


# In[8]:

# Etape 2 : Single Reaction Analysis

eprint("Entering : Single Reaction Analysis")

## DEBUG ONLY
begin = timer()
## END DEBUG ONLY


# perfoming a single_reaction_deletion analysis of the network

if (Param_SBMLfile.count(".xml")): # is it an xml or a .mat ?
    model = cobra.io.read_sbml_model(Param_SBMLfile)
else:
    model = cobra.io.load_matlab_model(Param_SBMLfile)

# the objective coefficient must be properly set
# try to add an objective for HMA_r3 sbml files
#if (len(model.objective) == 0):
#    model.reactions.CancerBiomass_OF.objective_coefficient=1

# reference biomass growth
fba=model.optimize().f

# single reaction deletion analysis


if (Param_DoReconstruction and Param_Pourcentage<1):
    ratesD = cobra.flux_analysis.single_reaction_deletion(model) #,solver=whichsolver)
    ratesD = ratesD.get('growth').to_dict() # for cobra 0.11.3
    rates=dict()                            # for cobra 0.11.3
    for r in ratesD:                        # for cobra 0.11.3
        rates[list(r)[0]]=ratesD.get(r)

else:
    rates=dict()
    for r in model.reactions:
        rates[r.id]=0

## DEBUG ONLY
end = timer()
eprint("Execution time (Single Reaction Analysis) = ",end-begin,"seconds")
## END DEBUG ONLY


# In[ ]:




# In[ ]:




# In[ ]:




# In[9]:

# Etape 3 : Extraction des enzymes régulateurs (nécessite étape 1 et 2)

def getRegulators(rates, percentage=1.1):
    regulators = dict()

    cpt=0
    for r in rates:
        if (math.isnan(rates.get(r)) or rates.get(r)<percentage*fba):
            if (HMR_to_Ensembl.get(r)!=''):
                # print(r,':',rates.get(r)," ",genes.get(r))
                cpt=cpt+1
                l=HMR_to_Ensembl.get(r)
                if (l):
                    for i in l:
                        if (i != ''):
                            regulators[i]=1
    return regulators

import math

def getRegulators_for_constrained_models(rates, percentage=1.1):
    regulators = dict()

    cpt=0
    for r in rates:
        if (math.isnan(rates.get(r)) or rates.get(r)<percentage*fba):
            react=model.reactions.get_by_id(r)
            l=[g.id for g in list(react.genes)]
            for g in l:
                regulators[g]=1
    return regulators



def getRegulators_obsolete(rates, percentage=1.1):
    regulators = dict()

    cpt=0
    for r in rates:
        if (rates.get(r)<percentage*fba):
            if (genes.get(r)!=''):
                # print(r,':',rates.get(r)," ",genes.get(r))
                cpt=cpt+1
                l=genes.get(r).split(' ')
                for i in l:
                    if (i != ''):
                        regulators[i]=1
    return regulators

if (Param_DoReconstruction):
    regulators = getRegulators_for_constrained_models(rates, Param_Pourcentage)
    # regulators = getRegulators(rates, Param_Pourcentage) # for HMA_r3


# In[ ]:




# In[10]:

# Etape 4 : récupération de la liste de gènes régulateurs
def GeneListFromEC(ecnumber):
    if (ecnumber.find('-')>0):
        cum=list()
        for i in range(1,500):
            gl=ECTCDBToEnsembl.get(ecnumber.replace('-',str(i)))
            if (gl != None and len(gl)>0):
                cum+=gl
        return cum
    else:
        gl=ECTCDBToEnsembl.get(ecnumber)
        if (gl == None):
            gl=list()
        return gl

if (Param_DoReconstruction):
    TargetGenesEnsembl=list()
    for ec in regulators:
#        TargetGenesEnsembl+=GeneListFromEC(ec.lower())
        TargetGenesEnsembl+=[ec.replace("'","%27")]

    TargetGenes = [EnsemblToGeneNames.get(x) for x in TargetGenesEnsembl]
    TargetGenes=list()
    for x in TargetGenesEnsembl:
        if (genelist.get(x)):
            TargetGenes.append(genelist.get(x)[0])
        else:
            eprint('Missing ',x)

    TargetGenes=set(TargetGenes)
    TargetGenes=list(TargetGenes)

    TargetGenesEnsembl=set(TargetGenesEnsembl)
    TargetGenesEnsembl=list(TargetGenesEnsembl)

    eprint("Target gene list size =",len(TargetGenes))

    fd = open(Param_TargetFilename,"w")
    for g in TargetGenes:
        fd.write(g+"\n")
    fd.close()
    fd = open(Param_TargetFilename+"_EnsemblId","w")
    for g in TargetGenesEnsembl:
        fd.write(g+"\n")
    fd.close()




# In[ ]:




# Regulatory network reconstruction using PathwayCommons SPARQL endpoint

# In[14]:

# Algorithms

Aliases = dict()
for g in GeneAltNameToName:
    if not Aliases.get(GeneAltNameToName.get(g)):
        Aliases[GeneAltNameToName.get(g)] = list()
    Aliases[GeneAltNameToName.get(g)].append(g)

def GetTFControllersList(EnsemblId):
    commonPCPrefixes = """
PREFIX bp: <http://www.biopax.org/release/biopax-level3.owl#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
"""

    Request = """
SELECT ?tempReac ?type ?controlledName ?controllerName ?source ?controllerType ?controlledType
WHERE{
    FILTER (
    ("""
    for i in range(0,len(EnsemblId)-1):
        EnsemblId[i]=EnsemblId[i].replace("'","%27")
#        Request=Request+"""((?controlledName = '%%GENETARGETNAME%%'^^xsd:string) and (?controllerName != '%%GENETARGETNAME%%'^^xsd:string) ) or
        Request=Request+"""((?controlledName = '%%GENETARGETNAME%%'^^xsd:string) ) or
        """.replace("%%GENETARGETNAME%%",EnsemblId[i])

#    Request=Request+"((?controlledName = '%%GENETARGETNAME%%'^^xsd:string) and (?controllerName != '%%GENETARGETNAME%%'^^xsd:string) )".replace("%%GENETARGETNAME%%",EnsemblId[len(EnsemblId)-1])
    Request=Request+"((?controlledName = '%%GENETARGETNAME%%'^^xsd:string) )".replace("%%GENETARGETNAME%%",EnsemblId[len(EnsemblId)-1])
    Request=Request+""")
        and (str(?source) != \"http://pathwaycommons.org/pc2/mirtarbase\")
        and ((str(?controlledType) = "http://www.biopax.org/release/biopax-level3.owl#Protein") or (str(?controlledType) = "http://www.biopax.org/release/biopax-level3.owl#Rna"))
        and ((str(?controllerType) = "http://www.biopax.org/release/biopax-level3.owl#Protein") or (str(?controllerType) = "http://www.biopax.org/release/biopax-level3.owl#Rna"))
) .
?tempReac a bp:TemplateReactionRegulation .
?tempReac rdf:type ?ctype ; bp:controlled ?controlled ; bp:controller ?controller ; bp:controlType ?type ; bp:dataSource ?source .
?controlled bp:participant ?participant ; bp:dataSource ?controlledsource .
?participant bp:displayName ?controlledName; rdf:type ?controlledType .
?controller bp:displayName ?controllerName ; rdf:type ?controllerType ; bp:dataSource ?controllersource .
}
GROUP BY ?controlledName ?controllerName
"""
#    print(Request)
#    RequestToBePerformed=commonPCPrefixes+Request.replace("%%GENETARGETNAME%%",EnsemblId)
    RequestToBePerformed=commonPCPrefixes+Request
    sparql = SPARQLWrapper(PC_Endpoint)
    sparql.setQuery(RequestToBePerformed)
    sparql.setReturnFormat(JSON)
    sparql.setMethod("POST")
    query = sparql.query().convert()
    results=list()
    listofgenes=list()
    ListBindings=query.get('results').get('bindings')
    for l in ListBindings:
        controllerName = (l.get('controllerName').get('value')).replace(" protein","").replace(" alternative form","")
        controlType= (l.get('type').get('value'))
        controlledGene=(l.get('controlledName').get('value')).replace("Transcription of ","")
        rule = controllerName+"_"+controlType +"_"+GeneAltNameToName.get(controlledGene)
        if (rule not in results):
            results.append(rule)
        if (controllerName not in listofgenes):
            listofgenes.append(controllerName)
    return results,listofgenes





def getParentGraphList(l,limit=30):
    pas=50
    i=0
    allgenes=dict()
    for g in l:
        allgenes[g]=1
    listofrelations=list()
    unmapped=list()
    while (i<len(l) and i<limit):
        eprint("Treated ",i," genes, still ",(len(l)-i)," limit = ",limit)
        L=list()
        for j in range(0,pas):
            if (i+j<len(l)):
                gene=l[i+j]
                if (Aliases.get(GeneAltNameToName.get(gene)) != None):
                    L=L+Aliases.get(GeneAltNameToName.get(gene))
        relations,newgenes=GetTFControllersList(L)
        if (len(relations) == 0):
            unmapped.append(gene)
        listofrelations+=relations
        for g in newgenes:
            g=GeneAltNameToName.get(g)
            if (g not in l): #(allgenes.get(g) != 1): #
                l.append(g)
                allgenes[g]=1
        i+=pas
    return listofrelations,l,unmapped










# In[15]:

eprint("Entering : RRG reconstruction")


## DEBUG ONLY
begin = timer()
## END DEBUG ONLY

if (Param_DoReconstruction):
    TargetGenesName = TargetGenes #[EnsemblToGeneNames.get(x) for x in TargetGenes if (len(x) > 2)]

    a,b,u=getParentGraphList(TargetGenesName,50000)

    ## DEBUG ONLY
    end = timer()
    eprint("Execution time for RRG reconstruction = ",end-begin,"seconds")
    ## END DEBUG ONLY

    eprint('Reconstructed graph contains',len(b),'genes,',len(a),'interactions')


    # write the file for compatibility purpose

    fd = open(Param_RRGFilename,"w")
    for r in a:
        relation=r.split("_")
#        if (relation[1] != "ACTIVATION"):
#        eprint(relation)
        fd.write(relation[0]+";"+relation[2]+"\n")
    fd.close()


# In[16]:

endtotal = timer()
eprint("Execution completed in",endtotal-begintotal,"seconds")


# In[ ]:




# In[ ]:




# In[17]:

tg = Allmeds.get(Param_Drug).get('TargetsGenes')


# In[ ]:




# In[ ]:




# In[18]:

possibleTargets=dict()
for m in Allmeds:
    tg = Allmeds.get(m).get('TargetsGenes')
    malist = [GeneAltNameToName.get(x) for x in b if GeneAltNameToName.get(x) in tg]
    for g in malist:
        if not possibleTargets.get(g):
            possibleTargets[g]=list()
        possibleTargets[g].append(m)
#    if (len(malist)>0):
#        print(m,malist)


# In[19]:

possibleTargets


# In[ ]:




# In[20]:


import json
with open("../tmp/PossibleTargets.json", 'w') as outfile:
    json.dump(possibleTargets, outfile)


# In[21]:

ListReg=list()
for g in regulators:
    if (EnsemblToGeneNamesList.get(g) != None):
        ListReg=ListReg+EnsemblToGeneNamesList.get(g)


# In[22]:

len(ListReg)


# In[23]:

possibleTargetsAvant=dict()
for m in Allmeds:
    tg = Allmeds.get(m).get('TargetsGenes')
    malist = [GeneAltNameToName.get(x) for x in ListReg if GeneAltNameToName.get(x) in tg]
    for g in malist:
        if not possibleTargetsAvant.get(g):
            possibleTargetsAvant[g]=list()
        possibleTargetsAvant[g].append(m)


# In[24]:

possibleTargetsAvant


# In[ ]:




# In[ ]:




# In[25]:

eprint("Le nombre total de cibles potentielles après reconstruction est",len(possibleTargets))


# In[26]:

eprint("Le nombre total de cibles potentielles avant reconstruction est",len(possibleTargetsAvant))


# In[ ]:




# In[27]:



Drugs=list()
for t in possibleTargets:
    lg=possibleTargets.get(t)
    for g in lg:
        Drugs.append(g)

Drugs=list(set(Drugs))


# In[28]:

len(Drugs)


# In[29]:

import networkx as nx

# construction du graphe de régulation

G=nx.DiGraph()

for i in a:
    source,typ,target=i.split("_")
    G.add_edge(source,target)

eprint("Le réseau de régulation possède",len(G.nodes()),"gènes")

eprint("Le réseau de régulation possède",len(G.edges()),"interactions")


# In[ ]:




# In[ ]:




# In[30]:

# essai : ici, on prend l'ensemble des drogues de KeggDrug et on regarde tous les gènes impactés par au moins une drogue
# NB : ici, on fournit pour L une liste de gènes précurseurs (cibles)

L=list()
for g in possibleTargets:
    L.append(g)

L=L+list(nx.algorithms.node_boundary(G,L)) # for compatibility purposes


# In[31]:

# G2 sera le sous-graphe induit par L (i.e., le sous-graphe de G dont tous les sommets sont dans L)

G2=G.copy()
G2.remove_nodes_from(n for n in G.nodes() if n not in L)

eprint("Le sous-réseau de régulation impacté possède",len(G2.nodes()),"gènes")
eprint("Le sous-réseau de régulation impacté possède",len(G2.edges()),"interactions")


# test results
print("Test sur",Param_SBMLfile)
print("  Nombre de gènes cibles",len(TargetGenes))
print("  Le nombre total de cibles potentielles après reconstruction est",len(possibleTargets))
print("  Le nombre total de cibles potentielles avant reconstruction est",len(possibleTargetsAvant))
print("  Le réseau de régulation possède",len(G.nodes()),"gènes")
print("  Le réseau de régulation possède",len(G.edges()),"interactions")
print("  Le sous-réseau de régulation impacté possède",len(G2.nodes()),"gènes")
print("  Le sous-réseau de régulation impacté possède",len(G2.edges()),"interactions")
print("----------------")

# All in one line easy to filter
print("FORFILTER;",Param_SBMLfile,";",len(TargetGenes),";",len(possibleTargets),";",len(possibleTargetsAvant),";",len(G.nodes()),";",len(G.edges()),";",len(G2.nodes()),";",len(G2.edges()))
print("----------------")


# In[ ]:




# In[ ]:




# In[32]:

GenesCibles=list()
for e in regulators:
    LR=EnsemblToGeneNamesList.get(e)
    if (LR != None):
        GenesCibles=GenesCibles+LR

len(GenesCibles)


# In[ ]:
