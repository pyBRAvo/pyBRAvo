#!/bin/sh

###
# Formate un fichier SIF retourné par Bravo pour son utilisation dans Iggy
#
# Usage :
#   sh format-iggy.sh <fichier.sif>
#
# Sortie :
#   Les interactions, toujours au format SIF mais formatées pour Iggy, sur la sortie standard
#
# Remplacements effectués :
#   - ACTIVATION et PART_OF (entre tabulations) deviennent 1
#   - INHIBITION (entre tabulations) devient -1
#   - Remplacement de (xxx) précédé par une espace par _xxx ; exemple : (dimer) remplacé par _dimer
#   - Remplacement de (espace) ( ) + / . , ' * par _
#   - Ajout d'un préfixe n_ aux noms de composants qui commencent par un chiffre
#
# Ancienne version :
#   La sortie était placée dans un fichier iggy/<fichier.sif>
###

if [ -z "$1" ]
then
  echo "Usage: sh format-iggy.sh <fichier.sif>"
  exit 1
fi

# Remplacements
sed "s/ (\([a-z][a-z ]*\))/_\1/g;s% \|(\|)\|+\|/\|\.\|,\|'\|*%_%g;" $1 |\
sed "s/^\([0-9]\)/n_&/g;s/\t\([0-9]\)\([^\t]\)/\tn_\1\2/g" |\
sed "s/ACTIVATION/1/g;s/INHIBITION/-1/g;s/PART_OF/1/g;"

# Précédemment : remplacements particuliers
#s/17-1A/n_17-1A/g;s/323_A3/n_323_A3/g;s/3M3/n_3M3/g;\

# Précédemment : plaçait le nouveau fichier dans un dossier iggy/ avec le même nom que l'input
#> iggy/$1

