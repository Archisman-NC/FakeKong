import { Request, Response, NextFunction } from 'express';
import AuthStuff from '../services/AuthStuff';
import { UnauthorizedError } from '../errors/CustomErrors';

declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

class AdminGuard {
    private authStuff: AuthStuff;

    constructor() {
        this.authStuff = new AuthStuff();
    }

    requireAuth() {
        return async (req: Request, _res: Response, next: NextFunction) => {
            const authHeader = req.headers['authorization'];

            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return next(new UnauthorizedError('Missing or invalid authorization header'));
            }

            const token = authHeader.substring(7);
            const payload = this.authStuff.verifyToken(token);

            if (!payload) {
                return next(new UnauthorizedError('Invalid or expired token'));
            }

            req.user = payload;
            next();
        };
    }
}

export default AdminGuard;
