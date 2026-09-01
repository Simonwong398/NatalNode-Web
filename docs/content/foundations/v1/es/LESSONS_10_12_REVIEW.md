---
title: "Foundations V1 es Lessons 10–12 Review Manifest"
courseId: foundations.v1
courseVersion: v1
canonicalLocale: en
locale: es
adaptationRevision: 1
documentKind: LOCALE_ADAPTATION_REVIEW_MANIFEST
contentState: REVIEW
currentness: CURRENT
runtimeAvailability: UNAVAILABLE
---

# Foundations V1 es Lessons 10–12 Review Manifest

## Alcance y estado

Este manifest registra el lote final de la adaptación española de Foundations V1: priorización, síntesis de carta y uso responsable. Las tres lecciones están completas como documentación Class C, pero la aprobación del Product Owner y la admisión runtime permanecen pendientes.

Cada lesson declara `contentRevision: 1`, `canonicalContentRevision: 1`, `contentState: REVIEW`, `currentness: CURRENT` y `runtimeAvailability: UNAVAILABLE`. `CURRENT` confirma alineación con el canon inglés actual; no autoriza publicación.

## Identidad de las lecciones

| Lección | Lesson ID | Título en español | Revisión canónica | Adaptación | Estado | Runtime |
| ---: | --- | --- | ---: | ---: | --- | --- |
| 10 | `foundations.chart_priorities` | Qué importa primero en una carta | 1 | 1 | `REVIEW` / `CURRENT` | `UNAVAILABLE` |
| 11 | `foundations.whole_chart` | Leer la carta como un todo | 1 | 1 | `REVIEW` / `CURRENT` | `UNAVAILABLE` |
| 12 | `foundations.responsible_astrology` | Usar la astrología con responsabilidad | 1 | 1 | `REVIEW` / `CURRENT` | `UNAVAILABLE` |

Las fuentes canónicas son `docs/content/foundations/v1/en/10-what-matters-first-in-a-chart.md`, `11-reading-the-chart-as-a-whole.md` y `12-using-astrology-responsibly.md`.

## Auditoría del contrato editorial

- Cada lesson conserva exactamente nueve secciones de nivel superior y exactamente dos preguntas de comprensión con respuesta correcta y explicación.
- Lesson 10 conserva la priorización como método transparente, no como puntuación, ranking ni peso numérico; empieza por la calidad de entrada y los hechos, continúa con capas respaldadas, temas repetidos y aspectos cercanos, y termina con una regla de parada.
- Lesson 11 conserva la síntesis de siete pasos, la diferencia entre hechos, temas y contexto, las tensiones neutrales y la regla de detenerse ante una frontera de evidencia.
- Lesson 12 conserva la diferencia entre hecho, convención e incertidumbre, el rechazo de diagnóstico y decisiones de alto riesgo, consentimiento, privacidad, terceras personas, niños, agencia y límites de competencia.

## Decisiones terminológicas y vacíos registrados

| Concepto | Decisión de adaptación | Límite |
| --- | --- | --- |
| Prioritization / stopping rule | `priorización` / `regla de parada` | Es un orden de observación, no una puntuación. |
| Whole-chart synthesis / theme | `síntesis` / `tema` | Relaciona hechos; no describe a la persona completa. |
| Tension / support | `tensión` / `apoyo` | Descriptores neutrales de una posible lectura. |
| Fact / convention / uncertainty | `hecho` / `convención` / `incertidumbre` | Se mantienen tres capas explícitas. |
| Consent / privacy / agency | `consentimiento` / `privacidad` / `agencia` | Son salvaguardas de práctica y autonomía. |

Estas decisiones son locales a la redacción y no crean runtime glossary IDs, capacidades, hooks o campos de API. `PROVIDER DECISION DEFERRED`.

## Revisión profesional, epistemológica y geométrica

Se realizó una pasada interna independiente de edición profesional y paridad epistemológica; ciclos de corrección posteriores: `0`. Se comprobó que la adaptación no presenta la priorización como score, que la síntesis no acumula keywords y que las salvaguardas de Lesson 12 no se rebajan por razones de estilo.

La geometría sintética de Lesson 10 conserva Sol 20° Tauro = 50° y Luna 20° Leo = 140°, con separación de 90° y cuadratura. Lesson 11 conserva la misma comprobación en su ejemplo de Sol 20° Tauro, Luna 20° Leo, Mercurio 5° Géminis y cuadratura Sol–Luna. Lesson 12 no añade grados.

La hora desconocida sigue excluyendo casas y ángulos no respaldados. No se inventan datos para fortalecer una síntesis y no se usa una carta para diagnosticar, vigilar, presionar o decidir por otra persona.

## Gate final del locale

El gate editorial interno de las doce lecciones españolas queda en `READY_FOR_OWNER_APPROVAL`.

| Hallazgo | Resultado |
| --- | ---: |
| `BLOCKER` | 0 |
| `MAJOR` | 0 |
| `MINOR` | 0 |
| `EDITORIAL_NOTE` | 0 |
| Lecciones completas | 12 / 12 |

Este resultado significa que el locale puede pasar a revisión del Product Owner. No es aprobación del Product Owner: `NO`. No es admisión runtime: `NO`. Todas las lecciones españolas siguen `REVIEW / CURRENT / UNAVAILABLE`.

## Fuentes, corrección y alcance seguro

Las URL de los tres lessons se conservan exactamente. Las fuentes de tradición astrológica se usan para contexto curricular; no se copió prosa ni se hizo investigación web amplia. El canon de producto, arquitectura y localización sigue gobernando estado, fallback y publicación.

No se modificaron UI, CSS, server, API, BFF, base de datos, migraciones, Auth, Vault, Commercial, Engine, provider, assessment, reward, renderer, inglés ni otros locales. No se añadió traducción automática ni funcionalidad P1/P2/P3.

## Historial y archivos exactos

- Adaptation revision: `1` para Lessons 10–12.
- Correction cycles after independent internal review: `0`.
- Product Owner approval: `NO`.
- Runtime admission: `NO`; runtime availability: `UNAVAILABLE`.

Archivos exactos de este lote:

1. `docs/content/foundations/v1/es/10-what-matters-first-in-a-chart.md`
2. `docs/content/foundations/v1/es/11-reading-the-chart-as-a-whole.md`
3. `docs/content/foundations/v1/es/12-using-astrology-responsibly.md`
4. `docs/content/foundations/v1/es/LESSONS_10_12_REVIEW.md`
