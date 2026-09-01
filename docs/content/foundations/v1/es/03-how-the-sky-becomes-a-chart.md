---
title: "Cómo se convierte el cielo en una carta"
courseId: foundations.v1
courseVersion: v1
lessonId: foundations.chart_calculation
canonicalLocale: en
locale: es
contentRevision: 1
canonicalContentRevision: 2
contentState: APPROVED
currentness: CURRENT
---

# Cómo se convierte el cielo en una carta

## Orientación

Una carta natal comienza con entradas concretas: fecha de nacimiento, hora civil local y lugar. El sistema debe conservar qué se sabe, resolver la relación entre hora local y tiempo universal y ubicar los cuerpos en una referencia geométrica antes de presentarlos como signos, ángulos, casas o aspectos.

La ruta de cálculo explica de dónde sale una etiqueta. No convierte un procedimiento técnico en una afirmación científica sobre el significado de una carta.

## Concepto central

### De la entrada civil a la estructura de la carta

Una descripción profesional de la ruta puede seguir estos pasos:

1. Registrar la fecha, la hora civil local, el lugar y la calidad de cada entrada.
2. Relacionar la hora local con UTC usando las reglas históricas de la zona horaria y el horario de verano cuando corresponda.
3. Detectar horas locales ambiguas o inexistentes en las transiciones históricas, en lugar de ocultar el problema.
4. Convertir el instante en una referencia temporal adecuada para el cálculo.
5. Obtener posiciones angulares y expresarlas como longitud eclíptica.
6. Mapear esa longitud al sector zodiacal que usa el modelo declarado.
7. Calcular, si la entrada lo permite, el Ascendente (ASC) y el Medio Cielo (MC) a partir de la relación entre el horizonte, el meridiano y el lugar.
8. Aplicar el sistema de casas declarado, por ejemplo Placidus, Whole Sign o Equal House.
9. Presentar los hechos calculados y mantener separada cualquier interpretación posterior.

Cada paso depende de la calidad de los anteriores. Una carta no debe parecer más precisa que sus entradas.

### Hora civil local, UTC y reglas históricas

La hora escrita en un registro de nacimiento es una hora civil local, no necesariamente UTC. La conversión puede depender de la zona horaria vigente en esa fecha y de las reglas históricas del horario de verano. También pueden existir horas ambiguas o inexistentes durante un cambio de reloj. Una implementación responsable conserva esa procedencia y hace visible una incertidumbre relevante.

### Longitud eclíptica y signos

Una posición angular puede expresarse como longitud eclíptica: una medida alrededor de la referencia de la eclíptica. El modelo zodiacal declarado convierte ese ángulo en un signo y grado, por ejemplo 15° de Tauro. Esa etiqueta es una representación del resultado geométrico dentro del modelo; no afirma que una constelación cause el resultado.

### ASC, MC y sistemas de casas

El Ascendente es el punto del zodíaco que asciende por el horizonte oriental local; el Medio Cielo es un ángulo relacionado con el meridiano local. El MC no es lo mismo que el cenit astronómico, es decir, la dirección directamente sobre la cabeza. Las casas dependen de la geometría local y del sistema elegido. Placidus, Whole Sign y Equal House pueden organizar la misma carta de maneras distintas; una presentación debe declarar qué sistema usa.

### La hora desconocida limita lo que puede afirmarse

Si la hora de nacimiento es desconocida, el sistema debe conservarla como desconocida. No debe insertar mediodía, medianoche ni una hora estimada para fabricar un ASC, un MC, una cúspide o casas exactas. Puede haber partes educativas de la carta que sigan siendo útiles, pero la interfaz y la interpretación deben distinguir claramente lo que queda limitado.

## Vocabulario profesional

- **Hora civil local** — Hora registrada en el lugar de nacimiento antes de su relación con UTC.
- **UTC** — Escala temporal de referencia utilizada para relacionar una hora local con un instante común.
- **Zona horaria** — Regla que relaciona la hora civil local con una escala temporal y que puede tener historia propia.
- **Horario de verano (DST)** — Ajuste civil de la hora que puede aplicarse en determinados periodos y lugares.
- **Longitud eclíptica** — Medida angular de una posición alrededor de la referencia de la eclíptica.
- **Ascendente (ASC)** — Ángulo asociado con el horizonte oriental local.
- **Medio Cielo (MC)** — Ángulo asociado con el meridiano local; no es el cenit astronómico.
- **Cúspide** — Frontera que inicia una casa dentro del sistema de casas declarado.
- **Sistema de casas** — Convención para organizar las doce casas a partir de la geometría local.

Estos términos describen entradas, transformaciones o salidas del cálculo. No son por sí mismos interpretaciones.

## Ejemplo

Imagina una entrada de enseñanza con fecha, hora civil local y lugar bien documentados. La ruta convierte esa hora según la zona histórica y el DST aplicables, expresa la posición del Sol como 50° de longitud eclíptica y la muestra como 20° de Tauro. Después, con el lugar y el sistema declarado, puede calcular ASC, MC y casas.

Si la hora civil es desconocida, la ruta debe conservar ese estado. Puede mostrar posiciones que no dependen de una hora exacta, pero no debe inventar ASC, MC o cúspides. En cualquier caso, «20° de Tauro» es un hecho presentado por el cálculo; decidir qué podría simbolizar pertenece a la interpretación.

## Mi carta

Abre **Mi carta** y sigue la procedencia que la interfaz haga visible.

- Identifica la fecha, la hora civil local, el lugar y cualquier indicación de precisión o incertidumbre.
- Busca la zona horaria, el DST o la nota histórica que explique cómo se interpretó la entrada.
- Distingue las posiciones expresadas en grados de las etiquetas de signo y de las capas de ASC, MC y casas.
- Comprueba qué sistema de casas se declara cuando aparecen casas o cúspides.
- Si la hora es desconocida, verifica que siga siendo desconocida y que no aparezcan grados exactos de ASC, MC o casas presentados como hechos.

No reproduzcas el cálculo en el navegador ni completes los huecos con una suposición.

## Práctica

Ordena estos elementos de manera razonable y señala cuál es una salida del cálculo: lugar; longitud eclíptica; hora civil local; zona horaria histórica; signo; ASC/MC y casas.

Una secuencia orientativa es: **hora civil local + lugar → zona horaria/DST y UTC → posición angular/longitud eclíptica → signo → ASC/MC → sistema de casas → presentación de hechos**. Si falta la hora, anota la limitación en vez de completar la secuencia con una hora conveniente.

## Comprobación de comprensión

### Pregunta 1

¿Qué secuencia respeta mejor la procedencia de una carta calculada?

- A. Elegir primero una interpretación, inventar una hora que encaje y después dibujar la rueda.
- B. Conservar las entradas, resolver hora local y reglas temporales, obtener posiciones, mapear signos y calcular ángulos/casas solo cuando los datos lo permitan.
- C. Leer el signo solar y deducir desde ahí el lugar, la zona horaria y las casas.
- D. Tratar todas las horas locales como UTC porque el formato escrito parece exacto.

**Respuesta correcta:** B.

**Explicación:** La ruta conserva la procedencia: entradas, tiempo, posiciones, signos y luego capas dependientes del lugar y la hora. La interpretación no reemplaza ningún paso de cálculo.

### Pregunta 2

¿Qué debe hacer el sistema cuando la hora de nacimiento es desconocida?

- A. Usar el mediodía como sustituto silencioso.
- B. Usar la medianoche y presentar las casas como exactas.
- C. Conservar la hora como desconocida y limitar o explicar ASC, MC, cúspides y casas dependientes de ella.
- D. Crear una hora promedio a partir de la fecha y llamarla observada.

**Respuesta correcta:** C.

**Explicación:** La incertidumbre es parte de la entrada. Mantenerla visible protege la procedencia y evita fabricar precisión, aunque otros conceptos de la carta sigan siendo enseñables.

## Idea clave

El cielo se convierte en una carta mediante una cadena declarada de entradas, tiempo, geometría, longitudes, signos, ángulos y casas; una hora desconocida limita esa cadena y nunca debe rellenarse con una suposición.

## Fuentes y lecturas adicionales

- **Foundation Course** — Faculty of Astrological Studies. Introducción a la construcción y lectura de una carta: https://astrology.org.uk/astrology-learning-options/foundation-course/
- **The Birth Chart** — Skyscript. Explicación introductoria de datos de nacimiento y construcción astrológica: https://www.skyscript.co.uk/begin5.html
- **Houses** — Skyscript Glossary. Vocabulario sobre casas y sus sistemas: https://www.skyscript.co.uk/glossary/houses/
- **Chapter 2: Reference Systems** — NASA Science. Contexto de referencias celestes y eclíptica: https://science.nasa.gov/learn/basics-of-space-flight/chapter2-2/
- **What Is the Plane of the Ecliptic?** — NASA. Contexto introductorio de la eclíptica: https://www.nasa.gov/image-article/plane-of-ecliptic/
- **Julian Date Converter; Universal Time; Terrestrial Time; Astronomical Applications Glossary** — U.S. Naval Observatory. Referencias técnicas de tiempo y coordenadas celestes: https://aa.usno.navy.mil/data/JulianDate · https://aa.usno.navy.mil/faq/UT.html · https://aa.usno.navy.mil/faq/TT · https://aa.usno.navy.mil/faq/asa_glossary
- **Time Zones; Theory and pragmatics of the tz code and data** — Internet Assigned Numbers Authority. Referencias de offsets históricos, horario de verano e incertidumbre de la hora civil: https://www.iana.org/time-zones · https://data.iana.org/time-zones/theory.html
