import type { Context, Hono } from 'hono';
import type {
  DeleteVaultChartApiResponse,
  GetVaultChartApiResponse,
  ListVaultChartsApiResponse,
  UpdateVaultChartMetadataApiRequest,
  UpdateVaultChartMetadataApiResponse,
  VaultApiErrorResponse,
  VaultChartCategory
} from '@natalnode/contracts';
import { requireAuthentication } from '../auth/index.js';
import type { ServerDependencies } from '../dependencies.js';

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

const VAULT_CHART_CATEGORIES: readonly VaultChartCategory[] = [
  'SELF',
  'PARTNER',
  'FAMILY',
  'FRIEND',
  'CLIENT'
];

const METADATA_UPDATE_KEYS = ['displayName', 'category', 'tags', 'favorite'] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isVaultChartCategory(value: unknown): value is VaultChartCategory {
  return VAULT_CHART_CATEGORIES.some((category) => category === value);
}

function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function hasOnlyMetadataUpdateKeys(value: Record<string, unknown>): boolean {
  return Object.keys(value).every((key) =>
    METADATA_UPDATE_KEYS.some((allowedKey) => allowedKey === key)
  );
}

function isMetadataUpdate(value: unknown): value is UpdateVaultChartMetadataApiRequest {
  if (!isRecord(value) || !hasOnlyMetadataUpdateKeys(value)) {
    return false;
  }

  return (
    (!('displayName' in value) || typeof value.displayName === 'string') &&
    (!('category' in value) || isVaultChartCategory(value.category)) &&
    (!('tags' in value) || isStringArray(value.tags)) &&
    (!('favorite' in value) || typeof value.favorite === 'boolean')
  );
}

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

export function registerVaultChartRoutes(app: Hono, dependencies: ServerDependencies): void {
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
