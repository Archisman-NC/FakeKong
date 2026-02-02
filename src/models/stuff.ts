import * as crypto from 'crypto';
import { IApiClient, IApiKey, IRateLimitRule, IUsageLog } from '../types';

export class ApiClient implements IApiClient {
    id: number | null;
    name: string;
    email: string;
    status: string;
    created_at: string;
    updated_at: string;

    constructor(data: Partial<IApiClient> = {}) {
        this.id = data.id || null;
        this.name = data.name || '';
        this.email = data.email || '';
        this.status = data.status || 'active';
        this.created_at = data.created_at || new Date().toISOString();
        this.updated_at = data.updated_at || new Date().toISOString();
    }

    isBlocked(): boolean {
        return this.status === 'blocked';
    }

    blockIt(): void {
        this.status = 'blocked';
        this.updated_at = new Date().toISOString();
    }

    unblockIt(): void {
        this.status = 'active';
        this.updated_at = new Date().toISOString();
    }

    toDict(): IApiClient {
        return {
            id: this.id,
            name: this.name,
            email: this.email,
            status: this.status,
            created_at: this.created_at,
            updated_at: this.updated_at
        };
    }

    static fromRow(row: any): ApiClient | null {
        if (!row) return null;
        return new ApiClient(row);
    }
}

export class ApiKey implements IApiKey {
    id: number | null;
    client_id: number;
    key_hash: string;
    key_prefix: string;
    is_active: boolean;
    expires_at: string | null;
    created_at: string;
    revoked_at: string | null;

    constructor(data: Partial<IApiKey> = {}) {
        this.id = data.id || null;
        this.client_id = data.client_id || 0;
        this.key_hash = data.key_hash || '';
        this.key_prefix = data.key_prefix || '';
        this.is_active = data.is_active !== undefined ? data.is_active : true;
        this.expires_at = data.expires_at || null;
        this.created_at = data.created_at || new Date().toISOString();
        this.revoked_at = data.revoked_at || null;
    }

    hasExpired(): boolean {
        if (!this.expires_at) return false;
        return new Date() > new Date(this.expires_at);
    }

    isValid(): boolean {
        return this.is_active && !this.hasExpired() && !this.revoked_at;
    }

    revokeIt(): void {
        this.is_active = false;
        this.revoked_at = new Date().toISOString();
    }

    checkHash(rawKey: string): boolean {
        const testHash = crypto.createHash('sha256').update(rawKey).digest('hex');
        return testHash === this.key_hash;
    }

    static generateKey(): string {
        return 'fk_' + crypto.randomBytes(32).toString('base64url');
    }

    static hashKey(rawKey: string): string {
        return crypto.createHash('sha256').update(rawKey).digest('hex');
    }

    toDict(): IApiKey {
        return {
            id: this.id,
            client_id: this.client_id,
            key_hash: this.key_hash,
            key_prefix: this.key_prefix,
            is_active: this.is_active,
            expires_at: this.expires_at,
            created_at: this.created_at,
            revoked_at: this.revoked_at
        };
    }

    static fromRow(row: any): ApiKey | null {
        if (!row) return null;
        return new ApiKey({
            ...row,
            is_active: Boolean(row.is_active)
        });
    }
}

export class RateLimitRule implements IRateLimitRule {
    id: number | null;
    client_id: number | null;
    endpoint_pattern: string;
    max_requests: number;
    window_seconds: number;
    created_at: string;

    constructor(data: Partial<IRateLimitRule> = {}) {
        this.id = data.id || null;
        this.client_id = data.client_id || null;
        this.endpoint_pattern = data.endpoint_pattern || '*';
        this.max_requests = data.max_requests || 100;
        this.window_seconds = data.window_seconds || 60;
        this.created_at = data.created_at || new Date().toISOString();
    }

    getRefillRate(): number {
        return this.max_requests / this.window_seconds;
    }

    calcRefill(lastRefillTime: string): number {
        const lastTime = new Date(lastRefillTime);
        const now = new Date();
        const elapsed = (now.getTime() - lastTime.getTime()) / 1000;
        return elapsed * this.getRefillRate();
    }

    matchesEndpoint(endpoint: string): boolean {
        if (this.endpoint_pattern === '*') return true;
        return endpoint.startsWith(this.endpoint_pattern);
    }

    toDict(): IRateLimitRule {
        return {
            id: this.id,
            client_id: this.client_id,
            endpoint_pattern: this.endpoint_pattern,
            max_requests: this.max_requests,
            window_seconds: this.window_seconds,
            created_at: this.created_at
        };
    }

    static fromRow(row: any): RateLimitRule | null {
        if (!row) return null;
        return new RateLimitRule(row);
    }
}

export class UsageLog implements IUsageLog {
    id: number | null;
    client_id: number;
    api_key_id: number;
    endpoint: string;
    method: string;
    status_code: number;
    latency_ms: number;
    timestamp: string;
    ip_address: string | null;
    user_agent: string | null;

    constructor(data: Partial<IUsageLog> = {}) {
        this.id = data.id || null;
        this.client_id = data.client_id || 0;
        this.api_key_id = data.api_key_id || 0;
        this.endpoint = data.endpoint || '';
        this.method = data.method || '';
        this.status_code = data.status_code || 0;
        this.latency_ms = data.latency_ms || 0;
        this.timestamp = data.timestamp || new Date().toISOString();
        this.ip_address = data.ip_address || null;
        this.user_agent = data.user_agent || null;
    }

    toDict(): IUsageLog {
        return {
            id: this.id,
            client_id: this.client_id,
            api_key_id: this.api_key_id,
            endpoint: this.endpoint,
            method: this.method,
            status_code: this.status_code,
            latency_ms: this.latency_ms,
            timestamp: this.timestamp,
            ip_address: this.ip_address,
            user_agent: this.user_agent
        };
    }

    static fromRow(row: any): UsageLog | null {
        if (!row) return null;
        return new UsageLog(row);
    }
}
