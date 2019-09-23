#!/bin/sh

###
# Extrait une liste de gènes partageant une prédiction
# 
# Utilisation :
#   sh extract-genes-from-predictions.sh <fichier prédictions> <motif>
# où <fichier prédictions> est un fichier contenant la reproduction de la sortie d'Iggy
# et <motif> est le motif auquel on s'intéresse et dont il faut extraire les gènes
# 
# Exemples :
#   sh ../extract-genes-from-predictions.sh id-ssm-reg-obspred.csv pred:+ > pred-up.txt
#   sh ../extract-genes-from-predictions.sh id-ssm-reg-obspred.csv "pred:\(+\|-\) > pred-updown.txt
# 
# Résultat :
#   Le résultat est retourné sur la sortie standard
#   Un nom de gène par ligne (sans les motifs)
#  
# Transformations effectuées :
#   - Conserve uniquement les lignes mentionnant le motif
#   - Puis ne conserve que le nom du gène (première colonne)
###

set -e

# $1 = Prédictions
# $2 = Motif

if [ -z $2 ]
then
  echo "Usage: sh extract-genes-from-predictions.sh <predictions file> <pattern>"
  echo "  where <predictions file> is a file containing the output of Iggy"
  echo "  and <pattern> is the sought pattern"
  exit
fi

cat $1 |\
grep $2 |\
awk '{print $1}' |\
sort

# Previously: removed the tab and prediction with sed
#| #sed "s/\t$2//g;"

