import {
  DEFAULT_LOCALE,
  LOCALE_ORDER,
  parseSupportedLocale,
  type SupportedLocale
} from './localization.js';

/** Stable, language-neutral identities for the Class A product shell. */
export const UI_MESSAGE_KEYS = [
  'nav.learn',
  'nav.tools',
  'nav.calculate',
  'nav.vault',
  'nav.about',
  'nav.methodology',
  'auth.account',
  'auth.signIn',
  'auth.signOut',
  'auth.feedback',
  'auth.signingOut',
  'auth.signOutError',
  'accessibility.skipToMain',
  'accessibility.toggleNavigation',
  'accessibility.openNavigation',
  'accessibility.closeNavigation',
  'accessibility.primaryNavigation',
  'accessibility.trustNavigation'
] as const;

export type UiMessageKey = (typeof UI_MESSAGE_KEYS)[number];

type UiCatalogShape = {
  readonly [Key in UiMessageKey]: string;
};

export type UiCatalog = Readonly<UiCatalogShape>;
export type UiCatalogSet = Readonly<
  Partial<Record<SupportedLocale, Partial<UiCatalog>>>
>;

/** The canonical source for ordinary UI wording and runtime safety fallback. */
export const CANONICAL_UI_CATALOG = {
  'nav.learn': 'Learn',
  'nav.tools': 'Tools',
  'nav.calculate': 'Calculate',
  'nav.vault': 'Vault',
  'nav.about': 'About',
  'nav.methodology': 'Methodology',
  'auth.account': 'Account',
  'auth.signIn': 'Sign in',
  'auth.signOut': 'Sign out',
  'auth.feedback': 'Feedback',
  'auth.signingOut': 'Signing out…',
  'auth.signOutError': "Couldn't sign out. Please try again.",
  'accessibility.skipToMain': 'Skip to main content',
  'accessibility.toggleNavigation': 'Toggle navigation',
  'accessibility.openNavigation': 'Open navigation',
  'accessibility.closeNavigation': 'Close navigation',
  'accessibility.primaryNavigation': 'Primary navigation',
  'accessibility.trustNavigation': 'Trust navigation'
} as const satisfies UiCatalog;

/** Repository-backed Class A shell catalogs. Keep every locale exactly in parity. */
export const UI_CATALOGS = {
  en: CANONICAL_UI_CATALOG,
  es: {
    'nav.learn': 'Aprender',
    'nav.tools': 'Herramientas',
    'nav.calculate': 'Calcular',
    'nav.vault': 'Bóveda',
    'nav.about': 'Acerca de',
    'nav.methodology': 'Metodología',
    'auth.account': 'Cuenta',
    'auth.signIn': 'Iniciar sesión',
    'auth.signOut': 'Cerrar sesión',
    'auth.feedback': 'Comentarios',
    'auth.signingOut': 'Cerrando sesión…',
    'auth.signOutError': 'No se pudo cerrar la sesión. Inténtalo de nuevo.',
    'accessibility.skipToMain': 'Saltar al contenido principal',
    'accessibility.toggleNavigation': 'Alternar navegación',
    'accessibility.openNavigation': 'Abrir navegación',
    'accessibility.closeNavigation': 'Cerrar navegación',
    'accessibility.primaryNavigation': 'Navegación principal',
    'accessibility.trustNavigation': 'Navegación de confianza'
  },
  fr: {
    'nav.learn': 'Apprendre',
    'nav.tools': 'Outils',
    'nav.calculate': 'Calculer',
    'nav.vault': 'Coffre',
    'nav.about': 'À propos',
    'nav.methodology': 'Méthodologie',
    'auth.account': 'Compte',
    'auth.signIn': 'Se connecter',
    'auth.signOut': 'Se déconnecter',
    'auth.feedback': 'Commentaires',
    'auth.signingOut': 'Déconnexion…',
    'auth.signOutError': 'Impossible de se déconnecter. Réessayez.',
    'accessibility.skipToMain': 'Aller au contenu principal',
    'accessibility.toggleNavigation': 'Basculer la navigation',
    'accessibility.openNavigation': 'Ouvrir la navigation',
    'accessibility.closeNavigation': 'Fermer la navigation',
    'accessibility.primaryNavigation': 'Navigation principale',
    'accessibility.trustNavigation': 'Navigation de confiance'
  },
  de: {
    'nav.learn': 'Lernen',
    'nav.tools': 'Werkzeuge',
    'nav.calculate': 'Berechnen',
    'nav.vault': 'Tresor',
    'nav.about': 'Über uns',
    'nav.methodology': 'Methodik',
    'auth.account': 'Konto',
    'auth.signIn': 'Anmelden',
    'auth.signOut': 'Abmelden',
    'auth.feedback': 'Feedback',
    'auth.signingOut': 'Abmeldung…',
    'auth.signOutError': 'Abmelden nicht möglich. Bitte erneut versuchen.',
    'accessibility.skipToMain': 'Zum Hauptinhalt springen',
    'accessibility.toggleNavigation': 'Navigation umschalten',
    'accessibility.openNavigation': 'Navigation öffnen',
    'accessibility.closeNavigation': 'Navigation schließen',
    'accessibility.primaryNavigation': 'Hauptnavigation',
    'accessibility.trustNavigation': 'Vertrauensnavigation'
  },
  ja: {
    'nav.learn': '学ぶ',
    'nav.tools': 'ツール',
    'nav.calculate': '計算',
    'nav.vault': '保管庫',
    'nav.about': 'NatalNodeについて',
    'nav.methodology': '方法論',
    'auth.account': 'アカウント',
    'auth.signIn': 'サインイン',
    'auth.signOut': 'サインアウト',
    'auth.feedback': 'フィードバック',
    'auth.signingOut': 'サインアウト中…',
    'auth.signOutError': 'サインアウトできませんでした。もう一度お試しください。',
    'accessibility.skipToMain': 'メインコンテンツへ移動',
    'accessibility.toggleNavigation': 'ナビゲーションを切り替え',
    'accessibility.openNavigation': 'ナビゲーションを開く',
    'accessibility.closeNavigation': 'ナビゲーションを閉じる',
    'accessibility.primaryNavigation': 'メインナビゲーション',
    'accessibility.trustNavigation': '信頼情報ナビゲーション'
  },
  ko: {
    'nav.learn': '학습',
    'nav.tools': '도구',
    'nav.calculate': '계산',
    'nav.vault': '보관함',
    'nav.about': 'NatalNode 소개',
    'nav.methodology': '방법론',
    'auth.account': '계정',
    'auth.signIn': '로그인',
    'auth.signOut': '로그아웃',
    'auth.feedback': '피드백',
    'auth.signingOut': '로그아웃 중…',
    'auth.signOutError': '로그아웃하지 못했습니다. 다시 시도해 주세요.',
    'accessibility.skipToMain': '본문으로 건너뛰기',
    'accessibility.toggleNavigation': '탐색 전환',
    'accessibility.openNavigation': '탐색 열기',
    'accessibility.closeNavigation': '탐색 닫기',
    'accessibility.primaryNavigation': '기본 탐색',
    'accessibility.trustNavigation': '신뢰 정보 탐색'
  },
  'zh-Hant': {
    'nav.learn': '學習',
    'nav.tools': '工具',
    'nav.calculate': '計算',
    'nav.vault': '收藏庫',
    'nav.about': '關於',
    'nav.methodology': '方法論',
    'auth.account': '帳戶',
    'auth.signIn': '登入',
    'auth.signOut': '登出',
    'auth.feedback': '意見回饋',
    'auth.signingOut': '登出中…',
    'auth.signOutError': '登出失敗，請再試一次。',
    'accessibility.skipToMain': '跳至主要內容',
    'accessibility.toggleNavigation': '切換導覽',
    'accessibility.openNavigation': '開啟導覽',
    'accessibility.closeNavigation': '關閉導覽',
    'accessibility.primaryNavigation': '主要導覽',
    'accessibility.trustNavigation': '信任資訊導覽'
  }
} as const satisfies Record<SupportedLocale, UiCatalog>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(
  value: Record<string, unknown>,
  expectedKeys: readonly string[]
): boolean {
  const actualKeys = Object.keys(value);

  return (
    actualKeys.length === expectedKeys.length &&
    expectedKeys.every((key) => Object.prototype.hasOwnProperty.call(value, key)) &&
    actualKeys.every((key) => expectedKeys.includes(key))
  );
}

/** Validates the complete committed catalog shape used by release checks. */
export function validateUiCatalogs(
  catalogs: unknown
): catalogs is Record<SupportedLocale, UiCatalog> {
  if (!isRecord(catalogs) || !hasExactKeys(catalogs, LOCALE_ORDER)) {
    return false;
  }

  for (const locale of LOCALE_ORDER) {
    if (!Object.prototype.hasOwnProperty.call(catalogs, locale)) {
      return false;
    }

    const catalog = catalogs[locale];
    if (!isRecord(catalog) || !hasExactKeys(catalog, UI_MESSAGE_KEYS)) {
      return false;
    }

    for (const key of UI_MESSAGE_KEYS) {
      const value = catalog[key];
      if (typeof value !== 'string' || value.trim() === '') {
        return false;
      }
    }
  }

  return Object.keys(catalogs).every((locale) => parseSupportedLocale(locale) !== null);
}

/** Resolves one ordinary UI message without exposing a mutable shared catalog. */
export function getUiMessage(
  locale: unknown,
  key: UiMessageKey,
  catalogs: UiCatalogSet = UI_CATALOGS
): string {
  const canonicalMessage = CANONICAL_UI_CATALOG[key];
  const requestedLocale = parseSupportedLocale(locale) ?? DEFAULT_LOCALE;
  const localizedMessage = catalogs[requestedLocale]?.[key];

  return typeof localizedMessage === 'string' && localizedMessage.trim() !== ''
    ? localizedMessage
    : canonicalMessage;
}
