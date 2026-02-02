import { Request, Response, NextFunction } from 'express';
import LogBits from '../services/LogBits';
import { LogFilters } from '../types';

class LogController {
    private logBits: LogBits;

    constructor() {
        this.logBits = new LogBits();
    }

    getLogs = (req: Request, res: Response, next: NextFunction): void => {
        try {
            const filters: LogFilters = {
                client_id: req.query.client_id ? parseInt(req.query.client_id as string) : undefined,
                endpoint: req.query.endpoint as string,
                method: req.query.method as string,
                status_code: req.query.status_code ? parseInt(req.query.status_code as string) : undefined,
                start_date: req.query.start_date as string,
                end_date: req.query.end_date as string,
                sort_by: (req.query.sort_by as string) || 'timestamp',
                sort_order: (req.query.sort_order as string) || 'DESC',
                limit: parseInt(req.query.limit as string) || 50,
                offset: parseInt(req.query.offset as string) || 0
            };

            const logs = this.logBits.getLogs(filters);
            const total = this.logBits.getLogCount(filters);

            res.json({
                logs: logs.map(l => l.toDict()),
                total,
                limit: filters.limit,
                offset: filters.offset
            });
        } catch (err) {
            next(err);
        }
    };

    getStats = (req: Request, res: Response, next: NextFunction): void => {
        try {
            const clientId = req.query.client_id ? parseInt(req.query.client_id as string) : null;
            const stats = this.logBits.getStats(clientId);
            res.json(stats);
        } catch (err) {
            next(err);
        }
    };
}

export default LogController;
