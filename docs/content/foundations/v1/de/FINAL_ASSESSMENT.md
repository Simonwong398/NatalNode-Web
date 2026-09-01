---
title: "Abschließende Foundations-V1-Prüfung"
locale: de
courseId: foundations.v1
courseVersion: v1
checkId: foundations.v1.final_check
canonicalLocale: en
contentRevision: 1
canonicalContentRevision: 1
adaptationRevision: 1
contentState: APPROVED
currentness: CURRENT
runtimeAvailability: AVAILABLE
documentKind: LOCALIZED_ASSESSMENT_CONTENT
questionCount: 10
passThreshold: "8/10"
retryPolicy: unlimited
certification: false
courseCompletionDependency: false
coreReadinessDependency: false
futureRewardEligibilityRelevance: true
productOwnerApproval: YES
runtimeAdmission: YES
---

# Abschließende Foundations-V1-Prüfung

Dies ist die deutsche Adaption der kanonischen abschließenden Prüfung von Foundations V1. Sie prüft, ob die Person Horoskopfakten, astrologische Deutung, Unsicherheit und verantwortungsvolle Nutzung auseinanderhalten kann.

Die Prüfung enthält genau zehn Fragen. 8/10 gilt als bestanden, und die Prüfung kann unbegrenzt wiederholt werden. Das Bestehen ist keine Zertifizierung und ersetzt nicht den Abschluss der zwölf Lektionen. Diese Adaption ist genehmigt und in der Runtime verfügbar; die konsolidierte Product-Owner-Genehmigung gilt für diese Adaption der Revision 1.

Dieses Dokument enthält ausschließlich Prüfungsinhalt. Es definiert weder Benutzeroberfläche noch Runtime, Persistenz, Kontostatus, Belohnungen, kommerzielle Vorteile oder eine Servergrenze.

## Question 01 — Horoskopfakt und Deutung

**Question ID:** `foundations.final_check.q01.chart_fact_interpretation`

**Linked lesson:** `foundations.natal_chart`

Ein zurückgegebenes Horoskopprotokoll enthält: „Sonne: 14° Stier“. Welche Aussage ist ein Horoskopfakt und keine Deutung?

**A.** Diese Stellung garantiert, dass die Person eine stabile Arbeit bevorzugen wird.

**B.** Diese Person ist dauerhaft vorsichtig, weil der Stier ein Erdzeichen ist.

**C.** Das zurückgegebene Ergebnis führt die Sonne bei 14° Stier auf.

**D.** Die Stellung beweist, dass die Identität der Person festgelegt ist.

**Correct answer:** **C**

**Rationale:** Die zurückgegebene Stellung ist ein berichteter Wert des Horoskops. Aussagen über Vorlieben, Identität oder Garantien fügen eine Deutung hinzu und sollten entsprechend eingegrenzt bleiben.

## Question 02 — Zeichen und astronomisches Sternbild

**Question ID:** `foundations.final_check.q02.sign_constellation_distinction`

**Linked lesson:** `foundations.zodiac_structure`

Welche Aussage unterscheidet ein astrologisches Zeichen am besten von einem astronomischen Sternbild?

**A.** Ein Zeichen ist ein physisches Objekt im All, während ein Sternbild eine Persönlichkeitskategorie ist.

**B.** Ein Zeichen ist ein 30-Grad-Sektor in einem astrologischen Tierkreisrahmen, während ein Sternbild eine astronomische Himmelsregion mit offiziellen Grenzen ist; Namen können sich überschneiden, ohne dass Grenzen oder Zwecke gleich sind.

**C.** Die zwölf Zeichen und die 88 Sternbilder sind identische Einteilungen gleicher Größe.

**D.** Ein Sternbild ist nur ein anderer Name für ein Haus im Geburtshoroskop.

**Correct answer:** **B**

**Rationale:** Foundations verwendet Zeichen als zwölfteiligen astrologischen Koordinatenwortschatz. Astronomische Sternbilder sind offiziell abgegrenzte Himmelsregionen unterschiedlicher Größe; gemeinsame Namen machen die Systeme daher nicht austauschbar.

## Question 03 — Unbekannte Geburtszeit

**Question ID:** `foundations.final_check.q03.unknown_birth_time`

**Linked lessons:** `foundations.chart_calculation`, `foundations.houses_angles`, `foundations.whole_chart`

Eine Person kennt Geburtsdatum und Geburtsort, aber nicht die genaue Geburtszeit. Was ist der verantwortungsvolle erste Schritt?

**A.** Die Zeit als unbekannt bewahren und Aszendent, Medium Coeli, Häuser, Häuserspitzen und andere zeitabhängige Aussagen weglassen oder qualifizieren.

**B.** Mittag verwenden, weil dies der am wenigsten voreingenommene Ersatz sei.

**C.** Mitternacht verwenden und die daraus entstehenden Winkel als exakt darstellen.

**D.** Die Zeit aus der Persönlichkeit ableiten, damit jede Horoskopebene vollständig ist.

**Correct answer:** **A**

**Rationale:** Eine unbekannte Zeit ist eine gültige Eingabe, keine Erlaubnis, eine passende Zeit einzusetzen. Die fehlende Eingabe begrenzt, was berechnet und gedeutet werden kann; diese Einschränkung muss sichtbar bleiben.

## Question 04 — Lokale bürgerliche Zeit, Zeitzonen und historische Regeln

**Question ID:** `foundations.final_check.q04.local_time_and_timezone`

**Linked lesson:** `foundations.chart_calculation`

Welche Behandlung einer aufgezeichneten Geburtszeit entspricht der Berechnungsgrenze von Foundations?

**A.** Die Uhrzeit unabhängig vom Geburtsort als UTC behandeln.

**B.** Den aktuellen Versatz der Stadt verwenden, auch wenn die Geburt unter anderen historischen Regeln stattfand.

**C.** Den Versatz auswählen, der die klarste Deutung ergibt.

**D.** Mit dem ursprünglichen lokalen bürgerlichen Datum, der Uhrzeit und dem Ort beginnen; die geltenden historischen Zeitzonen- und Sommerzeitregeln anwenden, um den Zeitpunkt zu bestimmen, und mehrdeutige oder nicht existente Angaben sichtbar halten.

**Correct answer:** **D**

**Rationale:** Der ursprüngliche lokale bürgerliche Eintrag und der Ort sind die Ausgangseingaben. Historische Zeitregeln können den geltenden Versatz ändern, und Mehrdeutigkeit muss gemeldet statt stillschweigend aus Bequemlichkeit aufgelöst werden.

## Question 05 — Planet × Zeichen × Haus

**Question ID:** `foundations.final_check.q05.planet_sign_house_synthesis`

**Linked lesson:** `foundations.planet_sign_house`

Ein unterstütztes Horoskopergebnis ordnet Mars der Jungfrau im 10. Haus zu. Welche ist die beste eingegrenzte erste Deutung?

**A.** Mars in Jungfrau im 10. Haus beweist, dass die Person eine anspruchsvolle Führungskraft wird.

**B.** Die Ebenen getrennt halten: Mars als Funktion von Antrieb oder Handeln betrachten, Jungfrau als möglichen Stil von Verfeinerung oder Praktikabilität und das 10. Haus als unterstützten Kontext einer öffentlichen Rolle innerhalb eines benannten Ansatzes.

**C.** Mars ignorieren und Jungfrau als vollständige Persönlichkeit der Person lesen.

**D.** Das 10. Haus als Beweis behandeln, dass ein bestimmtes Berufsergebnis unausweichlich ist.

**Correct answer:** **B**

**Rationale:** Die drei Ebenen beantworten unterschiedliche Fragen und können nur als eingegrenzte symbolische Deutung verbunden werden. Keine von ihnen begründet für sich allein ein festes Merkmal oder ein garantiertes Ergebnis.

## Question 06 — Aspektgeometrie

**Question ID:** `foundations.final_check.q06.major_aspect_geometry`

**Linked lesson:** `foundations.aspects`

Ein Ergebnis führt die Sonne bei 10° und den Mond bei 100° auf demselben Tierkreis an. Ihr kürzester Winkelabstand beträgt 90°. Welcher Name eines Hauptaspekts passt zu dieser Geometrie?

**A.** Konjunktion

**B.** Opposition

**C.** Quadrat

**D.** Trigon

**Correct answer:** **C**

**Rationale:** Ein Abstand von 90° ist die Zielgeometrie eines Quadrats. Der Aspektname beschreibt eine Winkelbeziehung; er entscheidet für sich allein nicht, ob eine Deutung positiv, negativ oder prädiktiv ist.

## Question 07 — Häuser, Winkel und Häuserspitzen

**Question ID:** `foundations.final_check.q07.houses_angles_cusps`

**Linked lesson:** `foundations.houses_angles`

Welche Zuordnung verwendet den Foundations-Wortschatz korrekt?

**A.** Aszendent und Medium Coeli sind zeit- und ortsabhängige Bezugspunkte; Häuser sind Sektoren im Horoskopraum; eine Häuserspitze ist eine Grenze oder ein Ausgangspunkt eines Hauses.

**B.** Zeichen und Häuser sind austauschbare Namen für dieselben zwölf Einteilungen.

**C.** Das Medium Coeli ist der astronomische Zenit, und der Aszendent ist nur eine Häuserspitze.

**D.** Ein leeres Haus gehört nicht zum Horoskop und hat daher weder Abschnitt noch Häuserspitze.

**Correct answer:** **A**

**Rationale:** Winkel, Häuser und Häuserspitzen sind miteinander verbundene, aber unterschiedliche Ebenen. Ihre Zeit- und Ortsabhängigkeit bedeutet außerdem, dass nicht belegte Geburtszeitdaten keine präzisen Aussagen über Häuser oder Winkel rechtfertigen.

## Question 08 — Priorisierung und Synthese des gesamten Horoskops

**Question ID:** `foundations.final_check.q08.prioritization_and_synthesis`

**Linked lessons:** `foundations.chart_priorities`, `foundations.whole_chart`

Welcher Leseplan folgt der Foundations-Methode?

**A.** Jedem Planeten numerische Stärkewerte geben und den höchsten Wert die Person erklären lassen.

**B.** Dem dramatischsten Stichwort die gesamte Aufmerksamkeit geben und Faktoren verwerfen, die es komplizieren.

**C.** Eine Stellung als vollständige Identitätsaussage behandeln, damit das gesamte Horoskop eine einfache Antwort hat.

**D.** Zuerst belegte Eingaben und die Horoskopstruktur prüfen, dann relevante oder wiederkehrende Beziehungen betrachten, nur belegte Faktoren verbinden, Spannungen qualifizieren und aufhören, wenn die Belege erschöpft sind; das gesamte Horoskop ist nicht die gesamte Person.

**Correct answer:** **D**

**Rationale:** Priorisierung ist eine transparente Reihenfolge der Erklärung, kein Dominanzwert. Die Synthese des gesamten Horoskops verbindet wenige belegte Linien und hält Unsicherheit, konkurrierende Themen und die Grenze um die ganze Person sichtbar.

## Question 09 — Astronomische Präzision und wissenschaftliche Validierung

**Question ID:** `foundations.final_check.q09.precision_is_not_validation`

**Linked lessons:** `foundations.chart_calculation`, `foundations.responsible_astrology`

Eine Berechnung verwendet die korrekte lokale Zeit, historische Zeitzonenregeln, Koordinaten und astronomische Positionen und gibt einen Aspekt präzise an. Welche Schlussfolgerung folgt daraus?

**A.** Die Präzision beweist, dass die symbolische Deutung Ereignisse verursacht.

**B.** Je präziser das Horoskop ist, desto wissenschaftlich validierter ist jede Deutung.

**C.** Präzision kann die Übereinstimmung der zurückgegebenen astronomischen Daten und Horoskopgeometrie mit den Eingaben verbessern, aber sie validiert keine symbolischen, kausalen, persönlichkeitsbezogenen oder prädiktiven Aussagen wissenschaftlich.

**D.** Sobald die Geometrie präzise ist, müssen Unsicherheit und Methode nicht mehr genannt werden.

**Correct answer:** **C**

**Rationale:** Berechnung und Deutung verwenden unterschiedliche Evidenzwege. Eine genaue Verarbeitung der Eingaben kann ein genaues Horoskopergebnis stützen, ohne eine astrologische Konvention in wissenschaftliche Validierung zu verwandeln.

## Question 10 — Verantwortungsvolle Nutzung und Aussagen mit hohen Risiken

**Question ID:** `foundations.final_check.q10.responsible_use`

**Linked lesson:** `foundations.responsible_astrology`

Eine Person bittet die Astrologie, eine Depression zu diagnostizieren und zu entscheiden, ob sie ein verschriebenes Medikament absetzen soll. Welche Antwort ist verantwortungsvoll?

**A.** Eine sichere Diagnose geben, wenn mehrere Stellungen scheinbar übereinstimmen.

**B.** Diagnostische und entscheidende Autorität bei hohen Risiken ablehnen, erklären, dass Astrologie keine klinische oder medizinische Beurteilung ist, zu qualifizierter Versorgung ermutigen und Einwilligung sowie Privatsphäre der Person schützen; gegebenenfalls nur eine engere Reflexionsfrage anbieten.

**C.** Vor der Antwort die Geburtsdaten einer dritten Person erfragen und die Horoskope vergleichen.

**D.** Das Horoskop als Warnung darstellen, aber sagen, die Person bleibe rechtlich für die Entscheidung verantwortlich.

**Correct answer:** **B**

**Rationale:** Verantwortungsvolle Astrologie verweigert Diagnose und Gewissheit bei Entscheidungen mit hohen Risiken. Sie wahrt Selbstbestimmung und Privatsphäre und verweist auf qualifizierte Unterstützung, wenn die Folgen eines Irrtums schwerwiegend sind.

## Content boundary

Diese deutsche Adaption ist `APPROVED / CURRENT / AVAILABLE` und wird in das Runtime aufgenommen, ohne automatisch als Fallback verwendet zu werden. Sie bewahrt die kanonische Revision 1, die zehn IDs, die Antwortschlüssel, die Geometrie 10°/100°/90°, den Umgang mit unbekannter Zeit sowie die Grenzen von Wissenschaft, Verantwortung, Einwilligung und Privatsphäre. Sie definiert weder Persistenz, Zertifizierung, Belohnungen, kommerzielle Vorteile, Konten, API, Engine noch Anbieter.
