# API express & typeORM template

REST API built with Node.js, Express and TypeORM.

## Prerequisites

- Node.js 18+
- PostgreSQL

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file at the project root:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=trade_db
PORT=3000
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript project |
| `npm start` | Start server (production) |
| `npm run dev` | Start in development mode |
| `npm run dev:watch` | Auto-recompile on changes |

## Getting Started

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

## Project Structure

```
api/
├── src/
│   ├── entities/        # TypeORM entities
│   ├── data-source.ts   # TypeORM configuration
│   └── index.ts         # Entry point
├── dist/                # Compiled code
├── package.json
└── tsconfig.json
```

## Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/` | Welcome message |
| GET | `/api/status` | API status |

## Tech Stack

- **Express** - Web framework
- **TypeORM** - PostgreSQL ORM
- **TypeScript** - Static typing
