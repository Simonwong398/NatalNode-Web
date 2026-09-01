---
title: "Foundations V1 de Lessons 07–09 Review Manifest"
courseId: foundations.v1
courseVersion: v1
canonicalLocale: en
locale: de
adaptationRevision: 1
documentKind: LOCALE_ADAPTATION_REVIEW_MANIFEST
contentState: APPROVED
currentness: CURRENT
runtimeAvailability: AVAILABLE
---

# Foundations V1 de Lessons 07–09 Review Manifest

## Umfang und Status

Dieses Manifest umfasst genau die deutschen Anpassungen der Lektionen 07–09. Die Arbeit bewahrt Häuserstruktur, Planet-×-Zeichen-×-Haus-Denkgerüst und Aspektgeometrie, ohne Berechnung, Renderer, Horoskopdaten oder Runtime-Logik hinzuzufügen.

Die Lektionen 07–08 erklären `contentRevision: 1`; Lektion 09 erklärt nach einer begrenzten Korrektur der Fragenparität `contentRevision: 2`. Alle behalten `canonicalContentRevision: 1` und sind nach der Aufnahme der deutschen Anpassung im Rahmen von `WEB-LEARN-009` `APPROVED / CURRENT / AVAILABLE`.

## Identität der Lektionen

| Lektion | Lesson ID | Deutscher Titel | Kanonische Revision | Anpassung | Status | Runtime |
| ---: | --- | --- | ---: | ---: | --- | --- |
| 07 | `foundations.houses_angles` | Die zwölf Häuser und die Achsen | 1 | 1 | `APPROVED` / `CURRENT` | `AVAILABLE` |
| 08 | `foundations.planet_sign_house` | Planet × Zeichen × Haus | 1 | 1 | `APPROVED` / `CURRENT` | `AVAILABLE` |
| 09 | `foundations.aspects` | Aspekte: Beziehungen zwischen Planeten | 1 | 2 | `APPROVED` / `CURRENT` | `AVAILABLE` |

Kanonische Quellen: `docs/content/foundations/v1/en/07-the-twelve-houses-and-the-angles.md`, `08-planet-sign-house.md` und `09-aspects-relationships-between-planets.md`.

## Audit des Inhaltsvertrags

- Jede Lektion bewahrt genau neun Top-Level-Abschnitte und genau zwei Verständnisfragen mit Antworten und Erklärungen.
- Lektion 07 bewahrt zwölf Häuser, Häuserspitzen, ASC–DSC- und MC–IC-Achsen sowie die vier Winkel ASC, DSC, MC und IC.
- Sie erklärt ausdrücklich, dass MC nicht der astronomische Zenit ist und Placidus, Whole Sign und Equal House die Häuser unterschiedlich verteilen können.
- Lektion 08 bewahrt die Frage `was × wie × wo`, die Beispiele Sonne Widder 1. Haus, Sonne Waage 1. Haus und Sonne Widder 10. Haus sowie die Übung Merkur Jungfrau 3. Haus / Venus Waage 10. Haus / Mars Steinbock 6. Haus.
- Lektion 09 bewahrt 0° Konjunktion, 60° Sextil, 90° Quadrat, 120° Trigon und 180° Opposition sowie Orbis, applizierend, exakt und separierend.

## Terminologieentscheidungen und dokumentierte Lücken

| Begriff | Anpassungsentscheidung | Grenze |
| --- | --- | --- |
| House / cusp / house system | `Haus` / `Häuserspitze` / `Häusersystem` | Modellort, keine Ursache. |
| Ascendant / Descendant | `Aszendent (ASC)` / `Deszendent (DSC)` | Endpunkte der Horizontachse. |
| Midheaven / IC / zenith | `Medium Coeli (MC)` / `Imum Coeli (IC)` / `Zenit` | MC und Zenit sind nicht austauschbar. |
| Planet × sign × house | `Planet × Zeichen × Haus` | Denkgerüst was × wie × wo, keine Rezeptur. |
| Aspect / orb / phase | `Aspekt` / `Orbis` / `applizierend, exakt, separierend` | Orbis und Phase hängen von der Methode ab. |
| Square / trine | `Quadrat` / `Trigon` | Keiner ist automatisch gut oder schlecht. |

Das Runtime glossary wurde nicht erweitert und keine neue Haus- oder Aspektsemantik wurde definiert. `PROVIDER DECISION DEFERRED`.

## Professionelle und epistemische Prüfung

Eine unabhängige interne Prüfung von professioneller Redaktion, Terminologie und epistemischer Parität wurde durchgeführt. Die Prüfung erkannte eine umgestellte richtige Antwort in der zweiten Frage von Lektion 09; sie wurde begrenzt korrigiert und der Los erneut geprüft. Nachfolgende Korrekturzyklen: `1` (zulässiges Maximum: 2). Der Text vermeidet Rezept-Astrologie, das Erraten von Häusern und moralische Wertungen von Aspekten.

Die Geometrieprüfung der Lektion 09 bewahrt exakt: 50°–52° = 2° Konjunktion; 10°–190° = 180° Opposition; 105°–195° = 90° Quadrat; 132°–252° = 120° Trigon; 65°–125° = 60° Sextil. Dies sind Prüfungen der dargestellten Geometrie, kein Produktberechnungsschritt und kein wissenschaftlicher Beleg.

Unbekannte Uhrzeit bleibt eine Grenze: Häuser, Häuserspitzen, ASC oder MC werden nie aus Mittag, Mitternacht oder einer Schätzung erzeugt.

## Quellen und Evidenzebenen

Jede Lektion bewahrt ihre kanonischen URL exakt. Faculty of Astrological Studies, Astrodienst, Skyscript, Astrology University und The Astrology School dienen Terminologie und traditioneller Reihenfolge; NASA dient Himmelsreferenzen und Ekliptik. Keine Quelle wird als wissenschaftliche Bestätigung einer Deutung dargestellt.

Keine breite Webrecherche, kopierte Prosa oder automatische Übersetzung wurde verwendet. PRD sowie Architektur- und Lokalisierungs-Freeze bleiben die Produktautorität.

## Veröffentlichungs-Gate und Runtime-Aufnahme

Ergebnis dieses Loses: `READY_FOR_OWNER_APPROVAL`; die deutsche Anpassung der Foundations V1 Lessons 01–12 wurde im Rahmen von `WEB-LEARN-009` vom Product Owner freigegeben. Product Owner approval: `YES`; runtime admission: `YES` über den bestehenden locale-aware Foundations-Pfad. Die drei Lektionen sind `APPROVED / CURRENT / AVAILABLE`. Assessment approval und reward approval: `NO`.

Die Aufnahme erweiterte ausschließlich das bestehende Content-Mapping und die Imports des locale-aware Foundations-Pfads; kein paralleler Loader, kein paralleles Registry, kein stiller Fallback und keine Runtime-Übersetzung wurde erstellt. Registry, Route, UI, CSS, Server, API, BFF, Database, Migration, Auth, Vault, Commercial, Engine, Provider, Assessment, Reward, Renderer und andere Locales wurden nicht geändert.

## Korrekturverlauf und exakte Dateien

- Adaptation revision: `1` für Lessons 07–08; `2` für Lektion 09 nach der Paritätskorrektur.
- Correction cycles after independent internal review: `1`.
- Product Owner approval: `YES` für die Foundations V1 Lessons 01–12 auf Deutsch.
- Runtime admission: `YES`; runtime availability: `AVAILABLE`.

Exakte Dateien dieses Loses:

1. `docs/content/foundations/v1/de/07-the-twelve-houses-and-the-angles.md`
2. `docs/content/foundations/v1/de/08-planet-sign-house.md`
3. `docs/content/foundations/v1/de/09-aspects-relationships-between-planets.md`
4. `docs/content/foundations/v1/de/LESSONS_07_09_REVIEW.md`
