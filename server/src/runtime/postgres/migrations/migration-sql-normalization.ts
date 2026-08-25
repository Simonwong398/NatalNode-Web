import { PostgresMigrationError } from './postgres-migration-error.js';

interface SemicolonScan {
  readonly previousSemicolon: number | undefined;
  readonly lastSemicolon: number | undefined;
}

interface KeywordToken {
  readonly end: number;
  readonly value: string;
}

function isWhitespace(character: string | undefined): boolean {
  return character !== undefined && /\s/.test(character);
}

function isIdentifierCharacter(character: string | undefined): boolean {
  return character !== undefined && /[A-Za-z0-9_$]/.test(character);
}

function skipBlockComment(sql: string, start: number): number {
  let cursor = start + 2;
  let depth = 1;

  while (cursor < sql.length) {
    if (sql.startsWith('/*', cursor)) {
      depth += 1;
      cursor += 2;
      continue;
    }

    if (sql.startsWith('*/', cursor)) {
      depth -= 1;
      cursor += 2;
      if (depth === 0) {
        return cursor;
      }
      continue;
    }

    cursor += 1;
  }

  throw new PostgresMigrationError('Unterminated SQL block comment.');
}

function skipLineComment(sql: string, start: number): number {
  let cursor = start + 2;
  while (cursor < sql.length && sql[cursor] !== '\n') {
    cursor += 1;
  }
  return cursor;
}

function skipSqlTrivia(sql: string, start: number): number {
  let cursor = start;

  while (cursor < sql.length) {
    if (isWhitespace(sql[cursor])) {
      cursor += 1;
      continue;
    }

    if (sql.startsWith('--', cursor)) {
      cursor = skipLineComment(sql, cursor);
      continue;
    }

    if (sql.startsWith('/*', cursor)) {
      cursor = skipBlockComment(sql, cursor);
      continue;
    }

    break;
  }

  return cursor;
}

function skipQuotedLiteral(sql: string, start: number): number {
  const quote = sql[start];
  let cursor = start + 1;

  while (cursor < sql.length) {
    if (sql[cursor] === '\\') {
      cursor += 2;
      continue;
    }

    if (sql[cursor] === quote) {
      if (sql[cursor + 1] === quote) {
        cursor += 2;
        continue;
      }
      return cursor + 1;
    }

    cursor += 1;
  }

  throw new PostgresMigrationError('Unterminated SQL quoted literal.');
}

function readDollarQuoteDelimiter(sql: string, start: number): string | undefined {
  if (sql[start] !== '$') {
    return undefined;
  }

  if (sql[start + 1] === '$') {
    return '$$';
  }

  if (!/[A-Za-z_]/.test(sql[start + 1] ?? '')) {
    return undefined;
  }

  let cursor = start + 2;
  while (isIdentifierCharacter(sql[cursor])) {
    cursor += 1;
  }

  if (sql[cursor] !== '$') {
    return undefined;
  }

  return sql.slice(start, cursor + 1);
}

function skipDollarQuotedLiteral(sql: string, start: number, delimiter: string): number {
  const closingDelimiter = sql.indexOf(delimiter, start + delimiter.length);
  if (closingDelimiter === -1) {
    throw new PostgresMigrationError('Unterminated SQL dollar-quoted literal.');
  }
  return closingDelimiter + delimiter.length;
}

function readKeywordAt(sql: string, start: number): KeywordToken | undefined {
  if (!/[A-Za-z_]/.test(sql[start] ?? '')) {
    return undefined;
  }

  let cursor = start + 1;
  while (isIdentifierCharacter(sql[cursor])) {
    cursor += 1;
  }

  return {
    end: cursor,
    value: sql.slice(start, cursor).toUpperCase()
  };
}

function findNextTopLevelSemicolon(sql: string, start: number): number | undefined {
  let cursor = start;

  while (cursor < sql.length) {
    if (isWhitespace(sql[cursor])) {
      cursor += 1;
      continue;
    }

    if (sql.startsWith('--', cursor)) {
      cursor = skipLineComment(sql, cursor);
      continue;
    }

    if (sql.startsWith('/*', cursor)) {
      cursor = skipBlockComment(sql, cursor);
      continue;
    }

    if (sql[cursor] === "'" || sql[cursor] === '"') {
      cursor = skipQuotedLiteral(sql, cursor);
      continue;
    }

    const dollarQuoteDelimiter = readDollarQuoteDelimiter(sql, cursor);
    if (dollarQuoteDelimiter !== undefined) {
      cursor = skipDollarQuotedLiteral(sql, cursor, dollarQuoteDelimiter);
      continue;
    }

    if (sql[cursor] === ';') {
      return cursor;
    }

    cursor += 1;
  }

  return undefined;
}

function scanLastTopLevelSemicolons(sql: string): SemicolonScan {
  let cursor = 0;
  let previousSemicolon: number | undefined;
  let lastSemicolon: number | undefined;

  while (true) {
    const semicolon = findNextTopLevelSemicolon(sql, cursor);
    if (semicolon === undefined) {
      return { previousSemicolon, lastSemicolon };
    }

    previousSemicolon = lastSemicolon;
    lastSemicolon = semicolon;
    cursor = semicolon + 1;
  }
}

function isBoundaryStatement(
  sql: string,
  start: number,
  keyword: string,
  semicolon: number | undefined
): boolean {
  if (semicolon === undefined) {
    return false;
  }

  const token = readKeywordAt(sql, start);
  if (token === undefined || token.value !== keyword) {
    return false;
  }

  return skipSqlTrivia(sql, token.end) === semicolon;
}

function hasActualSql(sql: string): boolean {
  let cursor = skipSqlTrivia(sql, 0);

  while (cursor < sql.length) {
    if (sql[cursor] === ';') {
      cursor = skipSqlTrivia(sql, cursor + 1);
      continue;
    }

    return true;
  }

  return false;
}

function transactionControlAt(
  sql: string,
  start: number,
  token: KeywordToken
): string | undefined {
  switch (token.value) {
    case 'BEGIN':
    case 'COMMIT':
    case 'END':
    case 'ROLLBACK':
    case 'ABORT':
    case 'SAVEPOINT':
    case 'RELEASE':
      return token.value;
    case 'START':
    case 'SET':
    case 'PREPARE': {
      const nextToken = readKeywordAt(sql, skipSqlTrivia(sql, token.end));
      if (
        (token.value === 'START' && nextToken?.value === 'TRANSACTION') ||
        (token.value === 'SET' && nextToken?.value === 'TRANSACTION') ||
        (token.value === 'PREPARE' && nextToken?.value === 'TRANSACTION')
      ) {
        return `${token.value} TRANSACTION`;
      }
      return undefined;
    }
    default:
      return undefined;
  }
}

function findTopLevelTransactionControl(sql: string): string | undefined {
  let cursor = skipSqlTrivia(sql, 0);

  while (cursor < sql.length) {
    while (sql[cursor] === ';') {
      cursor = skipSqlTrivia(sql, cursor + 1);
    }

    if (cursor >= sql.length) {
      return undefined;
    }

    const token = readKeywordAt(sql, cursor);
    if (token !== undefined) {
      const control = transactionControlAt(sql, cursor, token);
      if (control !== undefined) {
        return control;
      }
    }

    const semicolon = findNextTopLevelSemicolon(sql, cursor);
    if (semicolon === undefined) {
      return undefined;
    }

    cursor = skipSqlTrivia(sql, semicolon + 1);
  }

  return undefined;
}

function assertRunnerManagedTransactionCompatible(sql: string): void {
  const control = findTopLevelTransactionControl(sql);
  if (control !== undefined) {
    throw new PostgresMigrationError(
      `Migration contains unsupported top-level transaction control: ${control}.`
    );
  }
}

export function canonicalizeMigrationSql(sql: string): string {
  const withoutBom = sql.startsWith('\uFEFF') ? sql.slice(1) : sql;
  return withoutBom.replace(/\r\n?/g, '\n');
}

export function deriveExecutableMigrationSql(canonicalArtifactSql: string): string {
  const firstStatementStart = skipSqlTrivia(canonicalArtifactSql, 0);
  const firstSemicolon = findNextTopLevelSemicolon(
    canonicalArtifactSql,
    firstStatementStart
  );
  const { previousSemicolon, lastSemicolon } = scanLastTopLevelSemicolons(
    canonicalArtifactSql
  );
  const lastStatementStart =
    lastSemicolon === undefined
      ? canonicalArtifactSql.length
      : skipSqlTrivia(
          canonicalArtifactSql,
          previousSemicolon === undefined ? 0 : previousSemicolon + 1
        );

  const hasLeadingBegin = isBoundaryStatement(
    canonicalArtifactSql,
    firstStatementStart,
    'BEGIN',
    firstSemicolon
  );
  const hasTrailingCommit = isBoundaryStatement(
    canonicalArtifactSql,
    lastStatementStart,
    'COMMIT',
    lastSemicolon
  );

  if (hasLeadingBegin !== hasTrailingCommit) {
    throw new PostgresMigrationError(
      'Migration transaction wrapper is incomplete or ambiguous.'
    );
  }

  if (hasLeadingBegin && hasTrailingCommit) {
    const executableSql =
      canonicalArtifactSql.slice(0, firstStatementStart) +
      canonicalArtifactSql.slice((firstSemicolon ?? -1) + 1, lastStatementStart) +
      canonicalArtifactSql.slice((lastSemicolon ?? -1) + 1);

    if (!hasActualSql(executableSql)) {
      throw new PostgresMigrationError('Migration executable body must not be empty.');
    }

    assertRunnerManagedTransactionCompatible(executableSql);
    return executableSql;
  }

  if (!hasActualSql(canonicalArtifactSql)) {
    throw new PostgresMigrationError('Migration artifact must not be empty.');
  }

  assertRunnerManagedTransactionCompatible(canonicalArtifactSql);
  return canonicalArtifactSql;
}
