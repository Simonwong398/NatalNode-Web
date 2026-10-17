import { build } from 'esbuild';
import { createElement, Fragment } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const WEB_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const RENDERER_SOURCE = join(WEB_ROOT, 'src/core/chart/ChartRenderer.tsx');
const DISCLOSURE = 'ENGINEERING TEST DATA · NOT REAL ASTRONOMICAL OUTPUT · NOT PRODUCTION ADMITTED';

let rendererPromise;

async function loadChartRenderer() {
  if (rendererPromise) return rendererPromise;
  rendererPromise = (async () => {
    const outputRoot = join(WEB_ROOT, 'dist');
    mkdirSync(outputRoot, { recursive: true });
    const temporaryRoot = mkdtempSync(join(outputRoot, '.engine-result-v2-renderer-'));
    try {
      const outputDirectory = temporaryRoot;
      await build({
        absWorkingDir: WEB_ROOT,
        alias: { '@': join(WEB_ROOT, 'src') },
        bundle: true,
        entryPoints: {
          ChartRenderer: RENDERER_SOURCE,
          AstrologicalNotation: join(WEB_ROOT, 'src/features/chart-workspace/AstrologicalNotation.tsx')
        },
        external: ['react', 'react-dom'],
        format: 'esm',
        outdir: outputDirectory,
        outExtension: { '.js': '.mjs' },
        platform: 'node',
        target: 'node22'
      });
      const [chartRenderer, astrologicalNotation] = await Promise.all([
        import(pathToFileURL(join(outputDirectory, 'ChartRenderer.mjs')).href),
        import(pathToFileURL(join(outputDirectory, 'AstrologicalNotation.mjs')).href)
      ]);
      return {
        ChartRenderer: chartRenderer.default,
        AstrologicalNotation: astrologicalNotation.default
      };
    } finally {
      rmSync(temporaryRoot, { recursive: true, force: true });
    }
  })();
  return rendererPromise;
}

export async function renderChartInstrumentWithDisclosure(chart, { chartKind = 'natal' } = {}) {
  const { ChartRenderer } = await loadChartRenderer();
  return renderToStaticMarkup(createElement(
    Fragment,
    null,
    createElement('aside', { 'data-development-disclosure': 'synthetic-engine-result' }, DISCLOSURE),
    createElement(ChartRenderer, {
      chart,
      chartKind,
      presentationPolicy: {
        showAngles: true,
        showHouses: true,
        showHouseInterpretation: true,
        showAspects: true,
        mode: 'workspace'
      }
    })
  ));
}

export async function renderAstrologicalNotationWithDisclosure(chart) {
  const { AstrologicalNotation } = await loadChartRenderer();
  return renderToStaticMarkup(createElement(
    Fragment,
    null,
    createElement('aside', { 'data-development-disclosure': 'synthetic-engine-result' }, DISCLOSURE),
    createElement(AstrologicalNotation, {
      chart,
      presentationPolicy: {
        showAngles: true,
        showHouses: true,
        showHouseInterpretation: true,
        showAspects: true,
        mode: 'workspace'
      }
    })
  ));
}
