#!/bin/sh

###
# General post-processing on the output of Iggy
###
# Purpose:
#   - Extract the observations and predictions from the output file
#   - Format in CSV (Cytoscape-compatible)
#   - Compare the results with the original ICGC data
#   - Remove missing genes from observations (genes that were not in the graph)
#
# Usage:
#   sh post-processing-iggy.sh [--gen] <obs-file> <sif-file> <ICGC-file>
#                              <down-threshold> <up-threshold> [iggy-output]
# where --gen means that _gen and _prot suffixes have to be handeld,
# <obs-file> is the OBS input file (of observations) given to Iggy,
# where <sif-file> is the SIF input file (of interactions) given to Iggy,
# <ICGC-file> is the original ICGC file with gene expression fold-change analysis,
# <down-threshold> and <up-threshold> are the thresholds to consider a down- or up-regulation,
# and the otpional argument [iggy-output] is a file name containing the output of Iggy;
# if this last argument is not given, the data is read on the standard input (which can be piped)
#
# Examples:
# Using the output of Iggy in a file:
# $ sh ../post-processing-iggy.sh input/updownreg.obs input/name-ssm-reg.sif ../icgc.csv -2.0 2.0 output/name-ssm-reg.out > result/obspred-name-ssm-reg-2.0.tsv
# Directly piping from Iggy:
# $ iggy input/name-ssm-reg.sif input/updownreg.obs --show_predictions --autoinputs | sh ../post-processing-iggy.sh input/updownreg.obs input/name-ssm-reg.sif ../icgc.csv -2.0 2.0 > result/obspred-name-ssm-reg-2.0.tsv
#
# Scripts called, in order:
#   - iggy-to-cytoscape.sh
#   - remove-missing.sh (calls get-genes-from-sif.sh)
#   - compare-to-icgc.py
# These scripts should be available in the same folder as this one
#
# Special usage:
#   sh post-processing-iggy.sh --check
# just checks the access to the required scripts and exits
###

# Check arguments
if [ -z "$5" ] && [ "$1" != "--check" ]
then
  echo "Usage: sh post-processing-iggy.sh [--gen] <obs-file> <sif-file> <ICGC-file>"
  echo "                                  <down-threshold> <up-threshold> [iggy-output]"
  echo "where <obs-file> is the OBS input file (of observations) given to Iggy,"
  echo "where <sif-file> is the SIF input file (of interactions) given to Iggy,"
  echo "<ICGC-file> is the original ICGC file with gene expression fold-change analysis,"
  echo "<down-threshold> and <up-threshold> are the thresholds to consider a down- or up-regulation,"
  echo "and the otpional argument [iggy-output] is a file name containing the output of Iggy;"
  echo "if this last argument is not given, the data is read on the standard input"
  exit 1
fi

# Arguments
SUFFIX=""
if [ "$1" = "--gen" ]
then
  SUFFIX="--gen"
  shift
fi
OBS_FILE=$1
SIF_FILE=$2
ICGC_FILE=$3
DOWN_THRESHOLD=$4
UP_THRESHOLD=$5
IGGY_OUTPUT=$6    # Can be empty; then read from standanrd input

# Check access to scripts
BASEDIR="$(dirname $0)"
IGGY_TO_CYTOSCAPE="$BASEDIR/iggy-to-cytoscape.sh"
REMOVE_MISSING="$BASEDIR/remove-missing.sh"
GET_GENES_FROM_SIF="$BASEDIR/get-genes-from-sif.sh"
COMPARE_TO_ICGC="$BASEDIR/compare-to-icgc.py"
MAIN_NAMES="$BASEDIR/main-names-csv.py"
for s in $IGGY_TO_CYTOSCAPE $REMOVE_MISSING $GET_GENES_FROM_SIF $COMPARE_TO_ICGC $MAIN_NAMES
do
  if [ ! -f "$s" ]
  then
    echo "Error: script $s was not found but is required"
    exit 1
  fi
done

# Check access to scripts
if [ "$1" = "--check" ]
then
  exit 0
fi

# Workflow
sh $IGGY_TO_CYTOSCAPE $OBS_FILE $IGGY_OUTPUT |\
bash $REMOVE_MISSING $SIF_FILE |\
python $MAIN_NAMES ../Homo_sapiens.gene_info |\
python $COMPARE_TO_ICGC $SUFFIX $ICGC_FILE $DOWN_THRESHOLD $UP_THRESHOLD


# Original commands:
#sh ../iggy-to-cytoscape.sh input/updownreg.obs output/name-ssm-pid-kegg-reactome-reg.out | python ../Analyse/compare-to-icgc.py ../icgc.csv -2.0 2.0 > result/obspred-name-ssm-pid-kegg-reactome-reg-2.0.tsv
#sh ../remove-missing.sh input/name-ssm-pid-kegg-reactome-reg.sif result/obspred-name-ssm-pid-kegg-reactome-reg-2.0.tsv > result/obspred-name-ssm-pid-kegg-reactome-reg-2.0-nomissing.tsv

