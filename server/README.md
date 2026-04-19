# AutoFlow AI

![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)
![Express](https://img.shields.io/badge/Express-4.21+-blue.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-blue.svg)
![Redis](https://img.shields.io/badge/Redis-7+-red.svg)
![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)

A multi-tenant AI-powered business automation SaaS platform that enables businesses to automate their workflows using AI agents without writing code.

## Features

- **Multi-tenant Architecture**: Single platform serving multiple organizations
- **AI-Powered Automation**: Claude API integration for intelligent workflow execution
- **Visual Workflow Builder**: No-code workflow creation and management
- **Comprehensive Tooling**: Email, HTTP requests, database operations, Slack integrations
- **Enterprise Security**: JWT authentication, RBAC, audit trails
- **Scalable Infrastructure**: Queue-based job processing with BullMQ

## Tech Stack

- **Backend**: Node.js 20, Express.js, JavaScript (ES2022+)
- **Database**: PostgreSQL 16 with Prisma ORM
- **Cache & Queue**: Redis 7, BullMQ
- **Authentication**: JWT (jose), bcryptjs
- **Validation**: Zod
- **Logging**: Winston
- **Email**: Nodemailer
- **Containerization**: Docker, Docker Compose
- **AI**: Anthropic Claude API

## Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16+ (if not using Docker)
- Redis 7+ (if not using Docker)

## Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd autoflow-ai
   ```

2. **Start services with Docker Compose**
   ```bash
   docker-compose up -d
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Setup database**
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

5. **Start the application**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`

## Manual Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start PostgreSQL and Redis**
   ```bash
   # Using Docker for databases
   docker-compose up -d postgres redis
   ```

4. **Setup database**
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

5. **Start the application**
   ```bash
   npm run dev
   ```

## Environment Variables

Key environment variables (see `.env.example` for complete list):

```bash
# Application
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/autoflow_db
REDIS_URL=redis://localhost:6379

# Authentication
JWT_ACCESS_SECRET=your-super-secret-access-key-minimum-32-chars-long
JWT_REFRESH_SECRET=your-super-secret-refresh-key-minimum-32-chars-long

# AI
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your-app-password

# AWS (for file storage)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=ap-south-1
AWS_S3_BUCKET=autoflow-files

# Security
ENCRYPTION_KEY=your-32-char-encryption-key-here
```

## Available Scripts

```bash
# Development
npm run dev          # Start with hot reload
npm run start        # Start in production mode

# Database
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run database migrations
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed database with sample data

# Testing & Quality
npm run test         # Run tests with Vitest
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user and organization
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update current user profile
- `POST /api/users/change-password` - Change password
- `GET /api/users/org/members` - Get organization members
- `POST /api/users/org/invite` - Invite member (Phase 3)
- `PUT /api/users/org/members/:userId/role` - Update member role
- `DELETE /api/users/org/members/:userId` - Remove member

### Workflows (Phase 2)
- `GET /api/workflows` - List workflows
- `POST /api/workflows` - Create workflow
- `GET /api/workflows/:id` - Get workflow
- `PUT /api/workflows/:id` - Update workflow
- `DELETE /api/workflows/:id` - Delete workflow
- `POST /api/workflows/:id/run` - Execute workflow

### Executions (Phase 2)
- `GET /api/executions` - List executions
- `GET /api/executions/:id` - Get execution details
- `POST /api/executions/:id/cancel` - Cancel execution

### Webhooks (Phase 2)
- `POST /api/webhooks/:workflowId` - Webhook trigger

### Health Checks
- `GET /health` - Application health status
- `GET /ping` - Simple ping endpoint

## Project Structure

```
autoflow-ai/
src/
  config/          # Configuration files (database, redis, environment)
  modules/         # Feature modules (auth, users, workflows, etc.)
  agents/          # AI agent engine and tools
  queues/          # Job queue processors
  middlewares/      # Express middleware
  utils/           # Utility functions
  app.js           # Main application file
prisma/            # Database schema and migrations
tests/             # Test files
docs/              # Documentation
```

## Development Roadmap

### Phase 1: Foundation (Current)
- [x] Project structure and setup
- [x] Authentication system (JWT + refresh tokens)
- [x] User and organization management
- [x] Database schema and migrations
- [x] Core middleware and utilities
- [x] Docker setup

### Phase 2: Core Features
- [ ] Workflow CRUD operations
- [ ] AI agent engine with Claude integration
- [ ] Queue system implementation
- [ ] Basic tool integrations (email, HTTP, database)
- [ ] Execution tracking and logging

### Phase 3: Advanced Features
- [ ] Webhook triggers
- [ ] Cron scheduling
- [ ] Advanced tool integrations (Slack, PDF)
- [ ] Member invitation system
- [ ] API key management

### Phase 4: Production Ready
- [ ] Security hardening
- [ ] Performance optimization
- [ ] Monitoring and alerting
- [ ] Comprehensive testing
- [ ] Documentation

## Security Features

- **Authentication**: JWT with refresh token rotation
- **Authorization**: Role-based access control (RBAC)
- **Data Protection**: Encrypted sensitive data, rate limiting
- **Audit Trail**: Complete logging of all actions
- **Input Validation**: Zod schema validation
- **SQL Injection Prevention**: Prisma ORM with parameterized queries

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run linting and formatting
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check the documentation in the `docs/` folder
- Review the API endpoints and examples

---

**Note**: This is Phase 1 of the AutoFlow AI platform. Currently implemented features include authentication, user management, and basic API structure. Workflow execution and AI agent features will be available in Phase 2.
