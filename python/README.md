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
Inside the python directory, just run the `jupyter-notebook BRAvo-python-API-tutorial.ipynb` command. 

The notebook can be browsed [here](https://gitlab.univ-nantes.fr/gaignard-a/BRAvo/blob/master/python/BRAvo-python-API-tutorial.ipynb). 

## Usage from a terminal 
Here is the help message for the command line when running `python pyBravo.py`:
```
please fill the -i (--input_genes) or -f (--input_file) parameter
usage: pyBravo.py [-h] [-md MD] [-i I [I ...]] [-f F] [-incl INCL [INCL ...]]
                  [-excl EXCL [EXCL ...]]

BRAvo upstream regulation network reconstruction. 
Here are some possible command lines :
    
    python pyBravo.py --input_genes JUN/FOS SCN5A -md 1
    python pyBravo.py --input_genes JUN/FOS SCN5A -md 1 -excl mirtarbase
    python pyBravo.py --input_file myGenes.csv -md 1 -incl pid panther msigdb kegg
    
Please report any issue to alban.gaignard@univ-nantes.fr. 

optional arguments:
  -h, --help            show this help message and exit
  -md MD, --max_depth MD
                        the maximum exploration depth
  -i I [I ...], --input_genes I [I ...]
                        the input gene list
  -f F, --input_file F  the input file, one gene per line
  -incl INCL [INCL ...], --include_sources INCL [INCL ...]
                        the data sources to include
  -excl EXCL [EXCL ...], --exclude_sources EXCL [EXCL ...]
                        the data sources to exclude

```