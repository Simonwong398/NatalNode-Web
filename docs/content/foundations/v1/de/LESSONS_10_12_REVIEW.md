---
title: "Foundations V1 de Lessons 10–12 Review Manifest"
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

# Foundations V1 de Lessons 10–12 Review Manifest

## Umfang und Status

Dieses Manifest dokumentiert das abschließende deutsche Foundations-V1-Los: Priorisierung, Synthese des gesamten Horoskops und verantwortungsvolle Nutzung. Die drei Lektionen sind als Class-C-Dokumentation vollständig, doch Product-Owner-Freigabe und Runtime-Aufnahme bleiben ausstehend.

Die Lektionen 10 und 12 erklären `contentRevision: 1`; Lektion 11 erklärt nach einer begrenzten Korrektur der Fragenparität `contentRevision: 2`. Alle behalten `canonicalContentRevision: 1` und sind nach der Aufnahme der deutschen Anpassung im Rahmen von `WEB-LEARN-009` `APPROVED / CURRENT / AVAILABLE`.

## Identität der Lektionen

| Lektion | Lesson ID | Deutscher Titel | Kanonische Revision | Anpassung | Status | Runtime |
| ---: | --- | --- | ---: | ---: | --- | --- |
| 10 | `foundations.chart_priorities` | Was in einem Horoskop zuerst zählt | 1 | 1 | `APPROVED` / `CURRENT` | `AVAILABLE` |
| 11 | `foundations.whole_chart` | Das Horoskop als Ganzes lesen | 1 | 2 | `APPROVED` / `CURRENT` | `AVAILABLE` |
| 12 | `foundations.responsible_astrology` | Astrologie verantwortungsvoll verwenden | 1 | 1 | `APPROVED` / `CURRENT` | `AVAILABLE` |

Kanonische Quellen: `docs/content/foundations/v1/en/10-what-matters-first-in-a-chart.md`, `11-reading-the-chart-as-a-whole.md` und `12-using-astrology-responsibly.md`.

## Audit des Inhaltsvertrags

- Jede Lektion bewahrt genau neun Top-Level-Abschnitte und genau zwei Fragen mit richtiger Antwort und Erklärung.
- Lektion 10 bewahrt Priorisierung als transparente Methode, nicht als Score, Rangfolge oder numerische Gewichtung; sie beginnt mit Eingabequalität und Fakten, fährt mit belegten Ebenen, wiederkehrenden Themen und engen Aspekten fort und endet mit einer Stoppregel.
- Lektion 11 bewahrt den Ablauf mit sieben Schritten, die Unterscheidung zwischen Fakten, Themen und Kontext, neutrale Spannungen sowie die Stoppregel an der Evidenzgrenze.
- Lektion 12 bewahrt die Unterscheidung von Fakt, Konvention und Unsicherheit, die Ablehnung von Diagnose und Hochrisikoentscheidungen, Einwilligung, Privatsphäre, Dritte, Kinder, Selbstbestimmung und Kompetenzgrenzen.

## Terminologieentscheidungen und dokumentierte Lücken

| Begriff | Anpassungsentscheidung | Grenze |
| --- | --- | --- |
| Prioritization / stopping rule | `Priorisierung` / `Stoppregel` | Beobachtungsreihenfolge, kein Score. |
| Whole-chart synthesis / theme | `Synthese` / `Thema` | Verbindet Fakten, beschreibt nicht die ganze Person. |
| Tension / support | `Spannung` / `Unterstützung` | Neutrale Begriffe für mögliche Lesarten. |
| Fact / convention / uncertainty | `Fakt` / `Konvention` / `Unsicherheit` | Drei explizite Ebenen. |
| Consent / privacy / agency | `Einwilligung` / `Privatsphäre` / `Selbstbestimmung` | Praxis- und Autonomieschutz. |

Diese Entscheidungen gelten für den Text und schaffen keine Runtime-glossary-IDs, Fähigkeiten, Hooks oder API-Felder. `PROVIDER DECISION DEFERRED`.

## Professionelle, epistemische und geometrische Prüfung

Eine unabhängige interne Prüfung von professioneller Redaktion und epistemischer Parität wurde durchgeführt. Die Prüfung erkannte eine umgestellte richtige Antwort in der zweiten Frage von Lektion 11; sie wurde begrenzt korrigiert und der Los erneut geprüft. Nachfolgende Korrekturzyklen: `1` (zulässiges Maximum: 2). Die Anpassung stellt Priorisierung nicht als Score, Synthese nicht als Schlüsselwortsammlung und die Schutzgrenzen von Lektion 12 nicht als optional dar.

Die synthetische Geometrie von Lektion 10 bewahrt Sonne 20° Stier = 50° und Mond 20° Löwe = 140°, mit 90° Abstand und Quadrat. Lektion 11 bewahrt dieselbe Prüfung in ihrem Beispiel mit Sonne 20° Stier, Mond 20° Löwe, Merkur 5° Zwillinge und Sonne–Mond-Quadrat. Lektion 12 fügt keine Grade hinzu.

Unbekannte Uhrzeit schließt weiterhin unbelegte Häuser und Achsen aus. Es werden keine Daten erfunden, um eine Synthese zu verstärken, und ein Horoskop wird nicht zum Diagnostizieren, Überwachen, Unter-Druck-Setzen oder Entscheiden für eine andere Person verwendet.

## Finales Locale-Gate

Das interne redaktionelle Gate für alle zwölf deutschen Lektionen ist `READY_FOR_OWNER_APPROVAL`.

| Befund | Ergebnis |
| --- | ---: |
| `BLOCKER` | 0 |
| `MAJOR` | 0 |
| `MINOR` | 0 |
| `EDITORIAL_NOTE` | 0 |
| Vollständige Lektionen | 12 / 12 |

Das Locale wurde dem Product Owner vorgelegt und die deutsche Anpassung der Foundations V1 Lessons 01–12 im Rahmen von `WEB-LEARN-009` freigegeben. Product Owner approval: `YES`. Runtime admission: `YES` über den bestehenden locale-aware Foundations-Pfad; alle deutschen Lektionen sind `APPROVED / CURRENT / AVAILABLE`. Assessment approval und reward approval: `NO`.

## Quellen, Korrektur und sicherer Umfang

Die URL der drei Lektionen werden exakt beibehalten. Astrologische Quellen dienen dem curricularen Kontext; keine Prosa wurde kopiert und keine breite Webrecherche durchgeführt. Produktkanon, Architektur und Lokalisierungspolitik steuern weiterhin Status, Fallback und Veröffentlichung.

Die Aufnahme erweiterte ausschließlich das bestehende Content-Mapping und die Imports des locale-aware Foundations-Pfads; kein neuer Loader, kein paralleles Registry, kein Fallback und kein Runtime-Übersetzungssystem wurde hinzugefügt. UI, CSS, Server, API, BFF, Datenbank, Migrationen, Auth, Vault, Commercial, Engine, Provider, Assessment, Reward, Renderer, Englisch und andere Locales wurden nicht geändert. Keine automatische Übersetzung und keine P1/P2/P3-Funktion wurde hinzugefügt.

## Korrekturverlauf und exakte Dateien

- Adaptation revision: `1` für Lessons 10 und 12; `2` für Lektion 11 nach der Paritätskorrektur.
- Correction cycles after independent internal review: `1`.
- Product Owner approval: `YES` für die Foundations V1 Lessons 01–12 auf Deutsch.
- Runtime admission: `YES`; runtime availability: `AVAILABLE`.

Exakte Dateien dieses Loses:

1. `docs/content/foundations/v1/de/10-what-matters-first-in-a-chart.md`
2. `docs/content/foundations/v1/de/11-reading-the-chart-as-a-whole.md`
3. `docs/content/foundations/v1/de/12-using-astrology-responsibly.md`
4. `docs/content/foundations/v1/de/LESSONS_10_12_REVIEW.md`
