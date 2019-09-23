#!/usr/bin/python

###
# Compare Iggy prediction results to original ICGC analysis
###
# Usage:
#   python compare-to-icgc.py [--gen] <ICGC-file> <down-threshold> <up-threshold> [input-file]
# where <ICGC-file> is the original ICGC file with gene expression fold-change analysis,
# <down-threshold> and <up-threshold> are the thresholds to consider a down- or up-regulation,
# and [obspred-file] is an optional file name for the list of observations and predictions
# produced by Iggy in Cytoscape-readable format (attributes obs:xxx and pred:xxx).
#
# Typical usage
#   python compare-to-icgc.py icgc.csv 0 0 obspred.tsv
#
# Complete help:
#   python compare-to-icgc.py --help
###
# Remark: A dot (.) was found in the ICGC data file; check if this is a problem
###

import sys
import csv
import argparse



# [Argparse] Command line parsing options
parser = argparse.ArgumentParser(
  add_help = False,
  description = 'Compare Iggy prediction results to original ICGC analysis',
  epilog = """ICGCFILE should be a tab-delimited CSV file containing in its first two columns
    the gene names and their fold-change values.
    OBSPREDFILE should be a tab-delimited CSV file containing in its first two columns
    the gene names and the related Iggy predictions in format obs:xxx and pred:xxx.
    If omitted, this data is read from the standard input.
    The result appends columns to Iggy results to detail the comparison with ICGC data.""")

parser.add_argument('dataFileName', metavar = 'ICGCFILE',
  type = str,
  help = 'The CSV file containing (ICGC) expression data')
parser.add_argument('downT', metavar = 'DOWN',
  type = float,
  help = 'The threshold to consider a down-regulation')
parser.add_argument('upT', metavar = 'UP',
  type = float,
  help = 'The threshold to consider an up-regulation')
parser.add_argument('obspredFile', metavar = 'OBSPREDFILE',
  type = str, nargs = '?',
  help = 'The observations & predictions file (read from standard input if omitted)')
parser.add_argument('--gen',
  dest = 'suffix', action = 'store_true',
  help = 'Remove _gen and _prot suffixes (adds a type column)')
parser.add_argument('-h', '--help',
  action = 'help',
  help = 'Print this help message')

args = parser.parse_args()



# Define what weakly matches
weakMatch = [
# Predictions
  ('-', 'NOT+'),
  ('-', 'CHANGE'),
  ('+', 'NOT-'),
  ('+', 'CHANGE'),
  ('0', 'NOT+'),
  ('0', 'NOT-'),
# Observations
  ('-', 'notPlus'),
  ('+', 'notMinus'),
  ('0', 'notPlus'),
  ('0', 'notMinus')
]

# Handle thresholds
downRegThreshold = min(args.downT, args.upT)
upRegThreshold = max(args.downT, args.upT)
if downRegThreshold == upRegThreshold and downRegThreshold != 0:
  print('Warning: identical non-null thresholds ({})'.format(downRegThreshold), file=sys.stderr)



# Open and parse the ICGC data
dataName = []
dataFC = []
with open(args.dataFileName, 'r') as fdata:
  dataReader = csv.reader(fdata, delimiter='\t')
  # Ignore first line
  next(dataReader)
  # Check type (upreg, downreg, nochange)
  for row in dataReader:
    dataName.append(row[0])
    dataFC.append(row[1])



# Read on standard input or in a file if a name is specified
if args.obspredFile is None:
  f = sys.stdin
else:
  f = open(args.obspredFile, 'r')

# Parse and treat input
resList = []
try:
  inputReader = csv.reader(f, delimiter='\t')
  row = next(inputReader)
  resList.append([row[0], row[1], 'diffexp-icgc', 'obs-icgc', 'comp'])
  if args.suffix:
    resList[0].append('type')
  
  # Main loop
  for row in inputReader:
    gene = row[0]  # Gene name
    trueName = gene   # Gene name without suffix
    obspred = row[1]  # Iggy's observation or prediction
    
    # Iggy change type (+, -, 0, etc.)
    typeIggy = ''
    if obspred[0:4] == 'obs:':
      infoIggy = 'obs'
      typeIggy = obspred[4:]
    elif obspred[0:5] == 'pred:':
      infoIggy = 'pred'
      typeIggy = obspred[5:]
    else:
      print("Error in parsing input: {}".format(obspred))
      exit()  # TODO: Turn into exception or error value
    
    # Extract true gene name & type
    if args.suffix:
      geneType = 'unknown'
      if gene[-4:] == '_gen':
        trueName = gene[:-4]
        geneType = 'gen'
      elif gene[-5:] == '_prot':
        trueName = gene[:-5]
        geneType = 'prot'
      elif '::' in gene:
        geneType = 'complex'
    
    # Search for gene in ICGC data
    if dataName.count(trueName) == 0:
      fc = 'not-found'
      typeICGC = 'not-found'
      comp = 'not-found'
    else:
      idx = dataName.index(trueName)  # Index in ICGC data
      fc = float(dataFC[idx])  # Fold-change value
      
      # ICGC-only change type given fold-change and thresholds
      typeICGC = ''
      if fc < downRegThreshold:
        typeICGC = '-'
      elif fc > upRegThreshold:
        typeICGC = '+'
      else:
        typeICGC = '0'
      
      # Compare ICGC and Iggy change types in predictions or observations
      if typeICGC == typeIggy:
        comp = 'match'
      elif (typeICGC, typeIggy) in weakMatch:
        comp = 'weak-match'
      else:
        comp = 'no-match'
    
    resList.append([gene, obspred, fc, 'icgc:' + typeICGC, infoIggy + ':' + comp])
    if args.suffix:
      resList[-1].append(geneType)
finally:
  f.close()

outputWriter = csv.writer(sys.stdout, delimiter='\t', quoting=csv.QUOTE_NONE)
for row in resList:
  outputWriter.writerow(row)

