import type { SupportedLocale } from '@/lib/localization';
import type { PublicEditorialPage } from './types';

export const ABOUT_CONTENT: Record<SupportedLocale, PublicEditorialPage> = {
  en: {
    locale: 'en',
    eyebrow: 'ABOUT NATALNODE',
    title: 'A clearer way to read a chart.',
    description:
      'NatalNode is building a clearer, more transparent way to calculate, inspect, and understand a natal chart—combining professional chart UX, structured chart facts, clear interpretation, and calculation transparency.',
    sections: [
      {
        id: 'why',
        eyebrow: 'Why NatalNode exists',
        title: 'Keep the layers visible.',
        paragraphs: [
          'A chart can become one opaque result: calculation, interpretation, and presentation blended together. NatalNode keeps those layers distinct so you can tell what was calculated, what is interpretive, and what is unavailable or limited.'
        ]
      },
      {
        id: 'calculation',
        eyebrow: 'Calculation before interpretation',
        title: 'Start with explicit chart facts.',
        paragraphs: [
          'The product direction is straightforward: Birth input → chart calculation → structured chart facts → interpretation. NatalNode.com is the first-party Web product around the NatalNode Engine boundary, presenting interpretation grounded in the facts returned there.',
          'Any future AI explanation would sit after those facts; it would not calculate them or fill in what is missing.'
        ]
      },
      {
        id: 'uncertainty',
        eyebrow: 'Uncertainty stays visible',
        title: 'Unknown should stay unknown.',
        paragraphs: [
          'An unknown birth time can leave time-dependent parts of a chart unavailable. Historical timezone ambiguity may need to be surfaced for a user to choose between possible occurrences, and provenance may not be available for every result.',
          'NatalNode should show those limits instead of creating false precision. The product does not treat an unavailable fact as an invitation to guess.'
        ]
      },
      {
        id: 'inspectability',
        eyebrow: 'Inspectability',
        title: 'A chart should not be a black box.',
        paragraphs: [
          'When available, Calculation Details can expose calculation status, Engine version, chart schema, configuration status, provenance, and warnings alongside the result.',
          'Not every field is present in every result. Showing what is known—and what is not—is part of making the chart easier to inspect.'
        ]
      },
      {
        id: 'direction',
        eyebrow: 'Product direction',
        title: 'Build toward clearer understanding.',
        paragraphs: [
          'Planned work is focused on better chart understanding, richer deterministic interpretation, additional professional chart tools, and stronger Learn and reference tools. Future capabilities will stay on the same Engine-first boundary and will be labeled future or planned until they are ready.'
        ],
        link: {
          href: '/methodology',
          label: 'Read our methodology →'
        }
      }
    ]
  },
  es: {
    locale: 'es',
    eyebrow: 'SOBRE NATALNODE',
    title: 'Una forma más clara de leer una carta.',
    description:
      'NatalNode está construyendo una forma más clara y transparente de calcular, examinar y comprender una carta natal, combinando una experiencia de carta profesional, datos estructurados, interpretación clara y transparencia en el cálculo.',
    sections: [
      {
        id: 'why',
        eyebrow: 'Por qué existe NatalNode',
        title: 'Mantener visibles las capas.',
        paragraphs: [
          'Una carta puede convertirse en un resultado opaco: cálculo, interpretación y presentación se mezclan. NatalNode mantiene esas capas separadas para que puedas distinguir lo calculado, lo interpretativo y lo que no está disponible o está limitado.'
        ]
      },
      {
        id: 'calculation',
        eyebrow: 'Cálculo antes que interpretación',
        title: 'Comenzar con datos explícitos de la carta.',
        paragraphs: [
          'La dirección del producto es directa: datos de nacimiento → cálculo de la carta → datos estructurados de la carta → interpretación. NatalNode.com es el producto web propio alrededor del límite del NatalNode Engine y presenta interpretaciones basadas en los datos que devuelve.',
          'Cualquier explicación futura mediante IA se situaría después de esos datos; no los calcularía ni completaría lo que falta.'
        ]
      },
      {
        id: 'uncertainty',
        eyebrow: 'La incertidumbre permanece visible',
        title: 'Lo desconocido debe seguir siendo desconocido.',
        paragraphs: [
          'Desconocer la hora de nacimiento puede dejar sin disponibilidad algunas partes de la carta que dependen de la hora. La ambigüedad de la zona horaria histórica puede tener que mostrarse para que el usuario elija entre posibles ocurrencias, y no todos los resultados tendrán datos de procedencia.',
          'NatalNode debe mostrar esos límites en lugar de crear una precisión falsa. El producto no trata un dato no disponible como una invitación a adivinar.'
        ]
      },
      {
        id: 'inspectability',
        eyebrow: 'Inspeccionabilidad',
        title: 'Una carta no debería ser una caja negra.',
        paragraphs: [
          'Cuando están disponibles, los Detalles del cálculo pueden mostrar el estado del cálculo, la versión del Engine, el esquema de la carta, el estado de configuración, la procedencia y las advertencias junto al resultado.',
          'No todos los resultados contienen todos los campos. Mostrar lo que se conoce —y lo que no— forma parte de hacer la carta más fácil de examinar.'
        ]
      },
      {
        id: 'direction',
        eyebrow: 'Dirección del producto',
        title: 'Construir para comprender con más claridad.',
        paragraphs: [
          'El trabajo previsto se centra en comprender mejor las cartas, ofrecer una interpretación determinista más rica, añadir herramientas profesionales y fortalecer Learn y las herramientas de referencia. Las capacidades futuras mantendrán el mismo límite centrado en el Engine y se marcarán como futuras o previstas hasta estar listas.'
        ],
        link: {
          href: '/methodology',
          label: 'Leer nuestra metodología →'
        }
      }
    ]
  },
  fr: {
    locale: 'fr',
    eyebrow: 'À PROPOS DE NATALNODE',
    title: 'Une manière plus claire de lire un thème.',
    description:
      'NatalNode construit une manière plus claire et plus transparente de calculer, examiner et comprendre un thème natal, en réunissant une expérience de thème professionnelle, des faits structurés, une interprétation claire et une transparence du calcul.',
    sections: [
      {
        id: 'why',
        eyebrow: 'Pourquoi NatalNode existe',
        title: 'Garder les différentes couches visibles.',
        paragraphs: [
          'Un thème peut devenir un résultat opaque : calcul, interprétation et présentation se confondent. NatalNode garde ces couches distinctes afin que vous puissiez voir ce qui a été calculé, ce qui relève de l’interprétation et ce qui est indisponible ou limité.'
        ]
      },
      {
        id: 'calculation',
        eyebrow: 'Le calcul avant l’interprétation',
        title: 'Commencer par des faits de thème explicites.',
        paragraphs: [
          'La direction du produit est simple : données de naissance → calcul du thème → faits structurés du thème → interprétation. NatalNode.com est le produit Web de première partie construit autour de la frontière du NatalNode Engine et présente une interprétation fondée sur les faits qu’il renvoie.',
          'Toute explication future par IA viendrait après ces faits ; elle ne les calculerait pas et ne compléterait pas ce qui manque.'
        ]
      },
      {
        id: 'uncertainty',
        eyebrow: 'L’incertitude reste visible',
        title: 'Ce qui est inconnu doit le rester.',
        paragraphs: [
          'Une heure de naissance inconnue peut rendre indisponibles certaines parties du thème qui dépendent de l’heure. Une ambiguïté historique de fuseau horaire peut devoir être présentée afin que l’utilisateur choisisse entre plusieurs occurrences possibles, et la provenance peut ne pas être disponible pour chaque résultat.',
          'NatalNode doit montrer ces limites plutôt que de créer une fausse précision. Le produit ne considère pas un fait indisponible comme une invitation à deviner.'
        ]
      },
      {
        id: 'inspectability',
        eyebrow: 'Possibilité d’examen',
        title: 'Un thème ne devrait pas être une boîte noire.',
        paragraphs: [
          'Lorsqu’ils sont disponibles, les détails du calcul peuvent exposer le statut du calcul, la version de l’Engine, le schéma du thème, le statut de configuration, la provenance et les avertissements à côté du résultat.',
          'Tous les résultats ne contiennent pas tous les champs. Montrer ce qui est connu — et ce qui ne l’est pas — rend le thème plus facile à examiner.'
        ]
      },
      {
        id: 'direction',
        eyebrow: 'Direction du produit',
        title: 'Construire pour mieux comprendre.',
        paragraphs: [
          'Le travail prévu porte sur une meilleure compréhension des thèmes, une interprétation déterministe plus riche, des outils professionnels supplémentaires et des ressources Learn et de référence plus solides. Les capacités futures resteront sur la même frontière centrée sur l’Engine et seront indiquées comme futures ou prévues jusqu’à leur disponibilité.'
        ],
        link: {
          href: '/methodology',
          label: 'Lire notre méthodologie →'
        }
      }
    ]
  },
  de: {
    locale: 'de',
    eyebrow: 'ÜBER NATALNODE',
    title: 'Ein klarerer Weg, ein Horoskop zu lesen.',
    description:
      'NatalNode entwickelt eine klarere und transparentere Möglichkeit, ein Geburtshoroskop zu berechnen, zu prüfen und zu verstehen – mit professioneller Horoskopdarstellung, strukturierten Fakten, verständlicher Interpretation und nachvollziehbaren Berechnungen.',
    sections: [
      {
        id: 'why',
        eyebrow: 'Warum es NatalNode gibt',
        title: 'Die Ebenen sichtbar halten.',
        paragraphs: [
          'Ein Horoskop kann zu einem undurchsichtigen Ergebnis werden: Berechnung, Interpretation und Darstellung verschmelzen. NatalNode hält diese Ebenen getrennt, damit erkennbar bleibt, was berechnet wurde, was interpretativ ist und was nicht verfügbar oder eingeschränkt ist.'
        ]
      },
      {
        id: 'calculation',
        eyebrow: 'Berechnung vor Interpretation',
        title: 'Mit expliziten Horoskopfakten beginnen.',
        paragraphs: [
          'Die Produktidee ist klar: Geburtsdaten → Horoskopberechnung → strukturierte Horoskopfakten → Interpretation. NatalNode.com ist das eigene Webprodukt an der Grenze zum NatalNode Engine und stellt Interpretationen auf Grundlage der dort zurückgegebenen Fakten dar.',
          'Eine künftige KI-Erklärung würde erst nach diesen Fakten ansetzen; sie würde sie weder berechnen noch fehlende Angaben ergänzen.'
        ]
      },
      {
        id: 'uncertainty',
        eyebrow: 'Unsicherheit bleibt sichtbar',
        title: 'Unbekanntes soll unbekannt bleiben.',
        paragraphs: [
          'Eine unbekannte Geburtszeit kann zeitabhängige Teile eines Horoskops nicht verfügbar machen. Historische Mehrdeutigkeiten der Zeitzone müssen möglicherweise sichtbar gemacht werden, damit Nutzer zwischen möglichen Zeitpunkten wählen können; außerdem ist die Herkunft nicht für jedes Ergebnis verfügbar.',
          'NatalNode soll diese Grenzen zeigen, statt eine falsche Genauigkeit zu erzeugen. Das Produkt versteht einen nicht verfügbaren Fakt nicht als Einladung zum Raten.'
        ]
      },
      {
        id: 'inspectability',
        eyebrow: 'Nachvollziehbarkeit',
        title: 'Ein Horoskop sollte keine Blackbox sein.',
        paragraphs: [
          'Wenn verfügbar, können die Berechnungsdetails den Berechnungsstatus, die Engine-Version, das Horoskopschema, den Konfigurationsstatus, die Herkunft und Warnungen neben dem Ergebnis offenlegen.',
          'Nicht jedes Ergebnis enthält jedes Feld. Sichtbar zu machen, was bekannt ist – und was nicht –, gehört zu einem leichter prüfbaren Horoskop.'
        ]
      },
      {
        id: 'direction',
        eyebrow: 'Produktrichtung',
        title: 'Auf klareres Verständnis hinarbeiten.',
        paragraphs: [
          'Die geplante Arbeit konzentriert sich auf ein besseres Verständnis von Horoskopen, eine reichhaltigere deterministische Interpretation, zusätzliche professionelle Werkzeuge sowie stärkere Learn- und Referenzangebote. Künftige Funktionen bleiben an dieselbe Engine-first-Grenze gebunden und werden bis zur Bereitschaft als zukünftig oder geplant gekennzeichnet.'
        ],
        link: {
          href: '/methodology',
          label: 'Unsere Methodik lesen →'
        }
      }
    ]
  },
  ja: {
    locale: 'ja',
    eyebrow: 'NATALNODEについて',
    title: 'チャートをより明確に読むために。',
    description:
      'NatalNodeは、プロフェッショナルなチャート体験、構造化されたチャート事実、明確な解釈、計算の透明性を組み合わせ、ネイタルチャートをより明確かつ透明に計算・確認・理解できる方法をつくっています。',
    sections: [
      {
        id: 'why',
        eyebrow: 'NatalNodeが存在する理由',
        title: '層を見えるままに保つ。',
        paragraphs: [
          'チャートは、計算・解釈・表示が混ざった不透明な結果になり得ます。NatalNodeはそれらの層を分け、何が計算された事実で、何が解釈で、何が利用できない、または制限されているのかを確認できるようにします。'
        ]
      },
      {
        id: 'calculation',
        eyebrow: '解釈より先に計算を',
        title: '明示されたチャート事実から始める。',
        paragraphs: [
          'プロダクトの流れは明確です。出生情報 → チャート計算 → 構造化されたチャート事実 → 解釈。NatalNode.comはNatalNode Engineとの境界を中心とするファーストパーティのWebプロダクトで、Engineが返した事実に基づく解釈を提示します。',
          '将来のAIによる説明が加わる場合も、それは事実の後に位置づけられます。事実を計算したり、欠けている情報を補ったりするものではありません。'
        ]
      },
      {
        id: 'uncertainty',
        eyebrow: '不確実性を見えるままにする',
        title: '不明なものは不明なままにする。',
        paragraphs: [
          '出生時刻が不明だと、時刻に依存するチャートの一部を利用できないことがあります。過去のタイムゾーンの曖昧さについては、可能な候補から利用者が選べるように示す必要があり、すべての結果で来歴情報を利用できるとは限りません。',
          'NatalNodeは偽の精密さをつくるのではなく、そうした制限を示します。利用できない事実を推測することはありません。'
        ]
      },
      {
        id: 'inspectability',
        eyebrow: '検証可能性',
        title: 'チャートをブラックボックスにしない。',
        paragraphs: [
          '利用できる場合、Calculation Detailsでは、計算ステータス、Engineのバージョン、チャートスキーマ、設定ステータス、来歴情報、警告を結果とともに確認できます。',
          'すべての結果にすべての項目が含まれるわけではありません。わかっていることと、わかっていないことを示すことが、チャートを確認しやすくします。'
        ]
      },
      {
        id: 'direction',
        eyebrow: 'プロダクトの方向性',
        title: 'より明確な理解に向けてつくる。',
        paragraphs: [
          '今後は、チャートの理解を深めること、決定論的な解釈を豊かにすること、プロフェッショナル向けのチャートツールを増やすこと、Learnとリファレンスツールを強化することに取り組みます。将来の機能も同じEngine-firstの境界に置き、準備が整うまでは将来または計画中であることを明示します。'
        ],
        link: {
          href: '/methodology',
          label: '方法論を読む →'
        }
      }
    ]
  },
  ko: {
    locale: 'ko',
    eyebrow: 'NATALNODE 소개',
    title: '차트를 더 명확하게 읽는 방법.',
    description:
      'NatalNode는 전문적인 차트 경험, 구조화된 차트 사실, 명확한 해석, 투명한 계산을 결합해 네이털 차트를 더 명확하고 투명하게 계산하고 살펴보고 이해하는 방법을 만들고 있습니다.',
    sections: [
      {
        id: 'why',
        eyebrow: 'NatalNode가 필요한 이유',
        title: '각 층위를 보이는 상태로 둡니다.',
        paragraphs: [
          '차트는 계산, 해석, 표현이 섞인 불투명한 결과가 되기 쉽습니다. NatalNode는 이 층위를 분리해 무엇이 계산된 사실인지, 무엇이 해석인지, 무엇을 사용할 수 없거나 제한되는지 구분할 수 있게 합니다.'
        ]
      },
      {
        id: 'calculation',
        eyebrow: '해석보다 먼저 계산을',
        title: '명시적인 차트 사실에서 시작합니다.',
        paragraphs: [
          '제품의 방향은 분명합니다. 출생 입력 → 차트 계산 → 구조화된 차트 사실 → 해석. NatalNode.com은 NatalNode Engine 경계를 중심으로 한 퍼스트파티 웹 제품이며, Engine이 반환한 사실에 근거한 해석을 보여 줍니다.',
          '향후 AI 설명이 추가되더라도 그 위치는 해당 사실 뒤입니다. AI가 사실을 계산하거나 없는 내용을 채우지는 않습니다.'
        ]
      },
      {
        id: 'uncertainty',
        eyebrow: '불확실성을 보이는 상태로 둡니다',
        title: '모르는 것은 모르는 채로 둡니다.',
        paragraphs: [
          '출생 시각을 알 수 없으면 시각에 의존하는 차트의 일부를 사용할 수 없게 될 수 있습니다. 역사적 시간대의 모호함은 가능한 발생 시점 중 하나를 사용자가 선택하도록 표시해야 할 수 있으며, 모든 결과에 출처 정보가 있는 것도 아닙니다.',
          'NatalNode는 거짓된 정밀함을 만드는 대신 이러한 한계를 보여 줍니다. 사용할 수 없는 사실을 추측의 근거로 삼지 않습니다.'
        ]
      },
      {
        id: 'inspectability',
        eyebrow: '검토 가능성',
        title: '차트를 블랙박스로 만들지 않습니다.',
        paragraphs: [
          '사용 가능한 경우 Calculation Details에서 계산 상태, Engine 버전, 차트 스키마, 구성 상태, 출처 정보와 경고를 결과와 함께 확인할 수 있습니다.',
          '모든 결과에 모든 필드가 포함되는 것은 아닙니다. 알려진 것과 알려지지 않은 것을 보여 주는 것이 차트를 더 쉽게 검토하는 방법입니다.'
        ]
      },
      {
        id: 'direction',
        eyebrow: '제품 방향',
        title: '더 명확한 이해를 향해 만듭니다.',
        paragraphs: [
          '앞으로는 차트를 더 잘 이해하도록 돕고, 결정론적 해석을 풍부하게 하며, 전문 차트 도구를 추가하고, Learn과 참고 도구를 강화하는 데 집중합니다. 향후 기능도 같은 Engine-first 경계를 따르며 준비되기 전까지는 미래 기능 또는 계획으로 표시합니다.'
        ],
        link: {
          href: '/methodology',
          label: '방법론 읽기 →'
        }
      }
    ]
  },
  'zh-Hant': {
    locale: 'zh-Hant',
    eyebrow: '關於 NATALNODE',
    title: '用更清楚的方式閱讀星盤。',
    description:
      'NatalNode 正在打造更清楚、更透明的本命盤計算、檢視與理解方式，結合專業的星盤體驗、結構化的星盤事實、清楚的詮釋，以及計算透明度。',
    sections: [
      {
        id: 'why',
        eyebrow: 'NatalNode 存在的原因',
        title: '讓各個層次保持可見。',
        paragraphs: [
          '星盤可能變成一個不透明的結果：計算、詮釋與呈現混在一起。NatalNode 將這些層次分開，讓你能分辨哪些是已計算的內容、哪些屬於詮釋，以及哪些內容無法使用或受到限制。'
        ]
      },
      {
        id: 'calculation',
        eyebrow: '先計算，再詮釋',
        title: '從明確的星盤事實開始。',
        paragraphs: [
          '產品方向很直接：出生輸入 → 星盤計算 → 結構化星盤事實 → 詮釋。NatalNode.com 是圍繞 NatalNode Engine 邊界建立的第一方 Web 產品，根據 Engine 回傳的事實呈現詮釋。',
          '未來若加入 AI 說明，也會位於這些事實之後；它不會計算事實，也不會填補缺少的內容。'
        ]
      },
      {
        id: 'uncertainty',
        eyebrow: '讓不確定性保持可見',
        title: '未知就應該保持未知。',
        paragraphs: [
          '出生時間未知，可能使依賴時間的星盤部分無法使用。歷史時區歧義可能需要呈現出來，讓使用者在可能的發生時刻之間作出選擇；而且並非每個結果都有可用的出處資訊。',
          'NatalNode 應該呈現這些限制，而不是製造虛假的精確度。產品不會把無法使用的事實當成猜測的邀請。'
        ]
      },
      {
        id: 'inspectability',
        eyebrow: '可檢視性',
        title: '星盤不應該是黑箱。',
        paragraphs: [
          '在資料可用時，計算詳細資料可以在結果旁呈現計算狀態、Engine 版本、星盤結構、設定狀態、出處資訊與警告。',
          '每個結果不一定都有每個欄位。呈現已知與未知的內容，是讓星盤更容易檢視的一部分。'
        ]
      },
      {
        id: 'direction',
        eyebrow: '產品方向',
        title: '朝向更清楚的理解前進。',
        paragraphs: [
          '規劃中的工作聚焦於更好的星盤理解、更豐富的決定性詮釋、更多專業星盤工具，以及更完善的 Learn 與參考工具。未來功能會維持相同的 Engine-first 邊界，在準備完成前標示為未來或規劃中。'
        ],
        link: {
          href: '/methodology',
          label: '閱讀我們的方法論 →'
        }
      }
    ]
  }
};

export function getAboutContent(locale: SupportedLocale): PublicEditorialPage {
  const content = ABOUT_CONTENT[locale];

  if (content === undefined) {
    throw new Error(`Missing About content for locale: ${locale}`);
  }

  return content;
}
