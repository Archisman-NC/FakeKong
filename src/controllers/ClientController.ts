import { Request, Response, NextFunction } from 'express';
import ClientRepo from '../repos/ClientRepo';
import { NotFoundStuff } from '../errors/CustomErrors';

class ClientController {
    private repo: ClientRepo;

    constructor() {
        this.repo = new ClientRepo();
    }

    create = (req: Request, res: Response, next: NextFunction): void => {
        try {
            const { name, email } = req.body;

            if (!name || !email) {
                res.status(400).json({ error: 'Name and email required' });
                return;
            }

            const client = this.repo.create(name, email);
            res.status(201).json(client?.toDict());
        } catch (err) {
            next(err);
        }
    };

    getAll = (req: Request, res: Response, next: NextFunction): void => {
        try {
            const limit = parseInt(req.query.limit as string) || 50;
            const offset = parseInt(req.query.offset as string) || 0;

            const clients = this.repo.findAll(limit, offset);
            res.json(clients.map(c => c.toDict()));
        } catch (err) {
            next(err);
        }
    };

    getById = (req: Request, res: Response, next: NextFunction): void => {
        try {
            const client = this.repo.findById(parseInt(req.params.id));

            if (!client) {
                throw new NotFoundStuff('Client not found');
            }

            res.json(client.toDict());
        } catch (err) {
            next(err);
        }
    };

    block = (req: Request, res: Response, next: NextFunction): void => {
        try {
            const client = this.repo.findById(parseInt(req.params.id));

            if (!client) {
                throw new NotFoundStuff('Client not found');
            }

            client.blockIt();
            const updated = this.repo.update(client);
            res.json(updated?.toDict());
        } catch (err) {
            next(err);
        }
    };

    unblock = (req: Request, res: Response, next: NextFunction): void => {
        try {
            const client = this.repo.findById(parseInt(req.params.id));

            if (!client) {
                throw new NotFoundStuff('Client not found');
            }

            client.unblockIt();
            const updated = this.repo.update(client);
            res.json(updated?.toDict());
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

export default ClientController;
