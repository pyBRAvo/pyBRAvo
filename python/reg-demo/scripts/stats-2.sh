#!/bin/bash

# Print stats on a BRAvo results' folder

FOLDER=$1
shift

if [ -z "$FOLDER" ]
then
  echo 'Usage: bash stats-2.sh <folder>'
  exit 1
fi

echo "   ******"
echo $FOLDER
echo "   ******"
cd $FOLDER

# Base (no unification)
echo 'Without unification:'
echo '--------------------'
# Graph size
echo -n 'Nodes: '
wc -l out.sif.genes
echo -n 'Edges: '
wc -l out.sif
echo -n ' - signed: '
grep -cv 'UNKNOWN\|PART_OF' out.sif
echo -n ' - unsigned: '
grep -c 'UNKNOWN' out.sif
echo -n ' - PART_OF: '
grep -c 'PART_OF' out.sif
echo -n 'Coverage: '
python3 ../../compute_coverage.py out.sif ../../input-910.csv ../../Homo_sapiens.gene_info

echo ''

# Unified
echo 'With unification:'
echo '-----------------'
# Graph size
echo -n 'Nodes: '
wc -l out-unified.sif.genes
echo -n 'Edges: '
wc -l out-unified.sif
echo -n ' - signed: '
grep -cv 'UNKNOWN\|PART_OF' out-unified.sif
echo -n ' - unsigned: '
grep -c 'UNKNOWN' out-unified.sif
echo -n ' - PART_OF: '
grep -c 'PART_OF' out-unified.sif
echo -n 'Coverage: '
python3 ../../compute_coverage.py out-unified.sif ../../input-910.csv ../../Homo_sapiens.gene_info

echo ''

# Complexes
COMPLEXES=$(grep ' decomposed into' std.out | awk -F' decomposed into' '{print $1}' | sort -u)
echo -n 'Complexes: '
echo "$COMPLEXES" | wc -l

# Small molecules in complexes
echo -n 'Complexes involving small molecules: '
COMPLEXES_LINES=$(grep ' decomposed into' std.out | grep -v ' when removing small molecules' | sort -u)
COMPLEXES_LINES2=$(grep ' decomposed into' std.out | grep ' when removing small molecules' | awk -F' when removing small molecules' '{print $1}' | sort -u)
diff -U 0 <(echo "$COMPLEXES_LINES") <(echo "$COMPLEXES_LINES2") | grep -v '^@\|+++' | grep -c '^+'
#diff -U 0 <(echo "$COMPLEXES_LINES") <(echo "$COMPLEXES_LINES2") | grep -v '^@\|+++' | grep '^+'

echo ''

# Iggy
#cat iggy/result/stats.txt

# To extract results from Iggy predictions:
#echo $(grep 'pred:match' out-unified-0-0.tsv  | grep 'pred:+' | awk '{ print $1 }')

