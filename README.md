# OmniGate

A high-performance AI API Gateway that optimizes LLM requests through semantic caching, automated failover, and rate limiting to reduce latency and infrastructure costs.

## Features

- **Semantic Caching:** Reduces duplicate LLM API calls and lowers latency by caching semantic equivalents of prompts.
- **Automated Failover:** Ensures high availability by automatically routing requests to backup models when primary providers experience downtime.
- **Rate Limiting:** Protects your infrastructure and controls costs by limiting the number of requests per consumer.
- **Real-time Dashboard:** Monitor gateway performance, cache hit rates, API usage metrics, and manage configurations.
- **API Key Management:** Secure and flexible management of API keys for consumers.

## Architecture

The project is organized as a monorepo consisting of two main components:

- **`gateway` (Backend):** Built with Node.js, Express, TypeScript, Prisma (PostgreSQL), and Redis. Handles API requests, caching logic, rate limiting, and routing.
- **`dashboard` (Frontend):** Built with React and Vite. Provides a user interface for monitoring metrics and managing the gateway.

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL
- Redis server

## Getting Started

### 1. Install dependencies

From the root directory, install all dependencies for both the gateway and the dashboard:

```bash
npm install
```

### 2. Environment Setup

Create a `.env` file in the `gateway` directory with your database and Redis configuration. For example:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/omnigate?schema=public"
REDIS_URL="redis://localhost:6379"
# Add your LLM provider API keys here as needed
```

### 3. Database Migration

Set up the PostgreSQL database schema using Prisma:

```bash
cd gateway
npx prisma db push
# or npx prisma migrate dev
```

### 4. Start the Application

You can start the gateway from the root directory:

```bash
npm run dev:gateway
```

To start the dashboard, open a new terminal:

```bash
cd dashboard
npm run dev
```
