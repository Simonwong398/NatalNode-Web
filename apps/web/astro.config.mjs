import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import {
  createProductionBuildArtifactBoundary
} from '../../scripts/architecture/production-route-boundaries.config.mjs';

export default defineConfig({
  integrations: [react(), createProductionBuildArtifactBoundary()],
  vite: {
    plugins: [tailwindcss()]
  }
});
