import { Request, Response, NextFunction } from 'express';
import AuthStuff from '../services/AuthStuff';

class AdminController {
    private authStuff: AuthStuff;

    constructor() {
        this.authStuff = new AuthStuff();
    }

    login = (req: Request, res: Response, next: NextFunction): void => {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                res.status(400).json({ error: 'Username and password required' });
                return;
            }

            const token = this.authStuff.login(username, password);

            if (!token) {
                res.status(401).json({ error: 'Invalid credentials' });
                return;
            }

            res.json({ token });
        } catch (err) {
            next(err);
        }
    };

    me = (req: Request, res: Response): void => {
        res.json({ user: req.user });
    };
}

export default AdminController;
