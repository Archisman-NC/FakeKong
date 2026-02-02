import { Request, Response, NextFunction } from 'express';
import KeyChecker from '../services/KeyChecker';
import LimitBox from '../services/LimitBox';
import LogBits from '../services/LogBits';
import { BadKeyError, TooManyHitsError, ClientBlockedError } from '../errors/CustomErrors';
import { ApiKey } from '../models/stuff';
import { ApiClient } from '../models/stuff';

// extend Express Request type
declare global {
    namespace Express {
        interface Request {
            apiKey?: ApiKey;
            client?: ApiClient;
        }
    }
}

class GateThing {
    private keyChecker: KeyChecker;
    private limitBox: LimitBox;
    private logBits: LogBits;

    constructor() {
        this.keyChecker = new KeyChecker();
        this.limitBox = new LimitBox();
        this.logBits = new LogBits();
    }

    authenticate() {
        return async (req: Request, _res: Response, next: NextFunction) => {
            const startTime = Date.now();

            try {
                const apiKey = req.headers['x-api-key'] as string;

                if (!apiKey) {
                    throw new BadKeyError('Missing API key');
                }

                const result = await this.keyChecker.validateKey(apiKey);

                if (!result.valid) {
                    throw new BadKeyError(result.error);
                }

                if (result.client.isBlocked()) {
                    throw new ClientBlockedError();
                }

                req.apiKey = result.apiKey;
                req.client = result.client;

                next();
            } catch (err) {
                if (req.client) {
                    const latency = Date.now() - startTime;
                    this.logBits.recordUsage({
                        clientId: req.client.id!,
                        apiKeyId: req.apiKey?.id || 0,
                        endpoint: req.path,
                        method: req.method,
                        statusCode: (err as any).statusCode || 401,
                        latencyMs: latency,
                        ipAddress: req.ip,
                        userAgent: req.get('user-agent')
                    });
                }

                next(err);
            }
        };
    }

    rateLimit() {
        return (req: Request, res: Response, next: NextFunction) => {
            if (!req.client) {
                return next();
            }

            const result = this.limitBox.checkLimit(req.client.id!, req.path);

            res.set('X-RateLimit-Limit', (result.limit || 0).toString());
            res.set('X-RateLimit-Remaining', (result.remaining || 0).toString());
            res.set('X-RateLimit-Reset', (result.reset || 0).toString());

            if (!result.allowed) {
                return next(new TooManyHitsError('Rate limit exceeded', result.retryAfter));
            }

            next();
        };
    }

    logUsage() {
        return (req: Request, res: Response, next: NextFunction) => {
            if (!req.client || !req.apiKey) {
                return next();
            }

            const startTime = Date.now();
            const originalSend = res.send.bind(res);

            res.send = ((data: any) => {
                const latency = Date.now() - startTime;

                this.logBits.recordUsage({
                    clientId: req.client!.id!,
                    apiKeyId: req.apiKey!.id!,
                    endpoint: req.path,
                    method: req.method,
                    statusCode: res.statusCode,
                    latencyMs: latency,
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent')
                });

                return originalSend(data);
            }) as any;

            next();
        };
    }
}

export default GateThing;
