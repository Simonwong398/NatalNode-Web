import type { SupportedLocale } from '@/lib/localization';
import type { PublicEditorialPage } from './types';

export const METHODOLOGY_CONTENT: Record<SupportedLocale, PublicEditorialPage> = {
  en: {
    locale: 'en',
    eyebrow: 'METHODOLOGY',
    title: 'Calculation you can inspect.',
    description:
      'NatalNode separates chart calculation from interpretation so the facts, assumptions, limitations, and provenance of a chart can remain visible.',
    sections: [
      {
        id: 'engine-first',
        eyebrow: 'Engine first',
        title: 'The Engine owns the calculation.',
        paragraphs: [
          'Positions, signs, ASC/MC, houses, aspects, orb, applying/exact/separating state, retrograde/direct state, and calculation warnings are Engine facts.',
          'The frontend presents returned facts and status. It does not independently calculate them, fill gaps with guesses, or derive new chart facts from a partial result.'
        ]
      },
      {
        id: 'architecture',
        eyebrow: 'A decoupled path',
        title: 'The website stays separate from the scientific core.',
        paragraphs: [
          'The conceptual path is NatalNode.com → Website API / BFF → NatalNode Engine Public API → scientific core.',
          'NatalNode.com remains decoupled from whichever astronomy provider or dataset eventually powers the Engine. Provider choice belongs behind the Engine boundary, not in Web product logic.'
        ]
      },
      {
        id: 'uncertainty',
        eyebrow: 'Uncertainty stays visible',
        title: 'Unknown inputs remain unknown.',
        paragraphs: [
          'An unknown birth time is valid. NatalNode does not silently substitute noon or another artificial time; ASC, MC, houses, and house-based interpretation remain unavailable when the time needed for them is unavailable.',
          'Historical timezone and daylight-saving ambiguity should be surfaced for the user to choose between possible occurrences. The system should not silently select one and present it as certain.'
        ]
      },
      {
        id: 'interpretation',
        eyebrow: 'Facts before interpretation',
        title: 'Interpretation consumes explicit facts.',
        paragraphs: [
          'Birth input → Engine calculation → structured chart facts → deterministic interpretation → optional future AI explanation.',
          'Each layer has a defined responsibility. AI explanation is future and deferred; it does not calculate, repair, or guess missing chart facts.'
        ]
      },
      {
        id: 'provenance',
        eyebrow: 'Calculation Details',
        title: 'A result should explain where it came from.',
        paragraphs: [
          'Calculation Details uses concrete fields such as Engine Version, Chart Schema, Calculation Status, Configuration Status, Astronomy Configuration, Provenance Envelope, Warnings, and, where relevant, House System.',
          'Identifiers or metadata may be unavailable. Research or incomplete results should say unavailable or incomplete instead of presenting fabricated identifiers or production claims.'
        ]
      },
      {
        id: 'environment',
        eyebrow: 'Development boundary',
        title: 'Development output is not production astronomy.',
        paragraphs: [
          'The current Web development environment uses a mock/development boundary and may show research configuration or fixtures. It is not a production astronomy system. Production scientific claims remain gated until the production Engine configuration is approved.',
          'Birth date, birth time, birth place, timezone-resolution context, and chart results are privacy-sensitive product data.'
        ]
      },
      {
        id: 'does-not',
        eyebrow: 'Boundaries',
        title: 'What NatalNode does not do.',
        paragraphs: [],
        bullets: [
          'The frontend does not invent chart facts.',
          'AI does not calculate or guess missing facts.',
          'There is no silent exact-time fallback.',
          'Known ambiguity is not hidden.',
          'Unavailable provenance is not presented as a claim.',
          'Web logic is not coupled to a specific provider.'
        ],
        link: {
          href: '/about',
          label: 'Read about NatalNode'
        }
      }
    ]
  },
  es: {
    locale: 'es',
    eyebrow: 'METODOLOGÍA',
    title: 'Un cálculo que puedes examinar.',
    description:
      'NatalNode separa el cálculo de la carta de la interpretación para mantener visibles sus datos, supuestos, límites y procedencia.',
    sections: [
      {
        id: 'engine-first',
        eyebrow: 'Primero el Engine',
        title: 'El Engine es responsable del cálculo.',
        paragraphs: [
          'Las posiciones, los signos, ASC/MC, las casas, los aspectos, el orbe, el estado aplicativo/exacto/separativo, el estado retrógrado/directo y las advertencias de cálculo son datos del Engine.',
          'El frontend presenta los datos y el estado devueltos. No los calcula de forma independiente, no rellena vacíos con suposiciones ni deriva nuevos datos de una respuesta parcial.'
        ]
      },
      {
        id: 'architecture',
        eyebrow: 'Un recorrido desacoplado',
        title: 'El sitio permanece separado del núcleo científico.',
        paragraphs: [
          'El recorrido conceptual es NatalNode.com → Website API / BFF → NatalNode Engine Public API → núcleo científico.',
          'NatalNode.com permanece desacoplado del proveedor o conjunto de datos astronómico que eventualmente utilice el Engine. La elección del proveedor pertenece detrás del límite del Engine, no a la lógica del producto web.'
        ]
      },
      {
        id: 'uncertainty',
        eyebrow: 'La incertidumbre permanece visible',
        title: 'Los datos desconocidos siguen siendo desconocidos.',
        paragraphs: [
          'Desconocer la hora de nacimiento es válido. NatalNode no sustituye silenciosamente esa hora por el mediodía ni por otra hora artificial; ASC, MC, casas e interpretación basada en casas no están disponibles cuando falta la hora necesaria.',
          'La ambigüedad histórica de la zona horaria y del horario de verano debe mostrarse para que el usuario elija entre posibles ocurrencias. El sistema no debe elegir una en silencio y presentarla como cierta.'
        ]
      },
      {
        id: 'interpretation',
        eyebrow: 'Datos antes que interpretación',
        title: 'La interpretación consume datos explícitos.',
        paragraphs: [
          'Datos de nacimiento → cálculo del Engine → datos estructurados de la carta → interpretación determinista → explicación opcional futura mediante IA.',
          'Cada capa tiene una responsabilidad definida. La explicación mediante IA es futura y está aplazada; no calcula, repara ni adivina datos que faltan.'
        ]
      },
      {
        id: 'provenance',
        eyebrow: 'Detalles del cálculo',
        title: 'Un resultado debe explicar de dónde procede.',
        paragraphs: [
          'Los Detalles del cálculo usan campos concretos como versión del Engine, esquema de la carta, estado del cálculo, estado de configuración, configuración astronómica, envolvente de procedencia, advertencias y, cuando corresponde, sistema de casas.',
          'Los identificadores o metadatos pueden no estar disponibles. Los resultados de investigación o incompletos deben indicarlo en vez de presentar identificadores inventados o afirmaciones de producción.'
        ]
      },
      {
        id: 'environment',
        eyebrow: 'Límite de desarrollo',
        title: 'La salida de desarrollo no es astronomía de producción.',
        paragraphs: [
          'El entorno de desarrollo web actual usa un límite de mock/desarrollo y puede mostrar configuraciones de investigación o fixtures. No es un sistema astronómico de producción. Las afirmaciones científicas de producción permanecen bloqueadas hasta aprobar la configuración del Engine de producción.',
          'La fecha de nacimiento, la hora, el lugar, el contexto de resolución de zona horaria y los resultados de la carta son datos sensibles de privacidad.'
        ]
      },
      {
        id: 'does-not',
        eyebrow: 'Límites',
        title: 'Lo que NatalNode no hace.',
        paragraphs: [],
        bullets: [
          'El frontend no inventa datos de la carta.',
          'La IA no calcula ni adivina datos que faltan.',
          'No existe un reemplazo silencioso de la hora exacta.',
          'La ambigüedad conocida no se oculta.',
          'La procedencia no disponible no se presenta como una afirmación.',
          'La lógica web no está acoplada a un proveedor concreto.'
        ],
        link: {
          href: '/about',
          label: 'Leer sobre NatalNode'
        }
      }
    ]
  },
  fr: {
    locale: 'fr',
    eyebrow: 'MÉTHODOLOGIE',
    title: 'Un calcul que vous pouvez examiner.',
    description:
      'NatalNode sépare le calcul du thème de l’interprétation afin que les faits, les hypothèses, les limites et la provenance restent visibles.',
    sections: [
      {
        id: 'engine-first',
        eyebrow: 'L’Engine d’abord',
        title: 'L’Engine est responsable du calcul.',
        paragraphs: [
          'Les positions, les signes, ASC/MC, les maisons, les aspects, l’orbe, l’état appliquant/exact/séparant, l’état rétrograde/direct et les avertissements de calcul sont des faits de l’Engine.',
          'Le frontend présente les faits et le statut renvoyés. Il ne les calcule pas indépendamment, ne comble pas les lacunes par des suppositions et ne déduit pas de nouveaux faits à partir d’un résultat partiel.'
        ]
      },
      {
        id: 'architecture',
        eyebrow: 'Un parcours découplé',
        title: 'Le site reste séparé du cœur scientifique.',
        paragraphs: [
          'Le parcours conceptuel est NatalNode.com → Website API / BFF → NatalNode Engine Public API → cœur scientifique.',
          'NatalNode.com reste découplé du fournisseur ou du jeu de données astronomique qui alimentera éventuellement l’Engine. Le choix du fournisseur appartient à l’arrière de la frontière de l’Engine, pas à la logique du produit Web.'
        ]
      },
      {
        id: 'uncertainty',
        eyebrow: 'L’incertitude reste visible',
        title: 'Les données inconnues restent inconnues.',
        paragraphs: [
          'Une heure de naissance inconnue est valide. NatalNode ne la remplace pas silencieusement par midi ou par une autre heure artificielle ; ASC, MC, maisons et interprétation fondée sur les maisons restent indisponibles lorsque l’heure nécessaire manque.',
          'L’ambiguïté historique du fuseau horaire et du changement d’heure doit être présentée afin que l’utilisateur choisisse entre plusieurs occurrences possibles. Le système ne doit pas en sélectionner une en silence et la présenter comme certaine.'
        ]
      },
      {
        id: 'interpretation',
        eyebrow: 'Les faits avant l’interprétation',
        title: 'L’interprétation consomme des faits explicites.',
        paragraphs: [
          'Données de naissance → calcul de l’Engine → faits structurés du thème → interprétation déterministe → explication IA future et optionnelle.',
          'Chaque couche a une responsabilité définie. L’explication IA est future et différée ; elle ne calcule pas, ne répare pas et ne devine pas les faits manquants.'
        ]
      },
      {
        id: 'provenance',
        eyebrow: 'Détails du calcul',
        title: 'Un résultat doit expliquer d’où il vient.',
        paragraphs: [
          'Les détails du calcul utilisent des champs concrets tels que la version de l’Engine, le schéma du thème, le statut du calcul, le statut de configuration, la configuration astronomique, l’enveloppe de provenance, les avertissements et, le cas échéant, le système de maisons.',
          'Les identifiants ou les métadonnées peuvent être indisponibles. Les résultats de recherche ou incomplets doivent le signaler au lieu de présenter des identifiants fabriqués ou des affirmations de production.'
        ]
      },
      {
        id: 'environment',
        eyebrow: 'Frontière de développement',
        title: 'La sortie de développement n’est pas de l’astronomie de production.',
        paragraphs: [
          'L’environnement Web de développement actuel utilise une frontière de mock/développement et peut afficher une configuration de recherche ou des fixtures. Ce n’est pas un système astronomique de production. Les affirmations scientifiques de production restent bloquées jusqu’à l’approbation de la configuration de l’Engine de production.',
          'La date, l’heure et le lieu de naissance, le contexte de résolution du fuseau horaire et les résultats du thème sont des données sensibles du point de vue de la vie privée.'
        ]
      },
      {
        id: 'does-not',
        eyebrow: 'Limites',
        title: 'Ce que NatalNode ne fait pas.',
        paragraphs: [],
        bullets: [
          'Le frontend n’invente pas de faits de thème.',
          'L’IA ne calcule pas et ne devine pas les faits manquants.',
          'Il n’existe pas de remplacement silencieux de l’heure exacte.',
          'Une ambiguïté connue n’est pas masquée.',
          'Une provenance indisponible n’est pas présentée comme une affirmation.',
          'La logique Web n’est pas couplée à un fournisseur précis.'
        ],
        link: {
          href: '/about',
          label: 'En savoir plus sur NatalNode'
        }
      }
    ]
  },
  de: {
    locale: 'de',
    eyebrow: 'METHODIK',
    title: 'Eine Berechnung, die Sie prüfen können.',
    description:
      'NatalNode trennt die Horoskopberechnung von der Interpretation, damit Fakten, Annahmen, Einschränkungen und Herkunft sichtbar bleiben.',
    sections: [
      {
        id: 'engine-first',
        eyebrow: 'Engine zuerst',
        title: 'Die Engine verantwortet die Berechnung.',
        paragraphs: [
          'Positionen, Zeichen, ASC/MC, Häuser, Aspekte, Orbis, applizierender/exakter/separierender Status, rückläufiger/direkter Status und Berechnungswarnungen sind Fakten der Engine.',
          'Das Frontend stellt zurückgegebene Fakten und Status dar. Es berechnet sie nicht unabhängig, füllt Lücken nicht durch Vermutungen und leitet keine neuen Horoskopfakten aus einem Teilergebnis ab.'
        ]
      },
      {
        id: 'architecture',
        eyebrow: 'Ein entkoppelter Weg',
        title: 'Die Website bleibt vom wissenschaftlichen Kern getrennt.',
        paragraphs: [
          'Der konzeptionelle Weg lautet NatalNode.com → Website API / BFF → NatalNode Engine Public API → wissenschaftlicher Kern.',
          'NatalNode.com bleibt unabhängig davon, welcher astronomische Anbieter oder Datensatz die Engine später speist. Die Anbieterwahl gehört hinter die Engine-Grenze, nicht in die Logik des Webprodukts.'
        ]
      },
      {
        id: 'uncertainty',
        eyebrow: 'Unsicherheit bleibt sichtbar',
        title: 'Unbekannte Eingaben bleiben unbekannt.',
        paragraphs: [
          'Eine unbekannte Geburtszeit ist zulässig. NatalNode ersetzt sie nicht stillschweigend durch Mittag oder eine andere künstliche Zeit; ASC, MC, Häuser und hausbasierte Interpretation bleiben nicht verfügbar, wenn die dafür nötige Zeit fehlt.',
          'Historische Mehrdeutigkeiten von Zeitzone und Sommerzeit sollten sichtbar gemacht werden, damit Nutzer zwischen möglichen Zeitpunkten wählen können. Das System sollte nicht stillschweigend einen auswählen und ihn als sicher darstellen.'
        ]
      },
      {
        id: 'interpretation',
        eyebrow: 'Fakten vor Interpretation',
        title: 'Interpretation verwendet explizite Fakten.',
        paragraphs: [
          'Geburtsdaten → Engine-Berechnung → strukturierte Horoskopfakten → deterministische Interpretation → optionale zukünftige KI-Erklärung.',
          'Jede Ebene hat eine definierte Verantwortung. Die KI-Erklärung ist zukünftig und zurückgestellt; sie berechnet, repariert oder errät keine fehlenden Horoskopfakten.'
        ]
      },
      {
        id: 'provenance',
        eyebrow: 'Berechnungsdetails',
        title: 'Ein Ergebnis sollte seine Herkunft erklären.',
        paragraphs: [
          'Die Berechnungsdetails verwenden konkrete Felder wie Engine-Version, Horoskopschema, Berechnungsstatus, Konfigurationsstatus, astronomische Konfiguration, Herkunftshülle, Warnungen und gegebenenfalls das Häusersystem.',
          'Kennungen oder Metadaten können fehlen. Forschungs- oder unvollständige Ergebnisse sollten dies als nicht verfügbar oder unvollständig ausweisen, statt erfundene Kennungen oder Produktionsaussagen zu zeigen.'
        ]
      },
      {
        id: 'environment',
        eyebrow: 'Entwicklungsgrenze',
        title: 'Entwicklungsausgaben sind keine Produktionsastronomie.',
        paragraphs: [
          'Die aktuelle Webentwicklungsumgebung verwendet eine Mock-/Entwicklungsgrenze und kann Forschungskonfigurationen oder Fixtures anzeigen. Sie ist kein astronomisches Produktionssystem. Wissenschaftliche Aussagen für die Produktion bleiben gesperrt, bis die Produktionskonfiguration der Engine freigegeben ist.',
          'Geburtsdatum, Geburtszeit, Geburtsort, Kontext der Zeitzonenauflösung und Horoskopergebnisse sind datenschutzsensible Produktdaten.'
        ]
      },
      {
        id: 'does-not',
        eyebrow: 'Grenzen',
        title: 'Was NatalNode nicht tut.',
        paragraphs: [],
        bullets: [
          'Das Frontend erfindet keine Horoskopfakten.',
          'KI berechnet oder errät keine fehlenden Fakten.',
          'Es gibt keinen stillen Ersatz für eine exakte Zeit.',
          'Bekannte Mehrdeutigkeiten werden nicht verborgen.',
          'Nicht verfügbare Herkunft wird nicht als Behauptung dargestellt.',
          'Die Weblogik ist nicht an einen bestimmten Anbieter gekoppelt.'
        ],
        link: {
          href: '/about',
          label: 'Mehr über NatalNode lesen'
        }
      }
    ]
  },
  ja: {
    locale: 'ja',
    eyebrow: '方法論',
    title: '検証できる計算。',
    description:
      'NatalNodeはチャートの計算と解釈を分け、チャートの事実、前提、制限、来歴を見える状態に保ちます。',
    sections: [
      {
        id: 'engine-first',
        eyebrow: 'Engineを中心に',
        title: '計算を担うのはEngineです。',
        paragraphs: [
          '天体の位置、サイン、ASC/MC、ハウス、アスペクト、オーブ、アプライング／イグザクト／セパレーティングの状態、逆行／順行の状態、計算時の警告はEngineの事実です。',
          'フロントエンドは返された事実と状態を表示します。独自に計算したり、推測で空白を埋めたり、部分的な結果から新しいチャート事実を導いたりしません。'
        ]
      },
      {
        id: 'architecture',
        eyebrow: '分離された経路',
        title: 'Webサイトは科学的コアから分離されています。',
        paragraphs: [
          '概念上の経路は NatalNode.com → Website API / BFF → NatalNode Engine Public API → 科学的コアです。',
          'NatalNode.comは、将来Engineを支える天文プロバイダーやデータセットに依存しません。プロバイダーの選択はEngineの境界の内側に置かれ、Webプロダクトのロジックには入りません。'
        ]
      },
      {
        id: 'uncertainty',
        eyebrow: '不確実性を見えるままにする',
        title: '不明な入力は不明なままです。',
        paragraphs: [
          '出生時刻が不明であることは有効な状態です。NatalNodeは正午や別の人工的な時刻に静かに置き換えません。必要な時刻がない場合、ASC、MC、ハウス、ハウスに基づく解釈は利用できないままです。',
          '過去のタイムゾーンや夏時間の曖昧さは、可能な発生時刻から利用者が選べるように示すべきです。システムが一つを黙って選び、確実なものとして示すことはありません。'
        ]
      },
      {
        id: 'interpretation',
        eyebrow: '解釈より先に事実を',
        title: '解釈は明示された事実を使います。',
        paragraphs: [
          '出生情報 → Engineによる計算 → 構造化されたチャート事実 → 決定論的な解釈 → 将来任意で追加されるAI説明。',
          '各層には定められた責任があります。AIによる説明は将来のものとして保留され、欠けているチャート事実を計算・修復・推測するものではありません。'
        ]
      },
      {
        id: 'provenance',
        eyebrow: 'Calculation Details',
        title: '結果がどこから来たのかを説明できるようにする。',
        paragraphs: [
          'Calculation Detailsでは、Engineのバージョン、チャートスキーマ、計算ステータス、設定ステータス、天文設定、来歴情報、警告、必要に応じてハウスシステムなどの具体的な項目を扱います。',
          '識別子やメタデータを利用できない場合があります。研究用または不完全な結果は、作成した識別子や本番の主張を示さず、利用できない、または不完全であることを示します。'
        ]
      },
      {
        id: 'environment',
        eyebrow: '開発の境界',
        title: '開発出力は本番の天文学ではありません。',
        paragraphs: [
          '現在のWeb開発環境はモック／開発境界を使用しており、研究用設定やfixtureを表示することがあります。本番の天文システムではありません。本番の科学的主張は、本番Engine設定が承認されるまで保留されます。',
          '出生年月日、出生時刻、出生地、タイムゾーン解決のコンテキスト、チャート結果はプライバシーに関わるプロダクトデータです。'
        ]
      },
      {
        id: 'does-not',
        eyebrow: '境界',
        title: 'NatalNodeがしないこと。',
        paragraphs: [],
        bullets: [
          'フロントエンドはチャート事実を作りません。',
          'AIは不足している事実を計算したり推測したりしません。',
          '正確な時刻を黙って置き換えることはありません。',
          '既知の曖昧さを隠しません。',
          '利用できない来歴情報を主張として示しません。',
          'Webのロジックを特定のプロバイダーに結びつけません。'
        ],
        link: {
          href: '/about',
          label: 'NatalNodeについて読む'
        }
      }
    ]
  },
  ko: {
    locale: 'ko',
    eyebrow: '방법론',
    title: '검토할 수 있는 계산.',
    description:
      'NatalNode는 차트 계산과 해석을 분리해 차트의 사실, 가정, 한계, 출처가 보이는 상태로 남도록 합니다.',
    sections: [
      {
        id: 'engine-first',
        eyebrow: 'Engine 우선',
        title: '계산은 Engine이 담당합니다.',
        paragraphs: [
          '위치, 별자리, ASC/MC, 하우스, 애스펙트, 오브, 적용/정확/분리 상태, 역행/순행 상태, 계산 경고는 Engine의 사실입니다.',
          '프론트엔드는 반환된 사실과 상태를 보여 줍니다. 독립적으로 계산하거나 추측으로 빈틈을 채우거나 부분 결과에서 새로운 차트 사실을 도출하지 않습니다.'
        ]
      },
      {
        id: 'architecture',
        eyebrow: '분리된 경로',
        title: '웹사이트는 과학적 핵심과 분리되어 있습니다.',
        paragraphs: [
          '개념상의 경로는 NatalNode.com → Website API / BFF → NatalNode Engine Public API → 과학적 핵심입니다.',
          'NatalNode.com은 향후 Engine을 구동할 천문 제공자나 데이터셋과 분리되어 있습니다. 제공자 선택은 Engine 경계 뒤에 속하며 웹 제품 로직에 들어오지 않습니다.'
        ]
      },
      {
        id: 'uncertainty',
        eyebrow: '불확실성을 보이는 상태로 둡니다',
        title: '알 수 없는 입력은 알 수 없는 채로 둡니다.',
        paragraphs: [
          '출생 시각을 모르는 것은 유효한 상태입니다. NatalNode는 정오나 다른 인공적인 시각으로 조용히 대체하지 않습니다. 필요한 시각이 없으면 ASC, MC, 하우스와 하우스 기반 해석을 사용할 수 없습니다.',
          '역사적 시간대와 서머타임의 모호함은 가능한 발생 시점 중 사용자가 고를 수 있도록 보여 줘야 합니다. 시스템이 하나를 조용히 선택해 확실한 것으로 제시해서는 안 됩니다.'
        ]
      },
      {
        id: 'interpretation',
        eyebrow: '해석보다 사실을 먼저',
        title: '해석은 명시적인 사실을 사용합니다.',
        paragraphs: [
          '출생 입력 → Engine 계산 → 구조화된 차트 사실 → 결정론적 해석 → 선택적인 미래 AI 설명.',
          '각 층위에는 정해진 책임이 있습니다. AI 설명은 미래로 미뤄진 기능이며 누락된 차트 사실을 계산하거나 고치거나 추측하지 않습니다.'
        ]
      },
      {
        id: 'provenance',
        eyebrow: '계산 세부 정보',
        title: '결과가 어디에서 왔는지 설명할 수 있어야 합니다.',
        paragraphs: [
          '계산 세부 정보는 Engine 버전, 차트 스키마, 계산 상태, 구성 상태, 천문 구성, 출처 봉투, 경고, 필요한 경우 하우스 시스템 같은 구체적인 필드를 사용합니다.',
          '식별자나 메타데이터를 사용할 수 없을 수 있습니다. 연구용 또는 불완전한 결과는 만들어 낸 식별자나 운영 주장을 보여 주는 대신 사용할 수 없음 또는 불완전함을 밝혀야 합니다.'
        ]
      },
      {
        id: 'environment',
        eyebrow: '개발 경계',
        title: '개발 출력은 운영 천문학이 아닙니다.',
        paragraphs: [
          '현재 웹 개발 환경은 mock/개발 경계를 사용하며 연구 구성이나 fixture를 보여 줄 수 있습니다. 운영 천문 시스템이 아닙니다. 운영 과학 주장은 운영 Engine 구성이 승인될 때까지 제한됩니다.',
          '출생일, 출생 시각, 출생지, 시간대 해결 맥락, 차트 결과는 개인정보와 관련된 제품 데이터입니다.'
        ]
      },
      {
        id: 'does-not',
        eyebrow: '경계',
        title: 'NatalNode가 하지 않는 일.',
        paragraphs: [],
        bullets: [
          '프론트엔드는 차트 사실을 만들지 않습니다.',
          'AI는 누락된 사실을 계산하거나 추측하지 않습니다.',
          '정확한 시각을 조용히 대체하지 않습니다.',
          '알려진 모호함을 숨기지 않습니다.',
          '사용할 수 없는 출처를 주장으로 제시하지 않습니다.',
          '웹 로직을 특정 제공자에 결합하지 않습니다.'
        ],
        link: {
          href: '/about',
          label: 'NatalNode 소개 읽기'
        }
      }
    ]
  },
  'zh-Hant': {
    locale: 'zh-Hant',
    eyebrow: '方法論',
    title: '可以檢視的計算。',
    description:
      'NatalNode 將星盤計算與詮釋分開，讓星盤的事實、假設、限制與出處保持可見。',
    sections: [
      {
        id: 'engine-first',
        eyebrow: 'Engine 優先',
        title: '計算由 Engine 負責。',
        paragraphs: [
          '位置、星座、ASC/MC、宮位、相位、容許度、入相／精確／出相狀態、逆行／順行狀態，以及計算警告，都是 Engine 事實。',
          '前端呈現回傳的事實與狀態，不會自行計算、不會用猜測填補空缺，也不會從不完整結果推導新的星盤事實。'
        ]
      },
      {
        id: 'architecture',
        eyebrow: '解耦的路徑',
        title: '網站與科學核心保持分離。',
        paragraphs: [
          '概念上的路徑是 NatalNode.com → Website API / BFF → NatalNode Engine Public API → 科學核心。',
          'NatalNode.com 與未來為 Engine 提供動力的天文供應商或資料集保持解耦。供應商選擇屬於 Engine 邊界之後，不屬於 Web 產品邏輯。'
        ]
      },
      {
        id: 'uncertainty',
        eyebrow: '讓不確定性保持可見',
        title: '未知的輸入仍然未知。',
        paragraphs: [
          '出生時間未知是有效狀態。NatalNode 不會悄悄以正午或其他人為時間替代；如果缺少必要時間，ASC、MC、宮位與以宮位為基礎的詮釋仍然無法使用。',
          '歷史時區與日光節約時間的歧義，應該呈現給使用者在可能的發生時刻之間選擇。系統不應該悄悄選出一個並將它呈現為確定答案。'
        ]
      },
      {
        id: 'interpretation',
        eyebrow: '先有事實，再有詮釋',
        title: '詮釋使用明確的事實。',
        paragraphs: [
          '出生輸入 → Engine 計算 → 結構化星盤事實 → 決定性詮釋 → 未來可選的 AI 說明。',
          '每個層次都有明確責任。AI 說明屬於未來並且已延期；它不會計算、修補或猜測缺少的星盤事實。'
        ]
      },
      {
        id: 'provenance',
        eyebrow: '計算詳細資料',
        title: '結果應該說明它從何而來。',
        paragraphs: [
          '計算詳細資料使用具體欄位，例如 Engine 版本、星盤結構、計算狀態、設定狀態、天文設定、出處封套、警告，以及在相關時使用的宮位系統。',
          '識別碼或中繼資料可能無法使用。研究用或不完整的結果應該說明無法使用或不完整，而不是呈現捏造的識別碼或生產環境聲明。'
        ]
      },
      {
        id: 'environment',
        eyebrow: '開發邊界',
        title: '開發輸出不是生產環境的天文學。',
        paragraphs: [
          '目前的 Web 開發環境使用 mock／開發邊界，可能顯示研究設定或 fixture。它不是生產環境的天文系統。生產環境的科學聲明會持續受到限制，直到生產 Engine 設定獲得核准。',
          '出生日期、出生時間、出生地、時區解析脈絡與星盤結果，都是涉及隱私的產品資料。'
        ]
      },
      {
        id: 'does-not',
        eyebrow: '邊界',
        title: 'NatalNode 不會做的事。',
        paragraphs: [],
        bullets: [
          '前端不會捏造星盤事實。',
          'AI 不會計算或猜測缺少的事實。',
          '不會悄悄替代精確時間。',
          '不會隱藏已知歧義。',
          '不會把無法使用的出處呈現為聲明。',
          'Web 邏輯不會綁定特定供應商。'
        ],
        link: {
          href: '/about',
          label: '閱讀 NatalNode 介紹'
        }
      }
    ]
  }
};

export function getMethodologyContent(locale: SupportedLocale): PublicEditorialPage {
  const content = METHODOLOGY_CONTENT[locale];

  if (content === undefined) {
    throw new Error(`Missing Methodology content for locale: ${locale}`);
  }

  return content;
}
