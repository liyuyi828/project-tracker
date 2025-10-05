import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

let db: DatabaseSync | null = null;

export function getDatabase(): DatabaseSync {
  if (db) {
    return db;
  }

  // Initialize database
  const dbPath = join(process.cwd(), 'data', 'tracker.db');

  // Ensure data directory exists
  const dataDir = dirname(dbPath);
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }

  db = new DatabaseSync(dbPath);

  // Run schema initialization
  const schemaPath = join(process.cwd(), 'src', 'lib', 'db', 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');

  // Execute PRAGMAs first
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');

  // Remove single-line comments (-- comments) before splitting
  const cleanedSchema = schema
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n');

  // Split statements and clean them
  const statements = cleanedSchema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('PRAGMA'));

  console.log('Total statements after split:', statements.length);
  statements.forEach((s, i) => {
    console.log(`Statement ${i}: ${s.substring(0, 50).replace(/\n/g, ' ')}...`);
  });

  // Execute all CREATE TABLE statements first (match at start, ignoring whitespace)
  const createTableStatements = statements.filter(s => /^\s*CREATE\s+TABLE/i.test(s));
  const otherStatements = statements.filter(s => !/^\s*CREATE\s+TABLE/i.test(s));

  console.log(`Found ${createTableStatements.length} CREATE TABLE statements`);
  console.log(`Found ${otherStatements.length} other statements`);

  for (const statement of createTableStatements) {
    try {
      console.log('Executing:', statement.substring(0, 50) + '...');
      db.exec(statement);
    } catch (error) {
      console.error('Error executing CREATE TABLE:', statement.substring(0, 100));
      throw error;
    }
  }

  // Then execute CREATE INDEX and other statements
  for (const statement of otherStatements) {
    try {
      console.log('Executing:', statement.substring(0, 50) + '...');
      db.exec(statement);
    } catch (error) {
      console.error('Error executing statement:', statement.substring(0, 100));
      throw error;
    }
  }

  console.log('✅ Database initialized at:', dbPath);

  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

// Utility to run queries with proper error handling
export function query<T = any>(
  sql: string,
  params?: any[]
): T[] {
  const database = getDatabase();
  const stmt = database.prepare(sql);
  return stmt.all(...(params || [])) as T[];
}

export function queryOne<T = any>(
  sql: string,
  params?: any[]
): T | null {
  const database = getDatabase();
  const stmt = database.prepare(sql);
  const result = stmt.get(...(params || []));
  return result as T | null;
}

export function execute(
  sql: string,
  params?: any[]
): void {
  const database = getDatabase();
  const stmt = database.prepare(sql);
  stmt.run(...(params || []));
}

export function transaction<T>(fn: () => T): T {
  const database = getDatabase();

  try {
    database.exec('BEGIN IMMEDIATE TRANSACTION');
    const result = fn();
    database.exec('COMMIT');
    return result;
  } catch (error) {
    try {
      database.exec('ROLLBACK');
    } catch (rollbackError) {
      // Ignore rollback errors if no transaction is active
      console.error('Rollback error:', rollbackError);
    }
    throw error;
  }
}
