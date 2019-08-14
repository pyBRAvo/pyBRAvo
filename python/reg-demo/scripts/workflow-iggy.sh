#!/bin/sh

###
# Full workflow to compute and post-process Iggy predictions
###
# Usage:
#   sh workflow-iggy.sh [--gen] [--iggy-command <command>] <obs-file> <sif-file> <ICGC-file>
#                       <down-threshold> <up-threshold> [Iggy-output-file]
# where --gen means that _gen and _prot suffixes have to be handeld,
# --iggy-command <command> specifies that iggy has to be called with this <command> (default: "iggy"),
# <obs-file> is an Iggy observations file (see Iggy documentation),
# <sif-file> is the network in Iggy SIF format (idem),
# <ICGC-file> is the CSV containing ICGC differential expression data,
# <down-threshold> <up-threshold> are thresholds for validation agains ICGC data
# and [Iggy-output-file] is an optional file name to redirect the output of Iggy to.
#
# Example:
#   sh workflow-iggy.sh updownreg.obs graph.sif icgc-v4.csv 0 0
###

# Arguments
SUFFIX=""
if [ "$1" = "--gen" ]
then
  SUFFIX="--gen"
  shift
fi

IGGY_COMMAND="iggy"
if [ "$1" = "--iggy-command" ]
then
  IGGY_COMMAND="$2"
  shift
  shift
fi

OBS_FILE=$1
SIF_FILE=$2
ICGC_FILE=$3
DOWN_THRESHOLD=$4
UP_THRESHOLD=$5
OUTPUT_IGGY=$6

# Check arguments
if [ -z "$UP_THRESHOLD" ]
then
  echo "Usage: sh workflow-iggy.sh [--gen] [--iggy-command <command>] <obs-file> <sif-file> <ICGC-file>"
  echo "                           <down-threshold> <up-threshold> [Iggy-output-file]"
  exit 1
fi

if [ -z "$OUTPUT_IGGY" ]
then
  OUTPUT_IGGY="/dev/null"
fi

# Check presence of scripts
BASEDIR="$(dirname $0)"
POST_PROCESSING_IGGY="$BASEDIR/post-processing-iggy.sh"
if [ ! -f $POST_PROCESSING_IGGY ]
then
  echo "Error: script $POST_PROCESSING_IGGY was not found but is required"
  exit 1
else
  eval "sh $POST_PROCESSING_IGGY --check"
  if [ ! $? -eq 0 ]
  then
    exit 1
  fi
fi

# Workflow
$IGGY_COMMAND $SIF_FILE $OBS_FILE --show_predictions --autoinputs |\
tee $OUTPUT_IGGY |\
sh $POST_PROCESSING_IGGY $SUFFIX $OBS_FILE $SIF_FILE $ICGC_FILE $DOWN_THRESHOLD $UP_THRESHOLD

