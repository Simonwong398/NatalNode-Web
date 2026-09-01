---
title: "Foundations V1 es Lessons 01–03 Review Manifest"
courseId: foundations.v1
courseVersion: v1
canonicalLocale: en
locale: es
adaptationRevision: 1
documentKind: LOCALE_ADAPTATION_REVIEW_MANIFEST
contentState: APPROVED
currentness: CURRENT
runtimeAvailability: AVAILABLE
---

# Foundations V1 es Lessons 01–03 Review Manifest

## Alcance y estado

Este manifest registra la adaptación profesional Class C en español neutro de Foundations V1 para exactamente las lecciones 01–03. Es una adaptación escrita de forma independiente, no una traducción en tiempo de ejecución. Conserva la identidad canónica `foundations.v1`, la procedencia `en` y los límites de astronomía, cálculo, interpretación y uso responsable.

Las tres lecciones usan `contentRevision: 1` y sus revisiones canónicas son 3, 2 y 2. Con la aprobación consolidada de `WEB-LEARN-009`, quedan en `contentState: APPROVED`, `currentness: CURRENT` y `runtimeAvailability: AVAILABLE`. La aprobación se limita a `es` Foundations V1 Lessons 01–12; no aprueba el assessment ni el reward.

## Identidad de las lecciones

| Lección | Lesson ID | Título en español | Revisión canónica | Adaptación | Estado | Runtime |
| ---: | --- | --- | ---: | ---: | --- | --- |
| 01 | `foundations.natal_chart` | Qué es realmente una carta natal | 3 | 1 | `APPROVED` / `CURRENT` | `AVAILABLE` |
| 02 | `foundations.zodiac_structure` | El zodíaco: elementos y modalidades | 2 | 1 | `APPROVED` / `CURRENT` | `AVAILABLE` |
| 03 | `foundations.chart_calculation` | Cómo se convierte el cielo en una carta | 2 | 1 | `APPROVED` / `CURRENT` | `AVAILABLE` |

Fuentes canónicas exactas: `docs/content/foundations/v1/en/01-what-a-natal-chart-actually-is.md`, `02-the-zodiac-structure.md` y `03-how-the-sky-becomes-a-chart.md`. No se modificó el inglés.

## Auditoría del contrato editorial

- Cada lesson conserva exactamente nueve secciones de nivel superior, en este orden: `Orientación`, `Concepto central`, `Vocabulario profesional`, `Ejemplo`, `Mi carta`, `Práctica`, `Comprobación de comprensión`, `Idea clave`, y `Fuentes y lecturas adicionales`.
- Cada lesson conserva exactamente dos preguntas de comprensión, dos respuestas correctas marcadas y dos explicaciones.
- Se mantuvieron el mapa por capas, la separación entre hecho calculado e interpretación, los doce signos, elementos y modalidades, la distinción signo/constelación, la ruta desde hora local a longitud eclíptica y la dependencia de ASC, MC y casas respecto de los datos.
- No se introdujeron puntuación, predicción, diagnóstico, comportamiento determinista, algoritmo de cálculo, traducción automática ni nuevos datos de carta.

## Decisiones terminológicas y vacíos registrados

| Concepto | Decisión de adaptación | Límite |
| --- | --- | --- |
| Natal chart / chart fact / interpretation | `carta natal` / `hecho de la carta` / `interpretación` | Se mantienen como capas distintas. |
| Zodiac sign / constellation | `signo del zodíaco` / `constelación` | Se explica que un sector astrológico regular no es una región astronómica. |
| Element / modality | `Fuego, Tierra, Aire, Agua` / `Cardinal, Fijo, Mutable` | Son categorías tradicionales, no mediciones ni estereotipos. |
| Ecliptic / ecliptic longitude | `eclíptica` / `longitud eclíptica` | Describe geometría y no validación científica de la interpretación. |
| Ascendant / Midheaven / house | `Ascendente (ASC)` / `Medio Cielo (MC)` / `casa` | MC se distingue del cenit; la casa depende de la hora. |
| Local civil time / timezone / DST | `hora civil local` / `zona horaria` / `horario de verano (DST)` | No se añadió un resolver ni datos de zona. |

No se amplió el runtime glossary. Los huecos de variantes locales para estos términos quedan registrados como decisiones editoriales locales y no como nuevos IDs, alias o campos de producto.

## Revisión profesional y epistemológica

Se realizó una pasada interna independiente de redacción, terminología profesional y paridad epistemológica; ciclos de corrección posteriores: `0`. El español es natural y editorial, no una sustitución mecánica palabra por palabra. Se comprobó la fuerza de `podría`, la separación entre convención y hecho, y la ausencia de afirmaciones de destino.

La lección 01 conserva el ejemplo sintético Sol 15° Tauro / Luna 15° Leo con cuadratura, sin presentarlo como una persona real. La lección 02 conserva los doce signos, la cuadrícula elemento × modalidad y el límite signo/constelación. La lección 03 conserva la secuencia de hora local, UTC, reglas históricas, longitud eclíptica, signos, ASC/MC y sistemas Placidus, Whole Sign y Equal House.

La hora desconocida permanece desconocida: no se usa mediodía, medianoche ni una hora estimada para fabricar ASC, MC, cúspides o casas. La geometría y los resultados de cálculo se presentan como hechos del modelo; la interpretación sigue siendo una lectura posible.

## Fuentes y capas de evidencia

Las lecciones conservan exactamente las URL del conjunto canónico. Las fuentes de astrología —Faculty of Astrological Studies, Astrodienst, Skyscript y Astrology University— se usan para secuencia didáctica y vocabulario de tradición. NASA, IAU, U.S. Naval Observatory e IANA se usan para el contexto astronómico, temporal y de referencias. Los documentos internos de producto y arquitectura siguen siendo la autoridad para identidad, estado, locale, fallback y límites de runtime.

No se realizó investigación web amplia, no se copió prosa externa y no se usó traducción automática. `PROVIDER DECISION DEFERRED`.

## Aprobación del Product Owner y admisión runtime

El gate completo de `WEB-LEARN-008` queda registrado como `READY_FOR_OWNER_APPROVAL` y fue aprobado por el Product Owner dentro del alcance de `WEB-LEARN-009`. Product Owner approval: `YES` para `es`, Foundations V1, Lessons 01–12. Runtime admission: `YES` a través de la ruta Foundations locale-aware existente; las lecciones quedan `APPROVED / CURRENT / AVAILABLE`. Assessment y reward approval: `NO`.

La admisión extendió únicamente el mapping de contenido de la ruta Foundations existente; no creó loader, registry paralelo, traducción runtime ni fallback nuevo. No se modificaron UI, CSS, server, API, BFF, base de datos, migraciones, Auth, Vault, Engine, provider, assessment, reward o contenido inglés. Los otros cuatro locales de esta campaña no forman parte de este manifest.

## Historial de corrección y archivos exactos

- Adaptation revision: `1`.
- Correction cycles after independent internal review: `0`.
- Product Owner approval: `YES` para `es` Foundations V1 Lessons 01–12.
- Runtime admission: `YES`; runtime availability: `AVAILABLE`.
- Assessment approval: `NO`; reward approval: `NO`.

Archivos exactos de este lote:

1. `docs/content/foundations/v1/es/01-what-a-natal-chart-actually-is.md`
2. `docs/content/foundations/v1/es/02-the-zodiac-structure.md`
3. `docs/content/foundations/v1/es/03-how-the-sky-becomes-a-chart.md`
4. `docs/content/foundations/v1/es/LESSONS_01_03_REVIEW.md`
