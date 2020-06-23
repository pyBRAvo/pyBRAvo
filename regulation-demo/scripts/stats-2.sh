#!/bin/bash

# Print stats on a BRAvo results' folder

NAME=$1
shift
STDOUT=$1
shift

if [ -z "$NAME" ] || [ -z "$STDOUT" ]
then
  echo 'Usage: bash stats-2.sh <base_name> <stdout_file>'
  exit 1
fi

# Graph size
echo -n 'Nodes: '
wc -l "${NAME}.genes"
echo -n 'Edges: '
wc -l "${NAME}"
echo -n ' - signed: '
grep -cv 'UNKNOWN\|PART_OF' "${NAME}"
echo -n ' - unsigned: '
grep -c 'UNKNOWN' "${NAME}"
echo -n ' - PART_OF: '
grep -c 'PART_OF' "${NAME}"

echo ''

echo -n 'Coverage: '
python3 scripts/compute_coverage.py "${NAME}" data/input-910.csv Homo_sapiens.gene_info

echo ''

# Complexes
COMPLEXES=$(grep ' decomposed into' "$STDOUT" | awk -F' decomposed into' '{print $1}' | sort -u)
echo -n 'Complexes: '
echo "$COMPLEXES" | wc -l

# Small molecules in complexes
echo -n 'Complexes involving small molecules: '
COMPLEXES_LINES=$(grep ' decomposed into' "$STDOUT" | grep -v ' when removing small molecules' | sort -u)
COMPLEXES_LINES2=$(grep ' decomposed into' "$STDOUT" | grep ' when removing small molecules' | awk -F' when removing small molecules' '{print $1}' | sort -u)
diff -U 0 <(echo "$COMPLEXES_LINES") <(echo "$COMPLEXES_LINES2") | grep -v '^@\|+++' | grep -c '^+'
#diff -U 0 <(echo "$COMPLEXES_LINES") <(echo "$COMPLEXES_LINES2") | grep -v '^@\|+++' | grep '^+'

# Iggy
#cat iggy/result/stats.txt

# To extract results from Iggy predictions:
#echo $(grep 'pred:match' out-unified-0-0.tsv  | grep 'pred:+' | awk '{ print $1 }')

