import type { Context, Hono } from 'hono';
import type {
  DeleteVaultChartApiResponse,
  DuplicateVaultChartApiResponse,
  GetVaultChartApiResponse,
  ListVaultChartsApiResponse,
  ChartResult,
  SaveVaultChartApiRequest,
  SaveVaultChartApiResponse,
  UpdateVaultChartMetadataApiRequest,
  UpdateVaultChartMetadataApiResponse,
  VaultChartRecord
} from '@natalnode/contracts';
import { requireAuthentication } from '../auth/index.js';
import type { ServerDependencies } from '../dependencies.js';
import { createProblemDetailsContextResponse } from '../problem-details/context-response.js';
import {
  enforceVaultMutationAccountRateLimit,
  type RateLimitAuthority
} from '../security/api-rate-limiting.js';
import { readVaultRouteIdentifier } from './vault-route-helpers.js';
import {
  isMetadataUpdate,
  isSaveVaultChartApiRequest,
  normalizeVaultChartDisplayName,
  normalizeVaultChartTags,
  encodeVaultChartListCursor,
  parseVaultChartListQuery,
  readBoundedJson
} from '../validation/index.js';
import {
  VAULT_FREE_RECORD_LIMIT,
  assertEligibleVaultRecordInput,
  createVaultRecord,
  isDevelopmentVaultFixtureResult,
  VaultRecordEligibilityError
} from '../../vault/vault-record-domain.js';
import type { VaultCapacity } from '@natalnode/contracts';

const VAULT_CHART_REQUEST_MAXIMUM_BYTES = 16 * 1024;

function vaultCapacity(used: number): VaultCapacity {
  return {
    used,
    limit: VAULT_FREE_RECORD_LIMIT,
    tier: 'FREE',
    proExpansionAvailable: false
  };
}

async function readVaultCapacity(
  repository: ServerDependencies['persistence']['vaultCharts'],
  userId: string
): Promise<VaultCapacity | undefined> {
  if (repository.countForUser === undefined) {
    return undefined;
  }

  return vaultCapacity(await repository.countForUser(userId));
}

async function parseMetadataUpdate(context: Context): Promise<
  UpdateVaultChartMetadataApiRequest | Response
> {
  const parsed = await readBoundedJson(
    context.req.raw,
    VAULT_CHART_REQUEST_MAXIMUM_BYTES
  );

  if (parsed.outcome === 'unsupported-media-type') {
    return createProblemDetailsContextResponse(context, {
      code: 'UNSUPPORTED_MEDIA_TYPE'
    });
  }

  if (parsed.outcome === 'too-large') {
    return createProblemDetailsContextResponse(context, {
      code: 'PAYLOAD_TOO_LARGE'
    });
  }

  if (parsed.outcome === 'invalid') {
    return createProblemDetailsContextResponse(context, {
      code: 'INVALID_REQUEST'
    });
  }

  return isMetadataUpdate(parsed.value)
    ? parsed.value
    : createProblemDetailsContextResponse(context, {
        code: 'INVALID_REQUEST'
      });
}

async function parseSaveVaultChartRequest(
  context: Context
): Promise<SaveVaultChartApiRequest | Response> {
  const parsed = await readBoundedJson(
    context.req.raw,
    VAULT_CHART_REQUEST_MAXIMUM_BYTES
  );

  if (parsed.outcome === 'unsupported-media-type') {
    return createProblemDetailsContextResponse(context, {
      code: 'UNSUPPORTED_MEDIA_TYPE'
    });
  }

  if (parsed.outcome === 'too-large') {
    return createProblemDetailsContextResponse(context, {
      code: 'PAYLOAD_TOO_LARGE'
    });
  }

  if (parsed.outcome === 'invalid') {
    return createProblemDetailsContextResponse(context, {
      code: 'INVALID_REQUEST'
    });
  }

  return isSaveVaultChartApiRequest(parsed.value)
    ? parsed.value
    : createProblemDetailsContextResponse(context, {
        code: 'INVALID_REQUEST'
      });
}

export function registerVaultChartRoutes(
  app: Hono,
  dependencies: ServerDependencies,
  rateLimiter: RateLimitAuthority
): void {
  app.post(
    '/api/vault/charts',
    requireAuthentication(dependencies.authenticator),
    enforceVaultMutationAccountRateLimit(rateLimiter),
    async (context) => {
      const request = await parseSaveVaultChartRequest(context);

      if (request instanceof Response) {
        return request;
      }

      const principal = context.get('authenticatedPrincipal');
      const userId = principal.userId;
      let canonicalChartResult: ChartResult | null = null;
      const saveMode = request.saveMode ?? 'CHART_RESULT_AVAILABLE';
      const allowDevelopmentFixtureRequest =
        request.saveMode === undefined &&
        dependencies.operationalConfig?.runtimeMode !== 'production';

      try {
        /* Reject malformed or non-authoritative input before invoking the
         * calculation boundary. Development's legacy fixture path is the
         * only exception, and it is still classified explicitly below. */
        assertEligibleVaultRecordInput(
          request.chart,
          dependencies.locationResolutionService,
          { allowDevelopmentFixture: allowDevelopmentFixtureRequest }
        );
      } catch (error) {
        if (error instanceof VaultRecordEligibilityError) {
          return createProblemDetailsContextResponse(context, {
            code:
              error.code === 'INVALID_INPUT'
                ? 'INVALID_REQUEST'
                : 'INVALID_STATE'
          });
        }

        throw error;
      }

      if (saveMode === 'CHART_RESULT_AVAILABLE') {
        try {
          const outcome =
            await dependencies.chartCalculator.calculateChartWithOutcome(
              request.chart
            );
          context.set('calculationObservability', outcome.observability);
          canonicalChartResult = outcome.chart;
        } catch (_error) {
          return createProblemDetailsContextResponse(context, {
            code: 'CALCULATION_UNAVAILABLE'
          });
        }
      }

      let chart: VaultChartRecord;

      try {
        chart = createVaultRecord({
          userId,
          displayName: normalizeVaultChartDisplayName(request.displayName),
          category: request.category,
          tags: normalizeVaultChartTags(request.tags),
          favorite: request.favorite,
          chart: request.chart,
          idGenerator: dependencies.idGenerator,
          clock: dependencies.clock,
          locationResolutionService: dependencies.locationResolutionService,
          saveMode,
          canonicalChartResult,
          allowDevelopmentFixtureSnapshot:
            request.saveMode === undefined &&
            dependencies.operationalConfig?.runtimeMode !== 'production' &&
            canonicalChartResult !== null &&
            isDevelopmentVaultFixtureResult(canonicalChartResult)
        });
      } catch (error) {
        if (error instanceof VaultRecordEligibilityError) {
          return createProblemDetailsContextResponse(context, {
            code:
              error.code === 'INVALID_INPUT'
                ? 'INVALID_REQUEST'
                : 'INVALID_STATE'
          });
        }

        throw error;
      }

      const repository = dependencies.persistence.vaultCharts;
      const creation =
        repository.createWithCapacity === undefined
          ? (await repository.create(chart), 'created' as const)
          : await repository.createWithCapacity(chart, VAULT_FREE_RECORD_LIMIT);

      if (creation === 'capacity-reached') {
        return createProblemDetailsContextResponse(context, {
          code: 'CAPACITY_REACHED'
        });
      }

      const capacity = await readVaultCapacity(repository, userId);
      const response: SaveVaultChartApiResponse = {
        chart,
        ...(capacity === undefined ? {} : { capacity })
      };
      return context.json(response, 201);
    }
  );

  app.get(
    '/api/vault/charts',
    requireAuthentication(dependencies.authenticator),
    async (context) => {
      const principal = context.get('authenticatedPrincipal');
      const userId = principal.userId;
      const query = parseVaultChartListQuery(
        context.req.query('limit'),
        context.req.query('cursor'),
        userId
      );

      if (query === null) {
        return createProblemDetailsContextResponse(context, {
          code: 'INVALID_REQUEST'
        });
      }

      const repository = dependencies.persistence.vaultCharts;
      const page = repository.listPageForUser === undefined
        ? {
            charts: (await repository.listForUser(userId)).slice(0, query.limit),
            nextCursor: null
          }
        : await repository.listPageForUser(userId, query);
      const lastCursor = page.nextCursor;
      const capacity = await readVaultCapacity(repository, userId);
      const response: ListVaultChartsApiResponse = {
        charts: page.charts,
        nextCursor: lastCursor === null
          ? null
          : encodeVaultChartListCursor(userId, lastCursor),
        ...(capacity === undefined ? {} : { capacity })
      };

      return context.json(response);
    }
  );

  app.get(
    '/api/vault/charts/:chartId',
    requireAuthentication(dependencies.authenticator),
    async (context) => {
      const principal = context.get('authenticatedPrincipal');
      const userId = principal.userId;
      const chartId = readVaultRouteIdentifier(context, 'chartId');

      if (chartId instanceof Response) {
        return chartId;
      }

      const chart = await dependencies.persistence.vaultCharts.findById(userId, chartId);

      if (!chart) {
        return createProblemDetailsContextResponse(context, {
          code: 'NOT_FOUND'
        });
      }

      const response: GetVaultChartApiResponse = { chart };
      return context.json(response);
    }
  );

  app.post(
    '/api/vault/charts/:chartId/duplicate',
    requireAuthentication(dependencies.authenticator),
    enforceVaultMutationAccountRateLimit(rateLimiter),
    async (context) => {
      const principal = context.get('authenticatedPrincipal');
      const userId = principal.userId;
      const sourceChartId = readVaultRouteIdentifier(context, 'chartId');

      if (sourceChartId instanceof Response) {
        return sourceChartId;
      }

      const sourceChart = await dependencies.persistence.vaultCharts.findById(
        userId,
        sourceChartId
      );

      if (!sourceChart) {
        return createProblemDetailsContextResponse(context, {
          code: 'NOT_FOUND'
        });
      }

      let canonicalChartResult: ChartResult;

      try {
        const outcome =
          await dependencies.chartCalculator.calculateChartWithOutcome(
            sourceChart.normalizedChartRequest
          );
        context.set('calculationObservability', outcome.observability);
        canonicalChartResult = outcome.chart;
      } catch (_error) {
        return createProblemDetailsContextResponse(context, {
          code: 'CALCULATION_UNAVAILABLE'
        });
      }

      let duplicate: VaultChartRecord;

      try {
        duplicate = createVaultRecord({
          userId,
          displayName: sourceChart.displayName,
          category: sourceChart.category,
          tags: sourceChart.tags,
          favorite: sourceChart.favorite,
          chart: sourceChart.normalizedChartRequest,
          idGenerator: dependencies.idGenerator,
          clock: dependencies.clock,
          locationResolutionService: dependencies.locationResolutionService,
          saveMode: 'CHART_RESULT_AVAILABLE',
          canonicalChartResult,
          allowDevelopmentFixtureSnapshot:
            dependencies.operationalConfig?.runtimeMode !== 'production' &&
            isDevelopmentVaultFixtureResult(canonicalChartResult)
        });
      } catch (error) {
        if (error instanceof VaultRecordEligibilityError) {
          return createProblemDetailsContextResponse(context, {
            code:
              error.code === 'INVALID_INPUT'
                ? 'INVALID_REQUEST'
                : 'INVALID_STATE'
          });
        }

        throw error;
      }

      const repository = dependencies.persistence.vaultCharts;
      const creation =
        repository.createWithCapacity === undefined
          ? (await repository.create(duplicate), 'created' as const)
          : await repository.createWithCapacity(
              duplicate,
              VAULT_FREE_RECORD_LIMIT
            );

      if (creation === 'capacity-reached') {
        return createProblemDetailsContextResponse(context, {
          code: 'CAPACITY_REACHED'
        });
      }

      const response: DuplicateVaultChartApiResponse = { chart: duplicate };
      return context.json(response, 201);
    }
  );

  app.patch(
    '/api/vault/charts/:chartId',
    requireAuthentication(dependencies.authenticator),
    enforceVaultMutationAccountRateLimit(rateLimiter),
    async (context) => {
      const update = await parseMetadataUpdate(context);

      if (update instanceof Response) {
        return update;
      }

      const principal = context.get('authenticatedPrincipal');
      const userId = principal.userId;
      const chartId = readVaultRouteIdentifier(context, 'chartId');

      if (chartId instanceof Response) {
        return chartId;
      }

      const normalizedUpdate: UpdateVaultChartMetadataApiRequest = {
        ...update,
        ...(update.displayName === undefined
          ? {}
          : { displayName: normalizeVaultChartDisplayName(update.displayName) }),
        ...(update.tags === undefined
          ? {}
          : { tags: normalizeVaultChartTags(update.tags) })
      };
      const chart = await dependencies.persistence.vaultCharts.updateMetadata(
        userId,
        chartId,
        normalizedUpdate
      );

      if (!chart) {
        return createProblemDetailsContextResponse(context, {
          code: 'NOT_FOUND'
        });
      }

      const response: UpdateVaultChartMetadataApiResponse = { chart };
      return context.json(response);
    }
  );

  app.delete(
    '/api/vault/charts/:chartId',
    requireAuthentication(dependencies.authenticator),
    enforceVaultMutationAccountRateLimit(rateLimiter),
    async (context) => {
      const principal = context.get('authenticatedPrincipal');
      const userId = principal.userId;
      const chartId = readVaultRouteIdentifier(context, 'chartId');

      if (chartId instanceof Response) {
        return chartId;
      }

      const deleted = await dependencies.persistence.vaultCharts.deleteById(userId, chartId);

      if (!deleted) {
        return createProblemDetailsContextResponse(context, {
          code: 'NOT_FOUND'
        });
      }

      const response: DeleteVaultChartApiResponse = { deleted: true };
      return context.json(response);
    }
  );
}
