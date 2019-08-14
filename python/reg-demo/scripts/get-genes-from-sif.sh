#!/bin/sh

###
# Extract the name of all nodes (genes, proteins, etc.) appearing in a SIF file
###
# Usage:
#   sh get-genes-from-sif.sh <file.sif>
#
# Result:
#   A list of all nodes (not only genes) names sorted and without duplicates,
#   with one name per line, on the standard output
#
# Process:
#   Keeps only columns 1 and 3 (sources and targets) of each line and separate them with a line return,
#   thus removing tab characters previously surrounding column 2.
#   The obtained list is then sortes (sort) with dupes removal (option -u).
#
# Transformations effectuées :
#   Conserve les colonnes 1 et 3 (activateurs et activés) en les séparant d'un retour à la ligne,
#   et en supprimant les tabulations qui encadraient la colonne 2.
#   La liste obtenue est ensuire triée (sort) avec suppression des doublons (option --unique).
###

###
# Extrait le nom de tous les gènes mentionnés dans un fichier SIF
###
# Utilisation :
#   sh get-genes-from-sif.sh <fichier.sif>
#
# Résultat :
#   Le résultat est une liste de gènes triée et sans doublons, avec un gène par ligne,
#   retournée sur la sortie standard
#
# Transformations effectuées :
#   Conserve les colonnes 1 et 3 (activateurs et activés) en les séparant d'un retour à la ligne,
#   et en supprimant les tabulations qui encadraient la colonne 2.
#   La liste obtenue est ensuire triée (sort) avec suppression des doublons (option -u).
# 
# Ancienne version :
#   Les mots-clefs de la colonne 2 étaient explicitement remplacés par une simple tabulation ;
#   c'était une mauvaise idée car il fallait être exhaustif et rajouter les nouveaux mots-clefs
#   éventuels au script.
###

#awk -F'\t' '{ print $1"\t"$3 }' $1 | sed 's/\t/\n/g' | sort -u
awk -F'\t' '{ print $1"\n"$3 }' $1 | sed 's/\r//g' | sort -u

#sed 's/\tACTIVATION\t\|\tINHIBITION\t\|\t1\t\|\t-1\t/\n/g' $1 | sort | uniq

