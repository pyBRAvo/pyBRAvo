
-ds kegg -ds netpath -ds panther -ds pid -ds reactome -ds wp -f sif -i nodes.csv -md 3 -n -o bravo.reg.up.sif -r -ssm -w Up

Test des nouvelles options:
    regulation
    way up
    skip small molecules
    max depth 3
    data sources: kegg, netpath, panther, pid, reactome, wp

C'est bien. Il n'y a plus quantité de nœuds sans grand intérêt et le temps d’exécution est beaucoup plus court.

En revanche si max depth = n (dans les options) alors max depth = n+1 dans le graphe retourné par bravo.

contact: Arnaud Poret
