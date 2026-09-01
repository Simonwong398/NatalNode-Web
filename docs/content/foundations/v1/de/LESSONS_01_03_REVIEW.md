---
title: "Foundations V1 de Lessons 01–03 Review Manifest"
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

# Foundations V1 de Lessons 01–03 Review Manifest

## Umfang und Status

Dieses Manifest dokumentiert die professionelle Class-C-Anpassung von Foundations V1 für die Lektionen 01–03 auf Deutsch. Die Texte sind unabhängig redigiert und keine Übersetzung zur Laufzeit. Die kanonische Identität `foundations.v1`, die Herkunft `en` und die Grenzen zwischen Astronomie, Berechnung, Deutung und verantwortungsvoller Nutzung bleiben erhalten.

Alle drei Lektionen haben `contentRevision: 1`; ihre kanonischen Revisionen sind 3, 2 und 2. Nach der Aufnahme der deutschen Anpassung im Rahmen von `WEB-LEARN-009` sind sie `contentState: APPROVED`, `currentness: CURRENT` und `runtimeAvailability: AVAILABLE`.

## Identität der Lektionen

| Lektion | Lesson ID | Deutscher Titel | Kanonische Revision | Anpassung | Status | Runtime |
| ---: | --- | --- | ---: | ---: | --- | --- |
| 01 | `foundations.natal_chart` | Was ein Geburtshoroskop tatsächlich ist | 3 | 1 | `APPROVED` / `CURRENT` | `AVAILABLE` |
| 02 | `foundations.zodiac_structure` | Der Tierkreis: Elemente und Modalitäten | 2 | 1 | `APPROVED` / `CURRENT` | `AVAILABLE` |
| 03 | `foundations.chart_calculation` | Wie der Himmel zu einem Horoskop wird | 2 | 1 | `APPROVED` / `CURRENT` | `AVAILABLE` |

Die exakten kanonischen Dateien sind `docs/content/foundations/v1/en/01-what-a-natal-chart-actually-is.md`, `02-the-zodiac-structure.md` und `03-how-the-sky-becomes-a-chart.md`. Englisch wurde nicht geändert.

## Audit des Inhaltsvertrags

- Jede Lektion bewahrt genau neun Top-Level-Abschnitte in der kanonischen Reihenfolge: Orientierung, Zentrales Konzept, Professionelles Vokabular, Beispiel, Mein Horoskop, Übung, Verständnisprüfung, Kerngedanke sowie Quellen und weiterführende Literatur.
- Jede Lektion enthält genau zwei Verständnisfragen, zwei markierte richtige Antworten und zwei Erklärungen.
- Bewahrt werden die Karte mit mehreren Ebenen, die Trennung von Berechnungsfakt und Deutung, die zwölf Zeichen, Elemente und Modalitäten, die Unterscheidung von Zeichen und Sternbild, der Weg von lokaler Zeit zu ekliptikaler Länge sowie die Abhängigkeit von ASC, MC und Häusern von den Eingaben.
- Es wurden kein Score, keine Vorhersage, Diagnose, deterministische Behauptung, Berechnungslogik, automatische Übersetzung oder neue Horoskopdaten eingeführt.

## Terminologieentscheidungen und dokumentierte Lücken

| Begriff | Anpassungsentscheidung | Grenze |
| --- | --- | --- |
| Natal chart / chart fact / interpretation | `Geburtshoroskop` / `Horoskopfakt` / `Deutung` | Ebenen bleiben getrennt. |
| Zodiac sign / constellation | `Tierkreiszeichen` / `Sternbild` | Regelmäßiger astrologischer Sektor wird von astronomischer Region unterschieden. |
| Element / modality | `Feuer, Erde, Luft, Wasser` / `Kardinal, Fix, Veränderlich` | Traditionelle Kategorien, keine Messungen oder Stereotype. |
| Ecliptic / ecliptic longitude | `Ekliptik` / `ekliptikale Länge` | Geometrie, keine wissenschaftliche Bestätigung der Deutung. |
| Ascendant / Midheaven / house | `Aszendent (ASC)` / `Medium Coeli (MC)` / `Haus` | MC wird vom Zenit unterschieden; das Haus hängt von der Zeit ab. |
| Local civil time / timezone / DST | `lokale bürgerliche Zeit` / `Zeitzone` / `Sommerzeit (DST)` | Kein Zeitauflöser oder Zeitzonendatensatz wurde hinzugefügt. |

Die lokalen Varianten werden im Text erklärt und erweitern weder das Runtime glossary noch dessen IDs, Aliase oder Produktfelder.

## Professionelle und epistemische Prüfung

Eine unabhängige interne Prüfung von Sprache, Fachterminologie und epistemischer Parität wurde durchgeführt; nachfolgende Korrekturzyklen: `0`. Das Deutsch ist redaktionell formuliert und keine mechanische Wort-für-Wort-Ersetzung. Möglichkeitssprache, die Trennung von Konvention und Fakt sowie das Fehlen deterministischer Aussagen wurden geprüft.

Lektion 01 bewahrt das synthetische Beispiel Sonne 15° Stier / Mond 15° Löwe mit Quadrat, ausdrücklich nicht als reale Person. Lektion 02 bewahrt zwölf Zeichen, Element-×-Modalitäts-Tabelle und Zeichen/Sternbild-Grenze. Lektion 03 bewahrt die Kette lokale Zeit, UTC, historische Regeln, ekliptikale Länge, Zeichen, ASC/MC und Placidus, Whole Sign und Equal House.

Unbekannte Geburtszeit bleibt unbekannt: Mittag, Mitternacht oder eine Schätzung werden nie verwendet, um ASC, MC, Häuserspitzen oder Häuser zu erzeugen. Geometrie und Berechnungsergebnisse werden als Modellfakten dargestellt; Deutung bleibt eine mögliche Lesart.

## Quellen und Evidenzebenen

Die kanonischen URL werden exakt beibehalten. Faculty of Astrological Studies, Astrodienst, Skyscript und Astrology University dienen curricularer Reihenfolge und astrologischem Traditionsvokabular. NASA, IAU, U.S. Naval Observatory und IANA dienen astronomischem, zeitlichem und Referenzkontext. Interne Dokumente sind maßgeblich für Identität, Status, Locale, Fallback und Runtime.

Keine breite Webrecherche, keine kopierte externe Prosa und keine automatische Übersetzung wurden verwendet. `PROVIDER DECISION DEFERRED`.

## Veröffentlichungs-Gate und Runtime-Aufnahme

Das Ergebnis der internen Redaktion war `READY_FOR_OWNER_APPROVAL`; die deutsche Anpassung der Foundations V1 Lessons 01–12 wurde im Rahmen von `WEB-LEARN-009` vom Product Owner freigegeben. Product Owner approval: `YES`. Runtime admission: `YES` über den bestehenden locale-aware Foundations-Pfad; die Lektionen sind `APPROVED / CURRENT / AVAILABLE`. Assessment approval und reward approval: `NO`.

Die Aufnahme erweiterte ausschließlich das bestehende Content-Mapping und die Imports des locale-aware Foundations-Pfads; es wurde kein paralleler Loader, kein paralleles Registry, kein stiller Fallback und keine Runtime-Übersetzung erstellt. Der explizite Fallback bleibt auf nicht verfügbare lokalisierte Inhalte begrenzt. UI, CSS, Server, API, BFF, Datenbank, Migration, Auth, Vault, Engine, Provider, Assessment, Reward und englischer Inhalt wurden nicht geändert. Die anderen Locale-Lose gehören nicht zu diesem Manifest.

## Korrekturverlauf und exakte Dateien

- Adaptation revision: `1`.
- Correction cycles after independent internal review: `0`.
- Product Owner approval: `YES` für die Foundations V1 Lessons 01–12 auf Deutsch.
- Runtime admission: `YES`; runtime availability: `AVAILABLE`.

Exakte Dateien dieses Loses:

1. `docs/content/foundations/v1/de/01-what-a-natal-chart-actually-is.md`
2. `docs/content/foundations/v1/de/02-the-zodiac-structure.md`
3. `docs/content/foundations/v1/de/03-how-the-sky-becomes-a-chart.md`
4. `docs/content/foundations/v1/de/LESSONS_01_03_REVIEW.md`
