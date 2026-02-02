import express, { Express, Request, Response } from 'express';
import dbThing from './database';
import GateThing from './middleware/GateThing';
import AdminGuard from './middleware/AdminGuard';
import ClientController from './controllers/ClientController';
import KeyController from './controllers/KeyController';
import RuleController from './controllers/RuleController';
import LogController from './controllers/LogController';
import AdminController from './controllers/AdminController';
import { errorHandler } from './errors/CustomErrors';

const app: Express = express();
const PORT = process.env.PORT || 3000;

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// init db
dbThing.initTables();

// create default rate limit rule
import RuleRepo from './repos/RuleRepo';
const ruleRepo = new RuleRepo();
const existingRules = ruleRepo.findAll(1, 0);
if (existingRules.length === 0) {
    ruleRepo.create(null, '*', 100, 60);
    console.log('✓ Created default rate limit rule: 100 req/min');
}

// instances
const gateThing = new GateThing();
const adminGuard = new AdminGuard();
const clientCtrl = new ClientController();
const keyCtrl = new KeyController();
const ruleCtrl = new RuleController();
const logCtrl = new LogController();
const adminCtrl = new AdminController();

// admin routes (JWT protected)
app.post('/admin/login', adminCtrl.login);
app.get('/admin/me', adminGuard.requireAuth(), adminCtrl.me);

// client management (admin only)
app.post('/clients', adminGuard.requireAuth(), clientCtrl.create);
app.get('/clients', adminGuard.requireAuth(), clientCtrl.getAll);
app.get('/clients/:id', adminGuard.requireAuth(), clientCtrl.getById);
app.post('/clients/:id/block', adminGuard.requireAuth(), clientCtrl.block);
app.post('/clients/:id/unblock', adminGuard.requireAuth(), clientCtrl.unblock);
app.delete('/clients/:id', adminGuard.requireAuth(), clientCtrl.delete);

// api key management (admin only)
app.post('/keys', adminGuard.requireAuth(), keyCtrl.create);
app.get('/keys/client/:client_id', adminGuard.requireAuth(), keyCtrl.getByClient);
app.post('/keys/:id/revoke', adminGuard.requireAuth(), keyCtrl.revoke);
app.delete('/keys/:id', adminGuard.requireAuth(), keyCtrl.delete);

// rate limit rules (admin only)
app.post('/rules', adminGuard.requireAuth(), ruleCtrl.create);
app.get('/rules', adminGuard.requireAuth(), ruleCtrl.getAll);
app.get('/rules/:id', adminGuard.requireAuth(), ruleCtrl.getById);
app.get('/rules/client/:client_id', adminGuard.requireAuth(), ruleCtrl.getByClient);
app.delete('/rules/:id', adminGuard.requireAuth(), ruleCtrl.delete);

// usage logs (admin only)
app.get('/logs', adminGuard.requireAuth(), logCtrl.getLogs);
app.get('/stats', adminGuard.requireAuth(), logCtrl.getStats);

// protected endpoints (require API key + rate limiting)
app.get(
    '/protected/test',
    gateThing.authenticate(),
    gateThing.rateLimit(),
    gateThing.logUsage(),
    (req: Request, res: Response) => {
        res.json({
            message: 'Success!',
            client: req.client?.name,
            timestamp: new Date().toISOString()
        });
    }
);

app.get(
    '/protected/data',
    gateThing.authenticate(),
    gateThing.rateLimit(),
    gateThing.logUsage(),
    (req: Request, res: Response) => {
        res.json({
            data: [1, 2, 3, 4, 5],
            client: req.client?.name
        });
    }
);

// health check
app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`\n🚀 FakeKong API running on http://localhost:${PORT}`);
    console.log(`\n📚 Quick Start:`);
    console.log(`   1. Login: POST /admin/login { "username": "admin", "password": "admin123" }`);
    console.log(`   2. Create client: POST /clients (with JWT token)`);
    console.log(`   3. Create API key: POST /keys (with JWT token)`);
    console.log(`   4. Test protected endpoint: GET /protected/test (with X-API-Key header)\n`);
});

export default app;
