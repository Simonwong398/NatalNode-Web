import { PRODUCTION_BOUNDARY_CONFIG } from './production-boundaries.config.mjs';

function webLayer(relativePath) {
  if (relativePath.startsWith('apps/web/src/lib/')) {
    return 'SHARED';
  }
  if (relativePath.startsWith('apps/web/src/core/')) {
    return 'CORE';
  }
  if (relativePath.startsWith('apps/web/src/features/')) {
    return 'FEATURE';
  }
  if (relativePath.startsWith('apps/web/src/pages/')) {
    return 'ROUTE';
  }
  return null;
}

export function findWebLayerViolations(
  graph,
  config = PRODUCTION_BOUNDARY_CONFIG
) {
  const debt = new Set(config.knownStructuralDebtEdges);
  const violations = [];
  for (const [source, targets] of graph.allEdges) {
    const sourceLayer = webLayer(source);
    for (const target of targets) {
      const targetLayer = webLayer(target);
      const forbidden = sourceLayer === 'CORE' && targetLayer === 'FEATURE' ||
        sourceLayer === 'SHARED' && (targetLayer === 'CORE' || targetLayer === 'FEATURE');
      if (!forbidden) {
        continue;
      }
      const edge = `${source} -> ${target}`;
      violations.push({
        edge,
        source,
        target,
        sourceLayer,
        targetLayer,
        baselined: debt.has(edge)
      });
    }
  }
  return Object.freeze({
    violations: Object.freeze(violations
      .sort((left, right) => left.edge.localeCompare(right.edge))),
    newViolations: Object.freeze(violations
      .filter((violation) => !violation.baselined)
      .sort((left, right) => left.edge.localeCompare(right.edge)))
  });
}
