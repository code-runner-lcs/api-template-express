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

# SMTP Configuration for Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@example.com

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000
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

### Endpoints overview

| Method | Route | Description | Body / Query |
|---------|-------|-------------|---------------|
| GET | `/` | Welcome message | — |
| POST | `/auth/login` | Login | `{ email, password }` |
| POST | `/auth/register` | Registration | `{ name, email, password }` |
| GET | `/auth/me` | Current user (JWT required) | Header `Authorization: Bearer <token>` |
| GET | `/auth/confirm-email` | Confirmer l’email | Query `?token=<jwt>` |
| POST | `/auth/reset-password` | Reset password | `{ token, password }` |
| POST | `/auth/ask-password-reset` | Request password reset email | `{ to }` (email) |
| POST | `/auth/confirmation` | Send confirmation email | `{ to, name }` |

### Exemples d’utilisation

#### Login
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "myPassword123"
}
```

#### Registration
```bash
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "myPassword123"
}
```

#### Request password reset
```bash
POST /auth/ask-password-reset
Content-Type: application/json

{
  "to": "user@example.com"
}
```

#### Reset password
```bash
POST /auth/reset-password
Content-Type: application/json

{
  "token": "<jwt received by email>",
  "password": "newPassword123"
}
```

#### Send confirmation email
```bash
POST /auth/confirmation
Content-Type: application/json

{
  "to": "user@example.com",
  "name": "John Doe"
}
```

## Tech Stack

- **Express** - Web framework
- **TypeORM** - PostgreSQL ORM
- **TypeScript** - Static typing
- **Nodemailer** - Email service
