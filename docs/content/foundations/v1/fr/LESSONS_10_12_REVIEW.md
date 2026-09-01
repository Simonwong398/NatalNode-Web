---
title: "Foundations V1 fr Lessons 10–12 Review Manifest"
courseId: foundations.v1
courseVersion: v1
canonicalLocale: en
locale: fr
adaptationRevision: 1
documentKind: LOCALE_ADAPTATION_REVIEW_MANIFEST
contentState: REVIEW
currentness: CURRENT
runtimeAvailability: UNAVAILABLE
---

# Foundations V1 fr Lessons 10–12 Review Manifest

## Périmètre et état

Ce manifest enregistre le dernier lot de l'adaptation française de Foundations V1 : priorisation, synthèse du thème et usage responsable. Les trois leçons sont complètes comme documentation Class C, mais l'approbation du Product Owner et l'admission runtime restent en attente.

Chaque leçon déclare `contentRevision: 1`, `canonicalContentRevision: 1`, `contentState: REVIEW`, `currentness: CURRENT` et `runtimeAvailability: UNAVAILABLE`. `CURRENT` confirme l'alignement sur le canon anglais actuel ; il n'autorise pas la publication.

## Identité des leçons

| Leçon | Lesson ID | Titre français | Révision canonique | Adaptation | État | Runtime |
| ---: | --- | --- | ---: | ---: | --- | --- |
| 10 | `foundations.chart_priorities` | Ce qui compte d'abord dans un thème | 1 | 1 | `REVIEW` / `CURRENT` | `UNAVAILABLE` |
| 11 | `foundations.whole_chart` | Lire le thème dans son ensemble | 1 | 1 | `REVIEW` / `CURRENT` | `UNAVAILABLE` |
| 12 | `foundations.responsible_astrology` | Utiliser l'astrologie de manière responsable | 1 | 1 | `REVIEW` / `CURRENT` | `UNAVAILABLE` |

Sources canoniques : `docs/content/foundations/v1/en/10-what-matters-first-in-a-chart.md`, `11-reading-the-chart-as-a-whole.md` et `12-using-astrology-responsibly.md`.

## Audit du contrat éditorial

- Chaque leçon conserve exactement neuf sections de niveau supérieur et exactement deux questions avec réponse correcte et explication.
- La leçon 10 conserve la priorisation comme méthode transparente, non comme score, classement ou pondération numérique ; elle commence par la qualité des entrées et les faits, continue avec les couches étayées, thèmes récurrents et aspects proches, puis s'arrête avec une règle explicite.
- La leçon 11 conserve le parcours en sept étapes, la différence entre faits, thèmes et contexte, les tensions neutres et la règle d'arrêt devant une frontière de preuve.
- La leçon 12 conserve la distinction fait/convention/incertitude, le refus des diagnostics et décisions à haut risque, le consentement, la vie privée, les tiers, les enfants, l'agence et les limites de compétence.

## Décisions terminologiques et lacunes consignées

| Concept | Décision d'adaptation | Limite |
| --- | --- | --- |
| Prioritization / stopping rule | `priorisation` / `règle d'arrêt` | Ordre d'observation, pas score. |
| Whole-chart synthesis / theme | `synthèse` / `thème` | Relie des faits sans décrire toute la personne. |
| Tension / support | `tension` / `appui` | Descripteurs neutres d'une lecture possible. |
| Fact / convention / uncertainty | `fait` / `convention` / `incertitude` | Trois couches explicites. |
| Consent / privacy / agency | `consentement` / `vie privée` / `agence` | Garde-fous de pratique et d'autonomie. |

Ces choix sont locaux au texte et ne créent aucun ID de glossary, capacité, hook ou champ API runtime. `PROVIDER DECISION DEFERRED`.

## Revue professionnelle, épistémique et géométrique

Une passe interne indépendante d'édition professionnelle et de parité épistémique a été effectuée ; cycles de correction ultérieurs : `0`. L'adaptation ne présente pas la priorisation comme un score, la synthèse comme une accumulation de mots-clés ni les garde-fous de la leçon 12 comme facultatifs.

La géométrie synthétique de la leçon 10 conserve Soleil 20° Taureau = 50° et Lune 20° Lion = 140°, avec un écart de 90° et un carré. La leçon 11 conserve le même contrôle dans son exemple Soleil 20° Taureau, Lune 20° Lion, Mercure 5° Gémeaux et carré Soleil–Lune. La leçon 12 n'ajoute pas de degré.

L'heure inconnue exclut toujours maisons et angles non étayés. Aucune donnée n'est inventée pour renforcer une synthèse et un thème n'est pas utilisé pour diagnostiquer, surveiller, faire pression ou décider à la place d'une autre personne.

## Gate final de la locale

Le gate éditorial interne des douze leçons françaises est `READY_FOR_OWNER_APPROVAL`.

| Constat | Résultat |
| --- | ---: |
| `BLOCKER` | 0 |
| `MAJOR` | 0 |
| `MINOR` | 0 |
| `EDITORIAL_NOTE` | 0 |
| Leçons complètes | 12 / 12 |

Ce résultat signifie que la locale peut passer à la revue du Product Owner. Il ne constitue pas son approbation : `NO`. Il ne constitue pas une admission runtime : `NO`. Toutes les leçons françaises restent `REVIEW / CURRENT / UNAVAILABLE`.

## Sources, correction et périmètre sûr

Les URL des trois leçons sont conservées exactement. Les sources astrologiques servent au contexte curriculaire et aucune prose n'a été copiée ; aucune recherche web large n'a été effectuée. Le canon produit, l'architecture et la politique de localisation gouvernent toujours état, fallback et publication.

Aucun changement n'a touché UI, CSS, server, API, BFF, base de données, migrations, Auth, Vault, Commercial, Engine, provider, assessment, reward, renderer, anglais ou d'autres locales. Aucune traduction automatique ni fonctionnalité P1/P2/P3 n'a été ajoutée.

## Historique et fichiers exacts

- Adaptation revision : `1` pour Lessons 10–12.
- Correction cycles after independent internal review : `0`.
- Product Owner approval : `NO`.
- Runtime admission : `NO` ; runtime availability : `UNAVAILABLE`.

Fichiers exacts de ce lot :

1. `docs/content/foundations/v1/fr/10-what-matters-first-in-a-chart.md`
2. `docs/content/foundations/v1/fr/11-reading-the-chart-as-a-whole.md`
3. `docs/content/foundations/v1/fr/12-using-astrology-responsibly.md`
4. `docs/content/foundations/v1/fr/LESSONS_10_12_REVIEW.md`
