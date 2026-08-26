import { readFile, stat } from 'node:fs/promises';
import {
  createServer,
  request as createProxyRequest,
  type IncomingMessage,
  type IncomingHttpHeaders,
  type OutgoingHttpHeaders,
  type Server,
  type ServerResponse
} from 'node:http';
import { isIP } from 'node:net';
import { extname, resolve, sep } from 'node:path';
import { TRUSTED_EDGE_CLIENT_IP_HEADER } from '../app/security/trusted-edge-client-identity.js';

export interface LocalPublicEdgeConfig {
  readonly publicPort: number;
  readonly apiHostname: string;
  readonly apiPort: number;
  readonly staticDirectory: string;
}

export interface LocalPublicEdgeRuntime {
  close(): Promise<void>;
}

const CONTENT_TYPES: Readonly<Record<string, string>> = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8'
};

function writePlainResponse(
  response: ServerResponse,
  statusCode: number,
  body: string
): void {
  if (response.headersSent) {
    response.destroy();
    return;
  }

  response.writeHead(statusCode, {
    'Cache-Control': 'no-store',
    'Content-Type': 'text/plain; charset=utf-8'
  });
  response.end(body);
}

function parseRequestUrl(requestUrl: string | undefined): URL | undefined {
  try {
    return new URL(requestUrl ?? '/', 'http://localhost');
  } catch {
    return undefined;
  }
}

function isApiPath(pathname: string): boolean {
  return pathname === '/api' || pathname.startsWith('/api/');
}

function proxyHostname(hostname: string): string {
  if (hostname === '0.0.0.0') {
    return '127.0.0.1';
  }

  if (hostname === '::' || hostname === '[::]') {
    return '::1';
  }

  if (hostname.startsWith('[') && hostname.endsWith(']')) {
    return hostname.slice(1, -1);
  }

  return hostname;
}

function formatHostHeader(hostname: string, port: number): string {
  const formattedHostname = hostname.includes(':')
    ? `[${hostname}]`
    : hostname;

  return `${formattedHostname}:${port}`;
}

export function createLocalApiProxyHeaders(
  incomingHeaders: IncomingHttpHeaders,
  remoteAddress: string | undefined,
  apiHostname: string,
  apiPort: number
): OutgoingHttpHeaders {
  const headers: OutgoingHttpHeaders = {};

  for (const [name, value] of Object.entries(incomingHeaders)) {
    if (name.toLowerCase() !== TRUSTED_EDGE_CLIENT_IP_HEADER.toLowerCase()) {
      headers[name] = value;
    }
  }

  headers.host = formatHostHeader(apiHostname, apiPort);

  if (remoteAddress !== undefined && isIP(remoteAddress) !== 0) {
    headers[TRUSTED_EDGE_CLIENT_IP_HEADER] = remoteAddress;
  }

  return headers;
}

function proxyApiRequest(
  request: IncomingMessage,
  response: ServerResponse,
  config: LocalPublicEdgeConfig,
  targetPath: string
): void {
  const hostname = proxyHostname(config.apiHostname);
  const proxyRequest = createProxyRequest(
    {
      hostname,
      port: config.apiPort,
      method: request.method,
      path: targetPath,
      headers: createLocalApiProxyHeaders(
        request.headers,
        request.socket.remoteAddress,
        hostname,
        config.apiPort
      )
    },
    (proxyResponse) => {
      response.writeHead(
        proxyResponse.statusCode ?? 502,
        proxyResponse.headers
      );
      proxyResponse.once('error', () => response.destroy());
      proxyResponse.pipe(response);
    }
  );

  proxyRequest.once('error', () => {
    writePlainResponse(response, 502, 'Local API gateway error.');
  });
  request.once('aborted', () => proxyRequest.destroy());
  request.pipe(proxyRequest);
}

function resolveStaticFile(
  staticDirectory: string,
  pathname: string
): string | undefined {
  let decodedPathname: string;

  try {
    decodedPathname = decodeURIComponent(pathname);
  } catch {
    return undefined;
  }

  if (decodedPathname.includes('\0') || decodedPathname.includes('\\')) {
    return undefined;
  }

  const relativePath = decodedPathname.replace(/^\/+/, '');
  const filePath =
    decodedPathname.endsWith('/') || extname(relativePath).length === 0
      ? resolve(staticDirectory, relativePath, 'index.html')
      : resolve(staticDirectory, relativePath);
  const resolvedStaticDirectory = resolve(staticDirectory);

  if (
    filePath !== resolvedStaticDirectory &&
    !filePath.startsWith(`${resolvedStaticDirectory}${sep}`)
  ) {
    return undefined;
  }

  return filePath;
}

async function serveStaticRequest(
  request: IncomingMessage,
  response: ServerResponse,
  config: LocalPublicEdgeConfig,
  pathname: string
): Promise<void> {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    writePlainResponse(response, 405, 'Method not allowed.');
    return;
  }

  const filePath = resolveStaticFile(config.staticDirectory, pathname);
  if (filePath === undefined) {
    writePlainResponse(response, 400, 'Invalid request path.');
    return;
  }

  let file: Buffer;

  try {
    file = await readFile(filePath);
  } catch (error) {
    const errorCode =
      error !== null && typeof error === 'object' && 'code' in error
        ? error.code
        : undefined;

    if (
      errorCode === 'ENOENT' ||
      errorCode === 'EISDIR' ||
      errorCode === 'ENOTDIR'
    ) {
      writePlainResponse(response, 404, 'Not found.');
      return;
    }

    writePlainResponse(response, 500, 'Local static server error.');
    return;
  }

  response.writeHead(200, {
    'Cache-Control': 'no-cache',
    'Content-Length': file.byteLength,
    'Content-Type':
      CONTENT_TYPES[extname(filePath).toLowerCase()] ??
      'application/octet-stream'
  });
  response.end(request.method === 'HEAD' ? undefined : file);
}

function waitForListening(server: Server, port: number): Promise<void> {
  return new Promise<void>((resolvePromise, rejectPromise) => {
    const cleanup = (): void => {
      server.off('listening', onListening);
      server.off('error', onError);
    };
    const onListening = (): void => {
      cleanup();
      resolvePromise();
    };
    const onError = (error: Error): void => {
      cleanup();
      rejectPromise(error);
    };

    server.once('listening', onListening);
    server.once('error', onError);

    try {
      server.listen(port, 'localhost');
    } catch (error) {
      cleanup();
      rejectPromise(error);
    }
  });
}

function closeServer(server: Server): Promise<void> {
  return new Promise<void>((resolvePromise, rejectPromise) => {
    server.close((error?: Error) => {
      if (error !== undefined) {
        rejectPromise(error);
        return;
      }

      resolvePromise();
    });
  });
}

export async function startLocalPublicEdge(
  config: LocalPublicEdgeConfig
): Promise<LocalPublicEdgeRuntime> {
  const staticDirectoryStatus = await stat(config.staticDirectory);
  if (!staticDirectoryStatus.isDirectory()) {
    throw new Error('Astro static build is unavailable.');
  }

  const server = createServer((request, response) => {
    const requestUrl = parseRequestUrl(request.url);
    if (requestUrl === undefined) {
      writePlainResponse(response, 400, 'Invalid request URL.');
      return;
    }

    if (isApiPath(requestUrl.pathname)) {
      proxyApiRequest(
        request,
        response,
        config,
        `${requestUrl.pathname}${requestUrl.search}`
      );
      return;
    }

    void serveStaticRequest(
      request,
      response,
      config,
      requestUrl.pathname
    ).catch(() => {
      writePlainResponse(response, 500, 'Local static server error.');
    });
  });

  await waitForListening(server, config.publicPort);

  let closePromise: Promise<void> | undefined;

  return {
    close(): Promise<void> {
      if (closePromise === undefined) {
        closePromise = closeServer(server);
      }

      return closePromise;
    }
  };
}
