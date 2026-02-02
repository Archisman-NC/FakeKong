import dbThing from '../database';
import { RateLimitRule } from '../models/stuff';
import Database from 'better-sqlite3';

class RuleRepo {
    private db: Database.Database;

    constructor() {
        this.db = dbThing.getConn();
    }

    create(clientId: number | null, endpointPattern: string, maxRequests: number, windowSeconds: number): RateLimitRule | null {
        const now = new Date().toISOString();
        const stmt = this.db.prepare(`
      INSERT INTO rate_rules (client_id, endpoint_pattern, max_requests, window_seconds, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

        const result = stmt.run(clientId, endpointPattern, maxRequests, windowSeconds, now);
        return this.findById(Number(result.lastInsertRowid));
    }

    findById(id: number): RateLimitRule | null {
        const stmt = this.db.prepare('SELECT * FROM rate_rules WHERE id = ?');
        const row = stmt.get(id);
        return RateLimitRule.fromRow(row);
    }

    findByClientId(clientId: number): RateLimitRule[] {
        const stmt = this.db.prepare('SELECT * FROM rate_rules WHERE client_id = ?');
        const rows = stmt.all(clientId);
        return rows.map((row: any) => RateLimitRule.fromRow(row)).filter((r: any): r is RateLimitRule => r !== null);
    }

    findMatchingRule(clientId: number, endpoint: string): RateLimitRule | null {
        // try exact match first
        let stmt = this.db.prepare(`
      SELECT * FROM rate_rules 
      WHERE client_id = ? AND endpoint_pattern = ?
      LIMIT 1
    `);
        let row = stmt.get(clientId, endpoint);

        if (row) return RateLimitRule.fromRow(row);

        // try wildcard
        stmt = this.db.prepare(`
      SELECT * FROM rate_rules 
      WHERE client_id = ? AND endpoint_pattern = '*'
      LIMIT 1
    `);
        row = stmt.get(clientId);

        if (row) return RateLimitRule.fromRow(row);

        // global default
        stmt = this.db.prepare(`
      SELECT * FROM rate_rules 
      WHERE client_id IS NULL AND endpoint_pattern = '*'
      LIMIT 1
    `);
        row = stmt.get();

        return RateLimitRule.fromRow(row);
    }

    findAll(limit: number = 50, offset: number = 0): RateLimitRule[] {
        const stmt = this.db.prepare('SELECT * FROM rate_rules LIMIT ? OFFSET ?');
        const rows = stmt.all(limit, offset);
        return rows.map((row: any) => RateLimitRule.fromRow(row)).filter((r: any): r is RateLimitRule => r !== null);
    }

    delete(id: number): void {
        const stmt = this.db.prepare('DELETE FROM rate_rules WHERE id = ?');
        stmt.run(id);
    }
}

export default RuleRepo;
