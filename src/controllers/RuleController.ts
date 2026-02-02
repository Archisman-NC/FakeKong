import { Request, Response, NextFunction } from 'express';
import RuleRepo from '../repos/RuleRepo';
import { NotFoundStuff } from '../errors/CustomErrors';

class RuleController {
    private repo: RuleRepo;

    constructor() {
        this.repo = new RuleRepo();
    }

    create = (req: Request, res: Response, next: NextFunction): void => {
        try {
            const { client_id, endpoint_pattern, max_requests, window_seconds } = req.body;

            if (!max_requests || !window_seconds) {
                res.status(400).json({
                    error: 'max_requests and window_seconds required'
                });
                return;
            }

            const rule = this.repo.create(
                client_id || null,
                endpoint_pattern || '*',
                max_requests,
                window_seconds
            );

            res.status(201).json(rule?.toDict());
        } catch (err) {
            next(err);
        }
    };

    getAll = (req: Request, res: Response, next: NextFunction): void => {
        try {
            const limit = parseInt(req.query.limit as string) || 50;
            const offset = parseInt(req.query.offset as string) || 0;

            const rules = this.repo.findAll(limit, offset);
            res.json(rules.map(r => r.toDict()));
        } catch (err) {
            next(err);
        }
    };

    getById = (req: Request, res: Response, next: NextFunction): void => {
        try {
            const rule = this.repo.findById(parseInt(req.params.id));

            if (!rule) {
                throw new NotFoundStuff('Rule not found');
            }

            res.json(rule.toDict());
        } catch (err) {
            next(err);
        }
    };

    getByClient = (req: Request, res: Response, next: NextFunction): void => {
        try {
            const rules = this.repo.findByClientId(parseInt(req.params.client_id));
            res.json(rules.map(r => r.toDict()));
        } catch (err) {
            next(err);
        }
    };

    delete = (req: Request, res: Response, next: NextFunction): void => {
        try {
            this.repo.delete(parseInt(req.params.id));
            res.status(204).send();
        } catch (err) {
            next(err);
        }
    };
}

export default RuleController;
