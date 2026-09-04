import {
  type SignElement,
  type SignModality
} from '../../core/astrology-taxonomy/chart-taxonomy.js';
import {
  SUPPORTED_LOCALES,
  type SupportedLocale
} from '../../lib/localization.js';

export const ELEMENT_PAIR_KEYS = [
  'Fire|Fire',
  'Fire|Earth',
  'Fire|Air',
  'Fire|Water',
  'Earth|Earth',
  'Earth|Air',
  'Earth|Water',
  'Air|Air',
  'Air|Water',
  'Water|Water'
] as const;

export type ElementPairKey = (typeof ELEMENT_PAIR_KEYS)[number];

export const MODALITY_PAIR_KEYS = [
  'Cardinal|Cardinal',
  'Cardinal|Fixed',
  'Cardinal|Mutable',
  'Fixed|Fixed',
  'Fixed|Mutable',
  'Mutable|Mutable'
] as const;

export type ModalityPairKey = (typeof MODALITY_PAIR_KEYS)[number];

type PairCopyCatalog<Key extends string> = Readonly<
  Record<SupportedLocale, Readonly<Record<Key, string>>>
>;

/**
 * Sign Match content is compositional. These records describe unordered
 * element relationships; they do not describe individual sign pairs.
 */
export const ELEMENT_PAIR_CONTENT = {
  en: {
    'Fire|Fire': 'Both signs carry Fire classification, so traditional interpretation emphasizes activation and expression on shared elemental ground. Their modalities still shape how that pattern is organized.',
    'Fire|Earth': 'Fire emphasizes activation and expression while Earth emphasizes steadiness and material grounding. This is a difference in elemental emphasis, not a verdict about a pairing.',
    'Fire|Air': 'Fire and Air are traditionally read as active and expressive classifications. Their interaction can be discussed as movement and connection, while the signs’ modalities add another structural layer.',
    'Fire|Water': 'Fire and Water bring contrasting elemental emphases: activation and expression alongside receptivity and feeling. A sign-level comparison can name that contrast without predicting how people relate.',
    'Earth|Earth': 'Both signs share Earth classification, emphasizing steadiness and material grounding in a traditional structural reading. Their modalities distinguish the particular pattern.',
    'Earth|Air': 'Earth and Air pair grounding with connection and concepts in a traditional elemental lens. This describes two classifications; it cannot summarize a whole relationship.',
    'Earth|Water': 'Earth and Water combine grounding with receptivity in a traditional lens. The shared emphasis can be studied alongside their differing modalities without turning it into a conclusion.',
    'Air|Air': 'Both signs carry Air classification, emphasizing connection and concepts in a traditional structural reading. Their modalities show how each sign organizes that shared element.',
    'Air|Water': 'Air and Water contrast conceptual connection with receptivity and feeling. Traditional interpretation can use this difference as a study prompt, not a deterministic relationship claim.',
    'Water|Water': 'Both signs share Water classification, emphasizing receptivity and feeling in a traditional structural reading. Their modalities still distinguish how that element is organized.'
  },
  es: {
    'Fire|Fire': 'Ambos signos tienen clasificación de fuego; en la interpretación tradicional esto enfatiza la activación y la expresión sobre una base elemental compartida. Sus modalidades aún organizan ese patrón de maneras distintas.',
    'Fire|Earth': 'El fuego enfatiza la activación y la expresión, mientras que la tierra enfatiza la estabilidad y el arraigo material. Es una diferencia de énfasis elemental, no un veredicto sobre una pareja.',
    'Fire|Air': 'Fuego y aire se leen tradicionalmente como clasificaciones activas y expresivas. Su relación puede estudiarse como movimiento y conexión, mientras que las modalidades añaden otra capa estructural.',
    'Fire|Water': 'Fuego y agua presentan énfasis elementales contrastantes: activación y expresión junto con receptividad y sensibilidad. Una comparación de signos puede nombrar ese contraste sin predecir cómo se relacionan las personas.',
    'Earth|Earth': 'Ambos signos comparten la clasificación de tierra, asociada tradicionalmente con estabilidad y arraigo material. Sus modalidades distinguen la forma particular de ese patrón.',
    'Earth|Air': 'Tierra y aire reúnen arraigo, conexión y conceptos en una lente elemental tradicional. Describe dos clasificaciones; no puede resumir una relación completa.',
    'Earth|Water': 'Tierra y agua combinan arraigo y receptividad en una lente tradicional. El énfasis compartido puede estudiarse junto con sus modalidades diferentes sin convertirlo en una conclusión.',
    'Air|Air': 'Ambos signos comparten la clasificación de aire, asociada tradicionalmente con conexión y conceptos. Sus modalidades muestran cómo cada signo organiza ese elemento.',
    'Air|Water': 'Aire y agua contrastan la conexión conceptual con la receptividad y la sensibilidad. La interpretación tradicional puede usar la diferencia como punto de estudio, no como afirmación determinista.',
    'Water|Water': 'Ambos signos comparten la clasificación de agua, asociada tradicionalmente con receptividad y sensibilidad. Sus modalidades aún distinguen cómo se organiza ese elemento.'
  },
  fr: {
    'Fire|Fire': 'Les deux signes relèvent du feu ; l’interprétation traditionnelle met donc l’accent sur l’activation et l’expression autour d’une même base élémentaire. Leurs modalités organisent encore ce schéma différemment.',
    'Fire|Earth': 'Le feu met l’accent sur l’activation et l’expression, tandis que la terre met l’accent sur la stabilité et l’ancrage matériel. C’est une différence de classification, pas un verdict sur une relation.',
    'Fire|Air': 'Le feu et l’air sont traditionnellement lus comme des classifications actives et expressives. Leur interaction peut être étudiée comme mouvement et connexion, avec une couche supplémentaire apportée par les modalités.',
    'Fire|Water': 'Le feu et l’eau présentent des accents élémentaires contrastés : activation et expression d’un côté, réceptivité et sensibilité de l’autre. Une comparaison de signes peut nommer ce contraste sans prédire les relations.',
    'Earth|Earth': 'Les deux signes partagent la classification terre, traditionnellement liée à la stabilité et à l’ancrage matériel. Leurs modalités distinguent la forme particulière du schéma.',
    'Earth|Air': 'La terre et l’air associent ancrage, connexion et concepts dans une lecture élémentaire traditionnelle. Cela décrit deux classifications, pas une relation entière.',
    'Earth|Water': 'La terre et l’eau associent ancrage et réceptivité dans une lecture traditionnelle. Cet accent commun peut être étudié avec leurs modalités différentes, sans en faire une conclusion.',
    'Air|Air': 'Les deux signes partagent la classification air, traditionnellement liée à la connexion et aux concepts. Leurs modalités montrent comment chacun organise cet élément.',
    'Air|Water': 'L’air et l’eau contrastent connexion conceptuelle et réceptivité sensible. L’interprétation traditionnelle peut en faire un axe d’étude, non une affirmation déterministe.',
    'Water|Water': 'Les deux signes partagent la classification eau, traditionnellement liée à la réceptivité et à la sensibilité. Leurs modalités distinguent encore l’organisation de cet élément.'
  },
  de: {
    'Fire|Fire': 'Beide Zeichen tragen die Feuer-Klassifikation; in traditioneller Deutung betont das Aktivierung und Ausdruck auf gemeinsamer elementarer Grundlage. Ihre Modalitäten ordnen dieses Muster dennoch unterschiedlich.',
    'Fire|Earth': 'Feuer betont Aktivierung und Ausdruck, Erde dagegen Beständigkeit und materielle Erdung. Das ist ein Unterschied der Elementklassifikation, kein Urteil über ein Paar.',
    'Fire|Air': 'Feuer und Luft werden traditionell als aktive und ausdrucksbezogene Klassifikationen gelesen. Ihre Verbindung lässt sich als Bewegung und Austausch betrachten; die Modalitäten ergänzen eine weitere Strukturebene.',
    'Fire|Water': 'Feuer und Wasser bringen gegensätzliche Elementschwerpunkte zusammen: Aktivierung und Ausdruck neben Aufnahmefähigkeit und Empfindung. Ein Zeichenvergleich kann diesen Kontrast benennen, ohne Beziehungen vorherzusagen.',
    'Earth|Earth': 'Beide Zeichen teilen die Erdklassifikation, die traditionell Beständigkeit und materielle Erdung betont. Ihre Modalitäten unterscheiden die konkrete Ausprägung des Musters.',
    'Earth|Air': 'Erde und Luft verbinden Erdung mit Verbindung und Begriffen in einer traditionellen Elementperspektive. Das beschreibt zwei Klassifikationen, nicht eine ganze Beziehung.',
    'Earth|Water': 'Erde und Wasser verbinden Erdung und Aufnahmefähigkeit in einer traditionellen Perspektive. Der gemeinsame Schwerpunkt kann mit den unterschiedlichen Modalitäten betrachtet werden, ohne ein Urteil daraus abzuleiten.',
    'Air|Air': 'Beide Zeichen teilen die Luftklassifikation, die traditionell Verbindung und Begriffe betont. Ihre Modalitäten zeigen, wie jedes Zeichen dieses Element ordnet.',
    'Air|Water': 'Luft und Wasser stellen begriffliche Verbindung und Aufnahmefähigkeit gegenüber. Traditionelle Deutung kann diesen Unterschied als Lernanstoß nutzen, nicht als deterministische Beziehungsbehauptung.',
    'Water|Water': 'Beide Zeichen teilen die Wasserklassifikation, die traditionell Aufnahmefähigkeit und Empfindung betont. Ihre Modalitäten unterscheiden weiterhin, wie dieses Element geordnet wird.'
  },
  ja: {
    'Fire|Fire': '両方のサインは火の分類を持ち、伝統的な解釈では、共通する要素の基盤の上で活動性と表現が強調されます。モードはその形をさらに分けて示します。',
    'Fire|Earth': '火は活動性と表現、地は安定と物質的な足場を強調します。これは要素の分類の違いであり、組み合わせへの判定ではありません。',
    'Fire|Air': '火と風は、伝統的には活動的で表現的な分類として読まれます。動きとつながりという観点で学べますが、モードが別の構造の層を加えます。',
    'Fire|Water': '火と水は、活動性・表現と受容性・感受性という対照的な要素の重心を持ちます。サインレベルの比較はその違いを示せますが、人間関係を予測するものではありません。',
    'Earth|Earth': '両方のサインは地の分類を共有し、伝統的な構造の読みでは安定と物質性が重視されます。モードがそのパターンの違いを示します。',
    'Earth|Air': '地と風は、伝統的な要素のレンズで足場とつながり・概念を組み合わせます。これは二つの分類を説明するもので、関係全体を要約するものではありません。',
    'Earth|Water': '地と水は、伝統的な見方で足場と受容性を組み合わせます。共通する重心を異なるモードとともに学べますが、結論を決めるものではありません。',
    'Air|Air': '両方のサインは風の分類を共有し、伝統的な構造の読みではつながりと概念が重視されます。モードが各サインの整理の仕方を示します。',
    'Air|Water': '風と水は、概念的なつながりと受容性・感受性を対照させます。伝統的な解釈では学習の視点にできますが、決定論的な関係の主張ではありません。',
    'Water|Water': '両方のサインは水の分類を共有し、伝統的な構造の読みでは受容性と感受性が重視されます。モードがその要素の整理の違いを示します。'
  },
  ko: {
    'Fire|Fire': '두 별자리는 모두 불 원소로 분류됩니다. 전통적 해석에서는 공통된 원소의 바탕 위에서 활성화와 표현이 강조되며, 양식이 그 패턴의 구성을 더 구분합니다.',
    'Fire|Earth': '불은 활성화와 표현을, 흙은 안정과 물질적 기반을 강조합니다. 이는 원소 분류의 차이이지 조합에 대한 판정이 아닙니다.',
    'Fire|Air': '불과 공기는 전통적으로 활동적이고 표현적인 분류로 읽힙니다. 움직임과 연결의 관점에서 살펴볼 수 있으며, 양식은 또 다른 구조적 층을 더합니다.',
    'Fire|Water': '불과 물은 활성화·표현과 수용성·감각이라는 대비되는 원소적 강조를 가져옵니다. 별자리 수준의 비교는 그 차이를 설명할 수 있지만 관계를 예측하지는 않습니다.',
    'Earth|Earth': '두 별자리는 모두 흙 원소로 분류되며, 전통적 구조 해석에서는 안정과 물질적 기반이 강조됩니다. 양식이 구체적인 패턴을 구별합니다.',
    'Earth|Air': '흙과 공기는 전통적인 원소 관점에서 기반과 연결·개념을 함께 살펴보게 합니다. 두 분류를 설명할 뿐, 관계 전체를 요약하지는 않습니다.',
    'Earth|Water': '흙과 물은 전통적 관점에서 기반과 수용성을 함께 보여 줍니다. 서로 다른 양식과 함께 살펴볼 수 있지만 결론을 정하지는 않습니다.',
    'Air|Air': '두 별자리는 모두 공기 원소로 분류되며, 전통적 구조 해석에서는 연결과 개념이 강조됩니다. 양식이 각 별자리가 그 원소를 구성하는 방식을 보여 줍니다.',
    'Air|Water': '공기와 물은 개념적 연결과 수용성·감각을 대비시킵니다. 전통적 해석에서 학습의 관점으로 다룰 수 있지만 결정론적 관계 주장은 아닙니다.',
    'Water|Water': '두 별자리는 모두 물 원소로 분류되며, 전통적 구조 해석에서는 수용성과 감각이 강조됩니다. 양식이 그 원소를 구성하는 방식의 차이를 보여 줍니다.'
  },
  'zh-Hant': {
    'Fire|Fire': '兩個星座都屬於火象；在傳統解讀中，這會在共同的元素基礎上強調啟動與表達。它們的模式仍會把這個結構整理成不同形式。',
    'Fire|Earth': '火象強調啟動與表達，土象則強調穩定與物質基礎。這是元素分類的差異，不是對配對的判定。',
    'Fire|Air': '火象與風象在傳統語言中都可被視為活躍且具表達性的分類。可以從動勢與連結來學習它們的差異，而模式會再補充一層結構。',
    'Fire|Water': '火象與水象帶來對照的元素重點：啟動與表達，以及接納與感受。星座層級的比較可以命名這個差異，但不會預測人與人如何相處。',
    'Earth|Earth': '兩個星座都屬於土象；在傳統結構解讀中，這會強調穩定與物質基礎。它們的模式會區分具體的結構形式。',
    'Earth|Air': '土象與風象在傳統元素視角中，把基礎與連結、概念放在一起理解。這是在說明兩種分類，不是總結一段完整關係。',
    'Earth|Water': '土象與水象在傳統視角中結合基礎與接納。可以把共同重點和不同模式放在一起學習，但不應把它變成結論。',
    'Air|Air': '兩個星座都屬於風象；在傳統結構解讀中，這會強調連結與概念。它們的模式會顯示各自整理這個元素的方式。',
    'Air|Water': '風象與水象對照概念連結，以及接納與感受。傳統解讀可以把這個差異當作學習角度，而不是決定性的關係主張。',
    'Water|Water': '兩個星座都屬於水象；在傳統結構解讀中，這會強調接納與感受。它們的模式仍會區分這個元素如何被組織。'
  }
} as const satisfies PairCopyCatalog<ElementPairKey>;

/** Modality records are also unordered and compositional, never sign-pair essays. */
export const MODALITY_PAIR_CONTENT = {
  en: {
    'Cardinal|Cardinal': 'Both signs carry Cardinal modality, so traditional interpretation emphasizes initiating movement on both sides. The shared mode does not determine how a relationship unfolds.',
    'Cardinal|Fixed': 'Cardinal modality emphasizes starting movement, while Fixed modality emphasizes sustaining and concentrating expression. This is a structural contrast rather than a relationship verdict.',
    'Cardinal|Mutable': 'Cardinal modality emphasizes initiation, while Mutable modality emphasizes adaptation and transition. The comparison describes interaction styles at one symbolic layer only.',
    'Fixed|Fixed': 'Both signs carry Fixed modality, emphasizing continuity and concentration in a traditional structural reading. Their shared mode does not make any personal outcome automatic.',
    'Fixed|Mutable': 'Fixed modality emphasizes sustaining a form, while Mutable modality emphasizes adapting and transitioning. This difference can guide study without becoming a deterministic conclusion.',
    'Mutable|Mutable': 'Both signs carry Mutable modality, emphasizing adaptation and transition in a traditional structural reading. The shared mode is one classification, not a complete relationship account.'
  },
  es: {
    'Cardinal|Cardinal': 'Ambos signos tienen modalidad cardinal; la interpretación tradicional enfatiza la iniciativa en los dos lados. Compartir modalidad no determina cómo se desarrolla una relación.',
    'Cardinal|Fixed': 'La modalidad cardinal enfatiza iniciar el movimiento, mientras que la fija enfatiza sostener y concentrar la expresión. Es un contraste estructural, no un veredicto sobre una relación.',
    'Cardinal|Mutable': 'La modalidad cardinal enfatiza la iniciativa, mientras que la mutable enfatiza la adaptación y la transición. La comparación describe estilos de interacción en una sola capa simbólica.',
    'Fixed|Fixed': 'Ambos signos tienen modalidad fija, asociada tradicionalmente con continuidad y concentración. Compartir modalidad no hace automático ningún resultado personal.',
    'Fixed|Mutable': 'La modalidad fija enfatiza sostener una forma, mientras que la mutable enfatiza adaptarse y transitar. La diferencia puede orientar el aprendizaje sin convertirse en una conclusión determinista.',
    'Mutable|Mutable': 'Ambos signos tienen modalidad mutable, asociada tradicionalmente con adaptación y transición. Es una clasificación, no una explicación completa de una relación.'
  },
  fr: {
    'Cardinal|Cardinal': 'Les deux signes relèvent de la modalité cardinale ; l’interprétation traditionnelle souligne donc l’initiative des deux côtés. Une modalité commune ne détermine pas le déroulement d’une relation.',
    'Cardinal|Fixed': 'La modalité cardinale met l’accent sur l’impulsion, la fixe sur le maintien et la concentration de l’expression. C’est un contraste structurel, pas un verdict relationnel.',
    'Cardinal|Mutable': 'La modalité cardinale met l’accent sur l’initiation, la mutable sur l’adaptation et la transition. Cette comparaison décrit un style d’interaction sur une seule couche symbolique.',
    'Fixed|Fixed': 'Les deux signes relèvent de la modalité fixe, traditionnellement liée à la continuité et à la concentration. Une modalité commune ne rend aucun résultat personnel automatique.',
    'Fixed|Mutable': 'La modalité fixe met l’accent sur le maintien d’une forme, la mutable sur l’adaptation et la transition. Cette différence peut soutenir l’étude sans devenir une conclusion déterministe.',
    'Mutable|Mutable': 'Les deux signes relèvent de la modalité mutable, traditionnellement liée à l’adaptation et à la transition. C’est une classification, pas un récit complet de la relation.'
  },
  de: {
    'Cardinal|Cardinal': 'Beide Zeichen tragen die kardinale Modalität; traditionelle Deutung betont daher beidseitiges Einleiten von Bewegung. Die gemeinsame Modalität bestimmt nicht den Verlauf einer Beziehung.',
    'Cardinal|Fixed': 'Kardinal betont das Beginnen von Bewegung, fix betont das Bewahren und Bündeln von Ausdruck. Das ist ein struktureller Kontrast, kein Beziehungsurteil.',
    'Cardinal|Mutable': 'Kardinal betont den Beginn, beweglich betont Anpassung und Übergang. Der Vergleich beschreibt Interaktionsstile nur auf einer symbolischen Ebene.',
    'Fixed|Fixed': 'Beide Zeichen tragen die fixe Modalität, die traditionell Kontinuität und Konzentration betont. Die gemeinsame Modalität macht kein persönliches Ergebnis automatisch.',
    'Fixed|Mutable': 'Fix betont das Bewahren einer Form, beweglich betont Anpassung und Übergang. Dieser Unterschied kann das Lernen leiten, ohne zu einer deterministischen Schlussfolgerung zu werden.',
    'Mutable|Mutable': 'Beide Zeichen tragen die bewegliche Modalität, die traditionell Anpassung und Übergang betont. Diese Klassifikation erklärt keine Beziehung vollständig.'
  },
  ja: {
    'Cardinal|Cardinal': '両方のサインは活動宮に分類され、伝統的な解釈では双方の始動性が強調されます。共通するモードが関係の展開を決めるわけではありません。',
    'Cardinal|Fixed': '活動宮は動きを始めること、不動宮は表現を保ち集中させることを強調します。これは構造の対照であり、関係への判定ではありません。',
    'Cardinal|Mutable': '活動宮は始動、柔軟宮は適応と移行を強調します。この比較は、象徴体系の一つの層における相互作用の型を示します。',
    'Fixed|Fixed': '両方のサインは不動宮に分類され、伝統的な構造の読みでは継続性と集中が重視されます。共通するモードが個人的な結果を自動的に決めるものではありません。',
    'Fixed|Mutable': '不動宮は形を保つこと、柔軟宮は適応と移行を強調します。この違いは学びの手がかりになりますが、決定論的な結論にはなりません。',
    'Mutable|Mutable': '両方のサインは柔軟宮に分類され、伝統的な構造の読みでは適応と移行が重視されます。共通する分類だけで関係全体を説明することはできません。'
  },
  ko: {
    'Cardinal|Cardinal': '두 별자리는 모두 활동궁 양식으로 분류됩니다. 전통적 해석에서는 양쪽의 시작하는 움직임이 강조되지만, 같은 양식이 관계의 전개를 결정하지는 않습니다.',
    'Cardinal|Fixed': '활동궁은 움직임을 시작하는 방식을, 고정궁은 표현을 유지하고 집중하는 방식을 강조합니다. 이는 구조적 대비이지 관계에 대한 판정이 아닙니다.',
    'Cardinal|Mutable': '활동궁은 시작을, 변통궁은 적응과 전환을 강조합니다. 이 비교는 상징 체계의 한 층에서 상호작용 방식을 설명할 뿐입니다.',
    'Fixed|Fixed': '두 별자리는 모두 고정궁 양식으로 분류되며, 전통적 구조 해석에서는 지속과 집중이 강조됩니다. 같은 양식이 개인적 결과를 자동으로 만들지는 않습니다.',
    'Fixed|Mutable': '고정궁은 형태를 유지하는 방식을, 변통궁은 적응과 전환을 강조합니다. 이 차이는 학습을 돕지만 결정론적 결론이 되지는 않습니다.',
    'Mutable|Mutable': '두 별자리는 모두 변통궁 양식으로 분류되며, 전통적 구조 해석에서는 적응과 전환이 강조됩니다. 하나의 분류만으로 관계 전체를 설명할 수는 없습니다.'
  },
  'zh-Hant': {
    'Cardinal|Cardinal': '兩個星座都屬於基本宮；在傳統解讀中，這會強調雙方啟動動勢的方式。共同的模式不會決定一段關係如何發展。',
    'Cardinal|Fixed': '基本宮強調啟動動勢，固定宮則強調維持並集中表達。這是結構上的對照，不是關係判定。',
    'Cardinal|Mutable': '基本宮強調啟動，變動宮則強調適應與轉換。這個比較只描述象徵系統其中一層的互動方式。',
    'Fixed|Fixed': '兩個星座都屬於固定宮；在傳統結構解讀中，這會強調延續與集中。共同的模式不會自動決定個人結果。',
    'Fixed|Mutable': '固定宮強調維持一種形式，變動宮則強調適應與轉換。這個差異可以幫助學習，但不應變成決定性的結論。',
    'Mutable|Mutable': '兩個星座都屬於變動宮；在傳統結構解讀中，這會強調適應與轉換。共同分類不是完整的關係說明。'
  }
} as const satisfies PairCopyCatalog<ModalityPairKey>;

function orderedPairKey<T extends string>(
  first: T,
  second: T,
  order: readonly T[]
): string {
  return order.indexOf(first) <= order.indexOf(second)
    ? `${first}|${second}`
    : `${second}|${first}`;
}

const ELEMENT_ORDER: readonly SignElement[] = ['Fire', 'Earth', 'Air', 'Water'];
const MODALITY_ORDER: readonly SignModality[] = ['Cardinal', 'Fixed', 'Mutable'];

export function getElementPairKey(
  first: SignElement,
  second: SignElement
): ElementPairKey {
  return orderedPairKey(first, second, ELEMENT_ORDER) as ElementPairKey;
}

export function getModalityPairKey(
  first: SignModality,
  second: SignModality
): ModalityPairKey {
  return orderedPairKey(first, second, MODALITY_ORDER) as ModalityPairKey;
}

export function getElementPairContent(
  first: SignElement,
  second: SignElement,
  locale: SupportedLocale
): string {
  return ELEMENT_PAIR_CONTENT[locale][getElementPairKey(first, second)];
}

export function getModalityPairContent(
  first: SignModality,
  second: SignModality,
  locale: SupportedLocale
): string {
  return MODALITY_PAIR_CONTENT[locale][getModalityPairKey(first, second)];
}

export const SIGN_MATCH_CONTENT_LOCALES = Object.freeze([...SUPPORTED_LOCALES]);
