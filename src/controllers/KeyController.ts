import { Request, Response, NextFunction } from 'express';
import KeyRepo from '../repos/KeyRepo';
import ClientRepo from '../repos/ClientRepo';
import { ApiKey } from '../models/stuff';
import { NotFoundStuff } from '../errors/CustomErrors';

class KeyController {
    private keyRepo: KeyRepo;
    private clientRepo: ClientRepo;

    constructor() {
        this.keyRepo = new KeyRepo();
        this.clientRepo = new ClientRepo();
    }

    create = (req: Request, res: Response, next: NextFunction): void => {
        try {
            const { client_id, expires_in_days } = req.body;

            if (!client_id) {
                res.status(400).json({ error: 'client_id required' });
                return;
            }

            const client = this.clientRepo.findById(client_id);
            if (!client) {
                throw new NotFoundStuff('Client not found');
            }

            const rawKey = ApiKey.generateKey();
            const keyHash = ApiKey.hashKey(rawKey);
            const keyPrefix = rawKey.substring(0, 10) + '...';

            let expiresAt: string | null = null;
            if (expires_in_days) {
                const expiry = new Date();
                expiry.setDate(expiry.getDate() + expires_in_days);
                expiresAt = expiry.toISOString();
            }

            const apiKey = this.keyRepo.create(client_id, keyHash, keyPrefix, expiresAt);

            res.status(201).json({
                ...apiKey?.toDict(),
                key: rawKey
            });
        } catch (err) {
            next(err);
        }
    };

    getByClient = (req: Request, res: Response, next: NextFunction): void => {
        try {
            const keys = this.keyRepo.findByClientId(parseInt(req.params.client_id));
            res.json(keys.map(k => k.toDict()));
        } catch (err) {
            next(err);
        }
    };

    revoke = (req: Request, res: Response, next: NextFunction): void => {
        try {
            const apiKey = this.keyRepo.findById(parseInt(req.params.id));

            if (!apiKey) {
                throw new NotFoundStuff('API key not found');
            }

            apiKey.revokeIt();
            const updated = this.keyRepo.update(apiKey);
            res.json(updated?.toDict());
        } catch (err) {
            next(err);
        }
    };

    delete = (req: Request, res: Response, next: NextFunction): void => {
        try {
            this.keyRepo.delete(parseInt(req.params.id));
            res.status(204).send();
        } catch (err) {
            next(err);
        }
    };
}

export default KeyController;
