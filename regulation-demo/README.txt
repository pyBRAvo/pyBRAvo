This folder contains data, scripts and results related to the notebooks “BRAvo-regulation-demo-PC12.ipynb” and “BRAvo-regulation-demo-PC12-Fast.ipynb” in this folder. These two notebooks are identical except for the “fast” option used only in the second notebook.

Original folders:
  - data: input data for the notebook
  - scripts: Bash and Python scripts used by the notebook

Result folders created by the notebook:
  - cytoscape: table (.csv) files for Cytoscape
  - iggy: results from the Iggy execution (computation predictions)
  - .: several output files (.sif, .csv, .log, ...) are also created in this folder

To obtain a Cytoscape figure similar to Figure 2 and containing all relevant information obtained by running one of these notebooks, open Cytoscape and import the following files:
1) out-unified.sif -> File / Import / Network from File
2) cytoscape/edges-provenance.csv -> File / Import / Table from File; choose Edge Table Columns in the dialog window and check that the file appears correctly tabulated in the preview
3) bravo-style.xml -> File / Import / Style from File; select the BRAvo style under the Style tab of the Control Panel

