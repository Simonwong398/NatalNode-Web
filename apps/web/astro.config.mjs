import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import {
  createProductionBuildArtifactBoundary
} from '../../scripts/architecture/production-route-boundaries.config.mjs';

const localChartBffTarget =
  process.env.NATALNODE_LOCAL_CHART_WORKFLOW === 'true'
    ? process.env.NATALNODE_LOCAL_CHART_BFF_URL
    : undefined;

export default defineConfig({
  integrations: [react(), createProductionBuildArtifactBoundary()],
  vite: {
    plugins: [tailwindcss()],
    ...(localChartBffTarget === undefined ? {} : {
      server: {
        host: '127.0.0.1',
        proxy: {
          '/api/location': { target: localChartBffTarget, changeOrigin: true },
          '/api/dev/chart': { target: localChartBffTarget, changeOrigin: true }
        }
      }
    })
  }
});
