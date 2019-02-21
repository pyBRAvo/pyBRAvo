# pyPath 
This example allows you to use the pyPath library to construct signaling networks.
This implementation was used to make a comparison with pyBRAvo.

## Installation  
The first step consists in loading pyBRAvo environment (as explain [here](https://gitlab.univ-nantes.fr/gaignard-a/BRAvo/blob/master/python/README.md)) and **pull the required pyPath packages**:
```bash
source activate pybravo
pip install git+https://github.com/saezlab/pypath.git
conda install pycairo
conda install pygraphviz pysftp
pip install bioservices
```

## Usage from a Jupyter notebook
Inside the experiments-comparison directory, run the `jupyter-notebook pypath-sign-up.ipynb` command. 

The notebook can be browsed [here](https://gitlab.univ-nantes.fr/gaignard-a/BRAvo/blob/master/experiments-comparison/pypath-sign-up.ipynb). 

## Usage from a terminal 
