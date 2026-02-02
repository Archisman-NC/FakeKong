import KeyRepo from '../repos/KeyRepo';
import ClientRepo from '../repos/ClientRepo';
import { ApiKey } from '../models/stuff';
import { KeyValidationResult } from '../types';

class KeyChecker {
    private keyRepo: KeyRepo;
    private clientRepo: ClientRepo;

    constructor() {
        this.keyRepo = new KeyRepo();
        this.clientRepo = new ClientRepo();
    }

    async validateKey(rawKey: string): Promise<KeyValidationResult> {
        if (!rawKey || !rawKey.startsWith('fk_')) {
            return { valid: false, error: 'Invalid key format' };
        }

        const keyHash = ApiKey.hashKey(rawKey);
        const apiKey = this.keyRepo.findByHash(keyHash);

        if (!apiKey) {
            return { valid: false, error: 'Key not found' };
        }

        if (!apiKey.isValid()) {
            return { valid: false, error: 'Key is inactive or expired' };
        }

        const client = this.clientRepo.findById(apiKey.client_id);

        if (!client) {
            return { valid: false, error: 'Client not found' };
        }

        if (client.isBlocked()) {
            return { valid: false, error: 'Client is blocked' };
        }

        return {
            valid: true,
            apiKey,
            client
        };
    }
}

export default KeyChecker;
