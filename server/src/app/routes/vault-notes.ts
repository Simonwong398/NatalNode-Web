import type { Context, Hono } from 'hono';
import type {
  ChartNoteRecord,
  CreateChartNoteApiRequest,
  CreateChartNoteApiResponse,
  DeleteChartNoteApiResponse,
  ListChartNotesApiResponse,
  UpdateChartNoteApiRequest,
  UpdateChartNoteApiResponse
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
  isChartNoteContentRequest,
  normalizeChartNoteContent,
  readBoundedJson
} from '../validation/index.js';

const VAULT_NOTE_REQUEST_MAXIMUM_BYTES = 16 * 1024;

async function findOwnedChartUserId(
  context: Context,
  dependencies: ServerDependencies,
  chartId: string
): Promise<string | null> {
  const principal = context.get('authenticatedPrincipal');
  const userId = principal.userId;
  const chart = await dependencies.persistence.vaultCharts.findById(userId, chartId);

  return chart ? userId : null;
}

async function parseNoteContent(
  context: Context
): Promise<CreateChartNoteApiRequest | Response> {
  const parsed = await readBoundedJson(
    context.req.raw,
    VAULT_NOTE_REQUEST_MAXIMUM_BYTES
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

  return isChartNoteContentRequest(parsed.value)
    ? parsed.value
    : createProblemDetailsContextResponse(context, {
        code: 'INVALID_REQUEST'
      });
}

export function registerVaultNoteRoutes(
  app: Hono,
  dependencies: ServerDependencies,
  rateLimiter: RateLimitAuthority
): void {
  app.get(
    '/api/vault/charts/:chartId/notes',
    requireAuthentication(dependencies.authenticator),
    async (context) => {
      const chartId = readVaultRouteIdentifier(context, 'chartId');

      if (chartId instanceof Response) {
        return chartId;
      }

      const userId = await findOwnedChartUserId(context, dependencies, chartId);

      if (userId === null) {
        return createProblemDetailsContextResponse(context, {
          code: 'NOT_FOUND'
        });
      }

      const notes = await dependencies.persistence.chartNotes.listForChart(userId, chartId);
      const response: ListChartNotesApiResponse = { notes };

      return context.json(response);
    }
  );

  app.post(
    '/api/vault/charts/:chartId/notes',
    requireAuthentication(dependencies.authenticator),
    enforceVaultMutationAccountRateLimit(rateLimiter),
    async (context) => {
      const chartId = readVaultRouteIdentifier(context, 'chartId');

      if (chartId instanceof Response) {
        return chartId;
      }

      const userId = await findOwnedChartUserId(context, dependencies, chartId);

      if (userId === null) {
        return createProblemDetailsContextResponse(context, {
          code: 'NOT_FOUND'
        });
      }

      const request = await parseNoteContent(context);

      if (request instanceof Response) {
        return request;
      }

      const timestamp = dependencies.clock.now();
      const note: ChartNoteRecord = {
        noteId: dependencies.idGenerator.generate(),
        chartId,
        userId,
        content: normalizeChartNoteContent(request.content),
        createdAt: timestamp,
        updatedAt: timestamp
      };

      await dependencies.persistence.chartNotes.create(note);

      const response: CreateChartNoteApiResponse = { note };
      return context.json(response, 201);
    }
  );

  app.patch(
    '/api/vault/charts/:chartId/notes/:noteId',
    requireAuthentication(dependencies.authenticator),
    enforceVaultMutationAccountRateLimit(rateLimiter),
    async (context) => {
      const chartId = readVaultRouteIdentifier(context, 'chartId');

      if (chartId instanceof Response) {
        return chartId;
      }

      const noteId = readVaultRouteIdentifier(context, 'noteId');

      if (noteId instanceof Response) {
        return noteId;
      }

      const userId = await findOwnedChartUserId(context, dependencies, chartId);

      if (userId === null) {
        return createProblemDetailsContextResponse(context, {
          code: 'NOT_FOUND'
        });
      }

      const request = await parseNoteContent(context);

      if (request instanceof Response) {
        return request;
      }

      const update: UpdateChartNoteApiRequest = {
        content: normalizeChartNoteContent(request.content)
      };
      const note = await dependencies.persistence.chartNotes.updateContent(
        userId,
        chartId,
        noteId,
        update
      );

      if (!note) {
        return createProblemDetailsContextResponse(context, {
          code: 'NOT_FOUND'
        });
      }

      const response: UpdateChartNoteApiResponse = { note };
      return context.json(response);
    }
  );

  app.delete(
    '/api/vault/charts/:chartId/notes/:noteId',
    requireAuthentication(dependencies.authenticator),
    enforceVaultMutationAccountRateLimit(rateLimiter),
    async (context) => {
      const chartId = readVaultRouteIdentifier(context, 'chartId');

      if (chartId instanceof Response) {
        return chartId;
      }

      const noteId = readVaultRouteIdentifier(context, 'noteId');

      if (noteId instanceof Response) {
        return noteId;
      }

      const userId = await findOwnedChartUserId(context, dependencies, chartId);

      if (userId === null) {
        return createProblemDetailsContextResponse(context, {
          code: 'NOT_FOUND'
        });
      }

      const deleted = await dependencies.persistence.chartNotes.deleteById(
        userId,
        chartId,
        noteId
      );

      if (!deleted) {
        return createProblemDetailsContextResponse(context, {
          code: 'NOT_FOUND'
        });
      }

      const response: DeleteChartNoteApiResponse = { deleted: true };
      return context.json(response);
    }
  );
}
