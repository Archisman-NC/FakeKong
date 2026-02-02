import LogRepo from '../repos/LogRepo';
import { UsageLog } from '../models/stuff';
import { LogFilters, UsageStats } from '../types';

class LogBits {
    private logRepo: LogRepo;

    constructor() {
        this.logRepo = new LogRepo();
    }

    recordUsage(data: {
        clientId: number;
        apiKeyId: number;
        endpoint: string;
        method: string;
        statusCode: number;
        latencyMs: number;
        ipAddress?: string;
        userAgent?: string;
    }): UsageLog | null {
        const log = new UsageLog({
            client_id: data.clientId,
            api_key_id: data.apiKeyId,
            endpoint: data.endpoint,
            method: data.method,
            status_code: data.statusCode,
            latency_ms: data.latencyMs,
            ip_address: data.ipAddress || null,
            user_agent: data.userAgent || null
        });

        return this.logRepo.create(log);
    }

    getLogs(filters: LogFilters): UsageLog[] {
        return this.logRepo.findAll(filters);
    }

    getLogCount(filters: LogFilters): number {
        return this.logRepo.count(filters);
    }

    getStats(clientId: number | null = null): UsageStats {
        const filters: LogFilters = clientId ? { client_id: clientId, limit: 1000 } : { limit: 1000 };
        const logs = this.logRepo.findAll(filters);

        const stats: UsageStats = {
            total_requests: logs.length,
            avg_latency: 0,
            status_breakdown: {},
            method_breakdown: {}
        };

        if (logs.length === 0) return stats;

        let totalLatency = 0;

        logs.forEach(log => {
            totalLatency += log.latency_ms;

            stats.status_breakdown[log.status_code] =
                (stats.status_breakdown[log.status_code] || 0) + 1;

            stats.method_breakdown[log.method] =
                (stats.method_breakdown[log.method] || 0) + 1;
        });

        stats.avg_latency = totalLatency / logs.length;

        return stats;
    }
}

export default LogBits;
