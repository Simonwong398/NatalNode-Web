import {
  LEGAL_CANONICAL_LOCALE,
  LEGAL_METADATA,
  LEGAL_POLICY_VERSION,
  LEGAL_PUBLICATION_STATUS,
  LEGAL_TRANSLATION_REVIEW_STATUS
} from './legal-metadata.js';
import { CANONICAL_LEGAL_DOCUMENTS } from './legal-canonical-content.js';
import { LOCALIZED_LEGAL_DOCUMENTS } from './legal-localization.js';
import { SUPPORTED_LOCALES, type SupportedLocale } from './localization.js';

export type LegalPageId = 'privacy' | 'terms';

export type LegalBlock =
  | Readonly<{ kind: 'paragraph'; text: string }>
  | Readonly<{ kind: 'list'; items: readonly string[] }>;

export interface LegalSection {
  readonly number: string;
  readonly heading: string;
  readonly blocks: readonly LegalBlock[];
}

export interface LegalDocumentDefinition {
  readonly page: LegalPageId;
  readonly locale: SupportedLocale;
  readonly title: string;
  readonly description: string;
  readonly effectiveDate: string;
  readonly introduction: readonly string[];
  readonly sections: readonly LegalSection[];
  readonly canonicalSourceId: string;
  readonly translationOf?: string;
  readonly translationReviewStatus?: typeof LEGAL_TRANSLATION_REVIEW_STATUS;
}

export interface ApprovedLegalSection extends LegalSection {
  /** Flattened text retained for focused content and integrity tests. */
  readonly paragraphs: readonly string[];
}

export interface ApprovedLegalPageContent {
  readonly page: LegalPageId;
  readonly locale: SupportedLocale;
  readonly title: string;
  readonly description: string;
  readonly effectiveDate: string;
  readonly introduction: readonly string[];
  readonly sections: readonly ApprovedLegalSection[];
  readonly publicationNotice: string;
  readonly canonicalLocale: typeof LEGAL_CANONICAL_LOCALE;
  readonly canonicalSourceId: string;
  readonly translationOf?: string;
  readonly translationReviewStatus?: typeof LEGAL_TRANSLATION_REVIEW_STATUS;
  readonly policyVersion: typeof LEGAL_POLICY_VERSION;
  readonly publicationStatus: typeof LEGAL_PUBLICATION_STATUS;
}

/** Approved authority is implemented for pre-commercial rendering, not launch finality. */
export const LEGAL_CONTENT_STATUS =
  'PRODUCT_OWNER_APPROVED_PRECOMMERCIAL' as const;

const NEUTRAL_PRESENTATION = Object.freeze({
  en: Object.freeze({
    effectiveDate: 'Effective date will be finalized before public commercial launch.',
    operatorDetails: 'Operator details will be finalized before public commercial launch.',
    operatorIdentity: 'Operator identity details will be finalized before public commercial launch.',
    operatorAddress: 'Operator address details will be finalized before public commercial launch.',
    privacyContact: 'Privacy contact details will be finalized before public commercial launch.',
    supportContact: 'Support contact details will be finalized before public commercial launch.',
    legalContact: 'Legal contact details will be finalized before public commercial launch.',
    governingLaw: 'The governing-law and forum clause will be finalized before public commercial launch.',
    publicationNotice: 'This page presents the Product Owner-approved pre-commercial legal baseline. Operator identity, contact channels, effective date, and governing-law details will be finalized before public commercial launch.'
  }),
  es: Object.freeze({
    effectiveDate: 'La fecha de entrada en vigor se finalizará antes del lanzamiento comercial público.',
    operatorDetails: 'Los datos del operador se finalizarán antes del lanzamiento comercial público.',
    operatorIdentity: 'La identidad del operador se finalizará antes del lanzamiento comercial público.',
    operatorAddress: 'La dirección del operador se finalizará antes del lanzamiento comercial público.',
    privacyContact: 'Los datos de contacto de privacidad se finalizarán antes del lanzamiento comercial público.',
    supportContact: 'Los datos de contacto de soporte se finalizarán antes del lanzamiento comercial público.',
    legalContact: 'Los datos de contacto legal se finalizarán antes del lanzamiento comercial público.',
    governingLaw: 'La cláusula sobre ley aplicable y foro se finalizará antes del lanzamiento comercial público.',
    publicationNotice: 'Esta página presenta la base legal precomercial aprobada por el Product Owner. La identidad del operador, los canales de contacto, la fecha de entrada en vigor y los detalles sobre ley aplicable se finalizarán antes del lanzamiento comercial público.'
  }),
  fr: Object.freeze({
    effectiveDate: 'La date d’entrée en vigueur sera finalisée avant le lancement commercial public.',
    operatorDetails: 'Les informations relatives à l’opérateur seront finalisées avant le lancement commercial public.',
    operatorIdentity: 'L’identité de l’opérateur sera finalisée avant le lancement commercial public.',
    operatorAddress: 'L’adresse de l’opérateur sera finalisée avant le lancement commercial public.',
    privacyContact: 'Les coordonnées de contact relatives à la vie privée seront finalisées avant le lancement commercial public.',
    supportContact: 'Les coordonnées du support seront finalisées avant le lancement commercial public.',
    legalContact: 'Les coordonnées de contact juridique seront finalisées avant le lancement commercial public.',
    governingLaw: 'La clause relative au droit applicable et au for sera finalisée avant le lancement commercial public.',
    publicationNotice: 'Cette page présente la base juridique précommerciale approuvée par le Product Owner. L’identité de l’opérateur, les canaux de contact, la date d’entrée en vigueur et les informations relatives au droit applicable seront finalisés avant le lancement commercial public.'
  }),
  de: Object.freeze({
    effectiveDate: 'Das Datum des Inkrafttretens wird vor dem öffentlichen kommerziellen Start festgelegt.',
    operatorDetails: 'Die Angaben zum Betreiber werden vor dem öffentlichen kommerziellen Start festgelegt.',
    operatorIdentity: 'Die Identität des Betreibers wird vor dem öffentlichen kommerziellen Start festgelegt.',
    operatorAddress: 'Die Anschrift des Betreibers wird vor dem öffentlichen kommerziellen Start festgelegt.',
    privacyContact: 'Die Kontaktdaten für Datenschutzfragen werden vor dem öffentlichen kommerziellen Start festgelegt.',
    supportContact: 'Die Support-Kontaktdaten werden vor dem öffentlichen kommerziellen Start festgelegt.',
    legalContact: 'Die Kontaktdaten für rechtliche Hinweise werden vor dem öffentlichen kommerziellen Start festgelegt.',
    governingLaw: 'Die Klausel zu anwendbarem Recht und Gerichtsstand wird vor dem öffentlichen kommerziellen Start festgelegt.',
    publicationNotice: 'Diese Seite stellt die vom Product Owner genehmigte vor-kommerzielle rechtliche Grundlage dar. Betreiberidentität, Kontaktkanäle, Inkrafttretensdatum und Angaben zum anwendbaren Recht werden vor dem öffentlichen kommerziellen Start festgelegt.'
  }),
  ja: Object.freeze({
    effectiveDate: '発効日は公開商用ローンチ前に確定します。',
    operatorDetails: '運営者の詳細は公開商用ローンチ前に確定します。',
    operatorIdentity: '運営者の身元は公開商用ローンチ前に確定します。',
    operatorAddress: '運営者の住所は公開商用ローンチ前に確定します。',
    privacyContact: 'プライバシーに関する連絡先は公開商用ローンチ前に確定します。',
    supportContact: 'サポートの連絡先は公開商用ローンチ前に確定します。',
    legalContact: '法的通知の連絡先は公開商用ローンチ前に確定します。',
    governingLaw: '準拠法と管轄裁判所の条項は公開商用ローンチ前に確定します。',
    publicationNotice: 'このページはProduct Ownerが承認した商用化前の法的基準を示します。運営者の身元、連絡先、発効日、準拠法に関する情報は公開商用ローンチ前に確定します。'
  }),
  ko: Object.freeze({
    effectiveDate: '시행일은 공개 상용 출시 전에 확정됩니다.',
    operatorDetails: '운영자 정보는 공개 상용 출시 전에 확정됩니다.',
    operatorIdentity: '운영자 신원은 공개 상용 출시 전에 확정됩니다.',
    operatorAddress: '운영자 주소는 공개 상용 출시 전에 확정됩니다.',
    privacyContact: '개인정보 보호 연락처는 공개 상용 출시 전에 확정됩니다.',
    supportContact: '지원 연락처는 공개 상용 출시 전에 확정됩니다.',
    legalContact: '법적 고지 연락처는 공개 상용 출시 전에 확정됩니다.',
    governingLaw: '준거법 및 관할 조항은 공개 상용 출시 전에 확정됩니다.',
    publicationNotice: '이 페이지는 Product Owner가 승인한 상용화 전 법적 기준을 제시합니다. 운영자 신원, 연락 채널, 시행일 및 준거법 정보는 공개 상용 출시 전에 확정됩니다.'
  }),
  'zh-Hant': Object.freeze({
    effectiveDate: '生效日期將在公開商業發布前確定。',
    operatorDetails: '營運者詳細資料將在公開商業發布前確定。',
    operatorIdentity: '營運者身分將在公開商業發布前確定。',
    operatorAddress: '營運者地址將在公開商業發布前確定。',
    privacyContact: '隱私聯絡資料將在公開商業發布前確定。',
    supportContact: '支援聯絡資料將在公開商業發布前確定。',
    legalContact: '法律通知聯絡資料將在公開商業發布前確定。',
    governingLaw: '準據法與法院管轄條款將在公開商業發布前確定。',
    publicationNotice: '本頁呈現由 Product Owner 核准的商業化前法律基準。營運者身分、聯絡管道、生效日期及準據法資訊將在公開商業發布前確定。'
  })
} as const);

function replaceLegalVariables(
  text: string,
  locale: SupportedLocale
): string {
  const presentation = NEUTRAL_PRESENTATION[locale];

  return text.replaceAll('\\n', '\n')
    .replace(
      'Operator: [OPERATOR_LEGAL_NAME]\nRegistered address: [OPERATOR_ADDRESS]\nPrivacy contact: [PRIVACY_CONTACT_EMAIL]',
      presentation.operatorDetails
    )
    .replace('[OPERATOR_LEGAL_NAME]\n[OPERATOR_ADDRESS]', presentation.operatorDetails)
    .replace('[EFFECTIVE_DATE]', presentation.effectiveDate)
    .replace('[OPERATOR_LEGAL_NAME]', presentation.operatorIdentity)
    .replace('[OPERATOR_ADDRESS]', presentation.operatorAddress)
    .replace('[PRIVACY_CONTACT_EMAIL]', presentation.privacyContact)
    .replace('[SUPPORT_CONTACT_EMAIL]', presentation.supportContact)
    .replace('[LEGAL_CONTACT_EMAIL]', presentation.legalContact)
    .replace('[GOVERNING_LAW_AND_FORUM_CLAUSE]', presentation.governingLaw);
}

function resolveDocument(
  document: LegalDocumentDefinition,
  locale: SupportedLocale
): ApprovedLegalPageContent {
  const resolveBlock = (block: LegalBlock): LegalBlock =>
    block.kind === 'paragraph'
      ? Object.freeze({ kind: 'paragraph', text: replaceLegalVariables(block.text, locale) })
      : Object.freeze({
          kind: 'list',
          items: Object.freeze(block.items.map((item) => replaceLegalVariables(item, locale)))
        });

  const sections = Object.freeze(document.sections.map((sourceSection) => {
    const blocks = Object.freeze(sourceSection.blocks.map(resolveBlock));
    const paragraphs = Object.freeze(
      blocks.flatMap((block) => block.kind === 'paragraph' ? [block.text] : [...block.items])
    );

    return Object.freeze({
      ...sourceSection,
      blocks,
      paragraphs
    });
  }));

  const content = Object.freeze({
    page: document.page,
    locale,
    title: replaceLegalVariables(document.title, locale),
    description: replaceLegalVariables(document.description, locale),
    effectiveDate: replaceLegalVariables(document.effectiveDate, locale),
    introduction: Object.freeze(document.introduction.map((text) => replaceLegalVariables(text, locale))),
    sections,
    publicationNotice: NEUTRAL_PRESENTATION[locale].publicationNotice,
    canonicalLocale: LEGAL_CANONICAL_LOCALE,
    canonicalSourceId: document.canonicalSourceId,
    ...(document.translationOf === undefined ? {} : { translationOf: document.translationOf }),
    ...(document.translationReviewStatus === undefined ? {} : { translationReviewStatus: document.translationReviewStatus }),
    policyVersion: LEGAL_POLICY_VERSION,
    publicationStatus: LEGAL_PUBLICATION_STATUS
  });

  if (/\[[A-Z_]+\]/u.test(JSON.stringify(content))) {
    throw new Error(`Unresolved legal presentation variable in ${locale}/${document.page}`);
  }

  return content;
}

const SOURCE_DOCUMENTS: Readonly<Record<LegalPageId, Readonly<Record<SupportedLocale, LegalDocumentDefinition>>>> =
  Object.freeze({
    privacy: Object.freeze({
      en: CANONICAL_LEGAL_DOCUMENTS.privacy,
      ...Object.fromEntries(
        Object.entries(LOCALIZED_LEGAL_DOCUMENTS).map(([locale, documents]) => [locale, documents.privacy])
      )
    }) as Readonly<Record<SupportedLocale, LegalDocumentDefinition>>,
    terms: Object.freeze({
      en: CANONICAL_LEGAL_DOCUMENTS.terms,
      ...Object.fromEntries(
        Object.entries(LOCALIZED_LEGAL_DOCUMENTS).map(([locale, documents]) => [locale, documents.terms])
      )
    }) as Readonly<Record<SupportedLocale, LegalDocumentDefinition>>
  });

for (const page of ['privacy', 'terms'] as const) {
  for (const locale of SUPPORTED_LOCALES) {
    if (SOURCE_DOCUMENTS[page][locale] === undefined) {
      throw new Error(`Missing approved legal translation: ${locale}/${page}`);
    }
  }
}

export const APPROVED_LEGAL_CONTENT: Readonly<
  Record<LegalPageId, Readonly<Record<SupportedLocale, ApprovedLegalPageContent>>>
> = Object.freeze({
  privacy: Object.freeze(
    Object.fromEntries(
      SUPPORTED_LOCALES.map((locale) => [locale, resolveDocument(SOURCE_DOCUMENTS.privacy[locale], locale)])
    )
  ) as Readonly<Record<SupportedLocale, ApprovedLegalPageContent>>,
  terms: Object.freeze(
    Object.fromEntries(
      SUPPORTED_LOCALES.map((locale) => [locale, resolveDocument(SOURCE_DOCUMENTS.terms[locale], locale)])
    )
  ) as Readonly<Record<SupportedLocale, ApprovedLegalPageContent>>
});

export function getApprovedLegalContent(
  page: LegalPageId,
  locale: SupportedLocale
): ApprovedLegalPageContent | null {
  return APPROVED_LEGAL_CONTENT[page]?.[locale] ?? null;
}

export function getLegalMetadata() {
  return LEGAL_METADATA;
}
