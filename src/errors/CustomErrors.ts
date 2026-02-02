export class BadKeyError extends Error {
    statusCode: number;

    constructor(message: string = 'Invalid API key') {
        super(message);
        this.name = 'BadKeyError';
        this.statusCode = 401;
    }
}

export class TooManyHitsError extends Error {
    statusCode: number;
    retryAfter: number;

    constructor(message: string = 'Rate limit exceeded', retryAfter: number = 60) {
        super(message);
        this.name = 'TooManyHitsError';
        this.statusCode = 429;
        this.retryAfter = retryAfter;
    }
}

export class ClientBlockedError extends Error {
    statusCode: number;

    constructor(message: string = 'Client is blocked') {
        super(message);
        this.name = 'ClientBlockedError';
        this.statusCode = 403;
    }
}

export class NotFoundStuff extends Error {
    statusCode: number;

    constructor(message: string = 'Resource not found') {
        super(message);
        this.name = 'NotFoundStuff';
        this.statusCode = 404;
    }
}

export class UnauthorizedError extends Error {
    statusCode: number;

    constructor(message: string = 'Unauthorized') {
        super(message);
        this.name = 'UnauthorizedError';
        this.statusCode = 401;
    }
}

export function errorHandler(err: any, _req: any, res: any, _next: any): void {
    console.error('Error:', err);

    const statusCode = err.statusCode || 500;
    const response: any = {
        error: err.name || 'Error',
        message: err.message || 'Something went wrong'
    };

    if (err.retryAfter) {
        res.set('Retry-After', err.retryAfter.toString());
        response.retry_after = err.retryAfter;
    }

    res.status(statusCode).json(response);
}
