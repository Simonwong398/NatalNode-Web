---
title: "Foundations V1 es Lessons 07–09 Review Manifest"
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

# Foundations V1 es Lessons 07–09 Review Manifest

## Alcance y estado

Este manifest cubre exactamente las adaptaciones españolas de las lecciones 07–09. El trabajo conserva las estructuras de casas, el andamiaje planeta × signo × casa y la geometría de aspectos sin añadir cálculo, renderer, datos de carta ni lógica runtime.

Las lecciones 07–08 declaran `contentRevision: 1` y Lesson 09 declara `contentRevision: 2` después de una corrección acotada de paridad de respuesta; todas mantienen `canonicalContentRevision: 1`. Con la aprobación consolidada de `WEB-LEARN-009`, quedan en `APPROVED / CURRENT / AVAILABLE`. La aprobación se limita a `es` Foundations V1 Lessons 01–12; no aprueba el assessment ni el reward.

## Identidad de las lecciones

| Lección | Lesson ID | Título en español | Revisión canónica | Adaptación | Estado | Runtime |
| ---: | --- | --- | ---: | ---: | --- | --- |
| 07 | `foundations.houses_angles` | Las doce casas y los ángulos | 1 | 1 | `APPROVED` / `CURRENT` | `AVAILABLE` |
| 08 | `foundations.planet_sign_house` | Planeta × signo × casa | 1 | 1 | `APPROVED` / `CURRENT` | `AVAILABLE` |
| 09 | `foundations.aspects` | Aspectos: relaciones entre planetas | 1 | 2 | `APPROVED` / `CURRENT` | `AVAILABLE` |

Las fuentes canónicas son `docs/content/foundations/v1/en/07-the-twelve-houses-and-the-angles.md`, `08-planet-sign-house.md` y `09-aspects-relationships-between-planets.md`.

## Auditoría del contrato editorial

- Cada lesson conserva exactamente nueve secciones de nivel superior y exactamente dos preguntas de comprensión con respuestas y explicaciones.
- Lesson 07 conserva las doce casas, las cúspides, los ejes ASC–DSC y MC–IC, y los cuatro ángulos ASC, DSC, MC e IC.
- Lesson 07 mantiene explícitamente que el MC no equivale al cenit astronómico y que Placidus, Whole Sign y Equal House son sistemas de casas que pueden distribuir las casas de forma distinta.
- Lesson 08 conserva la pregunta `qué × cómo × dónde`, los ejemplos Sol Aries 1.ª, Sol Libra 1.ª y Sol Aries 10.ª, y la hoja Mercurio Virgo 3.ª / Venus Libra 10.ª / Marte Capricornio 6.ª.
- Lesson 09 conserva 0° conjunción, 60° sextil, 90° cuadratura, 120° trígono y 180° oposición, además de orbe, aplicativo, exacto y separativo.

## Decisiones terminológicas y vacíos registrados

| Concepto | Decisión de adaptación | Límite |
| --- | --- | --- |
| House / cusp / house system | `casa` / `cúspide` / `sistema de casas` | La casa es una ubicación del modelo, no una causa. |
| Ascendant / Descendant | `Ascendente (ASC)` / `Descendente (DSC)` | Se mantienen como extremos del eje del horizonte. |
| Midheaven / IC / zenith | `Medio Cielo (MC)` / `Fondo del Cielo (IC)` / `cenit` | MC y cenit no son intercambiables. |
| Planet × sign × house | `planeta × signo × casa` | Andamiaje qué × cómo × dónde, no receta. |
| Aspect / orb / phase | `aspecto` / `orbe` / `aplicativo, exacto, separativo` | La fase y el orbe dependen del método declarado. |
| Square / trine | `cuadratura` / `trígono` | Ninguno es automáticamente malo o bueno. |

No se amplió el runtime glossary y no se definió ninguna semántica nueva para casas o aspectos. `PROVIDER DECISION DEFERRED`.

## Revisión profesional y epistemológica

Se realizó una pasada interna independiente de edición profesional, terminología y paridad epistemológica. La revisión detectó una opción correcta reordenada en la segunda pregunta de Lesson 09; se corrigió de forma acotada y se volvió a revisar el lote. Ciclos de corrección posteriores: `1` (máximo permitido: 2). El texto usa los términos españoles de forma estable y conserva el alcance modal de la fuente. No introduce cookbook astrology, adivinación de casas ni valoración moral de aspectos.

La auditoría geométrica de Lesson 09 conserva exactamente estas relaciones sintéticas: 50°–52° = 2° de conjunción; 10°–190° = 180° de oposición; 105°–195° = 90° de cuadratura; 132°–252° = 120° de trígono; 65°–125° = 60° de sextil. Son comprobaciones de geometría presentada, no cálculo de producto ni evidencia científica.

La hora desconocida permanece como límite: no se crean casas, cúspides, ASC o MC a partir de mediodía, medianoche o estimaciones. La ausencia de una capa no se resuelve con una narración más completa.

## Fuentes y capas de evidencia

Cada lesson conserva exactamente las URL canónicas. Faculty of Astrological Studies, Astrodienst, Skyscript, Astrology University y The Astrology School se usan para secuencia y vocabulario tradicional. NASA se usa para referencias celestes y eclíptica; ningún recurso se presenta como validación científica de una interpretación.

No se realizó investigación web amplia, no se reprodujo prosa externa y no se usó traducción automática. La autoridad de producto sigue siendo el PRD y los freezes de arquitectura y localización.

## Aprobación del Product Owner y admisión runtime

El gate completo de `WEB-LEARN-008` queda registrado como `READY_FOR_OWNER_APPROVAL` y fue aprobado por el Product Owner dentro del alcance de `WEB-LEARN-009`. Product Owner approval: `YES` para `es`, Foundations V1, Lessons 01–12. Runtime admission: `YES` a través de la ruta Foundations locale-aware existente; las lecciones quedan `APPROVED / CURRENT / AVAILABLE`. Assessment y reward approval: `NO`.

La admisión extendió únicamente el mapping de contenido y los imports de la ruta Foundations locale-aware existente; no creó loader, registry paralelo, traducción runtime ni fallback nuevo. No se modificaron UI, CSS, server, API, BFF, database, migration, Auth, Vault, Commercial, Engine, provider, assessment, reward, renderer ni los demás locales.

## Historial de corrección y archivos exactos

- Adaptation revision: `1` para Lessons 07–08; `2` para Lesson 09 después de la corrección de paridad.
- Correction cycles after independent internal review: `1`.
- Product Owner approval: `YES` para `es` Foundations V1 Lessons 01–12.
- Runtime admission: `YES`; runtime availability: `AVAILABLE`.
- Assessment approval: `NO`; reward approval: `NO`.

Archivos exactos de este lote:

1. `docs/content/foundations/v1/es/07-the-twelve-houses-and-the-angles.md`
2. `docs/content/foundations/v1/es/08-planet-sign-house.md`
3. `docs/content/foundations/v1/es/09-aspects-relationships-between-planets.md`
4. `docs/content/foundations/v1/es/LESSONS_07_09_REVIEW.md`
