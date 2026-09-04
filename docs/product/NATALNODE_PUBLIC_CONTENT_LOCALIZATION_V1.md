# NatalNode Public Content Localization V1

Status: implementation foundation for WEB-P1-PLATFORM-001.

This document records the Web product boundary for public, indexable editorial
content. It does not authorize a new locale, a legal translation, or a change to
the NatalNode Engine boundary.

## Locale contract

The admitted presentation and editorial locale set is exactly:

- `en` (default)
- `es`
- `fr`
- `de`
- `ja`
- `ko`
- `zh-Hant`

There is no `zh-Hans` runtime locale. Existing browser-language mapping remains
authoritative: `zh-TW`, `zh-HK`, `zh-MO`, and `zh-Hant-*` map to `zh-Hant`;
`zh-CN`, `zh-SG`, `zh-Hans`, and `zh-Hans-*` fall back to English. A locale in
the URL is authoritative for that request.

## Bounded public-content audit

The relevant public surfaces were classified before implementation:

| Surface | Classification | V1 result |
| --- | --- | --- |
| About | NatalNode-owned editorial content | Full seven-locale content and localized metadata |
| Methodology | NatalNode-owned editorial content | Full seven-locale content and localized metadata |
| Learn hub | Editorial/product education | Localized UI, metadata, route links, and locale-filtered entries |
| Public explanatory Learn article | Editorial content | English plus six independently authored locale entries; no silent body fallback |
| Tools hub and sign/house/aspect supporting copy | Product/editorial supporting content | Existing seven-locale copy now has localized metadata and locale-preserving links |
| Discover | Product education/reference content | Existing seven-locale content and locale-aware metadata/links retained |
| Community and Practitioner | Dynamic user/product surfaces | Localized shell; user/application content is not silently machine-translated or rewritten |
| Privacy and Terms | Legal/external authority | Legal authority remains frozen; no translation was invented |
| Auth, Vault, Feedback, and technical/development routes | Product UI or technical surface | Governed by the existing UI catalog/runtime boundaries, not long-form editorial translation |

The audit therefore treats About and Methodology as ordinary NatalNode-owned
editorial content that the Web product may author in all admitted locales. Legal
content remains a separate authority class. Dynamic user-authored content is not
treated as an ordinary editorial translation target.

## Content architecture

Long-form About and Methodology copy lives under the intentional content
boundary:

```text
apps/web/src/content/public/
  types.ts
  about.ts
  methodology.ts
```

Each module exports a complete `Record<SupportedLocale, PublicEditorialPage>`.
The route components own composition, layout, accessible headings, localized
internal-link composition, and SEO composition. They do not contain seven
language prose branches.

Learn uses the existing Astro content collection. Each entry now has:

- `contentId`: stable public content identity and route slug;
- `locale`: one of the seven admitted locales;
- a locale-specific collection `slug` to keep Astro entries unique.

The route filters by `data.locale === requestedLocale`. This makes a missing
translation visible as missing content rather than silently rendering the
English entry. The current public article has a complete entry in all seven
locales.

## Translation policy

English remains the semantic source for this foundation. The authored Spanish,
French, German, Japanese, Korean, and Traditional Chinese variants preserve the
same hierarchy, calculation-versus-interpretation distinction, uncertainty
caveats, and product boundaries. They do not add scientific claims, guarantees,
or product promises.

Canonical astrology and scientific facts remain owned by their existing
contracts and terminology sources. This document does not authorize translation
of provider names, scientific identifiers, Engine output, or legal text through a
home-grown dictionary.

## SEO and link contract

`getPublicSeoAlternates()` maps a route identity through the seven-locale
registry and adds `x-default` mapped to English. `createPublicSeo()` composes a
localized canonical URL, localized title/description, and the same alternate
set. About, Methodology, Learn, and Tools use this contract where they are
indexable.

Every admitted public editorial page has one page-level `h1`. The localized
body is server-rendered and crawlable. Route-owned links use
`getLocalizedPath()`; Markdown article links are relative to the current
localized article route so they preserve the active locale without hardcoding an
English URL.

The sitemap emits locale-prefixed public editorial URLs and locale-specific
Learn article URLs. Legal routes are not converted into ordinary editorial
entries merely because they are linked from the shell.

## Fallback and authority rules

Ordinary admitted public editorial content must not use an English body as an
implicit fallback. Content getters fail loudly when a required locale entry is
missing, and Learn route generation filters to the requested locale.

English remains the explicit default for root/browser negotiation and for
unsupported language tags. That default is a locale-selection rule, not a
permission to display an English editorial body on an admitted non-English URL.

Legal/external content continues to use the existing `LEGAL_EXTERNAL` authority
state. No Privacy or Terms translation was created in this campaign.

## Verification boundary

Focused content characterization checks cover the closed locale set, complete
About and Methodology records, Learn entry locale identity, absence of `zh-Hans`,
localized SEO alternate generation, and locale-preserving link identities.
`npm run check` and `npm run build` remain the final repository gates.

This foundation does not start Share, add a CMS, translate user-generated
content, alter the legal authority, or change the scientific/provider boundary.
