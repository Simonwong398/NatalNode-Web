---
title: "Foundations V1 fr Lessons 01–03 Review Manifest"
courseId: foundations.v1
courseVersion: v1
canonicalLocale: en
locale: fr
adaptationRevision: 1
documentKind: LOCALE_ADAPTATION_REVIEW_MANIFEST
contentState: APPROVED
currentness: CURRENT
runtimeAvailability: AVAILABLE
---

# Foundations V1 fr Lessons 01–03 Review Manifest

## Périmètre et état

Ce manifest consigne l'adaptation professionnelle Class C en français des leçons 01–03 de Foundations V1. Il s'agit d'une rédaction adaptée de manière indépendante, non d'une traduction exécutée au runtime. L'identité `foundations.v1`, la provenance `en` et les frontières entre astronomie, calcul, interprétation et usage responsable sont conservées.

Les trois leçons ont `contentRevision: 1`; leurs révisions canoniques sont respectivement 3, 2 et 2. Elles sont `contentState: APPROVED`, `currentness: CURRENT` et `runtimeAvailability: AVAILABLE` après l'admission de l'adaptation française dans le cadre de `WEB-LEARN-009`.

## Identité des leçons

| Leçon | Lesson ID | Titre français | Révision canonique | Adaptation | État | Runtime |
| ---: | --- | --- | ---: | ---: | --- | --- |
| 01 | `foundations.natal_chart` | Ce qu'est réellement un thème natal | 3 | 1 | `APPROVED` / `CURRENT` | `AVAILABLE` |
| 02 | `foundations.zodiac_structure` | Le zodiaque : éléments et modalités | 2 | 1 | `APPROVED` / `CURRENT` | `AVAILABLE` |
| 03 | `foundations.chart_calculation` | Comment le ciel devient un thème | 2 | 1 | `APPROVED` / `CURRENT` | `AVAILABLE` |

Sources canoniques exactes : `docs/content/foundations/v1/en/01-what-a-natal-chart-actually-is.md`, `02-the-zodiac-structure.md` et `03-how-the-sky-becomes-a-chart`. Aucun fichier anglais n'a été modifié.

## Audit du contrat éditorial

- Chaque leçon conserve exactement neuf sections de niveau supérieur dans cet ordre : `Orientation`, `Concept central`, `Vocabulaire professionnel`, `Exemple`, `Ma carte`, `Pratique`, `Vérification de compréhension`, `Idée clé`, et `Sources et lectures complémentaires`.
- Chaque leçon contient exactement deux questions de compréhension, deux réponses correctes marquées et deux explications.
- Sont conservés la carte en couches, la séparation entre fait calculé et interprétation, les douze signes, les éléments et modalités, la distinction signe/constellation, le parcours de l'heure locale à la longitude écliptique, ainsi que la dépendance de l'ASC, du MC et des maisons aux données.
- Aucun score, prédiction, diagnostic, comportement déterministe, calculateur, traduction automatique ou donnée de thème nouvelle n'a été introduit.

## Décisions terminologiques et lacunes consignées

| Concept | Décision d'adaptation | Limite |
| --- | --- | --- |
| Natal chart / chart fact / interpretation | `thème natal` / `fait du thème` / `interprétation` | Les couches restent distinctes. |
| Zodiac sign / constellation | `signe du zodiaque` / `constellation` | Un secteur astrologique régulier est distingué d'une région astronomique. |
| Element / modality | `Feu, Terre, Air, Eau` / `Cardinal, Fixe, Mutable` | Catégories traditionnelles, pas mesures ni stéréotypes. |
| Ecliptic / ecliptic longitude | `écliptique` / `longitude écliptique` | Géométrie, pas validation scientifique de l'interprétation. |
| Ascendant / Midheaven / house | `Ascendant (ASC)` / `Milieu du Ciel (MC)` / `maison` | MC est distingué du zénith ; la maison dépend de l'heure. |
| Local civil time / timezone / DST | `heure civile locale` / `fuseau horaire` / `heure d'été (DST)` | Aucun résolveur ni jeu de données de fuseau n'a été ajouté. |

Les variantes locales sont expliquées dans le texte et n'étendent pas le runtime glossary par des IDs, alias ou champs produit.

## Revue professionnelle et épistémique

Une passe interne indépendante de rédaction, de terminologie et de parité épistémique a été effectuée ; cycles de correction ultérieurs : `0`. Le français est rédigé dans un style éditorial naturel, et non par substitution mécanique. La force modale de « pourrait », la séparation convention/fait et l'absence de déterminisme ont été contrôlées.

La leçon 01 conserve l'exemple synthétique Soleil 15° Taureau / Lune 15° Lion avec carré, explicitement non personnel. La leçon 02 conserve les douze signes, la grille élément × modalité et la distinction signe/constellation. La leçon 03 conserve la chaîne heure locale, UTC, règles historiques, longitude écliptique, signes, ASC/MC et systèmes Placidus, Whole Sign et Equal House.

L'heure inconnue reste inconnue : midi, minuit ou une heure estimée ne sont jamais utilisés pour fabriquer ASC, MC, cuspides ou maisons. La géométrie et les résultats de calcul sont présentés comme des faits du modèle ; l'interprétation reste une lecture possible.

## Sources et niveaux de preuve

Les URL du canon sont conservées exactement. Faculty of Astrological Studies, Astrodienst, Skyscript et Astrology University servent au contexte curriculaire et au vocabulaire astrologique. NASA, l'IAU, l'U.S. Naval Observatory et l'IANA servent au contexte astronomique, temporel et de référence. Les documents internes restent l'autorité pour identité, état, locale, fallback et runtime.

Aucune recherche web large, aucune prose externe copiée et aucune traduction automatique n'ont été utilisées. `PROVIDER DECISION DEFERRED`.

## Gate de publication et non-admission

Le résultat éditorial interne de ce lot était `READY_FOR_OWNER_APPROVAL`; l'adaptation française des Foundations V1 Lessons 01–12 a ensuite reçu l'approbation du Product Owner dans le cadre de `WEB-LEARN-009`. Product Owner approval : `YES`. Runtime admission : `YES` via le chemin Foundations locale-aware existant ; les leçons sont `APPROVED / CURRENT / AVAILABLE`. Assessment approval et reward approval : `NO`.

L'admission a étendu uniquement le mapping de contenu et les imports du chemin Foundations locale-aware existant ; aucun loader parallèle, registry parallèle, fallback silencieux ou traduction runtime n'a été créé. Le fallback explicite reste limité au contenu localisé indisponible. Aucun UI, CSS, server, API, BFF, base de données, migration, Auth, Vault, Engine, provider, assessment, reward ou contenu anglais n'a été modifié. Les autres lots de locale ne font pas partie de ce manifest.

## Historique de correction et fichiers exacts

- Adaptation revision : `1`.
- Correction cycles after independent internal review : `0`.
- Product Owner approval : `YES` pour les Foundations V1 Lessons 01–12 en français.
- Runtime admission : `YES` ; runtime availability : `AVAILABLE`.

Fichiers exacts de ce lot :

1. `docs/content/foundations/v1/fr/01-what-a-natal-chart-actually-is.md`
2. `docs/content/foundations/v1/fr/02-the-zodiac-structure.md`
3. `docs/content/foundations/v1/fr/03-how-the-sky-becomes-a-chart.md`
4. `docs/content/foundations/v1/fr/LESSONS_01_03_REVIEW.md`
