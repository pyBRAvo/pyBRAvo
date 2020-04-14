# BRAvo - Biological netwoRk Assembly
## pyBRAvo 
This tool is a Python implementation of BRAvo. It generates an upstream regulation network from the PathwayCommons knowledge base. 
pyBRAvo can be used through either a Jupyter notebook, or a command line interface. 

## Installation  
The first step consists in creating a software environment and **pull the required python packages**:
```
conda create --name pybravo rdflib requests matplotlib jupyter networkx flask -c conda-forge -c bioconda
conda activate pybravo
pip install nxpd
```
Then just **clone** this repository:
```
git clone https://github.com/albangaignard/pyBravo.git
cd pyBRAvo/src
```
Then **test** that everything is fine:
```
python pyBravo.py --regulation --fast --input_genes JUN/FOS SCN5A -md 2 -co -su -sy -excl mirtarbase
```
You should obtain something like:
```
Explored 84 regulators
Explored 92 regulators
...
Explored 398 regulators

--- Upstream regulation network in 72.77 seconds ---
Number of nodes = 458
Number of edges = 1683
SIF network written to out.sif
Basic regulation reaction provenance written to out-provenance.csv

| Node | Degree Centrality |
|------|------|
| NOG | 0.162 |
| POU2F1 | 0.144 |
| FOS | 0.144 |
| EGR2 | 0.133 |
| TNF | 0.133 |
| JUN | 0.127 |
| SP1 | 0.125 |
| MAZ | 0.12 |
| LEF1 | 0.114 |
| HNF1A | 0.109 |

--- Network simplification in 0.24 seconds ---
SIF network written to out-unified.sif
Basic regulation reaction provenance written to out-unified-provenance.csv
Nodes after simplification = 436
Edges after simplification = 1657

| Node | Degree Centrality |
|------|------|
| NOG | 0.159 |
| TNF | 0.156 |
| POU2F1 | 0.152 |
| HNF1A | 0.147 |
| FOS | 0.147 |
| EGR2 | 0.14 |
| JUN | 0.136 |
| DAND5 | 0.129 |
| GDNF | 0.129 |
| FGF13 | 0.12 |

```

For signaling networks :
```
python pyBravo.py --signaling --input_genes SCN5A -md 2 -co -su -sy -excl mirtarbase --fast
```
You should obtain something like:
```
Explored 26 regulators
Explored 3181 regulators
Explored 3197 regulators
Explored 3197 regulators
Explored 3198 regulators
Explored 3198 regulators
Explored 3199 regulators
Explored 3199 regulators
Explored 3199 regulators
--- Upstream regulation network in 95.63 seconds ---
Number of nodes = 3341
Number of edges = 4614
SIF network written to out.sif
Basic regulation reaction provenance written to out-provenance.csv

| Node | Degree Centrality |
|------|------|
| TGF-beta1 | 0.268 |
| HER2 | 0.258 |
| angiotensin II | 0.136 |
| CDK2 | 0.136 |
| DNMT1 | 0.1 |
| L-FoxO1 | 0.096 |
| CLOCK | 0.096 |
| Id | 0.072 |
| LIF | 0.055 |
| Forkhead | 0.013 |

--- Network simplification in 5.39 seconds ---
SIF network written to out-unified.sif
Basic regulation reaction provenance written to out-unified-provenance.csv
Nodes after simplification = 3311
Edges after simplification = 4601

| Node | Degree Centrality |
|------|------|
| TGF-beta1 | 0.269 |
| ERBB2 | 0.26 |
| CDK2 | 0.137 |
| angiotensin II | 0.136 |
| DNMT1 | 0.101 |
| CLOCK | 0.097 |
| L-FoxO1 | 0.096 |
| Id | 0.073 |
| LIF | 0.063 |
| Forkhead | 0.013 |

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
