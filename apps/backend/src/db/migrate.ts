import { Database } from 'bun:sqlite';
import { drizzle as drizzleBunSqlite } from 'drizzle-orm/bun-sqlite';
import { migrate as migrateBunSqlite } from 'drizzle-orm/bun-sqlite/migrator';
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import { migrate as migratePostgres } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import path from 'path';
import { fileURLToPath } from 'url';

import { env } from '../env';
import { Dialect } from './dbConfig';

interface MigrationOptions {
	dbType: Dialect;
	connectionString: string; // file path for SQLite, connection URL for PostgreSQL
	migrationsPath: string;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function runMigrations(options: MigrationOptions): Promise<void> {
	const { dbType, connectionString, migrationsPath } = options;
	const resolvedMigrationsPath = path.isAbsolute(migrationsPath)
		? migrationsPath
		: path.resolve(__dirname, '..', '..', migrationsPath);

	console.log(`🗃️  Database type: ${dbType}`);
	console.log(`📁 Migrations folder: ${resolvedMigrationsPath}`);

	if (dbType === Dialect.Postgres) {
		await runPostgresMigrations(connectionString, resolvedMigrationsPath);
	} else {
		await runSqliteMigrations(connectionString, resolvedMigrationsPath);
	}
}

async function runSqliteMigrations(dbPath: string, migrationsPath: string): Promise<void> {
	console.log(`🗃️  Opening SQLite database: ${dbPath}`);

	const sqlite = new Database(dbPath);
	const db = drizzleBunSqlite(sqlite);

	console.log('🚀 Running SQLite migrations...');

	try {
		await migrateBunSqlite(db, { migrationsFolder: migrationsPath });
		console.log('✅ Migrations completed successfully!');
	} catch (error) {
		console.error('❌ Migration failed:', error);
		throw error;
	} finally {
		sqlite.close();
	}
}

async function runPostgresMigrations(connectionString: string, migrationsPath: string): Promise<void> {
	console.log(`🗃️  Connecting to PostgreSQL...`);

	// Use postgres.js for Bun compatibility
	const ssl = env.DB_SSL ? 'require' : undefined;
	const sql = postgres(connectionString, { max: 1, ssl });
	const db = drizzlePostgres(sql);

	console.log('🚀 Running PostgreSQL migrations...');

	try {
		await migratePostgres(db, { migrationsFolder: migrationsPath });
		console.log('✅ Migrations completed successfully!');
	} catch (error) {
		console.error('❌ Migration failed:', error);
		throw error;
	} finally {
		await sql.end();
	}
}
