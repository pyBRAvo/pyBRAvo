# pyBRAvo 
This tool is a Python implementation of BRAvo. It generates an upstream regulation network from the PathwayCommons knowledge base. 
pyBRAvo can be used through either a Jupyter notebook, or a command line interface. 

## Installation  
The first step consists in creating a software environment and **pull the required python packages**:
```
conda create --name pybravo rdflib requests matplotlib jupyter networkx -c conda-forge -c bioconda
source activate pybravo
```
Then just **clone** this repository:
```
git clone https://gitlab.univ-nantes.fr/gaignard-a/BRAvo.git
cd BRAvo/python
```
Then **test** that everything is fine:
```
python pyBravo.py --input_genes JUN/FOS SCN5A -md 1 -excl mirtarbase
```
You should obtain something like:
```
--- Upstream regulation network in 7.56 seconds ---
Number of nodes = 67
Number of edges = 82
SIF network written to out.sif
Basic regulation reaction provenance written to out-provenance.csv

| Gene | Degree Centrality |
|------|------|
| FOS | 0.667 | 
| JUN | 0.394 | 
| SCN5A | 0.212 | 
| MAZ | 0.045 | 
| JUN/FOS | 0.045 | 
| CEBPD | 0.03 | 
| HSF1 | 0.03 | 
| SP1 | 0.03 | 
| HSF2 | 0.03 | 
| ATF1 | 0.03 | 
```
## Usage from a Jupyter notebook 

## Usage from a terminal 