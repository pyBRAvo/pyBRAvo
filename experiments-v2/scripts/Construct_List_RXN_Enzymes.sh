#!/bin/bash

filein=$1
fileout=$2

cat $filein |
sed "s+<reaction+\\\n<reaction+g" |
sed "s+</reaction>+\010+g" |
grep "reaction" |
awk -F "[<>= ]" '{for (i=1; i<=NF; i++) {if ($i~"\"metaid_") printf("%s ",$i); if ($i~"ec-code") {printf("%s ",$i);}} printf("\n");}' |
sed 's+"++g' |
sed "s/metaid_R_//g" |
sed "s/urn:miriam:ec-code://g" |
sed "s+/++g" > $fileout
