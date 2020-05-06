# pyPath 
This example allows you to use the pyPath library to construct signaling networks.
This implementation was used to make a comparison with pyBRAvo.

## Prerequisite
conda 4.7.5

## Installation  
The first step consists in loading pyBRAvo environment (as explain [here](https://github.com/albangaignard/pyBravo/README.md)) and **pulling the required pyPath packages**:
```bash
conda activate pybravo
pip install git+https://github.com/saezlab/pypath.git
conda install pycairo pygraphviz
conda install pysftp -c bioconda
pip install bioservices python-igraph pycurl
```

## Usage from a Jupyter notebook
Inside the experiments-comparison directory, run the `jupyter-notebook pypath-sign-up.ipynb` command. 

The notebook can be browsed [here](https://gitlab.univ-nantes.fr/gaignard-a/BRAvo/blob/master/experiments-comparison/pypath-sign-up.ipynb). 

