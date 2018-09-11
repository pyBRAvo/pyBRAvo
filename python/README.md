# pyBRAvo 
This tool is a Python implementation of BRAvo. It generates an upstream regulation network from the PathwayCommons knowledge base. 
pyBRAvo can be used through either a Jupyter notebook, or a command line interface. 

## Installation  
The first step consists in creating a software environment and **pull the required python packages**:
```
conda create --name pybravo rdflib requests matplotlib jupyter networkx -c conda-forge -c bioconda
source activate pybravo
pip install nxpd
```
Then just **clone** this repository:
```
git clone https://gitlab.univ-nantes.fr/gaignard-a/BRAvo.git
cd BRAvo/python
```
Then **test** that everything is fine:
```
python pyBravo.py --regulation --fast --input_genes JUN/FOS SCN5A -md 2 -co -su -sy -excl mirtarbase
```
You should obtain something like:
```
--- Upstream regulation network in 7.88 seconds ---
Number of nodes = 248
Number of edges = 323
SIF network written to out.sif
Basic regulation reaction provenance written to out-provenance.csv

| Node | Degree Centrality |
|------|------|
| TNF | 0.324 | 
| FOS | 0.235 | 
| SOD2 | 0.17 | 
| IL2 | 0.069 | 
| IL1A | 0.065 | 
| FGF2 | 0.053 | 
| JUN | 0.053 | 
| BDNF | 0.045 | 
| NGF | 0.045 | 
| EP300 | 0.04 | 
```
## Usage from a Jupyter notebook 
Inside the python directory, just run the `jupyter-notebook BRAvo-python-API-tutorial.ipynb` command. 

The notebook can be browsed [here](https://gitlab.univ-nantes.fr/gaignard-a/BRAvo/blob/master/python/BRAvo-python-API-tutorial.ipynb). 

## Usage from a terminal 
Here is the help message for the command line when running `python pyBravo.py`:
```
usage: pyBravo.py [-h] [-md MD] [-sy] [-su] [-co] [-i I [I ...]] [-f F]
                  [-incl INCL [INCL ...]] [-excl EXCL [EXCL ...]] [-v]

BRAvo upstream regulation network reconstruction. 
Here are some possible command lines :
    
    python pyBravo.py --input_genes JUN/FOS SCN5A -md 2 -co -su -sy
    python pyBravo.py --input_genes JUN/FOS SCN5A -md 2 -excl mirtarbase -co -su -sy
    python pyBravo.py --input_file myGenes.csv -md 2 -incl pid panther msigdb kegg -co -su -sy
    
Please report any issue to alban.gaignard@univ-nantes.fr. 

optional arguments:
  -h, --help            show this help message and exit
  -md MD, --max_depth MD
                        the maximum exploration depth
  -sy, --extend_with_synonyms
                        if specified, explore also synonyms
  -su, --extend_with_rna_protein_suffixes
                        if specified, explore also names suffixed with " rna" or " protein"
  -co, --decompose_complexes
                        if specified, decompose protein complexes
  -i I [I ...], --input_genes I [I ...]
                        the input gene list
  -f F, --input_file F  the input file, one gene per line
  -incl INCL [INCL ...], --include_sources INCL [INCL ...]
                        the data sources to include
  -excl EXCL [EXCL ...], --exclude_sources EXCL [EXCL ...]
                        the data sources to exclude
  -v, --verbose         print debug information

```