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
  isChartNoteContentRequest,
  normalizeChartNoteContent
} from '../validation/index.js';

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
  let payload: unknown;

  try {
    payload = await context.req.json();
  } catch (_error) {
    return createProblemDetailsContextResponse(context, {
      code: 'INVALID_REQUEST'
    });
  }

  return isChartNoteContentRequest(payload)
    ? payload
    : createProblemDetailsContextResponse(context, {
        code: 'INVALID_REQUEST'
      });
}

export function registerVaultNoteRoutes(app: Hono, dependencies: ServerDependencies): void {
  app.get(
    '/api/vault/charts/:chartId/notes',
    requireAuthentication(dependencies.authenticator),
    async (context) => {
      const chartId = context.req.param('chartId');
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
    async (context) => {
      const chartId = context.req.param('chartId');
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
    async (context) => {
      const chartId = context.req.param('chartId');
      const noteId = context.req.param('noteId');
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
    async (context) => {
      const chartId = context.req.param('chartId');
      const noteId = context.req.param('noteId');
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
