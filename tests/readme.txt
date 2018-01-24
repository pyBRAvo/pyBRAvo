
Avant de comparer 2 runs différents, j'ai voulu voir en détail ce que produisait 1 run.

J'ai demandé (en ligne de commande) à bravo de me trouver les régulateurs en amont du gène PIDD1 (ce gène code une protéine de signalisation intracellulaire pro-apoptotique).

En lisant ce que bravo m'affichait à l'écran durant le run, je me suis aperçu qu'il explorait dans Pathway Common des nœuds dont la pertinence est discutable, ex:
    -Paroxetine (un antidépresseur)
    -apple polyphenol extract (antioxydants extrait de la pomme)
    -gamisopoonghwanghyul-tang (une herbe médicinal Coréenne, je crois)
    -4-(2-(5,6,7,8-tetrahydro-5,5,8,8-tetramethyl-2-naphthalenyl)-1-propenyl)benzoic acid (aucune idée)
    -Propofol (un anesthésique)
    -Carbon Monoxide
    -Contraceptives, Oral, Combined

Dans les régulateurs trouvés par bravo une fois le run terminé, il y a des trucs bons (ex: TP53), et beaucoup de trucs moins bons.

Je penses que cela vient d'une trop grande hétérogénéité de ce qui est exploré par bravo: les résultats pertinents se retrouvent noyés dans une masse trop hétérogène.

Je suggérerais volontiers 2 choses pour commencer:
    1) effectuer une sélection davantage strict de ce que bravo est autorisé à explorer dans Pathway Common (ex: Reactome, KEGG Pathways, PID, Wikipathways)
    2) pouvoir spécifier la profondeur de cette exploration afin de rester dans un périmètre pertinent

Cela permettrait de diminuer le temps d’exécution et de contrôler l'hétérogénéité qui pour le moment pose un problème de par son ampleur.

Contact: Arnaud Poret
