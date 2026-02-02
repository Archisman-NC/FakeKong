export interface IApiClient {
    id: number | null;
    name: string;
    email: string;
    status: string;
    created_at: string;
    updated_at: string;
}

export interface IApiKey {
    id: number | null;
    client_id: number;
    key_hash: string;
    key_prefix: string;
    is_active: boolean;
    expires_at: string | null;
    created_at: string;
    revoked_at: string | null;
}

export interface IRateLimitRule {
    id: number | null;
    client_id: number | null;
    endpoint_pattern: string;
    max_requests: number;
    window_seconds: number;
    created_at: string;
}

export interface IUsageLog {
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
}

export interface RateLimitResult {
    allowed: boolean;
    remaining?: number;
    limit?: number;
    reset?: number;
    retryAfter?: number;
}

export interface KeyValidationResult {
    valid: boolean;
    error?: string;
    apiKey?: any;
    client?: any;
}

export interface LogFilters {
    client_id?: number;
    endpoint?: string;
    method?: string;
    status_code?: number;
    start_date?: string;
    end_date?: string;
    sort_by?: string;
    sort_order?: string;
    limit?: number;
    offset?: number;
}

export interface UsageStats {
    total_requests: number;
    avg_latency: number;
    status_breakdown: Record<number, number>;
    method_breakdown: Record<string, number>;
}
