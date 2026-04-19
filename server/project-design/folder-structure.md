# Project Folder Structure

## Complete Directory Structure

```text
autoflow-ai/
|
|--- src/
|    |
|    |--- config/
|    |    |--- db.js                  # PostgreSQL connection
|    |    |--- redis.js               # Redis connection
|    |    |--- env.js                 # Zod-validated env vars
|    |    |--- constants.js           # Application constants
|    |    |
|    |--- modules/
|    |    |
|    |    |--- auth/
|    |    |    |--- auth.routes.js
|    |    |    |--- auth.controller.js
|    |    |    |--- auth.service.js
|    |    |    |--- auth.schema.js     # Zod schemas
|    |    |
|    |    |--- users/
|    |    |    |--- users.routes.js
|    |    |    |--- users.controller.js
|    |    |    |--- users.service.js
|    |    |    |--- users.repository.js
|    |    |
|    |    |--- workflows/
|    |    |    |--- workflows.routes.js
|    |    |    |--- workflows.controller.js
|    |    |    |--- workflows.service.js
|    |    |    |--- workflows.repository.js
|    |    |    |--- workflows.schema.js
|    |    |
|    |    |--- executions/
|    |    |    |--- executions.routes.js
|    |    |    |--- executions.controller.js
|    |    |    |--- executions.repository.js
|    |    |
|    |    |--- webhooks/
|    |    |    |--- webhooks.routes.js
|    |    |    |--- webhooks.controller.js
|    |    |
|    |    |--- organizations/
|    |    |    |--- organizations.routes.js
|    |    |    |--- organizations.controller.js
|    |    |    |--- organizations.service.js
|    |    |    |--- organizations.repository.js
|    |    |
|    |    |--- api-keys/
|    |    |    |--- apiKeys.routes.js
|    |    |    |--- apiKeys.controller.js
|    |    |    |--- apiKeys.service.js
|    |    |    |--- apiKeys.repository.js
|    |    |
|    |    |--- tools/
|    |    |    |--- tools.routes.js
|    |    |    |--- tools.controller.js
|    |    |    |--- tools.service.js
|    |    |    |--- tools.repository.js
|    |    |
|    |--- agents/
|    |    |
|    |    |--- engine.js              # Core agent loop
|    |    |--- agent.service.js       # Agent orchestration
|    |    |
|    |    |--- tools/
|    |    |    |--- index.js           # Tool registry
|    |    |    |--- email.tool.js
|    |    |    |--- http.tool.js
|    |    |    |--- database.tool.js
|    |    |    |--- slack.tool.js
|    |    |    |--- pdf.tool.js
|    |    |    |--- webhook.tool.js
|    |    |    |--- delay.tool.js
|    |    |
|    |    |--- prompts/
|    |    |    |--- agent.prompt.js
|    |    |    |--- system.prompts.js
|    |    |
|    |--- queues/
|    |    |
|    |    |--- agent.queue.js
|    |    |    |--- email.queue.js
|    |    |    |--- cron.queue.js
|    |    |    |--- cleanup.queue.js
|    |    |
|    |    |--- processors/
|    |    |    |--- agent.processor.js
|    |    |    |--- email.processor.js
|    |    |    |--- cron.processor.js
|    |    |
|    |--- middlewares/
|    |    |
|    |    |--- auth.middleware.js      # JWT verify
|    |    |--- rbac.middleware.js      # Permission check
|    |    |--- rateLimiter.middleware.js
|    |    |--- validate.middleware.js  # Zod validation
|    |    |--- errorHandler.middleware.js
|    |    |--- requestLogger.middleware.js
|    |    |--- cors.middleware.js
|    |    |--- security.middleware.js
|    |    |
|    |--- utils/
|    |    |
|    |    |--- jwt.util.js
|    |    |--- crypto.util.js
|    |    |--- response.util.js       # Standard API response
|    |    |--- logger.util.js         # Winston logger
|    |    |--- pagination.util.js
|    |    |--- validation.util.js
|    |    |--- encryption.util.js
|    |    |--- date.util.js
|    |    |
|    |--- services/
|    |    |
|    |    |--- email.service.js
|    |    |--- storage.service.js
|    |    |--- notification.service.js
|    |    |--- audit.service.js
|    |    |
|    |--- database/
|    |    |
|    |    |--- connection.js
|    |    |--- migrations/
|    |    |    |--- 001_create_organizations.sql
|    |    |    |--- 002_create_users.sql
|    |    |    |--- ...
|    |    |
|    |    |--- seeds/
|    |    |    |--- development.sql
|    |    |
|    |--- tests/
|    |    |
|    |    |--- unit/
|    |    |    |--- auth.test.js
|    |    |    |--- workflows.test.js
|    |    |    |--- agents.test.js
|    |    |
|    |    |--- integration/
|    |    |    |--- api.test.js
|    |    |    |--- queues.test.js
|    |    |
|    |    |--- e2e/
|    |    |    |--- workflow-execution.test.js
|    |    |
|    |    |--- fixtures/
|    |    |    |--- users.json
|    |    |    |--- workflows.json
|    |    |
|    |    |--- helpers/
|    |    |    |--- testDb.js
|    |    |    |--- mockData.js
|    |    |
|    |--- app.js                     # Express app setup
|    |--- server.js                  # Server startup
|    |
|--- prisma/
|    |--- schema.prisma
|    |--- migrations/
|    |--- seed.js
|    |
|--- docs/
|    |--- api.md
|    |--- deployment.md
|    |--- architecture.md
|    |--- contributing.md
|    |
|--- scripts/
|    |--- build.sh
|    |--- deploy.sh
|    |--- backup.sh
|    |--- migrate.sh
|    |
|--- docker/
|    |--- Dockerfile
|    |--- Dockerfile.prod
|    |--- docker-compose.yml
|    |--- docker-compose.prod.yml
|    |--- nginx.conf
|    |
|--- .env.example
|--- .env
|--- .env.local
|--- .env.test
|--- .gitignore
|--- .dockerignore
|--- package.json
|--- package-lock.json
|--- README.md
|--- CHANGELOG.md
|--- LICENSE
|--- tsconfig.json (if using TypeScript)
|--- .eslintrc.js
|--- .prettierrc
|--- nodemon.json
|--- jest.config.js
```

## File Organization Principles

### 1. **Module-Based Structure**
Each feature/module has its own folder with:
- `routes.js` - Express route definitions
- `controller.js` - Request/response handling
- `service.js` - Business logic
- `repository.js` - Database operations
- `schema.js` - Validation schemas

### 2. **Shared Components**
- `config/` - Configuration files
- `middlewares/` - Reusable middleware functions
- `utils/` - Utility functions
- `services/` - Shared services (email, storage, etc.)

### 3. **Agent System**
- `agents/` - AI agent engine and tools
- `queues/` - Job queue management
- `processors/` - Queue job processors

### 4. **Testing Structure**
- `tests/unit/` - Unit tests
- `tests/integration/` - Integration tests
- `tests/e2e/` - End-to-end tests
- `tests/fixtures/` - Test data

## Naming Conventions

### Files
- **kebab-case** for file names: `auth.service.js`
- **camelCase** for functions/variables: `getUserById`
- **PascalCase** for classes: `UserService`

### Folders
- **kebab-case** for folder names: `user-management`
- **plural** for resource folders: `users`, `workflows`

### Database
- **snake_case** for table names: `user_profiles`
- **camelCase** for column names: `createdAt`

## Import Patterns

### Absolute Imports
```javascript
// Using absolute imports with path aliases
import { UserService } from '@/modules/users/users.service';
import { validateInput } from '@/utils/validation.util';
```

### Relative Imports
```javascript
// Within the same module
import { UserRepository } from './users.repository';
import { userSchema } from './users.schema';
```

## Configuration Management

### Environment Files
- `.env.example` - Template with all required variables
- `.env` - Local development (gitignored)
- `.env.test` - Test environment
- `.env.production` - Production environment

### Config Files
- `config/env.js` - Environment validation with Zod
- `config/db.js` - Database configuration
- `config/redis.js` - Redis configuration
- `config/constants.js` - Application constants

## Build and Deployment

### Docker Structure
- `Dockerfile` - Development build
- `Dockerfile.prod` - Production optimized build
- `docker-compose.yml` - Local development setup
- `nginx.conf` - Reverse proxy configuration

### Scripts
- `scripts/build.sh` - Build application
- `scripts/deploy.sh` - Deploy to production
- `scripts/backup.sh` - Database backup
- `scripts/migrate.sh` - Run database migrations

## Development Workflow

### Local Development
```bash
# Start development environment
docker-compose up -d

# Run migrations
npm run migrate

# Start server
npm run dev
```

### Testing
```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Test coverage
npm run test:coverage
```

### Code Quality
```bash
# Lint code
npm run lint

# Format code
npm run format

# Type check (if TypeScript)
npm run type-check
```

## Security Considerations

### File Permissions
- Sensitive files in `.env` should be gitignored
- Database migrations should be version controlled
- SSL certificates should be outside the repository

### Access Control
- Use file system permissions for sensitive files
- Implement proper IAM roles for deployment
- Use secrets management in production

## Scalability Considerations

### Horizontal Scaling
- Stateless application design
- External session storage (Redis)
- Load balancer ready configuration

### Performance
- Separate concerns for better caching
- Database connection pooling
- Queue-based processing for heavy tasks
