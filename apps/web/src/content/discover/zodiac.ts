import {
  SIGN_CLASSIFICATIONS,
  type SignElement,
  type SignId,
  type SignModality
} from '../../core/astrology-taxonomy/chart-taxonomy.js';
import {
  SUPPORTED_LOCALES,
  type SupportedLocale
} from '../../lib/localization.js';

export interface ZodiacSignCopy {
  readonly summary: string;
  readonly chartFunction: string;
}

export interface ZodiacSignContent extends ZodiacSignCopy {
  readonly signId: SignId;
  readonly locale: SupportedLocale;
}

export interface ZodiacFamilyCopy {
  readonly label: string;
  readonly description: string;
}

type ZodiacSignCopyCatalog = Readonly<
  Record<SupportedLocale, Readonly<Record<SignId, ZodiacSignCopy>>>
>;

type ZodiacElementCopyCatalog = Readonly<
  Record<SupportedLocale, Readonly<Record<SignElement, ZodiacFamilyCopy>>>
>;

type ZodiacModalityCopyCatalog = Readonly<
  Record<SupportedLocale, Readonly<Record<SignModality, ZodiacFamilyCopy>>>
>;

/**
 * Discover editorial copy is intentionally separate from Core taxonomy. The
 * copy describes the stable classification without making a personal claim.
 */
const SIGN_COPY_BY_LOCALE = {
  en: {
    aries: {
      summary: 'Aries is a cardinal fire sign in the zodiac taxonomy.',
      chartFunction: 'An Aries placement gives the fire element a cardinal starting point; the planet and house identify what is being expressed and where.'
    },
    taurus: {
      summary: 'Taurus is a fixed earth sign in the zodiac taxonomy.',
      chartFunction: 'A Taurus placement gives the earth element a fixed form; the surrounding planet, house, and aspects add the chart context.'
    },
    gemini: {
      summary: 'Gemini is a mutable air sign in the zodiac taxonomy.',
      chartFunction: 'A Gemini placement gives the air element a mutable, connective form; its chart function depends on the planet and house involved.'
    },
    cancer: {
      summary: 'Cancer is a cardinal water sign in the zodiac taxonomy.',
      chartFunction: 'A Cancer placement gives the water element a cardinal initiating pattern; the rest of the chart determines the subject and context.'
    },
    leo: {
      summary: 'Leo is a fixed fire sign in the zodiac taxonomy.',
      chartFunction: 'A Leo placement gives the fire element a fixed, centered expression; the planet and house show which chart layer carries it.'
    },
    virgo: {
      summary: 'Virgo is a mutable earth sign in the zodiac taxonomy.',
      chartFunction: 'A Virgo placement gives the earth element a mutable, discriminating expression; other chart facts determine how that layer is read.'
    },
    libra: {
      summary: 'Libra is a cardinal air sign in the zodiac taxonomy.',
      chartFunction: 'A Libra placement gives the air element a cardinal, relational orientation; its chart role must be read with the planet, house, and aspects.'
    },
    scorpio: {
      summary: 'Scorpio is a fixed water sign in the zodiac taxonomy.',
      chartFunction: 'A Scorpio placement gives the water element a fixed, concentrated form; the full chart supplies the context for any interpretation.'
    },
    sagittarius: {
      summary: 'Sagittarius is a mutable fire sign in the zodiac taxonomy.',
      chartFunction: "A Sagittarius placement gives the fire element a mutable, exploratory form; its meaning remains tied to the placement's wider chart context."
    },
    capricorn: {
      summary: 'Capricorn is a cardinal earth sign in the zodiac taxonomy.',
      chartFunction: "A Capricorn placement gives the earth element a cardinal, structuring direction; other placements and houses show how it participates in the chart."
    },
    aquarius: {
      summary: 'Aquarius is a fixed air sign in the zodiac taxonomy.',
      chartFunction: "An Aquarius placement gives the air element a fixed, pattern-oriented form; the chart's other layers keep the reading from becoming a single-label claim."
    },
    pisces: {
      summary: 'Pisces is a mutable water sign in the zodiac taxonomy.',
      chartFunction: 'A Pisces placement gives the water element a mutable, receptive form; the planet, house, and aspects establish the supported context.'
    }
  },
  es: {
    aries: {
      summary: 'Aries es un signo de fuego cardinal dentro de la taxonomía zodiacal.',
      chartFunction: 'Una posición en Aries da al elemento fuego un punto de inicio cardinal; el planeta y la casa indican qué se expresa y dónde.'
    },
    taurus: {
      summary: 'Tauro es un signo de tierra fijo dentro de la taxonomía zodiacal.',
      chartFunction: 'Una posición en Tauro da al elemento tierra una forma fija; el planeta, la casa y los aspectos aportan el contexto de la carta.'
    },
    gemini: {
      summary: 'Géminis es un signo de aire mutable dentro de la taxonomía zodiacal.',
      chartFunction: 'Una posición en Géminis da al elemento aire una forma mutable y conectiva; su función depende del planeta y la casa implicados.'
    },
    cancer: {
      summary: 'Cáncer es un signo de agua cardinal dentro de la taxonomía zodiacal.',
      chartFunction: 'Una posición en Cáncer da al elemento agua un patrón iniciador cardinal; el resto de la carta determina el tema y el contexto.'
    },
    leo: {
      summary: 'Leo es un signo de fuego fijo dentro de la taxonomía zodiacal.',
      chartFunction: 'Una posición en Leo da al elemento fuego una expresión fija y centrada; el planeta y la casa muestran qué capa de la carta la lleva.'
    },
    virgo: {
      summary: 'Virgo es un signo de tierra mutable dentro de la taxonomía zodiacal.',
      chartFunction: 'Una posición en Virgo da al elemento tierra una expresión mutable y diferenciadora; los demás hechos de la carta determinan cómo se lee esa capa.'
    },
    libra: {
      summary: 'Libra es un signo de aire cardinal dentro de la taxonomía zodiacal.',
      chartFunction: 'Una posición en Libra da al elemento aire una orientación cardinal y relacional; su papel debe leerse junto al planeta, la casa y los aspectos.'
    },
    scorpio: {
      summary: 'Escorpio es un signo de agua fijo dentro de la taxonomía zodiacal.',
      chartFunction: 'Una posición en Escorpio da al elemento agua una forma fija y concentrada; la carta completa aporta el contexto para cualquier interpretación.'
    },
    sagittarius: {
      summary: 'Sagitario es un signo de fuego mutable dentro de la taxonomía zodiacal.',
      chartFunction: 'Una posición en Sagitario da al elemento fuego una forma mutable y exploratoria; su sentido permanece ligado al contexto más amplio de la carta.'
    },
    capricorn: {
      summary: 'Capricornio es un signo de tierra cardinal dentro de la taxonomía zodiacal.',
      chartFunction: 'Una posición en Capricornio da al elemento tierra una dirección cardinal y estructuradora; otras posiciones y casas muestran cómo participa en la carta.'
    },
    aquarius: {
      summary: 'Acuario es un signo de aire fijo dentro de la taxonomía zodiacal.',
      chartFunction: 'Una posición en Acuario da al elemento aire una forma fija y orientada a patrones; las demás capas evitan reducir la lectura a una sola etiqueta.'
    },
    pisces: {
      summary: 'Piscis es un signo de agua mutable dentro de la taxonomía zodiacal.',
      chartFunction: 'Una posición en Piscis da al elemento agua una forma mutable y receptiva; el planeta, la casa y los aspectos establecen el contexto que puede sostenerse.'
    }
  },
  fr: {
    aries: {
      summary: 'Le Bélier est un signe de feu cardinal dans la taxonomie zodiacale.',
      chartFunction: 'Une position en Bélier donne à l’élément feu un point de départ cardinal ; la planète et la maison indiquent ce qui s’exprime et où.'
    },
    taurus: {
      summary: 'Le Taureau est un signe de terre fixe dans la taxonomie zodiacale.',
      chartFunction: 'Une position en Taureau donne à l’élément terre une forme fixe ; la planète, la maison et les aspects ajoutent le contexte du thème.'
    },
    gemini: {
      summary: 'Les Gémeaux sont un signe d’air mutable dans la taxonomie zodiacale.',
      chartFunction: 'Une position en Gémeaux donne à l’élément air une forme mutable et connective ; sa fonction dépend de la planète et de la maison concernées.'
    },
    cancer: {
      summary: 'Le Cancer est un signe d’eau cardinal dans la taxonomie zodiacale.',
      chartFunction: 'Une position en Cancer donne à l’élément eau un mouvement initiateur cardinal ; le reste du thème précise le sujet et le contexte.'
    },
    leo: {
      summary: 'Le Lion est un signe de feu fixe dans la taxonomie zodiacale.',
      chartFunction: 'Une position en Lion donne à l’élément feu une expression fixe et centrée ; la planète et la maison montrent quelle couche du thème la porte.'
    },
    virgo: {
      summary: 'La Vierge est un signe de terre mutable dans la taxonomie zodiacale.',
      chartFunction: 'Une position en Vierge donne à l’élément terre une expression mutable et différenciante ; les autres faits du thème indiquent comment cette couche se lit.'
    },
    libra: {
      summary: 'La Balance est un signe d’air cardinal dans la taxonomie zodiacale.',
      chartFunction: 'Une position en Balance donne à l’élément air une orientation cardinale et relationnelle ; son rôle se lit avec la planète, la maison et les aspects.'
    },
    scorpio: {
      summary: 'Le Scorpion est un signe d’eau fixe dans la taxonomie zodiacale.',
      chartFunction: 'Une position en Scorpion donne à l’élément eau une forme fixe et concentrée ; le thème complet fournit le contexte de toute interprétation.'
    },
    sagittarius: {
      summary: 'Le Sagittaire est un signe de feu mutable dans la taxonomie zodiacale.',
      chartFunction: 'Une position en Sagittaire donne à l’élément feu une forme mutable et exploratoire ; son sens reste lié au contexte plus large du thème.'
    },
    capricorn: {
      summary: 'Le Capricorne est un signe de terre cardinal dans la taxonomie zodiacale.',
      chartFunction: 'Une position en Capricorne donne à l’élément terre une direction cardinale et structurante ; les autres positions et maisons montrent sa place dans le thème.'
    },
    aquarius: {
      summary: 'Le Verseau est un signe d’air fixe dans la taxonomie zodiacale.',
      chartFunction: 'Une position en Verseau donne à l’élément air une forme fixe orientée vers les structures ; les autres couches évitent une lecture réduite à une étiquette.'
    },
    pisces: {
      summary: 'Les Poissons sont un signe d’eau mutable dans la taxonomie zodiacale.',
      chartFunction: 'Une position en Poissons donne à l’élément eau une forme mutable et réceptive ; la planète, la maison et les aspects établissent le contexte soutenu.'
    }
  },
  de: {
    aries: {
      summary: 'Widder ist in der Tierkreis-Taxonomie ein kardinales Feuerzeichen.',
      chartFunction: 'Eine Widder-Position gibt dem Element Feuer einen kardinalen Anfang; Planet und Haus zeigen, was ausgedrückt wird und wo.'
    },
    taurus: {
      summary: 'Stier ist in der Tierkreis-Taxonomie ein fixes Erdzeichen.',
      chartFunction: 'Eine Stier-Position gibt dem Element Erde eine fixe Form; Planet, Haus und Aspekte ergänzen den Kontext des Horoskops.'
    },
    gemini: {
      summary: 'Zwillinge ist in der Tierkreis-Taxonomie ein bewegliches Luftzeichen.',
      chartFunction: 'Eine Zwillinge-Position gibt dem Element Luft eine bewegliche, verbindende Form; ihre Funktion hängt vom beteiligten Planeten und Haus ab.'
    },
    cancer: {
      summary: 'Krebs ist in der Tierkreis-Taxonomie ein kardinales Wasserzeichen.',
      chartFunction: 'Eine Krebs-Position gibt dem Element Wasser ein kardinales, einleitendes Muster; der Rest des Horoskops bestimmt Thema und Kontext.'
    },
    leo: {
      summary: 'Löwe ist in der Tierkreis-Taxonomie ein fixes Feuerzeichen.',
      chartFunction: 'Eine Löwe-Position gibt dem Element Feuer einen fixen, zentrierten Ausdruck; Planet und Haus zeigen, welche Horoskopschicht ihn trägt.'
    },
    virgo: {
      summary: 'Jungfrau ist in der Tierkreis-Taxonomie ein bewegliches Erdzeichen.',
      chartFunction: 'Eine Jungfrau-Position gibt dem Element Erde einen beweglichen, unterscheidenden Ausdruck; andere Horoskopfakten bestimmen die Lesart dieser Schicht.'
    },
    libra: {
      summary: 'Waage ist in der Tierkreis-Taxonomie ein kardinales Luftzeichen.',
      chartFunction: 'Eine Waage-Position gibt dem Element Luft eine kardinale, relationale Ausrichtung; ihre Rolle wird mit Planet, Haus und Aspekten gelesen.'
    },
    scorpio: {
      summary: 'Skorpion ist in der Tierkreis-Taxonomie ein fixes Wasserzeichen.',
      chartFunction: 'Eine Skorpion-Position gibt dem Element Wasser eine fixe, konzentrierte Form; das gesamte Horoskop liefert den Interpretationskontext.'
    },
    sagittarius: {
      summary: 'Schütze ist in der Tierkreis-Taxonomie ein bewegliches Feuerzeichen.',
      chartFunction: 'Eine Schütze-Position gibt dem Element Feuer eine bewegliche, erkundende Form; ihre Bedeutung bleibt an den weiteren Horoskopkontext gebunden.'
    },
    capricorn: {
      summary: 'Steinbock ist in der Tierkreis-Taxonomie ein kardinales Erdzeichen.',
      chartFunction: 'Eine Steinbock-Position gibt dem Element Erde eine kardinale, strukturierende Richtung; andere Positionen und Häuser zeigen ihre Rolle im Horoskop.'
    },
    aquarius: {
      summary: 'Wassermann ist in der Tierkreis-Taxonomie ein fixes Luftzeichen.',
      chartFunction: 'Eine Wassermann-Position gibt dem Element Luft eine fixe, musterorientierte Form; die übrigen Schichten verhindern eine Lesart als einzelne Etikette.'
    },
    pisces: {
      summary: 'Fische ist in der Tierkreis-Taxonomie ein bewegliches Wasserzeichen.',
      chartFunction: 'Eine Fische-Position gibt dem Element Wasser eine bewegliche, aufnehmende Form; Planet, Haus und Aspekte bestimmen den tragfähigen Kontext.'
    }
  },
  ja: {
    aries: {
      summary: '牡羊座は、占星術の分類では活動宮の火のサインです。',
      chartFunction: '牡羊座の配置は、火の要素に活動宮らしい始動の形を与えます。何がどこで表れるかは、惑星とハウスが示します。'
    },
    taurus: {
      summary: '牡牛座は、占星術の分類では不動宮の地のサインです。',
      chartFunction: '牡牛座の配置は、地の要素に不動宮らしい持続の形を与えます。惑星、ハウス、アスペクトがチャートの文脈を加えます。'
    },
    gemini: {
      summary: '双子座は、占星術の分類では柔軟宮の風のサインです。',
      chartFunction: '双子座の配置は、風の要素に柔軟宮らしい接続の形を与えます。その機能は、関わる惑星とハウスによって文脈化されます。'
    },
    cancer: {
      summary: '蟹座は、占星術の分類では活動宮の水のサインです。',
      chartFunction: '蟹座の配置は、水の要素に活動宮らしい始動のパターンを与えます。テーマと文脈は、チャート全体から読み取ります。'
    },
    leo: {
      summary: '獅子座は、占星術の分類では不動宮の火のサインです。',
      chartFunction: '獅子座の配置は、火の要素に不動宮らしい中心的な表現を与えます。どの層が担うかは、惑星とハウスが示します。'
    },
    virgo: {
      summary: '乙女座は、占星術の分類では柔軟宮の地のサインです。',
      chartFunction: '乙女座の配置は、地の要素に柔軟宮らしい識別の形を与えます。その層の読み方は、他のチャート事実が支えます。'
    },
    libra: {
      summary: '天秤座は、占星術の分類では活動宮の風のサインです。',
      chartFunction: '天秤座の配置は、風の要素に活動宮らしい関係性への向きを与えます。惑星、ハウス、アスペクトとともに読みます。'
    },
    scorpio: {
      summary: '蠍座は、占星術の分類では不動宮の水のサインです。',
      chartFunction: '蠍座の配置は、水の要素に不動宮らしい集中の形を与えます。どの解釈も、チャート全体の文脈を必要とします。'
    },
    sagittarius: {
      summary: '射手座は、占星術の分類では柔軟宮の火のサインです。',
      chartFunction: '射手座の配置は、火の要素に柔軟宮らしい探究の形を与えます。その意味は、配置を取り巻くチャートの文脈に結び付きます。'
    },
    capricorn: {
      summary: '山羊座は、占星術の分類では活動宮の地のサインです。',
      chartFunction: '山羊座の配置は、地の要素に活動宮らしい構造化の方向を与えます。チャート内での役割は、他の配置とハウスが補います。'
    },
    aquarius: {
      summary: '水瓶座は、占星術の分類では不動宮の風のサインです。',
      chartFunction: '水瓶座の配置は、風の要素に不動宮らしいパターン志向の形を与えます。一つのラベルに還元しないため、他の層も確認します。'
    },
    pisces: {
      summary: '魚座は、占星術の分類では柔軟宮の水のサインです。',
      chartFunction: '魚座の配置は、水の要素に柔軟宮らしい受容の形を与えます。惑星、ハウス、アスペクトが支えられる文脈を示します。'
    }
  },
  ko: {
    aries: {
      summary: '양자리는 점성술 분류에서 활동궁의 불 원소 별자리입니다.',
      chartFunction: '양자리 배치는 불 원소에 활동궁의 시작하는 형태를 더합니다. 무엇이 어디에서 표현되는지는 행성과 하우스가 보여 줍니다.'
    },
    taurus: {
      summary: '황소자리는 점성술 분류에서 고정궁의 흙 원소 별자리입니다.',
      chartFunction: '황소자리 배치는 흙 원소에 고정궁의 지속하는 형태를 더합니다. 행성, 하우스, 애스펙트가 차트의 맥락을 보탭니다.'
    },
    gemini: {
      summary: '쌍둥이자리는 점성술 분류에서 변통궁의 공기 원소 별자리입니다.',
      chartFunction: '쌍둥이자리 배치는 공기 원소에 변통궁의 연결하는 형태를 더합니다. 그 기능은 관련된 행성과 하우스의 맥락에서 읽습니다.'
    },
    cancer: {
      summary: '게자리는 점성술 분류에서 활동궁의 물 원소 별자리입니다.',
      chartFunction: '게자리 배치는 물 원소에 활동궁의 시작하는 패턴을 더합니다. 주제와 맥락은 차트 전체가 정합니다.'
    },
    leo: {
      summary: '사자자리는 점성술 분류에서 고정궁의 불 원소 별자리입니다.',
      chartFunction: '사자자리 배치는 불 원소에 고정궁의 중심 잡힌 표현을 더합니다. 어느 차트 층이 이를 담당하는지는 행성과 하우스가 보여 줍니다.'
    },
    virgo: {
      summary: '처녀자리는 점성술 분류에서 변통궁의 흙 원소 별자리입니다.',
      chartFunction: '처녀자리 배치는 흙 원소에 변통궁의 구별하는 표현을 더합니다. 다른 차트 사실이 그 층을 읽을 수 있는 범위를 정합니다.'
    },
    libra: {
      summary: '천칭자리는 점성술 분류에서 활동궁의 공기 원소 별자리입니다.',
      chartFunction: '천칭자리 배치는 공기 원소에 활동궁의 관계 지향을 더합니다. 행성, 하우스, 애스펙트와 함께 차트의 역할을 읽습니다.'
    },
    scorpio: {
      summary: '전갈자리는 점성술 분류에서 고정궁의 물 원소 별자리입니다.',
      chartFunction: '전갈자리 배치는 물 원소에 고정궁의 집중된 형태를 더합니다. 어떤 해석도 차트 전체의 맥락을 필요로 합니다.'
    },
    sagittarius: {
      summary: '사수자리는 점성술 분류에서 변통궁의 불 원소 별자리입니다.',
      chartFunction: '사수자리 배치는 불 원소에 변통궁의 탐구하는 형태를 더합니다. 의미는 배치를 둘러싼 더 넓은 차트 맥락에 연결됩니다.'
    },
    capricorn: {
      summary: '염소자리는 점성술 분류에서 활동궁의 흙 원소 별자리입니다.',
      chartFunction: '염소자리 배치는 흙 원소에 활동궁의 구조화하는 방향을 더합니다. 차트 안의 역할은 다른 배치와 하우스가 보완합니다.'
    },
    aquarius: {
      summary: '물병자리는 점성술 분류에서 고정궁의 공기 원소 별자리입니다.',
      chartFunction: '물병자리 배치는 공기 원소에 고정궁의 패턴 지향 형태를 더합니다. 한 가지 라벨로 줄이지 않도록 차트의 다른 층도 함께 봅니다.'
    },
    pisces: {
      summary: '물고기자리는 점성술 분류에서 변통궁의 물 원소 별자리입니다.',
      chartFunction: '물고기자리 배치는 물 원소에 변통궁의 수용하는 형태를 더합니다. 행성, 하우스, 애스펙트가 지지되는 맥락을 정합니다.'
    }
  },
  'zh-Hant': {
    aries: {
      summary: '牡羊座在占星分類中屬於基本宮火象星座。',
      chartFunction: '牡羊座的落點讓火元素呈現基本宮的啟動形式；由行星與宮位指出它在命盤中表達什麼、位於哪裡。'
    },
    taurus: {
      summary: '金牛座在占星分類中屬於固定宮土象星座。',
      chartFunction: '金牛座的落點讓土元素呈現固定宮的持續形式；行星、宮位與相位補充命盤脈絡。'
    },
    gemini: {
      summary: '雙子座在占星分類中屬於變動宮風象星座。',
      chartFunction: '雙子座的落點讓風元素呈現變動宮的連結形式；它的命盤作用仍取決於相關的行星與宮位。'
    },
    cancer: {
      summary: '巨蟹座在占星分類中屬於基本宮水象星座。',
      chartFunction: '巨蟹座的落點讓水元素呈現基本宮的啟動模式；主題與脈絡由整張命盤共同限定。'
    },
    leo: {
      summary: '獅子座在占星分類中屬於固定宮火象星座。',
      chartFunction: '獅子座的落點讓火元素呈現固定宮的集中表達；行星與宮位顯示命盤中的哪一層承擔這項表達。'
    },
    virgo: {
      summary: '處女座在占星分類中屬於變動宮土象星座。',
      chartFunction: '處女座的落點讓土元素呈現變動宮的分辨形式；其他命盤事實決定這一層可以如何被閱讀。'
    },
    libra: {
      summary: '天秤座在占星分類中屬於基本宮風象星座。',
      chartFunction: '天秤座的落點讓風元素呈現基本宮的關係取向；它在命盤中的作用須與行星、宮位及相位一起閱讀。'
    },
    scorpio: {
      summary: '天蠍座在占星分類中屬於固定宮水象星座。',
      chartFunction: '天蠍座的落點讓水元素呈現固定宮的集中形式；任何詮釋都需要整張命盤提供脈絡。'
    },
    sagittarius: {
      summary: '射手座在占星分類中屬於變動宮火象星座。',
      chartFunction: '射手座的落點讓火元素呈現變動宮的探索形式；其意義仍與落點所在的更廣命盤脈絡相連。'
    },
    capricorn: {
      summary: '摩羯座在占星分類中屬於基本宮土象星座。',
      chartFunction: '摩羯座的落點讓土元素呈現基本宮的結構化方向；其他落點與宮位顯示它如何參與命盤。'
    },
    aquarius: {
      summary: '水瓶座在占星分類中屬於固定宮風象星座。',
      chartFunction: '水瓶座的落點讓風元素呈現固定宮的模式取向；為避免單一標籤化，仍須查看命盤的其他層次。'
    },
    pisces: {
      summary: '雙魚座在占星分類中屬於變動宮水象星座。',
      chartFunction: '雙魚座的落點讓水元素呈現變動宮的接納形式；行星、宮位與相位建立可被支持的脈絡。'
    }
  }
} as const satisfies ZodiacSignCopyCatalog;

export const ZODIAC_ELEMENT_CONTENT = {
  en: {
    Fire: { label: 'Fire', description: 'In traditional astrology, fire groups an activating and expressive mode; it is a classification, not a personality diagnosis.' },
    Earth: { label: 'Earth', description: 'In traditional astrology, earth groups a grounded and material mode; it is one layer of a symbolic system, not a verdict.' },
    Air: { label: 'Air', description: 'In traditional astrology, air groups a connective and conceptual mode; other chart layers add the necessary context.' },
    Water: { label: 'Water', description: 'In traditional astrology, water groups a receptive and feeling-oriented mode; it does not define a person.' }
  },
  es: {
    Fire: { label: 'Fuego', description: 'En la astrología tradicional, el fuego reúne un modo activo y expresivo; es una clasificación, no un diagnóstico de personalidad.' },
    Earth: { label: 'Tierra', description: 'En la astrología tradicional, la tierra reúne un modo arraigado y material; es una capa de un sistema simbólico, no un veredicto.' },
    Air: { label: 'Aire', description: 'En la astrología tradicional, el aire reúne un modo conectivo y conceptual; las demás capas de la carta aportan el contexto necesario.' },
    Water: { label: 'Agua', description: 'En la astrología tradicional, el agua reúne un modo receptivo y orientado a lo sensible; no define a una persona.' }
  },
  fr: {
    Fire: { label: 'Feu', description: 'Dans l’astrologie traditionnelle, le feu regroupe un mode actif et expressif ; c’est une classification, pas un diagnostic de personnalité.' },
    Earth: { label: 'Terre', description: 'Dans l’astrologie traditionnelle, la terre regroupe un mode ancré et matériel ; c’est une couche symbolique, pas un verdict.' },
    Air: { label: 'Air', description: 'Dans l’astrologie traditionnelle, l’air regroupe un mode relationnel et conceptuel ; les autres couches du thème apportent le contexte nécessaire.' },
    Water: { label: 'Eau', description: 'Dans l’astrologie traditionnelle, l’eau regroupe un mode réceptif et sensible ; elle ne définit pas une personne.' }
  },
  de: {
    Fire: { label: 'Feuer', description: 'In der traditionellen Astrologie bündelt Feuer eine aktivierende und ausdrucksstarke Art; es ist eine Klassifikation, keine Persönlichkeitsdiagnose.' },
    Earth: { label: 'Erde', description: 'In der traditionellen Astrologie bündelt Erde eine geerdete und materielle Art; sie ist eine symbolische Ebene, kein Urteil.' },
    Air: { label: 'Luft', description: 'In der traditionellen Astrologie bündelt Luft eine verbindende und begriffliche Art; weitere Horoskopschichten liefern den nötigen Kontext.' },
    Water: { label: 'Wasser', description: 'In der traditionellen Astrologie bündelt Wasser eine aufnehmende und gefühlsbezogene Art; es definiert keine Person.' }
  },
  ja: {
    Fire: { label: '火', description: '伝統的な占星術では、火は活動的で表現的な方向をまとめる要素です。これは分類であり、人格の診断ではありません。' },
    Earth: { label: '地', description: '伝統的な占星術では、地は安定や物質性に関わる方向をまとめる要素です。象徴体系の一層であり、判定ではありません。' },
    Air: { label: '風', description: '伝統的な占星術では、風は接続や概念に関わる方向をまとめる要素です。他のチャート層が文脈を加えます。' },
    Water: { label: '水', description: '伝統的な占星術では、水は受容や感受性に関わる方向をまとめる要素です。人を決めつけるものではありません。' }
  },
  ko: {
    Fire: { label: '불', description: '전통 점성술에서 불은 활성화와 표현의 방식을 묶는 원소입니다. 이는 분류이지 성격 진단이 아닙니다.' },
    Earth: { label: '흙', description: '전통 점성술에서 흙은 기반과 물질성의 방식을 묶는 원소입니다. 상징 체계의 한 층이지 판정이 아닙니다.' },
    Air: { label: '공기', description: '전통 점성술에서 공기는 연결과 개념의 방식을 묶는 원소입니다. 필요한 맥락은 차트의 다른 층이 더합니다.' },
    Water: { label: '물', description: '전통 점성술에서 물은 수용과 감각의 방식을 묶는 원소입니다. 한 사람을 규정하지 않습니다.' }
  },
  'zh-Hant': {
    Fire: { label: '火象', description: '在傳統占星語言中，火象整理啟動與表達的方式；這是分類，不是人格診斷。' },
    Earth: { label: '土象', description: '在傳統占星語言中，土象整理穩定與物質性的方式；它是象徵系統的一層，不是判決。' },
    Air: { label: '風象', description: '在傳統占星語言中，風象整理連結與概念的方式；命盤的其他層次會補充必要脈絡。' },
    Water: { label: '水象', description: '在傳統占星語言中，水象整理接納與感受的方式；它不會定義一個人。' }
  }
} as const satisfies ZodiacElementCopyCatalog;

export const ZODIAC_MODALITY_CONTENT = {
  en: {
    Cardinal: { label: 'Cardinal', description: 'Cardinal is the modality of initiating movement within the zodiac structure.' },
    Fixed: { label: 'Fixed', description: 'Fixed is the modality of sustaining and concentrating a sign’s expression.' },
    Mutable: { label: 'Mutable', description: 'Mutable is the modality of adapting and transitioning within the zodiac structure.' }
  },
  es: {
    Cardinal: { label: 'Cardinal', description: 'Cardinal es la modalidad que inicia el movimiento dentro de la estructura zodiacal.' },
    Fixed: { label: 'Fija', description: 'Fija es la modalidad que sostiene y concentra la expresión de un signo.' },
    Mutable: { label: 'Mutable', description: 'Mutable es la modalidad que adapta y transita dentro de la estructura zodiacal.' }
  },
  fr: {
    Cardinal: { label: 'Cardinal', description: 'Cardinal est la modalité qui initie le mouvement dans la structure zodiacale.' },
    Fixed: { label: 'Fixe', description: 'Fixe est la modalité qui soutient et concentre l’expression d’un signe.' },
    Mutable: { label: 'Mutable', description: 'Mutable est la modalité qui s’adapte et transite dans la structure zodiacale.' }
  },
  de: {
    Cardinal: { label: 'Kardinal', description: 'Kardinal ist die Modalität, die innerhalb der Tierkreisstruktur Bewegung einleitet.' },
    Fixed: { label: 'Fix', description: 'Fix ist die Modalität, die den Ausdruck eines Zeichens trägt und bündelt.' },
    Mutable: { label: 'Beweglich', description: 'Beweglich ist die Modalität, die sich innerhalb der Tierkreisstruktur anpasst und Übergänge bildet.' }
  },
  ja: {
    Cardinal: { label: '活動宮', description: '活動宮は、黄道の構造の中で動きを始めるモードです。' },
    Fixed: { label: '不動宮', description: '不動宮は、サインの表現を保ち、集中させるモードです。' },
    Mutable: { label: '柔軟宮', description: '柔軟宮は、黄道の構造の中で適応し、移行するモードです。' }
  },
  ko: {
    Cardinal: { label: '활동궁', description: '활동궁은 황도 구조 안에서 움직임을 시작하는 양식입니다.' },
    Fixed: { label: '고정궁', description: '고정궁은 별자리의 표현을 유지하고 집중하는 양식입니다.' },
    Mutable: { label: '변통궁', description: '변통궁은 황도 구조 안에서 적응하고 전환하는 양식입니다.' }
  },
  'zh-Hant': {
    Cardinal: { label: '基本宮', description: '基本宮是在黃道結構中啟動動勢的模式。' },
    Fixed: { label: '固定宮', description: '固定宮是維持並集中星座表達的模式。' },
    Mutable: { label: '變動宮', description: '變動宮是在黃道結構中適應與轉換的模式。' }
  }
} as const satisfies ZodiacModalityCopyCatalog;

function collectSignIdsBy<K extends string>(keyOf: (sign: (typeof SIGN_CLASSIFICATIONS)[number]) => K) {
  const groups = new Map<K, SignId[]>();

  for (const sign of SIGN_CLASSIFICATIONS) {
    const group = groups.get(keyOf(sign)) ?? [];
    group.push(sign.id);
    groups.set(keyOf(sign), group);
  }

  return Object.freeze(
    Object.fromEntries(
      [...groups.entries()].map(([key, signIds]) => [key, Object.freeze(signIds)])
    )
  ) as Readonly<Record<K, readonly SignId[]>>;
}

/** Relationship lists are derived from Core classifications, never re-authored here. */
export const ZODIAC_ELEMENT_MEMBERS = collectSignIdsBy((sign) => sign.element);
export const ZODIAC_MODALITY_MEMBERS = collectSignIdsBy((sign) => sign.modality);

export const ZODIAC_SIGN_CONTENT = Object.freeze(
  Object.fromEntries(
    SUPPORTED_LOCALES.map((locale) => [locale, Object.freeze({ ...SIGN_COPY_BY_LOCALE[locale] })])
  )
) as ZodiacSignCopyCatalog;

export function getZodiacSignContent(
  signId: SignId,
  locale: SupportedLocale
): ZodiacSignContent {
  const copy = ZODIAC_SIGN_CONTENT[locale]?.[signId];
  if (copy === undefined) {
    throw new TypeError(`Missing Discover sign content for ${locale}/${signId}`);
  }

  return Object.freeze({ signId, locale, ...copy });
}

export function getZodiacElementContent(
  element: SignElement,
  locale: SupportedLocale
): ZodiacFamilyCopy {
  return ZODIAC_ELEMENT_CONTENT[locale][element];
}

export function getZodiacModalityContent(
  modality: SignModality,
  locale: SupportedLocale
): ZodiacFamilyCopy {
  return ZODIAC_MODALITY_CONTENT[locale][modality];
}
