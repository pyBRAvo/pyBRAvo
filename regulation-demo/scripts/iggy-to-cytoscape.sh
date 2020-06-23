#!/bin/sh

###
# Transform an Iggy output into a predictions CSV file that can be read by Cutoscape
###
#
# Usage:
#   sh iggy-to-cytoscape.sh <observations file> [predictions file]
# where <observations file> is the observations file given to Iggy
# and [predictions file] is a file containing the output of Iggy;
# if missing, this last file is read from the standard input
# 
# Example:
#   bash iggy-to-cytoscape.sh input/updownreg.obs output/id-ssm-reg.out > obspred.csv
# 
# Result:
#   Returned on the standard output
# 
# Process:
#   - Add a header line “gene pred&obs”
#   - Remove the ASP-style atoms syntax on predictions
#   - Replace the “=” by horizontal tab characters as column separators
#   - Prefix observation labels (+, -, 0, notPlus, notMinus) by “obs:”
#   - Prefix prediction labels (+, -, 0, NOT+, NOT-, CHANGE) by “pred:”
#   - Remove obvious predictions (that is, already listed as observations)
###

###
# Transforme une sortie Iggy en un fichier CSV de prédictions compréhensible par Cytoscape
# par ex. :   gen("xx") = +   est transformé en   xx pred:+   (avec une tabulation)
# et          yy = -          est transformé en   yy obs:+    (avec une tabulation)
# 
# Utilisation :
#   sh iggy-to-cytoscape.sh <fichier observations> [fichier prédictions]
# où <fichier observations> est le fichier d'observations fourni à Iggy
# et [fichier prédictions] est un fichier contenant la reproduction de la sortie d'Iggy;
# si ce dernier argument n'est pas fourni, ces données sont lues sur l'entrée standard
# 
# Exemple :
#   sh ../iggy-to-cytoscape.sh input/updownreg.obs output/id-ssm-reg.out > obspred.csv
# 
# Résultat :
#   Le résultat est retourné sur la sortie standard
#  
# Transformations effectuées :
#   - Ajout d'une ligne d'en-tête « gene pred&obs »
#   - Suppression de la sytaxe d'atomes façon ASP (prédictions)
#   - Remplacement des « = » par des tabulations en tant que séparateurs de colonnes
#   - Préfixage des étiquettes d'observations (+, -, 0, notPlus, notMinus) par « obs: »
#   - Préfixage des étiquettes de prédiction (+, -, 0, NOT+, NOT-, CHANGE) par « pred: »
#   - Suppression des prédictions (triviales) (c.-à-d. déjà recensées en tant qu'observations)
###

set -e

# $1 = Observations
# $2 = Prédictions

if [ -z $1 ]
then
  echo "Usage: sh iggy-to-cytoscape.sh <observations file> [predictions file]"
  echo "  where <observations file> is the input given to Iggy"
  echo "  and [predictions file] is its output as a file"
  echo "  or standard input if no file is given"
  exit
fi

# Ligne d'en-tête
echo -e "gene\tpred&obs"

# Prédictions (avec suppression des prédictions triviales)
OBSGENES=$(sed 's/ = \(0\|+\|-\|notPlus\|notMinus\)//g;' $1)
cat $2 | grep "gen(\"" |\
grep --invert-match --word-regexp --regexp="$OBSGENES" |\
sed "s/ //g;s/gen(\"//g;s/\")=/\t/g;s/\t\(0\|+\|-\|NOT+\|NOT-\|CHANGE\)/\tpred:\1/g;"

# Observations
cat $1 | sed "s/ = \(0\|+\|-\|notPlus\|notMinus\)/\tobs:\1/g;" | grep --invert-match " = input"

