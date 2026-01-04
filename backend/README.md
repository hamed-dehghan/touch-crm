# Touch CRM Backend

Backend API for the unified CRM and Customer Loyalty platform.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Sequelize
- **Database**: PostgreSQL
- **Package Manager**: Bun

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Bun (for package management)

### Installation

1. Install dependencies:
```bash
bun install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update `.env` with your database credentials.

4. Run migrations:
```bash
bun run migrate
```

5. Seed initial data:
```bash
bun run seed
```

6. Start development server:
```bash
bun run dev
```

The API will be available at `http://localhost:3000`

## API Documentation

Swagger documentation is available at `/api-docs` when the server is running.

## Project Structure

```
backend/
├── src/
│   ├── controllers/    # Business logic
│   ├── models/         # Sequelize models
│   ├── routes/         # API route definitions
│   ├── middlewares/    # Reusable middleware
│   ├── services/      # Business services
│   ├── utils/         # Helper functions
│   ├── validations/   # Yup validation schemas
│   ├── config/        # Configuration files
│   ├── migrations/    # Database migrations
│   ├── seeders/       # Database seeders
│   ├── jobs/          # Cron jobs
│   ├── workers/       # Background workers
│   ├── app.ts         # Express app setup
│   └── index.ts       # Application entry point
├── docs/              # Implementation documentation
└── dist/              # Compiled JavaScript
```

## Scripts

- `bun run dev` - Start development server with hot reload
- `bun run build` - Build TypeScript to JavaScript
- `bun run start` - Start production server
- `bun run migrate` - Run database migrations
- `bun run seed` - Seed database with initial data
- `bun run lint` - Run ESLint
- `bun run format` - Format code with Prettier

## License

ISC
