# Iron Log

Personal workout tracker mobile app.

## Stack

- **Monorepo**: npm workspaces
- **Frontend**: React Native (Expo) with Expo Router
- **Backend**: NestJS with Prisma ORM
- **Database**: PostgreSQL

## Project Structure

```
iron-log/
├── apps/
│   ├── mobile/    # Expo app
│   └── api/       # NestJS app
├── package.json   # workspaces root
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL database

### Setup

1. Install dependencies from the root:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   # API
   cp apps/api/.env.example apps/api/.env
   # Edit apps/api/.env with your database URL and API key

   # Mobile
   cp apps/mobile/.env.example apps/mobile/.env
   # Edit apps/mobile/.env with your API URL and key
   ```

3. Run database migrations:
   ```bash
   cd apps/api
   npx prisma migrate dev
   ```

4. Seed the database:
   ```bash
   cd apps/api
   npx prisma db seed
   ```

### Running the Apps

**API Server:**
```bash
npm run api
# or
cd apps/api && npm run start:dev
```

**Mobile App:**
```bash
npm run mobile
# or
cd apps/mobile && npx expo start
```

## API Authentication

All API requests require an `x-api-key` header with a valid API key.
