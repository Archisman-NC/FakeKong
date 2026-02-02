import dbThing from '../database';
import { UsageLog } from '../models/stuff';
import { LogFilters } from '../types';
import Database from 'better-sqlite3';

class LogRepo {
    private db: Database.Database;

    constructor() {
        this.db = dbThing.getConn();
    }

    create(logData: Partial<UsageLog>): UsageLog | null {
        const stmt = this.db.prepare(`
      INSERT INTO usage_logs 
      (client_id, api_key_id, endpoint, method, status_code, latency_ms, timestamp, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

        const result = stmt.run(
            logData.client_id,
            logData.api_key_id,
            logData.endpoint,
            logData.method,
            logData.status_code,
            logData.latency_ms,
            logData.timestamp,
            logData.ip_address,
            logData.user_agent
        );

        return this.findById(Number(result.lastInsertRowid));
    }

    findById(id: number): UsageLog | null {
        const stmt = this.db.prepare('SELECT * FROM usage_logs WHERE id = ?');
        const row = stmt.get(id);
        return UsageLog.fromRow(row);
    }

    findAll(filters: LogFilters = {}): UsageLog[] {
        let query = 'SELECT * FROM usage_logs WHERE 1=1';
        const params: any[] = [];

        if (filters.client_id) {
            query += ' AND client_id = ?';
            params.push(filters.client_id);
        }

        if (filters.endpoint) {
            query += ' AND endpoint LIKE ?';
            params.push(`%${filters.endpoint}%`);
        }

        if (filters.method) {
            query += ' AND method = ?';
            params.push(filters.method);
        }

        if (filters.status_code) {
            query += ' AND status_code = ?';
            params.push(filters.status_code);
        }

        if (filters.start_date) {
            query += ' AND timestamp >= ?';
            params.push(filters.start_date);
        }

        if (filters.end_date) {
            query += ' AND timestamp <= ?';
            params.push(filters.end_date);
        }

        // sorting
        const sortBy = filters.sort_by || 'timestamp';
        const sortOrder = filters.sort_order || 'DESC';
        query += ` ORDER BY ${sortBy} ${sortOrder}`;

        // pagination
        const limit = filters.limit || 50;
        const offset = filters.offset || 0;
        query += ' LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const stmt = this.db.prepare(query);
        const rows = stmt.all(...params);
        return rows.map(row => UsageLog.fromRow(row)).filter((l): l is UsageLog => l !== null);
    }

    count(filters: LogFilters = {}): number {
        let query = 'SELECT COUNT(*) as total FROM usage_logs WHERE 1=1';
        const params: any[] = [];

        if (filters.client_id) {
            query += ' AND client_id = ?';
            params.push(filters.client_id);
        }

        if (filters.endpoint) {
            query += ' AND endpoint LIKE ?';
            params.push(`%${filters.endpoint}%`);
        }

        if (filters.method) {
            query += ' AND method = ?';
            params.push(filters.method);
        }

        if (filters.status_code) {
            query += ' AND status_code = ?';
            params.push(filters.status_code);
        }

        const stmt = this.db.prepare(query);
        const result: any = stmt.get(...params);
        return result.total;
    }
}

export default LogRepo;
