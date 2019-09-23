#!/bin/sh

###
# Extract statistics on the final post-processed results of Iggy
###
# Usage:
#   sh stats-result.sh [--en|--fr] [--skip0] <result-file> [<sif-file>]
# where "--en" and "--fr" are optional argument specifying the language (English or French),
# "--skip0" is an optional argument asking to skip stats on 0 (no-change) predictions,
# <result-file> is the name of a file containing the post-processed results of Iggy
# and [<sif-file>] is, optionally, the name of the corresponding SIF file (for the number of nodes)
#
# Output:
#   General statistics (number of observations, predictions, etc. with percentages)
#   in human-readale format on the standard output
###

# Function to tackle French/English text
enfr () {
  EN=$1   # English text
  FR=$2   # French text
  
  if [ -z "$EN" ]
  then
    echo "Syntax error on enfr() call"
    exit 1
  fi

  if [ "$L" = "en" ] || [ -z  "$FR" ]
  then
    echo -en "$EN "
  else
    echo -en "$FR "
  fi
  return 0
}



# Arguments

# Check if first argument is [--en|--fr]
if [ "${1//-/}" = "en" ] || [ "${1//-/}" = "fr" ]
then
  L="${1//-/}"
  shift
fi

# Check if first argument if --skip0
SKIP0="false"
if [ "$1" = "--skip0" ]
then
  SKIP0="true"
  shift
fi

# Result file
F="$1"
shift

if [ -z "$F" ]
then
  echo "   sh stats-result.sh [--en|--fr] [--skip0] <result-file> [<sif-file>]"
  echo "where \"--en\" or \"--fr\" specify the language (English/French),"
  echo "\"--skip0\" skips stats on 0 (no-change) predictions,"
  echo "<result-file> is the file containing the post-processed results of Iggy"
  echo "and [<sif-file>] is the name of the original SIF file"
  exit 1
fi

if [ ! -f "$F" ]
then
  echo "File not found: $F"
  exit 1
fi

# If second argument, it is the SIF file
if [ ! -z "$1" ]
then
  SIF_FILE="$1"
  # Check presence of get-genes-from-sif.sh
  GET_GENES_FROM_SIF="$(dirname $0)/get-genes-from-sif.sh"
  if [ ! -f "$GET_GENES_FROM_SIF" ]
  then
    GET_GENES_FROM_SIF="false"
  fi
else
  SIF_FILE=""
  GET_GENES_FROM_SIF="false"
fi



# Results
if [ ! "$GET_GENES_FROM_SIF" = "false" ]
then
  enfr "Total number of nodes:" "Nombre total de nœuds :"
  sh "$GET_GENES_FROM_SIF" "$SIF_FILE" | wc -l
  enfr "Total number of edges:" "Nombre total d'arcs :"
  cat "$SIF_FILE" | wc -l
fi
enfr "Number of observations:" "Nombre d'observations :"
grep -c "obs:" $F
enfr "Number of predictions:" "Nombre de prédictions :"
grep -c "pred:" $F
enfr "  positive (+):" "  positives (+) :"
grep -c "pred:+" $F
enfr "  negative (−):" "  négatives (−) :"
grep -c "pred:-" $F
enfr "  no-change (0):" "  sans changement (0) :"
grep -c "pred:0" $F
enfr "  may-up (NOT−):" "  faiblement positives (NOT−) :"
grep -c "pred:NOT-" $F
enfr "  may-down (NOT+):" "  faiblement négatives (NOT+) :"
grep -c "pred:NOT+" $F
enfr "  change (CHANGE/NOT0):" "  changement (CHANGE/NOT0) :"
grep -c "pred:CHANGE" $F

echo
enfr "Predictions found in ICGC data:" "Prédictions retrouvées dans les données ICGC :"
grep "pred:" $F | grep -cv "pred:not-found"
enfr "    +:"
grep -v "pred:not-found" $F | grep -c "pred:+"
enfr "    -:"
grep -v "pred:not-found" $F | grep -c "pred:-"
enfr "    0:"
grep -v "pred:not-found" $F | grep -c "pred:0"

enfr "  coherent:" "  cohérentes :"
if [ ! $SKIP0 = true ]
then
  grep -c "pred:match" $F
else
  grep "pred:match" $F | grep -cv "pred:0"
fi
enfr "    +:"
grep "pred:match" $F | grep -c "pred:+"
enfr "    -:"
grep "pred:match" $F | grep -c "pred:-"
if [ ! $SKIP0 = true ]
then
  enfr "    0:"
  grep "pred:match" $F | grep -c "pred:0"
fi

enfr "  weakly coherent:" "  faiblement cohérentes :"
grep -c "pred:weak-match" $F
enfr "    NOT-:"
grep "pred:weak-match" $F | grep -c "pred:NOT-"
enfr "    NOT+:"
grep "pred:weak-match" $F | grep -c "pred:NOT+"
enfr "    CHANGE:"
grep "pred:weak-match" $F | grep -c "pred:CHANGE"

enfr "  not coherent:" "  non cohérentes :"
if [ ! $SKIP0 = true ]
then
  grep -c "pred:no-match" $F
else
  grep "pred:no-match" $F | grep -cv "pred:0"
fi

enfr "    predicted +:" "    prédictions +:"
grep "pred:no-match" $F | grep -c "pred:+"
if [ ! $SKIP0 = true ]
then
  enfr "      should be -:" "      devraient être -:"
  grep "pred:no-match" $F | grep "pred:+" | grep -c "icgc:-"
  enfr "      should be 0:" "      devraient être 0:"
  grep "pred:no-match" $F | grep "pred:+" | grep -c "icgc:0"
else
  enfr "      (should be -)\n" "      (devraient être -)\n"
fi

enfr "    predicted -:" "    prédictions -:"
grep "pred:no-match" $F | grep -c "pred:-"
if [ ! $SKIP0 = true ]
then
  enfr "      should be +:" "      devraient être +:"
  grep "pred:no-match" $F | grep "pred:-" | grep -c "icgc:+"
  enfr "      should be 0:" "      devraient être 0:"
  grep "pred:no-match" $F | grep "pred:-" | grep -c "icgc:0"
else
  enfr "      (should be +)\n" "      (devraient être +)\n"
fi

if [ ! $SKIP0 = true ]
then
  enfr "    predicted 0:" "    prédictions 0:"
  grep "pred:no-match" $F | grep -c "pred:0"
  enfr "      should be +:" "      devraient être +:"
  grep "pred:no-match" $F | grep "pred:0" | grep -c "icgc:+"
  enfr "      should be -:" "      devraient être -:"
  grep "pred:no-match" $F | grep "pred:0" | grep -c "icgc:-"
fi

enfr "    predicted NOT-/NOT+/CHANGE:" "    prédictions NOT-/NOT+/CHANGE:"
grep "pred:no-match" $F | grep -c "pred:NOT-\|NOT+\|CHANGE"
exit 0

