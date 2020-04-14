#!/bin/bash

###
# Remove the missing genes from the observations
###
# Usage:
#   bash remove-missing.sh <sif-file> [results-file]
# where <sif-file> is the SIF file used as an input by Iggy
# and [results-file] is a file containing the output of Iggy;
# if not specified, it is read from the standard input
#
# Output:
#   The original output file where all lines refering to missing genes are removed
#
# Example:
#   sh remove-missing.sh input/name-ssm-reg.sif output/name-ssm-reg.out
# Or:
#   iggy --show_predictions input/sif.sif input/obs.obs | sh iggy_to_cytoscape.sh input/updownreg.obs | bash sh remove-missing.sh input/sif.sif
#
# Remarks:
#   * Must be run with Bash (for process substitution)
#   * Some missing genes are “missed again” (still in the output) because
#       the -w grep option cuts words around dashes, but this is quite rare (probably < 1%)
#   * This script should work on Iggy's output with of without postprocessing,
#       but has only been tested on the result of iggy-to-cytostape.sh or compare-to-icgc.py
#   * This script uses get-genes-from-sif.sh, which is required
###

if [ -z "$1" ]
then
  echo "Usage: sh remove-missing <sif-file> [results-file]"
  echo "where <sif-file> is the SIF file used as an input by Iggy"
  echo "and [results-file] is a file containing the output of Iggy"
  exit
fi

GET_GENES_FROM_SIF="$(dirname $0)/get-genes-from-sif.sh"

if [ ! -f "$GET_GENES_FROM_SIF" ]
then
  echo "Cannot find script get-genes-from-sif.sh"
  exit 1
fi

# First line (CSV header)
echo "$(head -n 1 $2)"

if [ -z "$2" ]
then
  # If from standard input: frist line already skipped
#  grep -w -e "$(sh $GET_GENES_FROM_SIF $1)" -
  grep -w -f <(sh "$GET_GENES_FROM_SIF" "$1") -
else
  # If from from file: do not read first line again
#  tail -n +2 $2 | grep -w -e "$(sh $GET_GENES_FROM_SIF $1)"
  tail -n +2 $2 | grep -w -f <(sh "$GET_GENES_FROM_SIF" "$1")
fi

