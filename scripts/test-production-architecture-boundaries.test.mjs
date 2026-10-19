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

test('civil-time implementation and packaged tzdb stay outside every browser graph', () => {
  const pending = [...graph.runtimeEdges.keys()].filter((path) => path.startsWith('apps/web/src/'));
  const visited = new Set();
  while (pending.length > 0) {
    const path = pending.pop();
    if (visited.has(path)) continue;
    visited.add(path);
    assert.ok(!path.startsWith('server/src/'), `Browser reaches server module: ${path}`);
    for (const { specifier } of graph.externalImports.get(path) ?? []) {
      assert.ok(!specifier.startsWith('@js-joda/'), `Browser reaches tzdb dependency: ${path}`);
    }
    pending.push(...(graph.runtimeEdges.get(path) ?? []));
  }
});

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

test('Engine result inspection adapter is development-only and unreachable from production roots', () => {
  const adapter = 'server/src/development/engine-result-adapter/engine-result-adapter.ts';
  assert.equal(classifyRepositoryPath(adapter), ADMISSION_CLASSES.DEVELOPMENT_ONLY);
  assert.equal(productionAudit.reachableModules.includes(adapter), false);
});

test('real research private-service client is development-only and unreachable from production roots', () => {
  const client = 'server/src/development/real-engine-private-service-client.ts';
  assert.equal(classifyRepositoryPath(client), ADMISSION_CLASSES.DEVELOPMENT_ONLY);
  assert.equal(productionAudit.reachableModules.includes(client), false);
  assert.equal(layerAudit.violations.some((violation) => violation.edge.endsWith(` -> ${client}`)), false);
});

test('real research chart remains dev-only, reuses the existing form and renderer, and shows its distinct disclosure', () => {
  const workflow = readFileSync(join(REPOSITORY_ROOT,
    'apps/web/src/features/chart-experience/LocalEngineChartWorkflow.tsx'), 'utf8');
  const route = readFileSync(join(REPOSITORY_ROOT, 'apps/web/src/pages/dev/chart.astro'), 'utf8');

  assert.match(workflow, /REAL ASTRONOMICAL RESEARCH OUTPUT/u);
  assert.match(workflow, /NOT SCIENTIFICALLY OR PRODUCTION APPROVED/u);
  assert.match(workflow, /data-testid="real-research-chart-disclosure"/u);
  assert.match(workflow, /<BirthInputForm/u);
  assert.match(workflow, /<ChartWorkspaceView/u);
  assert.match(workflow, /requireResolvedLocation/u);
  assert.match(route, /import\.meta\.env\.DEV/u);
  assert.match(route, /NATALNODE_LOCAL_CHART_WORKFLOW_MODE/u);
});

test('the local Astro child receives an explicit environment allowlist without private service credentials', () => {
  const launcher = readFileSync(join(REPOSITORY_ROOT,
    'scripts/run-local-browser-chart-workflow.mjs'), 'utf8');
  const environmentBlock = launcher.match(/const webEnvironment = \{([\s\S]*?)\n  \};/u)?.[1];
  assert.ok(environmentBlock, 'Astro child environment must remain an explicit allowlist.');
  assert.doesNotMatch(environmentBlock, /\.\.\.process\.env(?:\s|,|\})/u);
  assert.doesNotMatch(environmentBlock, /NATALNODE_REAL_ENGINE_(?:BEARER_TOKEN|SERVICE_URL|RUNTIME_IDENTITY)/u);
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
