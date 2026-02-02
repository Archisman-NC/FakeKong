import jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';

class AuthStuff {
    private secret: string;
    private adminUser: {
        username: string;
        passwordHash: string;
    };

    constructor() {
        this.secret = process.env.JWT_SECRET || 'super-secret-key-change-in-prod';
        this.adminUser = {
            username: 'admin',
            passwordHash: ''
        };
        this.initAdmin();
    }

    private initAdmin(): void {
        const defaultPass = 'admin123';
        this.adminUser.passwordHash = bcrypt.hashSync(defaultPass, 10);
    }

    verifyPassword(password: string, hash: string): boolean {
        return bcrypt.compareSync(password, hash);
    }

    generateToken(payload: object): string {
        return jwt.sign(payload, this.secret, { expiresIn: '24h' });
    }

    verifyToken(token: string): any | null {
        try {
            return jwt.verify(token, this.secret);
        } catch (err) {
            return null;
        }
    }

    login(username: string, password: string): string | null {
        if (username !== this.adminUser.username) {
            return null;
        }

        if (!this.verifyPassword(password, this.adminUser.passwordHash)) {
            return null;
        }

        return this.generateToken({ username, role: 'admin' });
    }
}

export default AuthStuff;
