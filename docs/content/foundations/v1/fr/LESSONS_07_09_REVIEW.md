---
title: "Foundations V1 fr Lessons 07–09 Review Manifest"
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

# Foundations V1 fr Lessons 07–09 Review Manifest

## Périmètre et état

Ce manifest couvre exactement les adaptations françaises des leçons 07–09. Le travail conserve les structures de maisons, l'échafaudage planète × signe × maison et la géométrie des aspects sans ajouter de calcul, de renderer, de données de thème ou de logique runtime.

Les leçons 07–08 déclarent `contentRevision: 1` et la leçon 09 `contentRevision: 2` après une correction circonscrite de parité des questions ; toutes conservent `canonicalContentRevision: 1` et sont `APPROVED / CURRENT / AVAILABLE` après l'admission de l'adaptation française dans le cadre de `WEB-LEARN-009`.

## Identité des leçons

| Leçon | Lesson ID | Titre français | Révision canonique | Adaptation | État | Runtime |
| ---: | --- | --- | ---: | ---: | --- | --- |
| 07 | `foundations.houses_angles` | Les douze maisons et les angles | 1 | 1 | `APPROVED` / `CURRENT` | `AVAILABLE` |
| 08 | `foundations.planet_sign_house` | Planète × signe × maison | 1 | 1 | `APPROVED` / `CURRENT` | `AVAILABLE` |
| 09 | `foundations.aspects` | Aspects : relations entre les planètes | 1 | 2 | `APPROVED` / `CURRENT` | `AVAILABLE` |

Sources canoniques : `docs/content/foundations/v1/en/07-the-twelve-houses-and-the-angles.md`, `08-planet-sign-house.md` et `09-aspects-relationships-between-planets.md`.

## Audit du contrat éditorial

- Chaque leçon conserve exactement neuf sections de niveau supérieur et exactement deux questions de compréhension avec réponses et explications.
- La leçon 07 conserve les douze maisons, les cuspides, les axes ASC–DSC et MC–IC, ainsi que les quatre angles ASC, DSC, MC et IC.
- Elle indique explicitement que le MC n'est pas le zénith astronomique et que Placidus, Whole Sign et Equal House sont des systèmes pouvant répartir les maisons différemment.
- La leçon 08 conserve la question `quoi × comment × où`, les exemples Soleil Bélier maison 1, Soleil Balance maison 1 et Soleil Bélier maison 10, ainsi que la fiche Mercure Vierge maison 3 / Vénus Balance maison 10 / Mars Capricorne maison 6.
- La leçon 09 conserve 0° conjonction, 60° sextile, 90° carré, 120° trigone et 180° opposition, avec orbe, appliquant, exact et séparant.

## Décisions terminologiques et lacunes consignées

| Concept | Décision d'adaptation | Limite |
| --- | --- | --- |
| House / cusp / house system | `maison` / `cuspide` / `système de maisons` | Localisation du modèle, pas cause. |
| Ascendant / Descendant | `Ascendant (ASC)` / `Descendant (DSC)` | Extrémités de l'axe de l'horizon. |
| Midheaven / IC / zenith | `Milieu du Ciel (MC)` / `Fond du Ciel (IC)` / `zénith` | MC et zénith ne sont pas interchangeables. |
| Planet × sign × house | `planète × signe × maison` | Échafaudage quoi × comment × où, pas recette. |
| Aspect / orb / phase | `aspect` / `orbe` / `appliquant, exact, séparant` | Orbe et phase dépendent de la méthode. |
| Square / trine | `carré` / `trigone` | Aucun n'est automatiquement mauvais ou bon. |

Le runtime glossary n'a pas été étendu et aucune sémantique de maison ou d'aspect n'a été créée. `PROVIDER DECISION DEFERRED`.

## Revue professionnelle et épistémique

Une passe interne indépendante d'édition professionnelle, de terminologie et de parité épistémique a été effectuée. La revue a détecté une option correcte réordonnée dans la deuxième question de la leçon 09 ; elle a été corrigée de manière circonscrite, puis le lot a été relu. Cycles de correction ultérieurs : `1` (maximum autorisé : 2). Le texte conserve le ton modal de la source et évite l'astrologie en recettes, la divination des maisons et les jugements moraux sur les aspects.

L'audit géométrique de la leçon 09 conserve exactement : 50°–52° = 2° de conjonction ; 10°–190° = 180° d'opposition ; 105°–195° = 90° de carré ; 132°–252° = 120° de trigone ; 65°–125° = 60° de sextile. Ce sont des vérifications de géométrie présentée, pas un calcul produit ni une preuve scientifique.

L'heure inconnue reste une limite : aucune maison, cuspide, ASC ou MC n'est créé à partir de midi, minuit ou d'une estimation.

## Sources et niveaux de preuve

Chaque leçon conserve exactement ses URL canoniques. Faculty of Astrological Studies, Astrodienst, Skyscript, Astrology University et The Astrology School servent au vocabulaire et à la séquence traditionnelle ; NASA sert aux références célestes et à l'écliptique. Aucun site n'est présenté comme validation scientifique d'une interprétation.

Aucune recherche web large, prose externe copiée ou traduction automatique n'a été utilisée. Le PRD et les freezes d'architecture et de localisation restent l'autorité produit.

## Gate de publication et non-admission

Résultat du lot : `READY_FOR_OWNER_APPROVAL`, puis approbation du Product Owner pour l'adaptation française des Foundations V1 Lessons 01–12 dans le cadre de `WEB-LEARN-009`. Product Owner approval : `YES` ; runtime admission : `YES` via le chemin Foundations locale-aware existant. Les trois leçons sont `APPROVED / CURRENT / AVAILABLE`. Assessment approval et reward approval : `NO`.

L'admission a étendu uniquement le mapping de contenu et les imports du chemin Foundations locale-aware existant ; aucun loader parallèle, registry parallèle, fallback silencieux ou traduction runtime n'a été créé. Aucun UI, CSS, server, API, BFF, database, migration, Auth, Vault, Commercial, Engine, provider, assessment, reward, renderer ou autre locale n'a été modifié.

## Historique de correction et fichiers exacts

- Adaptation revision : `1` pour Lessons 07–08 ; `2` pour Lesson 09 après la correction de parité.
- Correction cycles after independent internal review : `1`.
- Product Owner approval : `YES` pour les Foundations V1 Lessons 01–12 en français.
- Runtime admission : `YES` ; runtime availability : `AVAILABLE`.

Fichiers exacts de ce lot :

1. `docs/content/foundations/v1/fr/07-the-twelve-houses-and-the-angles.md`
2. `docs/content/foundations/v1/fr/08-planet-sign-house.md`
3. `docs/content/foundations/v1/fr/09-aspects-relationships-between-planets.md`
4. `docs/content/foundations/v1/fr/LESSONS_07_09_REVIEW.md`
