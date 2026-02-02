# FakeKong - API Rate Limiting & Usage Analytics

**Backend-only OOP system for API rate limiting and usage analytics built with Node.js, Express, and TypeScript.**

## ✨ Features

- API Client Management (CRUD)
- API Key Management (generate, revoke, expiry)
- Token Bucket Rate Limiting (configurable per client/endpoint)
- Usage Analytics (filtering, sorting, pagination)
- JWT Admin Authentication
- Full TypeScript with OOP architecture

## 🚀 Quick Start

```bash
# Install
npm install

# Build
npm run build

# Run
npm start

# Or dev mode
npm run dev
```

Server: `http://localhost:3000`

## 📖 Example Usage

```bash
# 1. Login
curl -X POST http://localhost:3000/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 2. Create client (use JWT from step 1)
curl -X POST http://localhost:3000/clients \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"name":"MyApp","email":"app@example.com"}'

# 3. Create API key
curl -X POST http://localhost:3000/keys \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"client_id":1}'

# 4. Test protected endpoint
curl http://localhost:3000/protected/test \
  -H "X-API-Key: <API_KEY>"
```

## 🏗️ Architecture

```
src/
├── models/       # ApiClient, ApiKey, RateLimitRule, UsageLog
├── repos/        # Database access layer
├── services/     # AuthStuff, KeyChecker, LimitBox, LogBits
├── controllers/  # Request handlers
├── middleware/   # GateThing (auth + rate limit), AdminGuard
├── errors/       # Custom error classes
└── server.ts     # Express app
```

## 📚 API Endpoints

### Admin (JWT required)
- `POST /admin/login` - Get JWT token
- `POST /clients` - Create client
- `GET /clients` - List clients
- `POST /clients/:id/block` - Block client
- `POST /keys` - Create API key
- `POST /rules` - Create rate limit rule
- `GET /logs` - Get usage logs
- `GET /stats` - Get statistics

### Protected (API key required)
- `GET /protected/test` - Test endpoint
- `GET /protected/data` - Data endpoint

Rate limit headers included:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

## ⚙️ Configuration

- **Admin**: `admin` / `admin123`
- **Default rate limit**: 100 req/60s
- **Database**: SQLite (`fakekong.db`)
- **Port**: 3000

## 📦 Tech Stack

- Node.js + Express
- TypeScript
- SQLite3
- JWT + bcrypt

## 📄 License

MIT
