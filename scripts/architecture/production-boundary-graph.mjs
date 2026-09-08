import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync
} from 'node:fs';
import {
  dirname,
  extname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep
} from 'node:path';
import ts from 'typescript';
import {
  ADMISSION_CLASSES,
  PRODUCTION_BOUNDARY_CONFIG
} from './production-boundaries.config.mjs';

const SOURCE_EXTENSIONS = Object.freeze([
  '.ts', '.tsx', '.mts', '.mjs', '.js', '.jsx', '.astro', '.json'
]);
const TYPESCRIPT_SOURCE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.mts', '.mjs', '.js', '.jsx'
]);
const CLASSIFICATION_PRIORITY = Object.freeze([
  ADMISSION_CLASSES.MECHANISM_ONLY,
  ADMISSION_CLASSES.TEST_ONLY,
  ADMISSION_CLASSES.RESEARCH_ONLY,
  ADMISSION_CLASSES.DEVELOPMENT_ONLY
]);

function toPosix(value) {
  return value.split(sep).join('/');
}

function sortedUnique(values) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function collectFiles(directory, predicate = () => true) {
  if (!existsSync(directory)) {
    return [];
  }

  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(entryPath, predicate));
    } else if (predicate(entryPath)) {
      files.push(entryPath);
    }
  }
  return files.sort((left, right) => left.localeCompare(right));
}

function extractAstroModuleSource(source) {
  const sections = [];
  const frontmatter = source.match(/^\s*---\s*\r?\n([\s\S]*?)\r?\n---/u);
  if (frontmatter?.[1] !== undefined) {
    sections.push(frontmatter[1]);
  }
  for (const match of source.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/giu)) {
    if (match[1] !== undefined) {
      sections.push(match[1]);
    }
  }
  return sections.join('\n');
}

function scriptKind(filePath) {
  switch (extname(filePath)) {
    case '.tsx':
      return ts.ScriptKind.TSX;
    case '.jsx':
      return ts.ScriptKind.JSX;
    case '.js':
    case '.mjs':
      return ts.ScriptKind.JS;
    default:
      return ts.ScriptKind.TS;
  }
}

function importClauseHasRuntime(importClause) {
  if (importClause === undefined) {
    return true;
  }
  if (importClause.isTypeOnly || importClause.name !== undefined) {
    return !importClause.isTypeOnly;
  }
  const bindings = importClause.namedBindings;
  if (bindings === undefined || ts.isNamespaceImport(bindings)) {
    return bindings !== undefined;
  }
  return bindings.elements.some((element) => !element.isTypeOnly);
}

function exportClauseHasRuntime(exportDeclaration) {
  if (exportDeclaration.isTypeOnly) {
    return false;
  }
  if (exportDeclaration.exportClause === undefined ||
      ts.isNamespaceExport(exportDeclaration.exportClause)) {
    return true;
  }
  return exportDeclaration.exportClause.elements.some((element) => !element.isTypeOnly);
}

export function collectModuleImports(source, filePath) {
  const analyzableSource = extname(filePath) === '.astro'
    ? extractAstroModuleSource(source)
    : source;
  if (extname(filePath) === '.json') {
    return [];
  }
  const sourceFile = ts.createSourceFile(
    filePath,
    analyzableSource,
    ts.ScriptTarget.Latest,
    true,
    scriptKind(filePath)
  );
  const imports = [];

  function addImport(specifier, runtime, kind) {
    imports.push({ specifier, runtime, kind });
  }

  function visit(node) {
    if (ts.isImportDeclaration(node) && ts.isStringLiteralLike(node.moduleSpecifier)) {
      addImport(
        node.moduleSpecifier.text,
        importClauseHasRuntime(node.importClause),
        'STATIC_IMPORT'
      );
    } else if (ts.isExportDeclaration(node) &&
        node.moduleSpecifier !== undefined &&
        ts.isStringLiteralLike(node.moduleSpecifier)) {
      addImport(
        node.moduleSpecifier.text,
        exportClauseHasRuntime(node),
        'STATIC_REEXPORT'
      );
    } else if (ts.isCallExpression(node) &&
        node.expression.kind === ts.SyntaxKind.ImportKeyword &&
        node.arguments.length === 1 &&
        ts.isStringLiteralLike(node.arguments[0])) {
      addImport(node.arguments[0].text, true, 'DYNAMIC_LITERAL_IMPORT');
    } else if (ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === 'require' &&
        node.arguments.length === 1 &&
        ts.isStringLiteralLike(node.arguments[0])) {
      addImport(node.arguments[0].text, true, 'COMMONJS_LITERAL_REQUIRE');
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return imports
    .filter((item, index, values) => values.findIndex((candidate) =>
      candidate.specifier === item.specifier &&
      candidate.runtime === item.runtime &&
      candidate.kind === item.kind
    ) === index)
    .sort((left, right) =>
      `${left.specifier}|${left.kind}|${left.runtime}`
        .localeCompare(`${right.specifier}|${right.kind}|${right.runtime}`)
    );
}

function candidatePaths(basePath) {
  const extension = extname(basePath);
  const candidates = [];
  const stem = TYPESCRIPT_SOURCE_EXTENSIONS.has(extension)
    ? basePath.slice(0, -extension.length)
    : basePath;

  if (extension === '.json' || extension === '.astro') {
    candidates.push(basePath);
  } else {
    for (const sourceExtension of SOURCE_EXTENSIONS) {
      candidates.push(`${stem}${sourceExtension}`);
    }
    for (const sourceExtension of SOURCE_EXTENSIONS) {
      candidates.push(join(stem, `index${sourceExtension}`));
    }
  }
  return sortedUnique(candidates);
}

function isInsideRepository(repositoryRoot, targetPath) {
  const relativePath = relative(repositoryRoot, targetPath);
  return relativePath !== '..' &&
    !relativePath.startsWith(`..${sep}`) &&
    !isAbsolute(relativePath);
}

export function resolveRepositoryImport(
  repositoryRoot,
  importerPath,
  specifier,
  config = PRODUCTION_BOUNDARY_CONFIG
) {
  if (config.ignoredAssetExtensions.includes(extname(specifier))) {
    return { kind: 'IGNORED_ASSET', specifier };
  }

  let basePath;
  if (specifier.startsWith('@/')) {
    basePath = join(repositoryRoot, 'apps', 'web', 'src', specifier.slice(2));
  } else if (specifier.startsWith('.')) {
    basePath = resolve(dirname(importerPath), specifier);
  } else if (config.workspaceImports[specifier] !== undefined) {
    basePath = join(repositoryRoot, config.workspaceImports[specifier]);
  } else {
    return { kind: 'EXTERNAL', specifier };
  }

  if (!isInsideRepository(repositoryRoot, basePath)) {
    return { kind: 'UNRESOLVED_INTERNAL', specifier };
  }

  const target = candidatePaths(basePath).find((candidate) =>
    existsSync(candidate) && statSync(candidate).isFile()
  );
  if (target === undefined) {
    return { kind: 'UNRESOLVED_INTERNAL', specifier };
  }
  return {
    kind: 'REPOSITORY_MODULE',
    specifier,
    absolutePath: target,
    relativePath: toPosix(relative(repositoryRoot, target))
  };
}

export function discoverBoundaryRoots(
  repositoryRoot,
  config = PRODUCTION_BOUNDARY_CONFIG
) {
  const pagesRoot = join(repositoryRoot, config.webPagesRoot);
  const pageFiles = collectFiles(
    pagesRoot,
    (filePath) => SOURCE_EXTENSIONS.includes(extname(filePath))
  );
  const productionWebRoots = [];
  const developmentWebRoots = [];

  for (const filePath of pageFiles) {
    const routeSegments = toPosix(relative(pagesRoot, filePath)).split('/');
    const relativePath = toPosix(relative(repositoryRoot, filePath));
    if (routeSegments.some((segment) => config.developmentRouteSegments.includes(segment))) {
      developmentWebRoots.push(relativePath);
    } else {
      productionWebRoots.push(relativePath);
    }
  }

  const testRoots = [];
  for (const directory of config.testRootDirectories) {
    testRoots.push(...collectFiles(join(repositoryRoot, directory), (filePath) =>
      SOURCE_EXTENSIONS.includes(extname(filePath))
    ).map((filePath) => toPosix(relative(repositoryRoot, filePath))));
  }
  testRoots.push(...collectFiles(join(repositoryRoot, 'scripts'), (filePath) =>
    /test-.*\.test\.mjs$/u.test(filePath)
  ).map((filePath) => toPosix(relative(repositoryRoot, filePath))));

  return Object.freeze({
    productionWebRoots: Object.freeze(sortedUnique(productionWebRoots)),
    productionServerRoots: Object.freeze(sortedUnique(config.productionRootFiles)),
    productionRoots: Object.freeze(sortedUnique([
      ...productionWebRoots,
      ...config.productionRootFiles
    ])),
    developmentRoots: Object.freeze(sortedUnique([
      ...developmentWebRoots,
      ...config.developmentRootFiles
    ])),
    testRoots: Object.freeze(sortedUnique(testRoots))
  });
}

export function buildRepositoryImportGraph(
  repositoryRoot,
  config = PRODUCTION_BOUNDARY_CONFIG
) {
  const initialFiles = config.sourceRoots.flatMap((sourceRoot) =>
    collectFiles(join(repositoryRoot, sourceRoot), (filePath) =>
      SOURCE_EXTENSIONS.includes(extname(filePath))
    )
  );
  const queue = [...initialFiles];
  const visited = new Set();
  const runtimeEdges = new Map();
  const allEdges = new Map();
  const sourceTexts = new Map();
  const externalImports = new Map();
  const unresolvedInternalImports = new Map();

  while (queue.length > 0) {
    const absolutePath = queue.shift();
    if (absolutePath === undefined || visited.has(absolutePath)) {
      continue;
    }
    visited.add(absolutePath);
    const relativePath = toPosix(relative(repositoryRoot, absolutePath));
    const source = readFileSync(absolutePath, 'utf8');
    sourceTexts.set(relativePath, source);
    const runtimeTargets = [];
    const allTargets = [];
    const externals = [];
    const unresolved = [];

    for (const item of collectModuleImports(source, absolutePath)) {
      const resolvedImport = resolveRepositoryImport(
        repositoryRoot,
        absolutePath,
        item.specifier,
        config
      );
      if (resolvedImport.kind === 'REPOSITORY_MODULE') {
        allTargets.push(resolvedImport.relativePath);
        if (item.runtime) {
          runtimeTargets.push(resolvedImport.relativePath);
        }
        if (!visited.has(resolvedImport.absolutePath)) {
          queue.push(resolvedImport.absolutePath);
        }
      } else if (resolvedImport.kind === 'EXTERNAL') {
        externals.push({ ...item, specifier: resolvedImport.specifier });
      } else if (resolvedImport.kind === 'UNRESOLVED_INTERNAL') {
        unresolved.push({ ...item, specifier: resolvedImport.specifier });
      }
    }

    runtimeEdges.set(relativePath, sortedUnique(runtimeTargets));
    allEdges.set(relativePath, sortedUnique(allTargets));
    externalImports.set(relativePath, externals);
    unresolvedInternalImports.set(relativePath, unresolved);
  }

  return {
    runtimeEdges,
    allEdges,
    sourceTexts,
    externalImports,
    unresolvedInternalImports
  };
}

export function classifyRepositoryPath(
  relativePath,
  config = PRODUCTION_BOUNDARY_CONFIG
) {
  for (const admissionClass of CLASSIFICATION_PRIORITY) {
    const definition = config.classification[admissionClass];
    if (definition.exact.includes(relativePath) ||
        definition.prefixes.some((prefix) => relativePath.startsWith(prefix))) {
      return admissionClass;
    }
  }
  return ADMISSION_CLASSES.PRODUCTION_ELIGIBLE;
}

export function isAdmissionDependencyAllowed(rootClass, targetClass) {
  if (rootClass === ADMISSION_CLASSES.PRODUCTION_ELIGIBLE) {
    return targetClass === ADMISSION_CLASSES.PRODUCTION_ELIGIBLE;
  }
  return true;
}

function reachableFrom(root, runtimeEdges) {
  const queue = [[root]];
  const visited = new Set();
  const paths = new Map();
  while (queue.length > 0) {
    const path = queue.shift();
    const current = path?.at(-1);
    if (current === undefined || visited.has(current)) {
      continue;
    }
    visited.add(current);
    paths.set(current, path);
    for (const target of runtimeEdges.get(current) ?? []) {
      if (!visited.has(target)) {
        queue.push([...path, target]);
      }
    }
  }
  return paths;
}

function isForbiddenExternal(specifier, config) {
  return config.forbiddenExternalImportPrefixes.some((prefix) =>
    specifier === prefix || specifier.startsWith(`${prefix}/`)
  );
}

export function analyzeProductionReachability(
  graph,
  productionRoots,
  config = PRODUCTION_BOUNDARY_CONFIG
) {
  const violations = [];
  const reachableModules = new Set();

  for (const root of sortedUnique(productionRoots)) {
    const paths = reachableFrom(root, graph.runtimeEdges);
    for (const [target, path] of paths) {
      reachableModules.add(target);
      const targetClass = classifyRepositoryPath(target, config);
      if (!isAdmissionDependencyAllowed(
        ADMISSION_CLASSES.PRODUCTION_ELIGIBLE,
        targetClass
      )) {
        violations.push({
          kind: 'FORBIDDEN_ADMISSION_CLASS',
          root,
          target,
          targetClass,
          path
        });
      }

      const source = graph.sourceTexts.get(target) ?? '';
      for (const marker of config.forbiddenProductionMarkers) {
        if (source.includes(marker)) {
          violations.push({
            kind: 'FORBIDDEN_PRODUCTION_MARKER',
            root,
            target,
            marker,
            path
          });
        }
      }

      for (const externalImport of graph.externalImports.get(target) ?? []) {
        if (externalImport.runtime && isForbiddenExternal(externalImport.specifier, config)) {
          violations.push({
            kind: 'FORBIDDEN_EXTERNAL_IMPORT',
            root,
            target,
            specifier: externalImport.specifier,
            path
          });
        }
      }

      for (const unresolvedImport of graph.unresolvedInternalImports.get(target) ?? []) {
        if (unresolvedImport.runtime) {
          violations.push({
            kind: 'UNRESOLVED_INTERNAL_IMPORT',
            root,
            target,
            specifier: unresolvedImport.specifier,
            path
          });
        }
      }
    }
  }

  const stableViolations = violations
    .filter((violation, index, values) => values.findIndex((candidate) =>
      JSON.stringify(candidate) === JSON.stringify(violation)
    ) === index)
    .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));

  return Object.freeze({
    productionRoots: Object.freeze(sortedUnique(productionRoots)),
    reachableModules: Object.freeze(sortedUnique([...reachableModules])),
    violations: Object.freeze(stableViolations)
  });
}

export function listClassifiedModules(graph, config = PRODUCTION_BOUNDARY_CONFIG) {
  const modules = {};
  for (const admissionClass of Object.values(ADMISSION_CLASSES)) {
    modules[admissionClass] = [];
  }
  for (const relativePath of graph.sourceTexts.keys()) {
    modules[classifyRepositoryPath(relativePath, config)].push(relativePath);
  }
  for (const values of Object.values(modules)) {
    values.sort((left, right) => left.localeCompare(right));
  }
  return modules;
}
