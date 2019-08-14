#!/bin/sh

###
# Compile provenances from a provenance file of pyBravo
###
# Usage:
#   sh pybravo-provenance <CSV provenance file>
###

awk -F"," '{print $NF}' "$1" | sort | uniq -c

