#!/bin/sh

###
# Extracts the inputs of a SIF file (nodes without predecessor)
###
# Usage:
#   sh extract-inputs.sh <SIF file>
# where <SIF file> is a SIF file you want the inputs extracted from
#
# Output:
#   A list of genes that have no predecessors in the model.
#
# Purpose:
#   The --auto_inputs option of Iggy does not work as intended;
#   the inputs have to be manually given in the obsersations file.
#   This can be done by calling this script then appending ' = input' to each line.
#   See construct-input.sh for the complete pipeline to build the observations file.
###

if [ -z "$1" ]
then
  echo "Usage: sh extract-inputs.sh <SIF file>"
  exit 1
fi

C1="$(awk '{ print $1 }' $1 | sort -u)"
C2="$(awk '{ print $3 }' $1 | sort -u)"

#echo "$C1" | wc -l
#echo "$C2" | wc -l

echo "$C1" | grep -x -F -v "$C2"

