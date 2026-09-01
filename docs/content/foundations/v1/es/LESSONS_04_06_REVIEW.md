---
title: "Foundations V1 es Lessons 04–06 Review Manifest"
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

# Foundations V1 es Lessons 04–06 Review Manifest

## Alcance y estado

Este manifest registra la adaptación profesional Class C en español neutro de las lecciones 04–06 de Foundations V1. El lote conserva la identidad canónica y la fuerza epistemológica de las lecciones inglesas; no crea una nueva línea de contenido ni una capa de traducción runtime.

Las lecciones 04–05 tienen `contentRevision: 1` y Lesson 06 tiene `contentRevision: 2` después de una corrección acotada de paridad de respuesta; las tres mantienen `canonicalContentRevision: 1`. Su estado es `REVIEW`, su currentness es `CURRENT` y su disponibilidad es `UNAVAILABLE`. Ninguna de estas condiciones equivale a aprobación del Product Owner.

## Identidad de las lecciones

| Lección | Lesson ID | Título en español | Revisión canónica | Adaptación | Estado | Runtime |
| ---: | --- | --- | ---: | ---: | --- | --- |
| 04 | `foundations.sun_moon` | El Sol y la Luna | 1 | 1 | `REVIEW` / `CURRENT` | `UNAVAILABLE` |
| 05 | `foundations.mercury_venus_mars` | Mercurio, Venus y Marte | 1 | 1 | `REVIEW` / `CURRENT` | `UNAVAILABLE` |
| 06 | `foundations.jupiter_saturn_outer_planets` | Júpiter, Saturno y los planetas exteriores | 1 | 2 | `REVIEW` / `CURRENT` | `UNAVAILABLE` |

Las fuentes canónicas exactas son `docs/content/foundations/v1/en/04-the-sun-and-moon.md`, `05-mercury-venus-and-mars.md` y `06-jupiter-saturn-and-the-outer-planets.md`.

## Auditoría del contrato editorial

- Cada lesson conserva exactamente nueve secciones de nivel superior, en la secuencia canónica: orientación, concepto central, vocabulario profesional, ejemplo, mi carta, práctica, comprobación de comprensión, idea clave y fuentes/lecturas adicionales.
- Cada lesson contiene exactamente dos preguntas, dos respuestas correctas marcadas y dos explicaciones.
- Lesson 04 mantiene la diferencia astronómica entre el Sol como estrella y la Luna como satélite natural, y las funciones astrológicas posibles de orientación/agencia/vitalidad frente a respuesta/necesidades/hábitos.
- Lesson 05 mantiene Mercurio, Venus y Marte como focos posibles de comunicación/coordinación, valoración/atracción y acción/esfuerzo, y rechaza IQ, romance exclusivo y estereotipos de género.
- Lesson 06 mantiene expansión y sentido para Júpiter como lenguaje posible, límites y estructura para Saturno, contexto de cohorte para los cuerpos lentos y la clasificación astronómica de Plutón como planeta enano.

## Decisiones terminológicas y vacíos registrados

| Concepto | Decisión de adaptación | Límite |
| --- | --- | --- |
| Luminary / Sun / Moon | `luminario` / `Sol` / `Luna` | Se conserva estrella frente a satélite natural. |
| Orientation, agency, vitality | `orientación, agencia, vitalidad` | Son temas interpretativos posibles, no capacidades garantizadas. |
| Response, needs, habits | `respuesta, necesidades, hábitos` | No son diagnóstico ni explicación total de la vida emocional. |
| Communication, values, action | `comunicación, valoración, acción` | Se usan para preguntas abiertas y con contexto. |
| Outer planets / cohort | `planetas exteriores` / `cohorte` | El movimiento lento no determina la experiencia individual. |
| Dwarf planet | `planeta enano` | La clasificación científica no se confunde con uso simbólico. |

Los términos locales se explican en las lecciones porque aún no existe una aprobación de variantes de runtime para estos conceptos. No se crearon IDs, aliases, etiquetas de interfaz ni metadatos de producción.

## Revisión profesional y epistemológica

Se realizó una pasada interna independiente de edición, terminología y paridad epistemológica. La revisión detectó una discordancia en la opción correcta de la Pregunta 1 de Lesson 06; se corrigió de forma acotada y se volvió a revisar el lote. Ciclos de corrección posteriores: `1` (máximo permitido: 2). La adaptación usa español profesional, lenguaje modal y ejemplos sintéticos. No convierte ninguna asociación planetaria en causa física, predicción, diagnóstico o clasificación personal.

La comprobación geométrica de Lesson 04 conserva Sol 8° Cáncer = 98° y Luna 8° Libra = 188°, con separación exacta de 90° y cuadratura. La lección declara que esa geometría es un hecho de carta y que cualquier significado posterior es interpretación. Lessons 05–06 no introducen nuevos grados científicos ni lógica de cálculo.

Se conservaron los límites de Lesson 06: Júpiter no garantiza suerte, Saturno no es castigo, los planetas exteriores pueden aportar contexto generacional y Plutón sigue siendo un planeta enano en la referencia astronómica. `PROVIDER DECISION DEFERRED`.

## Fuentes y capas de evidencia

Se conservaron exactamente las URL canónicas de cada lección. Faculty of Astrological Studies, Astrodienst, Astrology University y The Astrology School aportan contexto curricular o de tradición. NASA aporta hechos sobre Sol, Luna, sistema solar y Plutón; IAU aporta contexto de clasificación. Las fuentes no se usan como prueba de validación científica de la interpretación.

No hubo investigación web amplia, copia de prosa externa ni traducción automática. La evidencia de producto continúa siendo `docs/PRD.md` y los documentos congelados de Foundations y localización.

## Gate de publicación y no admisión

Resultado del lote: `READY_FOR_INTERNAL_LOCALE_REVIEW`. Product Owner approval: `NO`. Runtime admission: `NO`. Las tres lecciones permanecen `REVIEW / CURRENT / UNAVAILABLE`, y no se ha añadido fallback, loader, registry mapping ni comportamiento de producto para `es`.

No se tocaron UI, CSS, server, API, BFF, base de datos, migraciones, Auth, Vault, Commercial, Engine, provider, assessment, reward o los otros locales. La adaptación es solo documental.

## Historial de corrección y archivos exactos

- Adaptation revision: `1` para Lessons 04–05; `2` para Lesson 06 después de la corrección de paridad.
- Correction cycles after independent internal review: `1`.
- Product Owner approval: `NO`.
- Runtime admission: `NO`; runtime availability: `UNAVAILABLE`.

Archivos exactos de este lote:

1. `docs/content/foundations/v1/es/04-the-sun-and-moon.md`
2. `docs/content/foundations/v1/es/05-mercury-venus-and-mars.md`
3. `docs/content/foundations/v1/es/06-jupiter-saturn-and-the-outer-planets.md`
4. `docs/content/foundations/v1/es/LESSONS_04_06_REVIEW.md`
