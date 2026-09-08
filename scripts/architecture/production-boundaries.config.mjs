export const ADMISSION_CLASSES = Object.freeze({
  PRODUCTION_ELIGIBLE: 'PRODUCTION_ELIGIBLE',
  DEVELOPMENT_ONLY: 'DEVELOPMENT_ONLY',
  RESEARCH_ONLY: 'RESEARCH_ONLY',
  TEST_ONLY: 'TEST_ONLY',
  MECHANISM_ONLY: 'MECHANISM_ONLY'
});

export const PRODUCTION_BOUNDARY_CONFIG = Object.freeze({
  version: '1.0.0',
  sourceRoots: Object.freeze([
    'apps/web/src',
    'server/src',
    'packages/contracts/src',
    'packages/engine-client/src',
    'packages/test-fixtures/src'
  ]),
  webPagesRoot: 'apps/web/src/pages',
  developmentRouteSegments: Object.freeze(['dev']),
  productionRootFiles: Object.freeze([
    'apps/web/src/features/interpretation/index.ts',
    'apps/web/src/lib/engine-client.ts',
    'server/src/index.ts',
    'server/src/app/create-app.ts',
    'server/src/executable/auth-lifecycle-maintenance-main.ts',
    'server/src/executable/community-retention-maintenance-main.ts',
    'server/src/executable/feedback-retention-maintenance-main.ts',
    'server/src/executable/migration-main.ts',
    'server/src/executable/notification-worker-main.ts',
    'server/src/executable/practitioner-retention-maintenance-main.ts',
    'server/src/executable/server-main.ts'
  ]),
  developmentRootFiles: Object.freeze([
    'server/src/executable/local-main.ts',
    'server/src/executable/public-development-main.ts'
  ]),
  testRootDirectories: Object.freeze([
    'apps/web/test',
    'server/test'
  ]),
  workspaceImports: Object.freeze({
    '@natalnode/contracts': 'packages/contracts/src/index.ts',
    '@natalnode/engine-client': 'packages/engine-client/src/index.ts',
    '@natalnode/engine-client/http': 'packages/engine-client/src/http-engine-client.ts',
    '@natalnode/engine-client/mock': 'packages/engine-client/src/mock-engine-client.ts',
    '@natalnode/test-fixtures': 'packages/test-fixtures/src/index.ts'
  }),
  classification: Object.freeze({
    MECHANISM_ONLY: Object.freeze({
      exact: Object.freeze([
        'apps/web/src/features/interpretation/chart-level-convergence-counterevidence-poc.ts',
        'docs/research/personal-synthesis/CHART_CONVERGENCE_COUNTEREVIDENCE_REPRESENTATIVE_V1.json'
      ]),
      prefixes: Object.freeze([])
    }),
    TEST_ONLY: Object.freeze({
      exact: Object.freeze([]),
      prefixes: Object.freeze([
        'apps/web/test/',
        'server/test/',
        'packages/test-fixtures/src/',
        'scripts/test-'
      ])
    }),
    RESEARCH_ONLY: Object.freeze({
      exact: Object.freeze([
        'apps/web/src/features/interpretation/interpretation-signal-composition.ts',
        'apps/web/src/features/interpretation/interpretation-signal-contracts.ts',
        'apps/web/src/features/interpretation/interpretation-signal-engine.ts',
        'apps/web/src/features/interpretation/interpretation-signal-ranking.ts',
        'apps/web/src/features/interpretation/personal-synthesis-poc.ts',
        'apps/web/src/features/interpretation/composition-signal-personal-synthesis-poc.ts',
        'apps/web/src/features/interpretation/shared-root-relational-synthesis-poc.ts',
        'apps/web/src/features/interpretation/chart-level-personal-theme-selector-poc.ts',
        'apps/web/src/features/interpretation/weekly-editorial-lint.ts',
        'apps/web/src/features/interpretation/weekly-editorial.ts',
        'apps/web/src/features/interpretation/weekly-interpretation-poc.ts',
        'apps/web/src/features/interpretation/weekly-reading-model.ts',
        'apps/web/src/features/interpretation/weekly-reading-prototype-r2.ts',
        'apps/web/src/features/interpretation/weekly-reading-prototype.ts',
        'apps/web/src/features/interpretation/WeeklyReadingPrototype.tsx',
        'apps/web/src/features/interpretation/WeeklyReadingPrototypeR2.tsx'
      ]),
      prefixes: Object.freeze([
        'apps/web/src/features/my-chart/',
        'docs/research/'
      ])
    }),
    DEVELOPMENT_ONLY: Object.freeze({
      exact: Object.freeze([
        'apps/web/src/features/chart-input/development-resolver.ts',
        'apps/web/src/features/learn/educational-chart-source.ts',
        'packages/engine-client/src/mock-engine-client.ts',
        'server/src/executable/create-executable-server-bindings.ts',
        'server/src/executable/executable-server-config.ts',
        'server/src/executable/local-main.ts',
        'server/src/executable/public-development-dependencies.ts',
        'server/src/executable/public-development-main.ts',
        'server/src/executable/run-local-development-composition.ts',
        'server/src/executable/run-public-development-composition.ts'
      ]),
      prefixes: Object.freeze([
        'apps/web/src/features/chart-experience/',
        'apps/web/src/pages/dev/',
        'apps/web/src/pages/[locale]/dev/'
      ])
    })
  }),
  forbiddenProductionMarkers: Object.freeze([
    'MECHANISM_ONLY_SEMANTIC_TEST_FIXTURE',
    'BOUNDED_RESEARCH_POC',
    'DEVELOPMENT_RESEARCH_ONLY',
    'RESEARCH_REPRESENTATIVE_SIGNAL',
    'RUNTIME_NOT_ADMITTED'
  ]),
  forbiddenExternalImportPrefixes: Object.freeze([
    '@natalnode/astronomy-provider',
    '@natalnode/engine',
    'astronomy-engine',
    'ephemeris',
    'swisseph',
    'sweph'
  ]),
  ignoredAssetExtensions: Object.freeze([
    '.css', '.gif', '.jpeg', '.jpg', '.md', '.mdx', '.png', '.svg', '.webp', '.woff', '.woff2'
  ]),
  knownStructuralDebtEdges: Object.freeze([
    'apps/web/src/lib/aspect-lookup.ts -> apps/web/src/core/astrology-taxonomy/astrology-glossary.ts',
    'apps/web/src/lib/aspect-lookup.ts -> apps/web/src/core/astrology-taxonomy/chart-taxonomy.ts',
    'apps/web/src/lib/aspect-lookup.ts -> apps/web/src/features/interpretation/interpretation-content.ts',
    'apps/web/src/lib/house-lookup.ts -> apps/web/src/core/astrology-taxonomy/astrology-glossary.ts',
    'apps/web/src/lib/house-lookup.ts -> apps/web/src/features/interpretation/interpretation-content.ts',
    'apps/web/src/lib/share-links.ts -> apps/web/src/core/astrology-taxonomy/chart-taxonomy.ts',
    'apps/web/src/lib/sign-lookup.ts -> apps/web/src/core/astrology-taxonomy/astrology-glossary.ts',
    'apps/web/src/lib/sign-lookup.ts -> apps/web/src/core/astrology-taxonomy/chart-taxonomy.ts',
    'apps/web/src/lib/sign-lookup.ts -> apps/web/src/features/interpretation/interpretation-content.ts'
  ])
});
