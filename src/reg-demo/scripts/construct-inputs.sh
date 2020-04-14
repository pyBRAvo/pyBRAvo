#!/bin/sh

###
# Construct the Iggy observations file by appending inputs to preliminary observations
###
# Usage:
#   sh construct-inputs.sh [--gen] <SIF file> <obs file>
# where --gen specifies that a “_gen” suffix should be appened to each preliminary observation,
# <SIF file> is a SIF file you want the inputs extracted from
# and <obs file> is a preliminary Iggy observation file containing only “ = +” and “ = -” observations
#
# Output:
#   A list of “ = input” observations containing genes that have no predecessors in the model,
#   appened to the initial observations file.
#
# Purpose:
#   The --auto_inputs option of Iggy does not work as inteded;
#   the inputs have to be manually given in the obsersations file.
#   This can be done by calling this script then appending ' = input' to each line.
###

# Arguments
GEN_SUFFIX=""
if [ "$1" = "--gen" ]
then
  GEN_SUFFIX="_gen"
  shift
fi
SIF_FILE="$1"
OBS_FILE="$2"

# Check arguments
if [ -z "$OBS_FILE" ]
then
  echo "Usage:"
  echo "  sh construct-inputs.sh [--gen] <SIF file> <obs file>"
  echo "Adds ' = input' observations to source nodes of the SIF file"
  echo "Option --gen also adds '_gen' suffixes to preliminary (+/-) observations"
  exit 1
fi

# Check presence of files
if [ ! -f "$SIF_FILE" ]
then
  echo "File $SIF_FILE does not exist"
  exit 1
fi

if [ ! -f "$OBS_FILE" ]
then
  echo "File $OBS_FILE does not exist"
  exit 1
fi

# Check presence of scripts
BASEDIR="$(dirname $0)"
EXTRACT_INPUTS="$BASEDIR/extract-inputs.sh"
if [ ! -f $EXTRACT_INPUTS ]
then
  echo "Error: script $EXTRACT_INPUTS was not found but is required"
  exit 1
fi

# Pipeline
cat $OBS_FILE | sed -e "s/ = /${GEN_SUFFIX} = /"
sh "$EXTRACT_INPUTS" "$SIF_FILE" | sed -e 's/$/ = input/'

