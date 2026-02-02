import dbThing from '../database';
import { ApiClient } from '../models/stuff';
import Database from 'better-sqlite3';

class ClientRepo {
    private db: Database.Database;

    constructor() {
        this.db = dbThing.getConn();
    }

    create(name: string, email: string): ApiClient | null {
        const now = new Date().toISOString();
        const stmt = this.db.prepare(`
      INSERT INTO clients (name, email, status, created_at, updated_at)
      VALUES (?, ?, 'active', ?, ?)
    `);

        const result = stmt.run(name, email, now, now);
        return this.findById(Number(result.lastInsertRowid));
    }

    findById(id: number): ApiClient | null {
        const stmt = this.db.prepare('SELECT * FROM clients WHERE id = ?');
        const row = stmt.get(id);
        return ApiClient.fromRow(row);
    }

    findByEmail(email: string): ApiClient | null {
        const stmt = this.db.prepare('SELECT * FROM clients WHERE email = ?');
        const row = stmt.get(email);
        return ApiClient.fromRow(row);
    }

    findAll(limit: number = 50, offset: number = 0): ApiClient[] {
        const stmt = this.db.prepare('SELECT * FROM clients LIMIT ? OFFSET ?');
        const rows = stmt.all(limit, offset);
        return rows.map(row => ApiClient.fromRow(row)).filter((c): c is ApiClient => c !== null);
    }

    update(client: ApiClient): ApiClient | null {
        const stmt = this.db.prepare(`
      UPDATE clients 
      SET name = ?, email = ?, status = ?, updated_at = ?
      WHERE id = ?
    `);

        stmt.run(client.name, client.email, client.status, client.updated_at, client.id);
        return this.findById(client.id!);
    }

    delete(id: number): void {
        const stmt = this.db.prepare('DELETE FROM clients WHERE id = ?');
        stmt.run(id);
    }
}

export default ClientRepo;
