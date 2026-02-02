import dbThing from '../database';
import { ApiKey } from '../models/stuff';
import Database from 'better-sqlite3';

class KeyRepo {
    private db: Database.Database;

    constructor() {
        this.db = dbThing.getConn();
    }

    create(clientId: number, keyHash: string, keyPrefix: string, expiresAt: string | null = null): ApiKey | null {
        const now = new Date().toISOString();
        const stmt = this.db.prepare(`
      INSERT INTO api_keys (client_id, key_hash, key_prefix, is_active, expires_at, created_at)
      VALUES (?, ?, ?, 1, ?, ?)
    `);

        const result = stmt.run(clientId, keyHash, keyPrefix, expiresAt, now);
        return this.findById(Number(result.lastInsertRowid));
    }

    findById(id: number): ApiKey | null {
        const stmt = this.db.prepare('SELECT * FROM api_keys WHERE id = ?');
        const row = stmt.get(id);
        return ApiKey.fromRow(row);
    }

    findByHash(keyHash: string): ApiKey | null {
        const stmt = this.db.prepare('SELECT * FROM api_keys WHERE key_hash = ?');
        const row = stmt.get(keyHash);
        return ApiKey.fromRow(row);
    }

    findByClientId(clientId: number): ApiKey[] {
        const stmt = this.db.prepare('SELECT * FROM api_keys WHERE client_id = ?');
        const rows = stmt.all(clientId);
        return rows.map(row => ApiKey.fromRow(row)).filter((k): k is ApiKey => k !== null);
    }

    update(apiKey: ApiKey): ApiKey | null {
        const stmt = this.db.prepare(`
      UPDATE api_keys 
      SET is_active = ?, revoked_at = ?
      WHERE id = ?
    `);

        stmt.run(apiKey.is_active ? 1 : 0, apiKey.revoked_at, apiKey.id);
        return this.findById(apiKey.id!);
    }

    delete(id: number): void {
        const stmt = this.db.prepare('DELETE FROM api_keys WHERE id = ?');
        stmt.run(id);
    }
}

export default KeyRepo;
