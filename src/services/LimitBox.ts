import dbThing from '../database';
import RuleRepo from '../repos/RuleRepo';
import { RateLimitResult } from '../types';
import Database from 'better-sqlite3';

interface BucketState {
    id: number;
    client_id: number;
    endpoint: string;
    tokens: number;
    last_refill: string;
}

class LimitBox {
    private db: Database.Database;
    private ruleRepo: RuleRepo;

    constructor() {
        this.db = dbThing.getConn();
        this.ruleRepo = new RuleRepo();
    }

    checkLimit(clientId: number, endpoint: string): RateLimitResult {
        const rule = this.ruleRepo.findMatchingRule(clientId, endpoint);

        if (!rule) {
            return { allowed: true };
        }

        let bucket = this.getBucketState(clientId, endpoint);

        if (!bucket) {
            bucket = this.createBucket(clientId, endpoint, rule.max_requests);
        }

        const refillAmount = rule.calcRefill(bucket.last_refill);
        bucket.tokens = Math.min(bucket.tokens + refillAmount, rule.max_requests);
        bucket.last_refill = new Date().toISOString();

        if (bucket.tokens >= 1) {
            bucket.tokens -= 1;
            this.updateBucket(bucket);

            return {
                allowed: true,
                remaining: Math.floor(bucket.tokens),
                limit: rule.max_requests,
                reset: this.calcResetTime(rule, bucket)
            };
        } else {
            this.updateBucket(bucket);

            return {
                allowed: false,
                remaining: 0,
                limit: rule.max_requests,
                reset: this.calcResetTime(rule, bucket),
                retryAfter: Math.ceil(rule.window_seconds * (1 - bucket.tokens))
            };
        }
    }

    private getBucketState(clientId: number, endpoint: string): BucketState | null {
        const stmt = this.db.prepare(`
      SELECT * FROM bucket_state 
      WHERE client_id = ? AND endpoint = ?
    `);
        return stmt.get(clientId, endpoint) as BucketState | undefined || null;
    }

    private createBucket(clientId: number, endpoint: string, maxTokens: number): BucketState {
        const now = new Date().toISOString();
        const stmt = this.db.prepare(`
      INSERT INTO bucket_state (client_id, endpoint, tokens, last_refill)
      VALUES (?, ?, ?, ?)
    `);

        stmt.run(clientId, endpoint, maxTokens, now);
        return this.getBucketState(clientId, endpoint)!;
    }

    private updateBucket(bucket: BucketState): void {
        const stmt = this.db.prepare(`
      UPDATE bucket_state 
      SET tokens = ?, last_refill = ?
      WHERE id = ?
    `);

        stmt.run(bucket.tokens, bucket.last_refill, bucket.id);
    }

    private calcResetTime(rule: any, bucket: BucketState): number {
        const lastRefill = new Date(bucket.last_refill);
        const resetTime = new Date(lastRefill.getTime() + (rule.window_seconds * 1000));
        return Math.ceil((resetTime.getTime() - new Date().getTime()) / 1000);
    }
}

export default LimitBox;
