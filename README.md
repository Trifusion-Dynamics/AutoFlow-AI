# AutoFlow AI

[![CI Status](https://github.com/autoflow/autoflow/actions/workflows/ci.yml/badge.svg)](https://github.com/autoflow/autoflow/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**AutoFlow AI** is a production-ready, AI-native workflow automation platform. Build, scale, and monitor complex LLM-powered agents with ease.

---

## ⚡ Quick Start

1. **Deploy in 30 Seconds**
   ```bash
   docker-compose up -d
   ```

2. **Initialize Client**
   ```javascript
   const autoflow = new AutoFlowAI({ apiKey: 'ak_live_...' });
   ```

3. **Deploy Your First Agent**
   ```javascript
   await autoflow.workflows.create({
     name: 'Support Agent',
     aiModel: 'gpt-4o',
     steps: [{ tool: 'gmail', action: 'send_email' }]
   });
   ```

---

## 🏗️ Core Concepts

- **Workflows**: Visual and code-based directed graphs of task logic.
- **Agent Engine**: Multi-modal reasoning core (GPT-4o, Claude 3.5, Gemini 1.5).
- **Triggers**: Webhooks (real-time), Cron (scheduled), or Manual (API).
- **Integrations**: native connectors for Slack, Gmail, Notion, and HubSpot.
- **Marketplace**: Share and discover community-vetted automation templates.

---

## 🛠️ Developer SDK

AutoFlow AI is built for developers first. Our official SDK simplifies authentication, error handling, and type safety.

```javascript
import { AutoFlowAI } from '@autoflow/sdk';

const client = new AutoFlowAI({ apiKey: process.env.AUTOFLOW_API_KEY });
const execution = await client.workflows.run('workflow_id', { input: { query: 'summarize latest news' } });
```

[Read SDK Documentation →](/sdk/docs)

---

## 🛡️ Enterprise Ready

- **GDPR Compliant**: Data export and "Right to Erasure" built-in.
- **Secure**: All credentials encrypted with AES-256-GCM.
- **Scalable**: Redis-backed queueing and state management.
- **Audit Logs**: Full traceability of every configuration change and execution.

---

## 🗺️ Architecture

```text
[ Client / SDK ] <───> [ Nginx Load Balancer ]
                             │
            ┌────────────────┴────────────────┐
            │                                 │
     [ AI Engine ] <──> [ BullMQ / Redis ] <──> [ API Workers ]
            │                                 │
            └────────────────┬────────────────┘
                             │
                   [ PostgreSQL (Prisma) ]
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

Developed by **AutoFlow AI Team**.
