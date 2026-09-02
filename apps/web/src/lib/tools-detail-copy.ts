import type { SupportedLocale } from './localization.js';

type SignElement = 'Fire' | 'Earth' | 'Air' | 'Water';
type SignModality = 'Cardinal' | 'Fixed' | 'Mutable';

export interface ToolDetailCopy {
  common: {
    makeSelection: string;
    clearSelection: string;
    clearSelections: string;
    noscript: string;
  };
  sign: {
    title: string;
    description: string;
    selectionTitle: string;
    fieldLabel: string;
    optionPlaceholder: string;
    boundary: string;
    empty: string;
    representEyebrow: string;
    representTitle: string;
    representDescription: string;
    elementsEyebrow: string;
    elementsTitle: string;
    elementMeanings: Record<SignElement, string>;
    modalitiesEyebrow: string;
    modalitiesTitle: string;
    modalityMeanings: Record<SignModality, string>;
    howEyebrow: string;
    howTitle: string;
    howDescription: string;
    calculationEyebrow: string;
    calculationTitle: string;
    calculationDescription: string;
    resultTitle: string;
    resultSummary: string;
    elementLabel: string;
    modalityLabel: string;
    coreStyleLabel: string;
    constructive: string;
    tension: string;
  };
  house: {
    title: string;
    description: string;
    selectionTitle: string;
    fieldLabel: string;
    optionPlaceholder: string;
    boundary: string;
    empty: string;
    representEyebrow: string;
    representTitle: string;
    representDescription: string;
    sequenceEyebrow: string;
    sequenceTitle: string;
    sequenceDescription: string;
    timeEyebrow: string;
    timeTitle: string;
    timeDescription: string;
    howEyebrow: string;
    howTitle: string;
    howDescription: string;
    calculationEyebrow: string;
    calculationTitle: string;
    calculationDescription: string;
    resultTitle: string;
    resultSummary: string;
    resultCoreDomain: string;
    resultKeyThemes: string;
    resultConstructive: string;
    resultTension: string;
    coreDomainLabel: string;
    keyThemesLabel: string;
    constructiveLabel: string;
    tensionLabel: string;
  };
  aspect: {
    title: string;
    description: string;
    selectionTitle: string;
    planetALabel: string;
    aspectLabel: string;
    planetBLabel: string;
    planetPlaceholder: string;
    aspectPlaceholder: string;
    boundary: string;
    empty: string;
    whatEyebrow: string;
    whatTitle: string;
    whatDescription: string;
    howEyebrow: string;
    howTitle: string;
    howDescription: string;
    calculationEyebrow: string;
    calculationTitle: string;
    calculationDescription: string;
    resultParagraphOne: string;
    resultParagraphTwo: string;
    resultParagraphThree: string;
  };
}

const ENGLISH_COPY: ToolDetailCopy = {
  common: {
    makeSelection: 'Make a selection',
    clearSelection: 'Clear selection',
    clearSelections: 'Clear selections',
    noscript: 'JavaScript is required to generate the selected interpretation in this browser.'
  },
  sign: {
    title: 'Explore a zodiac sign',
    description: 'Select one sign to explore the symbolic element, modality, and interpretive themes associated with it.',
    selectionTitle: 'Choose a zodiac sign',
    fieldLabel: 'Zodiac sign',
    optionPlaceholder: 'Choose a sign',
    boundary: 'This tool explains a zodiac sign you select. It does not calculate a sign from your birth date or planetary position.',
    empty: 'Choose a zodiac sign to see a focused interpretation. No sign is preselected.',
    representEyebrow: 'What signs represent',
    representTitle: 'A vocabulary for style',
    representDescription: 'In astrology, zodiac signs are interpretive categories used to describe ways a theme may be expressed. A sign can offer language for qualities such as directness, patience, curiosity, or sensitivity; it does not define a person or determine what they will do.',
    elementsEyebrow: 'Elements',
    elementsTitle: 'Four symbolic lenses',
    elementMeanings: {
      Fire: 'A symbolic lens for initiative, warmth, visibility, and active expression.',
      Earth: 'A symbolic lens for steadiness, embodiment, practical attention, and tangible values.',
      Air: 'A symbolic lens for thought, language, exchange, and perspective.',
      Water: 'A symbolic lens for feeling, imagination, memory, and connection.'
    },
    modalitiesEyebrow: 'Modalities',
    modalitiesTitle: 'Three ways energy is described',
    modalityMeanings: {
      Cardinal: 'A way of describing energy that initiates, begins, and responds to a starting point.',
      Fixed: 'A way of describing energy that sustains, concentrates, and develops consistency.',
      Mutable: 'A way of describing energy that adapts, integrates, and makes room for change.'
    },
    howEyebrow: 'How to use the lookup',
    howTitle: 'Read the result as a starting point',
    howDescription: 'Begin with the element and modality, then notice how the core style and constructive expression fit together. The potential tension is an invitation to reflect on balance, not a prediction or a fixed label. Compare this tool with the Aspect Lookup when you want to explore another piece of astrology vocabulary.',
    calculationEyebrow: 'Calculation vs interpretation',
    calculationTitle: 'An explanation, not a sign calculator',
    calculationDescription: 'This tool explains a zodiac sign you select. It does not calculate a sign from your birth date or planetary position, and it does not claim scientific validation for astrological interpretation. For an introduction to chart inputs and calculation boundaries, read What Is a Natal Chart? or return to the Tools hub.',
    resultTitle: '{sign}: an interpretive snapshot',
    resultSummary: '{sign} is described here as {style}.',
    elementLabel: 'Element',
    modalityLabel: 'Modality',
    coreStyleLabel: 'Core style',
    constructive: 'Constructive expression: {expression}.',
    tension: 'Potential tension: {tension}'
  },
  house: {
    title: 'Explore an astrological house',
    description: 'Select one of the twelve numbered houses to explore its core domain, key themes, constructive expression, and balancing considerations.',
    selectionTitle: 'Choose a numbered house',
    fieldLabel: 'Astrological house',
    optionPlaceholder: 'Choose a house',
    boundary: 'This tool explains a house you select. It does not calculate house cusps or determine which house a planet occupies in a birth chart.',
    empty: 'Choose a numbered house to see a focused interpretation. No house is preselected.',
    representEyebrow: 'What houses represent',
    representTitle: 'Context for chart themes',
    representDescription: 'Within astrology’s interpretive framework, houses describe areas of life or experience where a chart theme may be considered. They are not physical places and they do not determine a person’s choices. This lookup provides a compact vocabulary for reflection, separate from the calculation of any chart.',
    sequenceEyebrow: 'How the twelve houses differ',
    sequenceTitle: 'A sequence of domains',
    sequenceDescription: 'The twelve houses form a sequence of related but distinct domains, from identity and self-direction through private reflection. In a full chart, a house supplies context for a planet or sign; the house itself is not a prediction. Choose a number above to focus on one domain at a time.',
    timeEyebrow: 'Why birth time can matter',
    timeTitle: 'House calculation is a separate task',
    timeDescription: 'In an actual natal chart, house cusps and planet-house placements can depend on birth time, birth location, and the chosen house system. If the exact birth time is unknown, exact house-based claims should not be assumed. This page collects none of that information and does not calculate cusps, angles, or placements.',
    howEyebrow: 'How to use the lookup',
    howTitle: 'Read the result as a starting point',
    howDescription: 'Choose a house, read its core domain and key themes, then consider the constructive expression and balancing consideration together. The language is educational and symbolic. Continue with the Sign Lookup or Aspect Lookup for related vocabulary.',
    calculationEyebrow: 'House meaning vs calculation',
    calculationTitle: 'An explanation, not a house calculator',
    calculationDescription: 'Different house systems can place cusps or planets differently, but this lookup does not select, compare, or calculate a house system. Terms such as maintenance, shared resources, transition, privacy, and less-visible processes are interpretive prompts; they are not medical diagnoses, financial predictions, death predictions, or psychiatric labels. For more context on chart inputs, read What Is a Natal Chart? or return to the Tools hub.',
    resultTitle: '{house}: an interpretive snapshot',
    resultSummary: 'In astrological interpretation, the {house} is considered a symbolic area of life or experience for chart reflection.',
    resultCoreDomain: '{domain}',
    resultKeyThemes: '{themes}',
    resultConstructive: '{expression}',
    resultTension: '{tension}',
    coreDomainLabel: 'Core domain',
    keyThemesLabel: 'Key themes',
    constructiveLabel: 'Constructive expression',
    tensionLabel: 'Balancing consideration'
  },
  aspect: {
    title: 'Explore a planetary aspect',
    description: 'Choose two planets and one major aspect to explore how astrology describes the relationship between those themes.',
    selectionTitle: 'Planet A + aspect + Planet B',
    planetALabel: 'Planet A',
    aspectLabel: 'Major aspect',
    planetBLabel: 'Planet B',
    planetPlaceholder: 'Choose a planet',
    aspectPlaceholder: 'Choose an aspect',
    boundary: 'Select an aspect you already want to understand. The same two planets represent one symmetric combination whichever order you choose.',
    empty: 'Choose Planet A, a major aspect, and Planet B to see a focused interpretation. No combination is preselected.',
    whatEyebrow: 'What this tool does',
    whatTitle: 'Start with a known combination',
    whatDescription: 'A planetary aspect is an interpretive way of describing a relationship between two chart bodies. This tool lets you name the two bodies and the major aspect first, then gives you a compact explanation of the themes and dynamic involved.',
    howEyebrow: 'How to use the result',
    howTitle: 'Read it as a starting point',
    howDescription: 'Notice the two planetary themes, then consider how the aspect dynamic might bring them into conversation. The wording is educational and symbolic; it does not make a prediction about a person or a chart.',
    calculationEyebrow: 'Calculation vs interpretation',
    calculationTitle: 'An explanation, not an aspect detector',
    calculationDescription: 'This tool explains an aspect you select. It does not calculate planetary positions, measure angles or orbs, or determine whether the aspect exists in a birth chart. For an introduction to chart inputs and calculation transparency, read What Is a Natal Chart? or return to the Tools hub.',
    resultParagraphOne: '{first} can be considered alongside {second} through the selected {aspect}. This is an educational starting point for noticing how two symbolic themes may be discussed together.',
    resultParagraphTwo: 'A {aspect} offers one way to describe the relationship between those themes. The combination may make each theme more noticeable within the same area of reflection.',
    resultParagraphThree: 'Use the relationship as a prompt for conscious reflection rather than a fixed verdict. This tool does not calculate or validate the aspect in a birth chart.'
  }
};

const SPANISH_COPY: ToolDetailCopy = {
  common: {
    makeSelection: 'Elige una opción',
    clearSelection: 'Borrar selección',
    clearSelections: 'Borrar selecciones',
    noscript: 'Se necesita JavaScript para generar la interpretación seleccionada en este navegador.'
  },
  sign: {
    title: 'Explora un signo del zodiaco',
    description: 'Selecciona un signo para explorar su elemento simbólico, modalidad y temas interpretativos.',
    selectionTitle: 'Elige un signo del zodiaco',
    fieldLabel: 'Signo del zodiaco',
    optionPlaceholder: 'Elige un signo',
    boundary: 'Esta herramienta explica el signo que selecciones. No calcula un signo a partir de tu fecha de nacimiento ni de una posición planetaria.',
    empty: 'Elige un signo del zodiaco para ver una interpretación centrada. No hay ningún signo preseleccionado.',
    representEyebrow: 'Qué representan los signos',
    representTitle: 'Un vocabulario para el estilo',
    representDescription: 'En astrología, los signos del zodiaco son categorías interpretativas que describen cómo puede expresarse un tema. Pueden ofrecer lenguaje para cualidades como franqueza, paciencia, curiosidad o sensibilidad; no definen a una persona ni determinan sus decisiones.',
    elementsEyebrow: 'Elementos',
    elementsTitle: 'Cuatro lentes simbólicas',
    elementMeanings: {
      Fire: 'Una lente simbólica para la iniciativa, la calidez, la visibilidad y la expresión activa.',
      Earth: 'Una lente simbólica para la estabilidad, la presencia, la atención práctica y los valores tangibles.',
      Air: 'Una lente simbólica para el pensamiento, el lenguaje, el intercambio y la perspectiva.',
      Water: 'Una lente simbólica para el sentimiento, la imaginación, la memoria y la conexión.'
    },
    modalitiesEyebrow: 'Modalidades',
    modalitiesTitle: 'Tres formas de describir la energía',
    modalityMeanings: {
      Cardinal: 'Una forma de describir la energía que inicia, comienza y responde a un punto de partida.',
      Fixed: 'Una forma de describir la energía que sostiene, concentra y desarrolla constancia.',
      Mutable: 'Una forma de describir la energía que se adapta, integra y deja espacio al cambio.'
    },
    howEyebrow: 'Cómo usar la consulta',
    howTitle: 'Lee el resultado como un punto de partida',
    howDescription: 'Empieza por el elemento y la modalidad, y observa cómo encajan el estilo central y la expresión constructiva. La posible tensión invita a reflexionar sobre el equilibrio; no es una predicción ni una etiqueta fija. Compara esta herramienta con la consulta de aspectos para explorar otro término astrológico.',
    calculationEyebrow: 'Cálculo frente a interpretación',
    calculationTitle: 'Una explicación, no una calculadora de signos',
    calculationDescription: 'Esta herramienta explica el signo que selecciones. No calcula un signo a partir de tu fecha de nacimiento ni de una posición planetaria, y no afirma que la interpretación astrológica tenga validación científica. Para conocer las entradas de una carta y sus límites de cálculo, lee ¿Qué es una carta natal? o vuelve al centro de herramientas.',
    resultTitle: '{sign}: una instantánea interpretativa',
    resultSummary: 'Aquí, {sign} se presenta como una categoría simbólica para la interpretación.',
    elementLabel: 'Elemento',
    modalityLabel: 'Modalidad',
    coreStyleLabel: 'Estilo central',
    constructive: 'Expresión constructiva: observa cómo las cualidades de {sign} pueden expresarse con atención.',
    tension: 'Posible tensión: el equilibrio forma parte de la reflexión; esto no es una predicción ni una etiqueta fija.'
  },
  house: {
    title: 'Explora una casa astrológica',
    description: 'Selecciona una de las doce casas numeradas para explorar su ámbito central, temas clave, expresión constructiva y consideraciones de equilibrio.',
    selectionTitle: 'Elige una casa numerada',
    fieldLabel: 'Casa astrológica',
    optionPlaceholder: 'Elige una casa',
    boundary: 'Esta herramienta explica la casa que selecciones. No calcula cúspides ni determina en qué casa se encuentra un planeta en una carta natal.',
    empty: 'Elige una casa numerada para ver una interpretación centrada. No hay ninguna casa preseleccionada.',
    representEyebrow: 'Qué representan las casas',
    representTitle: 'Contexto para los temas de una carta',
    representDescription: 'Dentro del marco interpretativo de la astrología, las casas describen áreas de vida o experiencia donde puede considerarse un tema de la carta. No son lugares físicos ni determinan las decisiones de una persona. Esta consulta ofrece un vocabulario breve para la reflexión, separado del cálculo de cualquier carta.',
    sequenceEyebrow: 'Cómo se diferencian las doce casas',
    sequenceTitle: 'Una secuencia de ámbitos',
    sequenceDescription: 'Las doce casas forman una secuencia de ámbitos relacionados pero distintos, desde la identidad y la autodirección hasta la reflexión privada. En una carta completa, una casa aporta contexto a un planeta o signo; la casa no es una predicción. Elige un número para centrarte en un ámbito cada vez.',
    timeEyebrow: 'Por qué puede importar la hora de nacimiento',
    timeTitle: 'El cálculo de casas es una tarea aparte',
    timeDescription: 'En una carta natal real, las cúspides y las posiciones planeta-casa pueden depender de la hora y el lugar de nacimiento y del sistema de casas elegido. Si se desconoce la hora exacta, no deben suponerse afirmaciones precisas basadas en casas. Esta página no recopila esos datos ni calcula cúspides, ángulos o posiciones.',
    howEyebrow: 'Cómo usar la consulta',
    howTitle: 'Lee el resultado como un punto de partida',
    howDescription: 'Elige una casa, lee su ámbito central y sus temas clave, y considera juntas la expresión constructiva y la consideración de equilibrio. El lenguaje es educativo y simbólico. Continúa con la consulta de signos o de aspectos para consultar vocabulario relacionado.',
    calculationEyebrow: 'Significado de la casa frente a cálculo',
    calculationTitle: 'Una explicación, no una calculadora de casas',
    calculationDescription: 'Los distintos sistemas de casas pueden situar las cúspides o los planetas de manera diferente, pero esta consulta no selecciona, compara ni calcula un sistema de casas. Términos como mantenimiento, recursos compartidos, transición, privacidad y procesos menos visibles son sugerencias interpretativas; no son diagnósticos médicos, predicciones financieras, predicciones de muerte ni etiquetas psiquiátricas. Para más contexto sobre las entradas de una carta, lee ¿Qué es una carta natal? o vuelve al centro de herramientas.',
    resultTitle: '{house}: una instantánea interpretativa',
    resultSummary: 'En la interpretación astrológica, {house} se considera un área simbólica de vida o experiencia para reflexionar sobre la carta.',
    resultCoreDomain: 'Área simbólica para reflexionar sobre {house}.',
    resultKeyThemes: 'Temas de experiencia asociados con {house}.',
    resultConstructive: 'Considerar este ámbito con curiosidad y contexto.',
    resultTension: 'Mantener la reflexión abierta evita convertirla en una etiqueta fija.',
    coreDomainLabel: 'Ámbito central',
    keyThemesLabel: 'Temas clave',
    constructiveLabel: 'Expresión constructiva',
    tensionLabel: 'Consideración de equilibrio'
  },
  aspect: {
    title: 'Explora un aspecto planetario',
    description: 'Elige dos planetas y un aspecto principal para explorar cómo la astrología describe la relación entre esos temas.',
    selectionTitle: 'Planeta A + aspecto + planeta B',
    planetALabel: 'Planeta A',
    aspectLabel: 'Aspecto principal',
    planetBLabel: 'Planeta B',
    planetPlaceholder: 'Elige un planeta',
    aspectPlaceholder: 'Elige un aspecto',
    boundary: 'Selecciona un aspecto que ya quieras comprender. Los mismos dos planetas representan una combinación simétrica en cualquier orden.',
    empty: 'Elige el planeta A, un aspecto principal y el planeta B para ver una interpretación centrada. No hay ninguna combinación preseleccionada.',
    whatEyebrow: 'Qué hace esta herramienta',
    whatTitle: 'Empieza con una combinación conocida',
    whatDescription: 'Un aspecto planetario es una forma interpretativa de describir la relación entre dos cuerpos de una carta. Esta herramienta te permite nombrar primero los dos cuerpos y el aspecto principal, y después ofrece una explicación breve de los temas y la dinámica implicados.',
    howEyebrow: 'Cómo usar el resultado',
    howTitle: 'Léelo como un punto de partida',
    howDescription: 'Observa los dos temas planetarios y considera cómo la dinámica del aspecto puede ponerlos en diálogo. La redacción es educativa y simbólica; no hace una predicción sobre una persona o una carta.',
    calculationEyebrow: 'Cálculo frente a interpretación',
    calculationTitle: 'Una explicación, no un detector de aspectos',
    calculationDescription: 'Esta herramienta explica el aspecto que selecciones. No calcula posiciones planetarias, mide ángulos u orbes ni determina si el aspecto existe en una carta natal. Para conocer las entradas de una carta y la transparencia del cálculo, lee ¿Qué es una carta natal? o vuelve al centro de herramientas.',
    resultParagraphOne: '{first} puede considerarse junto con {second} mediante el {aspect} seleccionado. Es un punto de partida educativo para observar cómo pueden comentarse conjuntamente dos temas simbólicos.',
    resultParagraphTwo: 'Un {aspect} ofrece una forma de describir la relación entre esos temas. La combinación puede hacer que cada tema sea más perceptible dentro de la misma área de reflexión.',
    resultParagraphThree: 'Usa esta relación como una invitación a la reflexión consciente, no como un veredicto fijo. Esta herramienta no calcula ni valida el aspecto en una carta natal.'
  }
};

const FRENCH_COPY: ToolDetailCopy = {
  common: {
    makeSelection: 'Faire un choix',
    clearSelection: 'Effacer la sélection',
    clearSelections: 'Effacer les sélections',
    noscript: 'JavaScript est nécessaire pour générer l’interprétation sélectionnée dans ce navigateur.'
  },
  sign: {
    title: 'Explorer un signe du zodiaque',
    description: 'Sélectionnez un signe pour explorer son élément symbolique, sa modalité et les thèmes interprétatifs qui lui sont associés.',
    selectionTitle: 'Choisir un signe du zodiaque',
    fieldLabel: 'Signe du zodiaque',
    optionPlaceholder: 'Choisir un signe',
    boundary: 'Cet outil explique le signe que vous sélectionnez. Il ne calcule pas un signe à partir de votre date de naissance ou d’une position planétaire.',
    empty: 'Choisissez un signe du zodiaque pour voir une interprétation ciblée. Aucun signe n’est présélectionné.',
    representEyebrow: 'Ce que représentent les signes',
    representTitle: 'Un vocabulaire du style',
    representDescription: 'En astrologie, les signes du zodiaque sont des catégories interprétatives qui décrivent comment un thème peut s’exprimer. Ils offrent un langage pour des qualités comme la franchise, la patience, la curiosité ou la sensibilité ; ils ne définissent pas une personne et ne déterminent pas ses choix.',
    elementsEyebrow: 'Éléments',
    elementsTitle: 'Quatre perspectives symboliques',
    elementMeanings: {
      Fire: 'Une perspective symbolique sur l’initiative, la chaleur, la visibilité et l’expression active.',
      Earth: 'Une perspective symbolique sur la stabilité, l’ancrage, l’attention pratique et les valeurs concrètes.',
      Air: 'Une perspective symbolique sur la pensée, le langage, l’échange et la perspective.',
      Water: 'Une perspective symbolique sur le sentiment, l’imagination, la mémoire et la relation.'
    },
    modalitiesEyebrow: 'Modalités',
    modalitiesTitle: 'Trois façons de décrire l’énergie',
    modalityMeanings: {
      Cardinal: 'Une manière de décrire une énergie qui initie, commence et répond à un point de départ.',
      Fixed: 'Une manière de décrire une énergie qui soutient, concentre et développe la constance.',
      Mutable: 'Une manière de décrire une énergie qui s’adapte, intègre et laisse place au changement.'
    },
    howEyebrow: 'Comment utiliser la consultation',
    howTitle: 'Lire le résultat comme un point de départ',
    howDescription: 'Commencez par l’élément et la modalité, puis observez comment le style central et l’expression constructive s’articulent. La tension possible invite à réfléchir à l’équilibre ; ce n’est ni une prédiction ni une étiquette fixe. Comparez cet outil avec la consultation des aspects pour explorer un autre terme astrologique.',
    calculationEyebrow: 'Calcul et interprétation',
    calculationTitle: 'Une explication, pas une calculatrice de signes',
    calculationDescription: 'Cet outil explique le signe que vous sélectionnez. Il ne calcule pas un signe à partir de votre date de naissance ou d’une position planétaire et ne revendique pas de validation scientifique de l’interprétation astrologique. Pour découvrir les entrées d’une carte et les limites du calcul, lisez Qu’est-ce qu’un thème natal ? ou revenez au centre des outils.',
    resultTitle: '{sign} : un aperçu interprétatif',
    resultSummary: '{sign} est présenté ici comme une catégorie symbolique d’interprétation.',
    elementLabel: 'Élément',
    modalityLabel: 'Modalité',
    coreStyleLabel: 'Style central',
    constructive: 'Expression constructive : observez comment les qualités de {sign} peuvent s’exprimer avec attention.',
    tension: 'Tension possible : l’équilibre fait partie de la réflexion ; il ne s’agit ni d’une prédiction ni d’une étiquette fixe.'
  },
  house: {
    title: 'Explorer une maison astrologique',
    description: 'Sélectionnez l’une des douze maisons numérotées pour explorer son domaine central, ses thèmes clés, son expression constructive et ses points d’équilibre.',
    selectionTitle: 'Choisir une maison numérotée',
    fieldLabel: 'Maison astrologique',
    optionPlaceholder: 'Choisir une maison',
    boundary: 'Cet outil explique la maison que vous sélectionnez. Il ne calcule pas les cuspides et ne détermine pas la maison occupée par une planète dans un thème natal.',
    empty: 'Choisissez une maison numérotée pour voir une interprétation ciblée. Aucune maison n’est présélectionnée.',
    representEyebrow: 'Ce que représentent les maisons',
    representTitle: 'Le contexte des thèmes d’une carte',
    representDescription: 'Dans le cadre interprétatif de l’astrologie, les maisons décrivent des domaines de vie ou d’expérience où un thème de carte peut être considéré. Ce ne sont pas des lieux physiques et elles ne déterminent pas les choix d’une personne. Cette consultation fournit un vocabulaire concis pour la réflexion, séparé du calcul d’une carte.',
    sequenceEyebrow: 'Comment les douze maisons diffèrent',
    sequenceTitle: 'Une séquence de domaines',
    sequenceDescription: 'Les douze maisons forment une séquence de domaines liés mais distincts, de l’identité et de l’autonomie à la réflexion privée. Dans une carte complète, une maison donne un contexte à une planète ou à un signe ; elle n’est pas une prédiction. Choisissez un nombre pour vous concentrer sur un domaine à la fois.',
    timeEyebrow: 'Pourquoi l’heure de naissance peut compter',
    timeTitle: 'Le calcul des maisons est une tâche distincte',
    timeDescription: 'Dans un thème natal réel, les cuspides et les positions planète-maison peuvent dépendre de l’heure et du lieu de naissance ainsi que du système de maisons choisi. Si l’heure exacte est inconnue, les affirmations précises fondées sur les maisons ne doivent pas être présumées. Cette page ne recueille aucune de ces données et ne calcule ni cuspides, ni angles, ni positions.',
    howEyebrow: 'Comment utiliser la consultation',
    howTitle: 'Lire le résultat comme un point de départ',
    howDescription: 'Choisissez une maison, lisez son domaine central et ses thèmes clés, puis considérez ensemble l’expression constructive et le point d’équilibre. Le langage est éducatif et symbolique. Poursuivez avec la consultation des signes ou des aspects pour le vocabulaire associé.',
    calculationEyebrow: 'Sens de la maison et calcul',
    calculationTitle: 'Une explication, pas une calculatrice de maisons',
    calculationDescription: 'Les différents systèmes de maisons peuvent placer les cuspides ou les planètes différemment, mais cette consultation ne sélectionne, ne compare et ne calcule aucun système de maisons. Des termes comme entretien, ressources partagées, transition, intimité et processus moins visibles sont des pistes interprétatives ; ce ne sont ni des diagnostics médicaux, ni des prédictions financières ou de décès, ni des étiquettes psychiatriques. Pour plus de contexte sur les entrées d’une carte, lisez Qu’est-ce qu’un thème natal ? ou revenez au centre des outils.',
    resultTitle: '{house} : un aperçu interprétatif',
    resultSummary: 'Dans l’interprétation astrologique, {house} est considéré comme un domaine symbolique de vie ou d’expérience pour réfléchir à la carte.',
    resultCoreDomain: 'Domaine symbolique pour réfléchir à {house}.',
    resultKeyThemes: 'Thèmes d’expérience associés à {house}.',
    resultConstructive: 'Considérer ce domaine avec curiosité et contexte.',
    resultTension: 'Garder la réflexion ouverte évite d’en faire une étiquette fixe.',
    coreDomainLabel: 'Domaine central',
    keyThemesLabel: 'Thèmes clés',
    constructiveLabel: 'Expression constructive',
    tensionLabel: 'Point d’équilibre'
  },
  aspect: {
    title: 'Explorer un aspect planétaire',
    description: 'Choisissez deux planètes et un aspect majeur pour explorer la manière dont l’astrologie décrit la relation entre ces thèmes.',
    selectionTitle: 'Planète A + aspect + planète B',
    planetALabel: 'Planète A',
    aspectLabel: 'Aspect majeur',
    planetBLabel: 'Planète B',
    planetPlaceholder: 'Choisir une planète',
    aspectPlaceholder: 'Choisir un aspect',
    boundary: 'Sélectionnez un aspect que vous souhaitez déjà comprendre. Les mêmes deux planètes représentent une combinaison symétrique quel que soit l’ordre choisi.',
    empty: 'Choisissez la planète A, un aspect majeur et la planète B pour voir une interprétation ciblée. Aucune combinaison n’est présélectionnée.',
    whatEyebrow: 'Ce que fait cet outil',
    whatTitle: 'Commencer par une combinaison connue',
    whatDescription: 'Un aspect planétaire est une manière interprétative de décrire une relation entre deux corps d’une carte. Cet outil vous permet de nommer d’abord les deux corps et l’aspect majeur, puis fournit une explication concise des thèmes et de la dynamique concernés.',
    howEyebrow: 'Comment utiliser le résultat',
    howTitle: 'Le lire comme un point de départ',
    howDescription: 'Observez les deux thèmes planétaires, puis considérez comment la dynamique de l’aspect peut les mettre en dialogue. La formulation est éducative et symbolique ; elle ne prédit rien au sujet d’une personne ou d’une carte.',
    calculationEyebrow: 'Calcul et interprétation',
    calculationTitle: 'Une explication, pas un détecteur d’aspects',
    calculationDescription: 'Cet outil explique l’aspect que vous sélectionnez. Il ne calcule pas les positions planétaires, ne mesure ni angles ni orbes et ne détermine pas si l’aspect existe dans un thème natal. Pour découvrir les entrées d’une carte et la transparence du calcul, lisez Qu’est-ce qu’un thème natal ? ou revenez au centre des outils.',
    resultParagraphOne: '{first} peut être considéré avec {second} au moyen de l’{aspect} sélectionné. C’est un point de départ éducatif pour observer comment deux thèmes symboliques peuvent être mis en relation.',
    resultParagraphTwo: 'Un {aspect} offre une manière de décrire la relation entre ces thèmes. La combinaison peut rendre chaque thème plus perceptible dans le même espace de réflexion.',
    resultParagraphThree: 'Utilisez cette relation comme une invitation à une réflexion consciente, et non comme un verdict fixe. Cet outil ne calcule ni ne valide l’aspect dans un thème natal.'
  }
};

const GERMAN_COPY: ToolDetailCopy = {
  common: {
    makeSelection: 'Auswahl treffen',
    clearSelection: 'Auswahl löschen',
    clearSelections: 'Auswahlen löschen',
    noscript: 'JavaScript ist erforderlich, um die ausgewählte Deutung in diesem Browser zu erzeugen.'
  },
  sign: {
    title: 'Ein Tierkreiszeichen erkunden',
    description: 'Wählen Sie ein Zeichen, um sein symbolisches Element, seine Modalität und die damit verbundenen Deutungsthemen zu erkunden.',
    selectionTitle: 'Ein Tierkreiszeichen auswählen',
    fieldLabel: 'Tierkreiszeichen',
    optionPlaceholder: 'Zeichen auswählen',
    boundary: 'Dieses Werkzeug erklärt das ausgewählte Zeichen. Es berechnet kein Zeichen aus Geburtsdatum oder Planetenposition.',
    empty: 'Wählen Sie ein Tierkreiszeichen für eine fokussierte Deutung. Es ist kein Zeichen vorausgewählt.',
    representEyebrow: 'Wofür Zeichen stehen',
    representTitle: 'Ein Vokabular für Stil',
    representDescription: 'In der Astrologie sind Tierkreiszeichen Deutungskategorien, die beschreiben, wie sich ein Thema ausdrücken kann. Sie bieten Sprache für Eigenschaften wie Direktheit, Geduld, Neugier oder Sensibilität; sie definieren keine Person und bestimmen keine Entscheidungen.',
    elementsEyebrow: 'Elemente',
    elementsTitle: 'Vier symbolische Perspektiven',
    elementMeanings: {
      Fire: 'Eine symbolische Perspektive auf Initiative, Wärme, Sichtbarkeit und aktiven Ausdruck.',
      Earth: 'Eine symbolische Perspektive auf Stabilität, Verkörperung, praktische Aufmerksamkeit und greifbare Werte.',
      Air: 'Eine symbolische Perspektive auf Denken, Sprache, Austausch und Blickwinkel.',
      Water: 'Eine symbolische Perspektive auf Gefühl, Vorstellungskraft, Erinnerung und Verbundenheit.'
    },
    modalitiesEyebrow: 'Modalitäten',
    modalitiesTitle: 'Drei Arten, Energie zu beschreiben',
    modalityMeanings: {
      Cardinal: 'Eine Beschreibung für Energie, die initiiert, beginnt und auf einen Ausgangspunkt reagiert.',
      Fixed: 'Eine Beschreibung für Energie, die erhält, bündelt und Beständigkeit entwickelt.',
      Mutable: 'Eine Beschreibung für Energie, die sich anpasst, integriert und Raum für Wandel schafft.'
    },
    howEyebrow: 'So verwenden Sie die Abfrage',
    howTitle: 'Das Ergebnis als Ausgangspunkt lesen',
    howDescription: 'Beginnen Sie mit Element und Modalität und achten Sie darauf, wie Kernstil und konstruktiver Ausdruck zusammenpassen. Die mögliche Spannung lädt zur Reflexion über Ausgleich ein; sie ist weder Vorhersage noch feste Bezeichnung. Vergleichen Sie dieses Werkzeug mit der Aspektabfrage, wenn Sie einen weiteren astrologischen Begriff erkunden möchten.',
    calculationEyebrow: 'Berechnung und Deutung',
    calculationTitle: 'Eine Erklärung, kein Zeichenrechner',
    calculationDescription: 'Dieses Werkzeug erklärt das ausgewählte Zeichen. Es berechnet kein Zeichen aus Geburtsdatum oder Planetenposition und behauptet keine wissenschaftliche Bestätigung astrologischer Deutung. Für eine Einführung in Karteneingaben und Berechnungsgrenzen lesen Sie Was ist ein Geburtshoroskop? oder kehren Sie zum Werkzeugzentrum zurück.',
    resultTitle: '{sign}: eine interpretative Momentaufnahme',
    resultSummary: '{sign} wird hier als symbolische Kategorie für die Deutung dargestellt.',
    elementLabel: 'Element',
    modalityLabel: 'Modalität',
    coreStyleLabel: 'Kernstil',
    constructive: 'Konstruktiver Ausdruck: Beobachten Sie, wie sich die Qualitäten von {sign} bewusst zeigen können.',
    tension: 'Mögliche Spannung: Ausgleich gehört zur Reflexion; dies ist keine Vorhersage und keine feste Bezeichnung.'
  },
  house: {
    title: 'Ein astrologisches Haus erkunden',
    description: 'Wählen Sie eines der zwölf nummerierten Häuser, um seinen Kernbereich, wichtige Themen, seinen konstruktiven Ausdruck und Ausgleichshinweise zu erkunden.',
    selectionTitle: 'Ein nummeriertes Haus auswählen',
    fieldLabel: 'Astrologisches Haus',
    optionPlaceholder: 'Haus auswählen',
    boundary: 'Dieses Werkzeug erklärt das ausgewählte Haus. Es berechnet keine Hausspitzen und bestimmt nicht, in welchem Haus sich ein Planet im Geburtshoroskop befindet.',
    empty: 'Wählen Sie ein nummeriertes Haus für eine fokussierte Deutung. Es ist kein Haus vorausgewählt.',
    representEyebrow: 'Wofür Häuser stehen',
    representTitle: 'Kontext für Themen im Horoskop',
    representDescription: 'Im interpretativen Rahmen der Astrologie beschreiben Häuser Lebens- oder Erfahrungsbereiche, in denen ein Horoskopthema betrachtet werden kann. Sie sind keine physischen Orte und bestimmen keine Entscheidungen. Diese Abfrage bietet ein kompaktes Vokabular zur Reflexion, getrennt von der Berechnung eines Horoskops.',
    sequenceEyebrow: 'Wie sich die zwölf Häuser unterscheiden',
    sequenceTitle: 'Eine Folge von Bereichen',
    sequenceDescription: 'Die zwölf Häuser bilden eine Folge verwandter, aber unterschiedlicher Bereiche, von Identität und Selbststeuerung bis zur privaten Reflexion. In einem vollständigen Horoskop gibt ein Haus einem Planeten oder Zeichen Kontext; das Haus selbst ist keine Vorhersage. Wählen Sie oben eine Zahl, um jeweils einen Bereich zu betrachten.',
    timeEyebrow: 'Warum die Geburtszeit wichtig sein kann',
    timeTitle: 'Die Hausberechnung ist eine eigene Aufgabe',
    timeDescription: 'In einem tatsächlichen Geburtshoroskop können Hausspitzen und Planet-Haus-Positionen von Geburtszeit, Geburtsort und dem gewählten Häusersystem abhängen. Ist die genaue Geburtszeit unbekannt, sollten genaue Aussagen auf Hausbasis nicht vorausgesetzt werden. Diese Seite erhebt keine dieser Angaben und berechnet keine Spitzen, Winkel oder Positionen.',
    howEyebrow: 'So verwenden Sie die Abfrage',
    howTitle: 'Das Ergebnis als Ausgangspunkt lesen',
    howDescription: 'Wählen Sie ein Haus, lesen Sie Kernbereich und wichtige Themen und betrachten Sie konstruktiven Ausdruck und Ausgleichshinweis gemeinsam. Die Sprache ist lehrreich und symbolisch. Für verwandtes Vokabular können Sie mit der Zeichen- oder Aspektabfrage fortfahren.',
    calculationEyebrow: 'Hausbedeutung und Berechnung',
    calculationTitle: 'Eine Erklärung, kein Hausrechner',
    calculationDescription: 'Verschiedene Häusersysteme können Spitzen oder Planeten unterschiedlich platzieren, aber diese Abfrage wählt, vergleicht oder berechnet kein Häusersystem. Begriffe wie Pflege, gemeinsame Ressourcen, Übergang, Privatsphäre und weniger sichtbare Prozesse sind Deutungsimpulse; sie sind keine medizinischen Diagnosen, finanziellen Vorhersagen, Todesvorhersagen oder psychiatrischen Etiketten. Für mehr Kontext zu Horoskopeingaben lesen Sie Was ist ein Geburtshoroskop? oder kehren Sie zum Werkzeugzentrum zurück.',
    resultTitle: '{house}: eine interpretative Momentaufnahme',
    resultSummary: 'In der astrologischen Deutung gilt {house} als symbolischer Lebens- oder Erfahrungsbereich für die Reflexion über ein Horoskop.',
    resultCoreDomain: 'Symbolischer Bereich zur Reflexion über {house}.',
    resultKeyThemes: 'Mit {house} verbundene Erfahrungsthemen.',
    resultConstructive: 'Diesen Bereich mit Neugier und Kontext betrachten.',
    resultTension: 'Eine offene Reflexion verhindert, daraus eine feste Bezeichnung zu machen.',
    coreDomainLabel: 'Kernbereich',
    keyThemesLabel: 'Wichtige Themen',
    constructiveLabel: 'Konstruktiver Ausdruck',
    tensionLabel: 'Ausgleichshinweis'
  },
  aspect: {
    title: 'Einen planetaren Aspekt erkunden',
    description: 'Wählen Sie zwei Planeten und einen Hauptaspekt, um zu erkunden, wie die Astrologie die Beziehung zwischen diesen Themen beschreibt.',
    selectionTitle: 'Planet A + Aspekt + Planet B',
    planetALabel: 'Planet A',
    aspectLabel: 'Hauptaspekt',
    planetBLabel: 'Planet B',
    planetPlaceholder: 'Planeten auswählen',
    aspectPlaceholder: 'Aspekt auswählen',
    boundary: 'Wählen Sie einen Aspekt, den Sie bereits verstehen möchten. Dieselben beiden Planeten bilden unabhängig von ihrer Reihenfolge eine symmetrische Kombination.',
    empty: 'Wählen Sie Planet A, einen Hauptaspekt und Planet B für eine fokussierte Deutung. Keine Kombination ist vorausgewählt.',
    whatEyebrow: 'Was dieses Werkzeug tut',
    whatTitle: 'Mit einer bekannten Kombination beginnen',
    whatDescription: 'Ein planetarer Aspekt beschreibt interpretativ eine Beziehung zwischen zwei Horoskopkörpern. Dieses Werkzeug lässt Sie zuerst die beiden Körper und den Hauptaspekt benennen und gibt dann eine kompakte Erklärung der beteiligten Themen und Dynamik.',
    howEyebrow: 'So verwenden Sie das Ergebnis',
    howTitle: 'Als Ausgangspunkt lesen',
    howDescription: 'Beachten Sie die beiden Planetenthemen und überlegen Sie, wie die Aspektdynamik sie in ein Gespräch bringen kann. Die Formulierung ist lehrreich und symbolisch; sie sagt nichts über eine Person oder ein Horoskop voraus.',
    calculationEyebrow: 'Berechnung und Deutung',
    calculationTitle: 'Eine Erklärung, kein Aspektdetektor',
    calculationDescription: 'Dieses Werkzeug erklärt den ausgewählten Aspekt. Es berechnet keine Planetenpositionen, misst keine Winkel oder Orben und bestimmt nicht, ob der Aspekt in einem Geburtshoroskop existiert. Für eine Einführung in Horoskopeingaben und Berechnungstransparenz lesen Sie Was ist ein Geburtshoroskop? oder kehren Sie zum Werkzeugzentrum zurück.',
    resultParagraphOne: '{first} kann gemeinsam mit {second} durch den ausgewählten {aspect} betrachtet werden. Dies ist ein lehrreicher Ausgangspunkt, um zu beobachten, wie zwei symbolische Themen zusammen besprochen werden können.',
    resultParagraphTwo: 'Ein {aspect} bietet eine Möglichkeit, die Beziehung zwischen diesen Themen zu beschreiben. Die Kombination kann jedes Thema im selben Reflexionsbereich deutlicher machen.',
    resultParagraphThree: 'Nutzen Sie diese Beziehung als Einladung zu bewusster Reflexion, nicht als festes Urteil. Dieses Werkzeug berechnet oder bestätigt den Aspekt in einem Geburtshoroskop nicht.'
  }
};

const JAPANESE_COPY: ToolDetailCopy = {
  common: {
    makeSelection: '選択する',
    clearSelection: '選択を解除',
    clearSelections: '選択をすべて解除',
    noscript: 'このブラウザで選択した解釈を生成するには、JavaScriptが必要です。'
  },
  sign: {
    title: 'サインを調べる',
    description: 'サインを一つ選び、そのエレメント、モダリティ、解釈上のテーマを確認します。',
    selectionTitle: 'サインを選択',
    fieldLabel: 'サイン',
    optionPlaceholder: 'サインを選択',
    boundary: 'このツールは選択したサインを説明します。生年月日や天体位置からサインを計算するものではありません。',
    empty: 'サインを選択すると、焦点を絞った解釈を確認できます。初期状態では選択されていません。',
    representEyebrow: 'サインが表すもの',
    representTitle: 'スタイルを読むための語彙',
    representDescription: '占星術では、サインはテーマがどのように表現されるかを説明する解釈上のカテゴリーです。率直さ、忍耐、好奇心、感受性などの性質を考えるための言葉を与えますが、人を定義したり行動を決めたりするものではありません。',
    elementsEyebrow: 'エレメント',
    elementsTitle: '四つの象徴的な視点',
    elementMeanings: {
      Fire: '行動の始まり、温かさ、可視性、能動的な表現を読む象徴的な視点。',
      Earth: '安定、身体感覚、実務的な注意、具体的な価値を読む象徴的な視点。',
      Air: '思考、言葉、交流、視点を読む象徴的な視点。',
      Water: '感情、想像力、記憶、つながりを読む象徴的な視点。'
    },
    modalitiesEyebrow: 'モダリティ',
    modalitiesTitle: 'エネルギーを説明する三つの方法',
    modalityMeanings: {
      Cardinal: '始める、開始する、出発点に応答するエネルギーを説明する方法。',
      Fixed: '持続させ、集中させ、一貫性を育てるエネルギーを説明する方法。',
      Mutable: '適応し、統合し、変化の余地をつくるエネルギーを説明する方法。'
    },
    howEyebrow: '検索結果の読み方',
    howTitle: '結果を出発点として読む',
    howDescription: 'まずエレメントとモダリティを確認し、中心的なスタイルと建設的な表現がどのようにつながるかを見ます。潜在的な緊張は、予測や固定的なラベルではなく、バランスを考えるためのきっかけです。別の占星術用語を学ぶときは、アスペクト検索とも比較できます。',
    calculationEyebrow: '計算と解釈',
    calculationTitle: 'サイン計算ではなく説明を読む',
    calculationDescription: 'このツールは選択したサインを説明します。生年月日や天体位置からサインを計算したり、占星術的解釈の科学的妥当性を主張したりするものではありません。チャート入力と計算の境界を知るには「ネイタルチャートとは？」を読み、ツール一覧に戻ってください。',
    resultTitle: '{sign}：解釈の概要',
    resultSummary: '{sign}を、解釈のための象徴的なカテゴリーとして示します。',
    elementLabel: 'エレメント',
    modalityLabel: 'モダリティ',
    coreStyleLabel: '中心的なスタイル',
    constructive: '建設的な表現：{sign}の性質がどのように意識的に表現されるかを観察します。',
    tension: '潜在的な緊張：バランスも振り返りの一部であり、予測や固定的なラベルではありません。'
  },
  house: {
    title: 'ハウスを調べる',
    description: '12のハウスから一つを選び、その中心領域、主なテーマ、建設的な表現、バランスの観点を確認します。',
    selectionTitle: 'ハウスを選択',
    fieldLabel: 'ハウス',
    optionPlaceholder: 'ハウスを選択',
    boundary: 'このツールは選択したハウスを説明します。ハウスカスプを計算したり、出生図で天体が入るハウスを決めたりするものではありません。',
    empty: 'ハウスを選択すると、焦点を絞った解釈を確認できます。初期状態では選択されていません。',
    representEyebrow: 'ハウスが表すもの',
    representTitle: 'チャートテーマの文脈',
    representDescription: '占星術の解釈体系では、ハウスはチャートのテーマを考える生活や経験の領域を表します。物理的な場所ではなく、人の選択を決めるものでもありません。この検索は、チャート計算とは分けて振り返りのための語彙を提供します。',
    sequenceEyebrow: '12ハウスの違い',
    sequenceTitle: '領域の連なり',
    sequenceDescription: '12のハウスは、自己認識や自己方向づけから内省まで、互いに関連しながらも異なる領域の連なりです。完全なチャートでは、ハウスが天体やサインに文脈を与えますが、ハウス自体は予測ではありません。一度に一つの領域を見るため、上から番号を選択してください。',
    timeEyebrow: '出生時刻が重要になる理由',
    timeTitle: 'ハウス計算は別の作業',
    timeDescription: '実際のネイタルチャートでは、ハウスカスプや天体とハウスの配置が出生時刻、出生地、選択したハウスシステムに依存することがあります。正確な出生時刻が不明な場合、ハウスに基づく精密な主張は前提にできません。このページはその情報を収集せず、カスプ、アングル、配置を計算しません。',
    howEyebrow: '検索結果の読み方',
    howTitle: '結果を出発点として読む',
    howDescription: 'ハウスを選び、中心領域と主なテーマを確認したうえで、建設的な表現とバランスの観点を合わせて考えます。ここで使う言葉は教育的・象徴的なものです。関連する語彙を知るには、サイン検索やアスペクト検索も利用できます。',
    calculationEyebrow: 'ハウスの意味と計算',
    calculationTitle: 'ハウス計算ではなく説明を読む',
    calculationDescription: 'ハウスシステムによってカスプや天体の位置は異なることがありますが、この検索はハウスシステムを選択、比較、計算しません。維持、共有資源、移行、プライバシー、見えにくいプロセスなどの言葉は解釈のきっかけであり、医学的診断、金銭的予測、死の予測、精神医学的なラベルではありません。チャート入力については「ネイタルチャートとは？」を読み、ツール一覧に戻ってください。',
    resultTitle: '{house}：解釈の概要',
    resultSummary: '占星術的な解釈では、{house}をチャートを振り返るための象徴的な生活・経験領域として考えます。',
    resultCoreDomain: '{house}を振り返るための象徴的な領域。',
    resultKeyThemes: '{house}に関連する経験上のテーマ。',
    resultConstructive: '好奇心と文脈を保ちながら、この領域を考えます。',
    resultTension: '解釈を開いたままにすることで、固定的なラベルになるのを防ぎます。',
    coreDomainLabel: '中心領域',
    keyThemesLabel: '主なテーマ',
    constructiveLabel: '建設的な表現',
    tensionLabel: 'バランスの観点'
  },
  aspect: {
    title: 'アスペクトを調べる',
    description: '二つの天体と一つの主要アスペクトを選び、占星術でそれらのテーマの関係をどのように説明するかを確認します。',
    selectionTitle: '天体A + アスペクト + 天体B',
    planetALabel: '天体A',
    aspectLabel: '主要アスペクト',
    planetBLabel: '天体B',
    planetPlaceholder: '天体を選択',
    aspectPlaceholder: 'アスペクトを選択',
    boundary: '理解したいアスペクトを選択してください。同じ二つの天体は、順序にかかわらず一つの対称的な組み合わせになります。',
    empty: '天体A、主要アスペクト、天体Bを選択すると、焦点を絞った解釈を確認できます。初期状態では組み合わせは選択されていません。',
    whatEyebrow: 'このツールでできること',
    whatTitle: '既知の組み合わせから始める',
    whatDescription: 'アスペクトは、チャート上の二つの天体の関係を説明する解釈上の方法です。このツールでは、まず二つの天体と主要アスペクトを指定し、そのテーマと力学を簡潔に説明します。',
    howEyebrow: '結果の読み方',
    howTitle: '出発点として読む',
    howDescription: '二つの天体テーマを確認し、アスペクトの力学がそれらをどのように対話させるかを考えます。ここでの表現は教育的・象徴的なもので、人やチャートについて予測するものではありません。',
    calculationEyebrow: '計算と解釈',
    calculationTitle: 'アスペクト検出ではなく説明を読む',
    calculationDescription: 'このツールは選択したアスペクトを説明します。天体位置、角度、オーブを計算したり、出生図にそのアスペクトが存在するかを判定したりするものではありません。チャート入力と計算の透明性を知るには「ネイタルチャートとは？」を読み、ツール一覧に戻ってください。',
    resultParagraphOne: '選択した{aspect}を通して、{first}と{second}を一緒に考えることができます。二つの象徴的なテーマをどのように関連づけて語れるかを観察するための教育的な出発点です。',
    resultParagraphTwo: '{aspect}は、これらのテーマの関係を説明する一つの方法です。同じ振り返りの領域で、それぞれのテーマがより意識されやすくなることがあります。',
    resultParagraphThree: 'この関係は固定的な判断ではなく、意識的に振り返るためのきっかけとして扱ってください。このツールは出生図のアスペクトを計算・検証しません。'
  }
};

const KOREAN_COPY: ToolDetailCopy = {
  common: {
    makeSelection: '선택하기',
    clearSelection: '선택 지우기',
    clearSelections: '선택 모두 지우기',
    noscript: '이 브라우저에서 선택한 해석을 생성하려면 JavaScript가 필요합니다.'
  },
  sign: {
    title: '황도대 별자리 살펴보기',
    description: '별자리 하나를 선택해 상징적 원소, 양식, 해석 주제를 살펴봅니다.',
    selectionTitle: '황도대 별자리 선택',
    fieldLabel: '황도대 별자리',
    optionPlaceholder: '별자리 선택',
    boundary: '이 도구는 선택한 별자리를 설명합니다. 생년월일이나 행성 위치로 별자리를 계산하지 않습니다.',
    empty: '별자리를 선택하면 집중된 해석을 볼 수 있습니다. 미리 선택된 별자리는 없습니다.',
    representEyebrow: '별자리가 나타내는 것',
    representTitle: '스타일을 위한 어휘',
    representDescription: '점성술에서 황도대 별자리는 주제가 표현되는 방식을 설명하는 해석 범주입니다. 직접성, 인내, 호기심, 감수성과 같은 특성을 생각할 언어를 제공하지만 사람을 정의하거나 행동을 결정하지 않습니다.',
    elementsEyebrow: '원소',
    elementsTitle: '네 가지 상징적 관점',
    elementMeanings: {
      Fire: '주도성, 따뜻함, 가시성, 적극적인 표현을 살펴보는 상징적 관점입니다.',
      Earth: '안정성, 체화, 실용적 주의, 구체적 가치를 살펴보는 상징적 관점입니다.',
      Air: '사고, 언어, 교류, 관점을 살펴보는 상징적 관점입니다.',
      Water: '감정, 상상력, 기억, 연결을 살펴보는 상징적 관점입니다.'
    },
    modalitiesEyebrow: '양식',
    modalitiesTitle: '에너지를 설명하는 세 가지 방식',
    modalityMeanings: {
      Cardinal: '시작하고 출발점에 응답하는 에너지를 설명하는 방식입니다.',
      Fixed: '유지하고 집중하며 일관성을 키우는 에너지를 설명하는 방식입니다.',
      Mutable: '적응하고 통합하며 변화의 여지를 만드는 에너지를 설명하는 방식입니다.'
    },
    howEyebrow: '조회 결과 사용법',
    howTitle: '결과를 출발점으로 읽기',
    howDescription: '먼저 원소와 양식을 살펴본 뒤 중심 스타일과 건설적 표현이 어떻게 어우러지는지 관찰합니다. 잠재적 긴장은 예측이나 고정된 꼬리표가 아니라 균형을 성찰하는 초대입니다. 다른 점성술 용어를 살펴보려면 각 조회와 비교해 보세요.',
    calculationEyebrow: '계산과 해석',
    calculationTitle: '별자리 계산기가 아닌 설명',
    calculationDescription: '이 도구는 선택한 별자리를 설명합니다. 생년월일이나 행성 위치로 별자리를 계산하지 않으며 점성술 해석의 과학적 검증을 주장하지 않습니다. 차트 입력과 계산의 경계를 알아보려면 「네이털 차트란?」을 읽고 도구 허브로 돌아가세요.',
    resultTitle: '{sign}: 해석 요약',
    resultSummary: '{sign}을(를) 해석을 위한 상징적 범주로 제시합니다.',
    elementLabel: '원소',
    modalityLabel: '양식',
    coreStyleLabel: '중심 스타일',
    constructive: '건설적 표현: {sign}의 특성이 어떻게 의식적으로 표현될 수 있는지 관찰합니다.',
    tension: '잠재적 긴장: 균형은 성찰의 일부이며 예측이나 고정된 꼬리표가 아닙니다.'
  },
  house: {
    title: '점성술 하우스 살펴보기',
    description: '12개의 하우스 중 하나를 선택해 중심 영역, 주요 주제, 건설적 표현, 균형을 위한 관점을 살펴봅니다.',
    selectionTitle: '번호가 있는 하우스 선택',
    fieldLabel: '점성술 하우스',
    optionPlaceholder: '하우스 선택',
    boundary: '이 도구는 선택한 하우스를 설명합니다. 하우스 커스프를 계산하거나 출생 차트에서 행성이 어느 하우스에 있는지 결정하지 않습니다.',
    empty: '번호가 있는 하우스를 선택하면 집중된 해석을 볼 수 있습니다. 미리 선택된 하우스는 없습니다.',
    representEyebrow: '하우스가 나타내는 것',
    representTitle: '차트 주제의 맥락',
    representDescription: '점성술의 해석 체계에서 하우스는 차트 주제를 살펴볼 수 있는 삶이나 경험의 영역을 설명합니다. 물리적 장소가 아니며 사람의 선택을 결정하지도 않습니다. 이 조회는 차트 계산과 분리된 성찰용 어휘를 제공합니다.',
    sequenceEyebrow: '12개 하우스의 차이',
    sequenceTitle: '영역의 흐름',
    sequenceDescription: '12개 하우스는 자기 인식과 자기 방향 설정에서 사적인 성찰까지 서로 관련되지만 구별되는 영역의 흐름을 이룹니다. 전체 차트에서 하우스는 행성이나 별자리에 맥락을 제공하지만 하우스 자체는 예측이 아닙니다. 위에서 번호를 선택해 한 번에 한 영역을 살펴보세요.',
    timeEyebrow: '출생 시간이 중요한 이유',
    timeTitle: '하우스 계산은 별도의 작업',
    timeDescription: '실제 네이털 차트에서 하우스 커스프와 행성-하우스 배치는 출생 시간, 출생 장소, 선택한 하우스 시스템에 따라 달라질 수 있습니다. 정확한 출생 시간이 알려지지 않았다면 하우스 기반의 정확한 주장을 전제해서는 안 됩니다. 이 페이지는 그러한 정보를 수집하거나 커스프, 앵글, 배치를 계산하지 않습니다.',
    howEyebrow: '조회 결과 사용법',
    howTitle: '결과를 출발점으로 읽기',
    howDescription: '하우스를 선택하고 중심 영역과 주요 주제를 읽은 다음 건설적 표현과 균형의 관점을 함께 생각합니다. 이 언어는 교육적이고 상징적입니다. 관련 어휘는 별자리 조회나 각 조회에서 이어서 살펴볼 수 있습니다.',
    calculationEyebrow: '하우스 의미와 계산',
    calculationTitle: '하우스 계산기가 아닌 설명',
    calculationDescription: '하우스 시스템에 따라 커스프나 행성 위치가 달라질 수 있지만 이 조회는 하우스 시스템을 선택, 비교, 계산하지 않습니다. 유지, 공유 자원, 전환, 사생활, 잘 보이지 않는 과정과 같은 표현은 해석의 단서이며 의료 진단, 금융 예측, 죽음의 예측, 정신의학적 꼬리표가 아닙니다. 차트 입력의 맥락은 「네이털 차트란?」을 읽고 도구 허브로 돌아가세요.',
    resultTitle: '{house}: 해석 요약',
    resultSummary: '점성술적 해석에서 {house}은(는) 차트를 성찰하기 위한 상징적 삶과 경험의 영역으로 생각할 수 있습니다.',
    resultCoreDomain: '{house}을(를) 성찰하기 위한 상징적 영역입니다.',
    resultKeyThemes: '{house}와(과) 관련된 경험의 주제입니다.',
    resultConstructive: '호기심과 맥락을 유지하며 이 영역을 살펴봅니다.',
    resultTension: '열린 성찰을 유지하면 고정된 꼬리표로 만들지 않을 수 있습니다.',
    coreDomainLabel: '중심 영역',
    keyThemesLabel: '주요 주제',
    constructiveLabel: '건설적 표현',
    tensionLabel: '균형을 위한 관점'
  },
  aspect: {
    title: '행성 각 살펴보기',
    description: '두 행성과 주요 각 하나를 선택해 점성술에서 두 주제의 관계를 어떻게 설명하는지 살펴봅니다.',
    selectionTitle: '행성 A + 각 + 행성 B',
    planetALabel: '행성 A',
    aspectLabel: '주요 각',
    planetBLabel: '행성 B',
    planetPlaceholder: '행성 선택',
    aspectPlaceholder: '각 선택',
    boundary: '이해하고 싶은 각을 선택하세요. 같은 두 행성은 순서와 관계없이 하나의 대칭적인 조합을 이룹니다.',
    empty: '행성 A, 주요 각, 행성 B를 선택하면 집중된 해석을 볼 수 있습니다. 미리 선택된 조합은 없습니다.',
    whatEyebrow: '이 도구가 하는 일',
    whatTitle: '알고 있는 조합에서 시작하기',
    whatDescription: '행성 각은 차트의 두 천체 사이 관계를 설명하는 해석 방법입니다. 이 도구에서는 먼저 두 천체와 주요 각을 지정한 뒤 관련된 주제와 역학을 간결하게 설명합니다.',
    howEyebrow: '결과 사용법',
    howTitle: '출발점으로 읽기',
    howDescription: '두 행성 주제를 확인하고 각의 역학이 두 주제를 어떻게 대화하게 하는지 생각해 보세요. 이 표현은 교육적이고 상징적이며 사람이나 차트에 대해 예측하지 않습니다.',
    calculationEyebrow: '계산과 해석',
    calculationTitle: '각 감지기가 아닌 설명',
    calculationDescription: '이 도구는 선택한 각을 설명합니다. 행성 위치, 각도, 오브를 계산하거나 출생 차트에 해당 각이 존재하는지 판단하지 않습니다. 차트 입력과 계산의 투명성을 알아보려면 「네이털 차트란?」을 읽고 도구 허브로 돌아가세요.',
    resultParagraphOne: '선택한 {aspect}을(를) 통해 {first}과(와) {second}을(를) 함께 살펴볼 수 있습니다. 두 상징적 주제가 어떻게 연결되어 이야기될 수 있는지 관찰하는 교육적 출발점입니다.',
    resultParagraphTwo: '{aspect}은(는) 이 주제들의 관계를 설명하는 한 가지 방법입니다. 같은 성찰의 영역에서 각 주제가 더 의식되도록 만들 수 있습니다.',
    resultParagraphThree: '이 관계를 고정된 판단이 아니라 의식적인 성찰의 초대로 사용하세요. 이 도구는 출생 차트의 각을 계산하거나 검증하지 않습니다.'
  }
};

const TRADITIONAL_CHINESE_COPY: ToolDetailCopy = {
  common: {
    makeSelection: '選擇一項',
    clearSelection: '清除選擇',
    clearSelections: '清除所有選擇',
    noscript: '此瀏覽器需要 JavaScript 才能產生所選的詮釋。'
  },
  sign: {
    title: '探索一個黃道星座',
    description: '選擇一個星座，探索它的象徵元素、模式與相關的詮釋主題。',
    selectionTitle: '選擇黃道星座',
    fieldLabel: '黃道星座',
    optionPlaceholder: '選擇星座',
    boundary: '這項工具會說明你選擇的星座，不會根據出生日期或行星位置計算星座。',
    empty: '選擇一個黃道星座以查看聚焦的詮釋。初始狀態不會預先選擇星座。',
    representEyebrow: '星座代表什麼',
    representTitle: '閱讀風格的詞彙',
    representDescription: '在占星術中，黃道星座是用來描述主題如何表達的詮釋分類。它能為直接、耐心、好奇或敏感等特質提供語言，但不會定義一個人，也不會決定其行動。',
    elementsEyebrow: '元素',
    elementsTitle: '四種象徵視角',
    elementMeanings: {
      Fire: '用來觀察主動性、溫度、可見度與積極表達的象徵視角。',
      Earth: '用來觀察穩定、身體感、實際注意力與具體價值的象徵視角。',
      Air: '用來觀察思考、語言、交流與觀點的象徵視角。',
      Water: '用來觀察感受、想像、記憶與連結的象徵視角。'
    },
    modalitiesEyebrow: '模式',
    modalitiesTitle: '描述能量的三種方式',
    modalityMeanings: {
      Cardinal: '描述會啟動、開始並回應起點的能量。',
      Fixed: '描述會維持、集中並培養一致性的能量。',
      Mutable: '描述會適應、整合並為變化留出空間的能量。'
    },
    howEyebrow: '如何使用查詢',
    howTitle: '把結果當作起點閱讀',
    howDescription: '先從元素與模式開始，再觀察核心風格與建設性表達如何相互配合。潛在張力是反思平衡的邀請，不是預測或固定標籤。想探索另一個占星術詞彙時，也可以比較相位查詢。',
    calculationEyebrow: '計算與詮釋',
    calculationTitle: '這是說明，不是星座計算器',
    calculationDescription: '這項工具會說明你選擇的星座，不會根據出生日期或行星位置計算星座，也不宣稱占星詮釋具有科學驗證。想了解星盤輸入與計算邊界，請閱讀〈什麼是本命盤？〉，或回到工具中心。',
    resultTitle: '{sign}：詮釋摘要',
    resultSummary: '這裡將{sign}呈現為詮釋用的象徵分類。',
    elementLabel: '元素',
    modalityLabel: '模式',
    coreStyleLabel: '核心風格',
    constructive: '建設性表達：觀察{sign}的特質如何以更有意識的方式表達。',
    tension: '潛在張力：平衡是反思的一部分；這不是預測或固定標籤。'
  },
  house: {
    title: '探索一個占星宮位',
    description: '選擇十二個編號宮位中的一個，探索它的核心領域、主要主題、建設性表達與平衡考量。',
    selectionTitle: '選擇編號宮位',
    fieldLabel: '占星宮位',
    optionPlaceholder: '選擇宮位',
    boundary: '這項工具會說明你選擇的宮位，不會計算宮位尖點，也不會判定出生星盤中的行星位於哪一宮。',
    empty: '選擇一個編號宮位以查看聚焦的詮釋。初始狀態不會預先選擇宮位。',
    representEyebrow: '宮位代表什麼',
    representTitle: '星盤主題的脈絡',
    representDescription: '在占星術的詮釋架構中，宮位描述可以考慮星盤主題的生活或經驗領域。它們不是物理位置，也不會決定一個人的選擇。這項查詢提供用於反思的精簡詞彙，並與星盤計算分開。',
    sequenceEyebrow: '十二宮位如何不同',
    sequenceTitle: '一連串的領域',
    sequenceDescription: '十二宮位由彼此相關但各自不同的領域組成，從身分與自我方向到私密反思。在完整星盤中，宮位為行星或星座提供脈絡；宮位本身不是預測。選擇上方的編號，一次聚焦一個領域。',
    timeEyebrow: '出生時間為何可能重要',
    timeTitle: '宮位計算是另一項工作',
    timeDescription: '在實際的本命盤中，宮位尖點與行星落宮可能取決於出生時間、出生地點與所選的宮位系統。如果不知道精確出生時間，就不應假定精確的宮位主張。此頁不收集這些資料，也不計算尖點、角度或配置。',
    howEyebrow: '如何使用查詢',
    howTitle: '把結果當作起點閱讀',
    howDescription: '選擇一個宮位，閱讀它的核心領域與主要主題，再一起考量建設性表達與平衡觀點。這裡的語言是教育性與象徵性的。想了解相關詞彙，可以繼續查看星座查詢或相位查詢。',
    calculationEyebrow: '宮位意義與計算',
    calculationTitle: '這是說明，不是宮位計算器',
    calculationDescription: '不同宮位系統可能以不同方式放置尖點或行星，但這項查詢不會選擇、比較或計算宮位系統。維護、共享資源、轉變、隱私與較不明顯的過程等詞語是詮釋提示，不是醫療診斷、財務預測、死亡預測或精神醫學標籤。想了解更多星盤輸入脈絡，請閱讀〈什麼是本命盤？〉，或回到工具中心。',
    resultTitle: '{house}：詮釋摘要',
    resultSummary: '在占星詮釋中，{house}可作為反思星盤的象徵性生活或經驗領域。',
    resultCoreDomain: '用來反思{house}的象徵性領域。',
    resultKeyThemes: '與{house}相關的經驗主題。',
    resultConstructive: '帶著好奇與脈絡來看待這個領域。',
    resultTension: '保持開放的反思，避免把它變成固定標籤。',
    coreDomainLabel: '核心領域',
    keyThemesLabel: '主要主題',
    constructiveLabel: '建設性表達',
    tensionLabel: '平衡考量'
  },
  aspect: {
    title: '探索一個行星相位',
    description: '選擇兩顆行星與一個主要相位，探索占星術如何描述這些主題之間的關係。',
    selectionTitle: '行星 A + 相位 + 行星 B',
    planetALabel: '行星 A',
    aspectLabel: '主要相位',
    planetBLabel: '行星 B',
    planetPlaceholder: '選擇行星',
    aspectPlaceholder: '選擇相位',
    boundary: '選擇你想先理解的相位。同樣兩顆行星無論順序如何，都代表一個對稱的組合。',
    empty: '選擇行星 A、主要相位與行星 B，以查看聚焦的詮釋。初始狀態不會預先選擇組合。',
    whatEyebrow: '這項工具的作用',
    whatTitle: '從已知組合開始',
    whatDescription: '行星相位是一種詮釋兩個星盤天體之間關係的方法。這項工具讓你先指定兩個天體與主要相位，再提供相關主題與互動的精簡說明。',
    howEyebrow: '如何使用結果',
    howTitle: '把它當作起點閱讀',
    howDescription: '注意兩個行星主題，再思考相位互動如何讓它們展開對話。這裡的文字是教育性與象徵性的，不會對個人或星盤作出預測。',
    calculationEyebrow: '計算與詮釋',
    calculationTitle: '這是說明，不是相位偵測器',
    calculationDescription: '這項工具會說明你選擇的相位，不會計算行星位置、測量角度或容許度，也不會判定出生星盤中是否存在該相位。想了解星盤輸入與計算透明度，請閱讀〈什麼是本命盤？〉，或回到工具中心。',
    resultParagraphOne: '可以透過選擇的{aspect}一起觀察{first}與{second}。這是探索兩個象徵主題如何被放在一起討論的教育性起點。',
    resultParagraphTwo: '{aspect}提供了一種描述這些主題關係的方法。在同一個反思領域中，這個組合可能讓每個主題都更加明顯。',
    resultParagraphThree: '請把這段關係當作有意識反思的提示，而不是固定判斷。這項工具不會計算或驗證出生星盤中的相位。'
  }
};

const LOCALE_COPY: Record<SupportedLocale, ToolDetailCopy> = {
  en: ENGLISH_COPY,
  es: SPANISH_COPY,
  fr: FRENCH_COPY,
  de: GERMAN_COPY,
  ja: JAPANESE_COPY,
  ko: KOREAN_COPY,
  'zh-Hant': TRADITIONAL_CHINESE_COPY
};

export function getToolDetailCopy(locale: SupportedLocale = 'en'): ToolDetailCopy {
  return LOCALE_COPY[locale] ?? ENGLISH_COPY;
}

export function formatToolDetailMessage(
  message: string,
  values: Readonly<Record<string, string | number>>
): string {
  return message.replace(
    /\{([A-Za-z0-9_.-]+)\}/gu,
    (token, name: string) =>
      Object.prototype.hasOwnProperty.call(values, name)
        ? String(values[name])
        : token
  );
}
