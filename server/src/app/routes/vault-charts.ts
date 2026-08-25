import type { Context, Hono } from 'hono';
import type {
  DeleteVaultChartApiResponse,
  GetVaultChartApiResponse,
  ListVaultChartsApiResponse,
  ChartResult,
  SaveVaultChartApiRequest,
  SaveVaultChartApiResponse,
  UpdateVaultChartMetadataApiRequest,
  UpdateVaultChartMetadataApiResponse,
  VaultApiErrorResponse,
  VaultChartRecord
} from '@natalnode/contracts';
import { requireAuthentication } from '../auth/index.js';
import type { ServerDependencies } from '../dependencies.js';
import {
  isMetadataUpdate,
  isSaveVaultChartApiRequest
} from '../validation/index.js';

const INVALID_REQUEST_RESPONSE: VaultApiErrorResponse = {
  error: {
    code: 'INVALID_REQUEST',
    message: 'Invalid Vault chart request.'
  }
};

const NOT_FOUND_RESPONSE: VaultApiErrorResponse = {
  error: {
    code: 'NOT_FOUND',
    message: 'Vault chart not found.'
  }
};

async function parseMetadataUpdate(context: Context): Promise<
  UpdateVaultChartMetadataApiRequest | Response
> {
  let payload: unknown;

  try {
    payload = await context.req.json();
  } catch (_error) {
    return context.json(INVALID_REQUEST_RESPONSE, 400);
  }

  return isMetadataUpdate(payload)
    ? payload
    : context.json(INVALID_REQUEST_RESPONSE, 400);
}

async function parseSaveVaultChartRequest(
  context: Context
): Promise<SaveVaultChartApiRequest | Response> {
  let payload: unknown;

  try {
    payload = await context.req.json();
  } catch (_error) {
    return context.json(INVALID_REQUEST_RESPONSE, 400);
  }

  return isSaveVaultChartApiRequest(payload)
    ? payload
    : context.json(INVALID_REQUEST_RESPONSE, 400);
}

export function registerVaultChartRoutes(app: Hono, dependencies: ServerDependencies): void {
  app.post(
    '/api/vault/charts',
    requireAuthentication(dependencies.authenticator),
    async (context) => {
      const request = await parseSaveVaultChartRequest(context);

      if (request instanceof Response) {
        return request;
      }

      const principal = context.get('authenticatedPrincipal');
      const userId = principal.userId;
      let canonicalChartResult: ChartResult;

      try {
        canonicalChartResult = await dependencies.engineClient.calculateChart(request.chart);
      } catch (_error) {
        return context.json(
          {
            error: {
              code: 'CALCULATION_UNAVAILABLE',
              message: 'Chart calculation is currently unavailable.'
            }
          } satisfies VaultApiErrorResponse,
          503
        );
      }

      const timestamp = dependencies.clock.now();
      const chart: VaultChartRecord = {
        chartId: dependencies.idGenerator.generate(),
        userId,
        displayName: request.displayName,
        category: request.category,
        tags: request.tags,
        favorite: request.favorite,
        normalizedChartRequest: request.chart,
        canonicalChartResult,
        engineVersion: canonicalChartResult.engineVersion,
        chartSchemaVersion: canonicalChartResult.schemaVersion,
        astronomyConfigurationId: canonicalChartResult.metadata.astronomyConfigurationId,
        provenanceEnvelopeId: canonicalChartResult.metadata.provenanceEnvelopeId,
        createdAt: timestamp,
        updatedAt: timestamp
      };

      await dependencies.persistence.vaultCharts.create(chart);

      const response: SaveVaultChartApiResponse = { chart };
      return context.json(response, 201);
    }
  );

  app.get(
    '/api/vault/charts',
    requireAuthentication(dependencies.authenticator),
    async (context) => {
      const principal = context.get('authenticatedPrincipal');
      const userId = principal.userId;
      const charts = await dependencies.persistence.vaultCharts.listForUser(userId);
      const response: ListVaultChartsApiResponse = { charts };

      return context.json(response);
    }
  );

  app.get(
    '/api/vault/charts/:chartId',
    requireAuthentication(dependencies.authenticator),
    async (context) => {
      const principal = context.get('authenticatedPrincipal');
      const userId = principal.userId;
      const chartId = context.req.param('chartId');
      const chart = await dependencies.persistence.vaultCharts.findById(userId, chartId);

      if (!chart) {
        return context.json(NOT_FOUND_RESPONSE, 404);
      }

      const response: GetVaultChartApiResponse = { chart };
      return context.json(response);
    }
  );

  app.patch(
    '/api/vault/charts/:chartId',
    requireAuthentication(dependencies.authenticator),
    async (context) => {
      const update = await parseMetadataUpdate(context);

      if (update instanceof Response) {
        return update;
      }

      const principal = context.get('authenticatedPrincipal');
      const userId = principal.userId;
      const chartId = context.req.param('chartId');
      const chart = await dependencies.persistence.vaultCharts.updateMetadata(
        userId,
        chartId,
        update
      );

      if (!chart) {
        return context.json(NOT_FOUND_RESPONSE, 404);
      }

      const response: UpdateVaultChartMetadataApiResponse = { chart };
      return context.json(response);
    }
  );

  app.delete(
    '/api/vault/charts/:chartId',
    requireAuthentication(dependencies.authenticator),
    async (context) => {
      const principal = context.get('authenticatedPrincipal');
      const userId = principal.userId;
      const chartId = context.req.param('chartId');
      const deleted = await dependencies.persistence.vaultCharts.deleteById(userId, chartId);

      if (!deleted) {
        return context.json(NOT_FOUND_RESPONSE, 404);
      }

      const response: DeleteVaultChartApiResponse = { deleted: true };
      return context.json(response);
    }
  );
}
