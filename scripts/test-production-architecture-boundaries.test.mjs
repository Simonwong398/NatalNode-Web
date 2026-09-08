import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  analyzeProductionReachability,
  buildRepositoryImportGraph,
  classifyRepositoryPath,
  collectModuleImports,
  discoverBoundaryRoots,
  isAdmissionDependencyAllowed
} from './architecture/production-boundary-graph.mjs';
import { findWebLayerViolations } from './architecture/production-boundary-layers.mjs';
import {
  ADMISSION_CLASSES,
  PRODUCTION_BOUNDARY_CONFIG
} from './architecture/production-boundaries.config.mjs';

const REPOSITORY_ROOT = fileURLToPath(new URL('../', import.meta.url));
const graph = buildRepositoryImportGraph(REPOSITORY_ROOT);
const roots = discoverBoundaryRoots(REPOSITORY_ROOT);
const productionAudit = analyzeProductionReachability(graph, roots.productionRoots);
const layerAudit = findWebLayerViolations(graph);

function syntheticGraph({ edges = {}, sources = {}, externalImports = {} }) {
  const moduleNames = new Set([
    ...Object.keys(edges),
    ...Object.values(edges).flat(),
    ...Object.keys(sources),
    ...Object.keys(externalImports)
  ]);
  return {
    runtimeEdges: new Map([...moduleNames].map((name) => [name, edges[name] ?? []])),
    allEdges: new Map([...moduleNames].map((name) => [name, edges[name] ?? []])),
    sourceTexts: new Map([...moduleNames].map((name) => [name, sources[name] ?? ''])),
    externalImports: new Map([...moduleNames].map((name) => [name, externalImports[name] ?? []])),
    unresolvedInternalImports: new Map([...moduleNames].map((name) => [name, []]))
  };
}

function violationKinds(audit) {
  return audit.violations.map((violation) => violation.kind);
}

test('A: current production roots transitively reach production-eligible modules only', () => {
  assert.ok(roots.productionWebRoots.length > 0);
  assert.ok(roots.productionServerRoots.includes('server/src/index.ts'));
  assert.equal(productionAudit.violations.length, 0);
  for (const root of roots.productionRoots) {
    assert.equal(classifyRepositoryPath(root), ADMISSION_CLASSES.PRODUCTION_ELIGIBLE);
  }
});

test('B-C: direct and transitive production-to-research reachability fail closed', () => {
  const root = 'apps/web/src/pages/index.astro';
  const facade = 'apps/web/src/features/interpretation/index.ts';
  const research = 'apps/web/src/features/interpretation/personal-synthesis-poc.ts';
  const direct = analyzeProductionReachability(
    syntheticGraph({ edges: { [root]: [research] } }),
    [root]
  );
  const transitive = analyzeProductionReachability(
    syntheticGraph({ edges: { [root]: [facade], [facade]: [research] } }),
    [root]
  );

  assert.ok(violationKinds(direct).includes('FORBIDDEN_ADMISSION_CLASS'));
  assert.ok(violationKinds(transitive).includes('FORBIDDEN_ADMISSION_CLASS'));
  assert.deepEqual(
    transitive.violations.find((violation) => violation.target === research)?.path,
    [root, facade, research]
  );
});

test('D-E: development and test roots may depend on research and mechanism modules', () => {
  assert.equal(
    isAdmissionDependencyAllowed(
      ADMISSION_CLASSES.DEVELOPMENT_ONLY,
      ADMISSION_CLASSES.RESEARCH_ONLY
    ),
    true
  );
  assert.equal(
    isAdmissionDependencyAllowed(
      ADMISSION_CLASSES.TEST_ONLY,
      ADMISSION_CLASSES.MECHANISM_ONLY
    ),
    true
  );
});

test('F: production-to-mechanism reachability fails closed', () => {
  const root = 'apps/web/src/pages/index.astro';
  const mechanism = 'apps/web/src/features/interpretation/chart-level-convergence-counterevidence-poc.ts';
  const audit = analyzeProductionReachability(
    syntheticGraph({ edges: { [root]: [mechanism] } }),
    [root]
  );

  assert.equal(audit.violations[0]?.targetClass, ADMISSION_CLASSES.MECHANISM_ONLY);
});

test('G-H: MockEngineClient is rejected from production and admitted for development', () => {
  const root = 'apps/web/src/pages/index.astro';
  const mock = 'packages/engine-client/src/mock-engine-client.ts';
  const audit = analyzeProductionReachability(
    syntheticGraph({ edges: { [root]: [mock] } }),
    [root]
  );

  assert.equal(audit.violations[0]?.targetClass, ADMISSION_CLASSES.DEVELOPMENT_ONLY);
  assert.equal(
    isAdmissionDependencyAllowed(
      ADMISSION_CLASSES.DEVELOPMENT_ONLY,
      ADMISSION_CLASSES.DEVELOPMENT_ONLY
    ),
    true
  );
  assert.doesNotMatch(
    readFileSync(join(REPOSITORY_ROOT, 'packages/engine-client/src/index.ts'), 'utf8'),
    /MockEngineClient/u
  );
});

test('I: production runtime cannot reach research interpretation modules or markers', () => {
  const root = 'server/src/executable/server-main.ts';
  const research = 'apps/web/src/features/interpretation/personal-synthesis-poc.ts';
  const audit = analyzeProductionReachability(
    syntheticGraph({
      edges: { [root]: [research] },
      sources: { [research]: 'export const status = "RUNTIME_NOT_ADMITTED";' }
    }),
    [root]
  );

  assert.ok(violationKinds(audit).includes('FORBIDDEN_ADMISSION_CLASS'));
  assert.ok(violationKinds(audit).includes('FORBIDDEN_PRODUCTION_MARKER'));
});

test('J: server routes may consume the EngineClient contract without a runtime edge', () => {
  const imports = collectModuleImports(
    "import type { EngineClient } from '@natalnode/engine-client';",
    'server/src/app/routes/chart.ts'
  );

  assert.deepEqual(imports, [{
    specifier: '@natalnode/engine-client',
    runtime: false,
    kind: 'STATIC_IMPORT'
  }]);
});

test('K: Web or BFF imports of concrete astronomy providers fail closed', () => {
  const root = 'server/src/app/routes/chart.ts';
  const audit = analyzeProductionReachability(
    syntheticGraph({
      externalImports: {
        [root]: [{
          specifier: '@natalnode/astronomy-provider',
          runtime: true,
          kind: 'STATIC_IMPORT'
        }]
      }
    }),
    [root]
  );

  assert.deepEqual(violationKinds(audit), ['FORBIDDEN_EXTERNAL_IMPORT']);
});

test('L-M: exact baseline layer debt is accepted and any new forbidden edge fails', () => {
  assert.equal(layerAudit.violations.length, PRODUCTION_BOUNDARY_CONFIG.knownStructuralDebtEdges.length);
  assert.equal(layerAudit.newViolations.length, 0);
  assert.deepEqual(
    layerAudit.violations.map((violation) => violation.edge),
    [...PRODUCTION_BOUNDARY_CONFIG.knownStructuralDebtEdges].sort()
  );

  const newEdge = 'apps/web/src/lib/new-authority.ts -> apps/web/src/features/interpretation/index.ts';
  const audit = findWebLayerViolations(syntheticGraph({
    edges: {
      'apps/web/src/lib/new-authority.ts': ['apps/web/src/features/interpretation/index.ts']
    }
  }));
  assert.deepEqual(audit.newViolations.map((violation) => violation.edge), [newEdge]);
});

test('N: root discovery and architecture audit are deterministic', () => {
  const secondRoots = discoverBoundaryRoots(REPOSITORY_ROOT);
  const secondAudit = analyzeProductionReachability(graph, secondRoots.productionRoots);

  assert.deepEqual(secondRoots, roots);
  assert.deepEqual(secondAudit, productionAudit);
});

test('literal dynamic imports and static reexports participate in runtime reachability', () => {
  const imports = collectModuleImports(
    "export { value } from './facade.js';\nvoid import('./research.js');",
    'apps/web/src/pages/index.ts'
  );

  assert.deepEqual(imports, [
    { specifier: './facade.js', runtime: true, kind: 'STATIC_REEXPORT' },
    { specifier: './research.js', runtime: true, kind: 'DYNAMIC_LITERAL_IMPORT' }
  ]);
});

test('dev route namespace is excluded from production roots but remains auditable', () => {
  assert.ok(roots.developmentRoots.includes('apps/web/src/pages/dev/chart.astro'));
  assert.ok(roots.developmentRoots.includes('apps/web/src/pages/dev/educational-chart.astro'));
  assert.equal(
    roots.productionRoots.some((root) => root.includes('/dev/')),
    false
  );
});
