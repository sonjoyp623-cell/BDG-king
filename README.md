# BDG-king

Real withdrawal and deposit monthly reward and level up big bonus

## Betting Game Backend API

A Node.js/Express backend API for a betting/gaming platform with user authentication, deposits, withdrawals, and betting rounds.

## Features

- **User Authentication**: Register/Login with JWT tokens
- **Balance Management**: Deposit and withdrawal system with admin approval
- **Betting System**: Create rounds, place bets, and settle results
- **Admin Panel**: Admin endpoints for managing deposits, withdrawals, and rounds
- **SQLite Database**: Lightweight database using better-sqlite3

## Installation

```bash
npm install
```

## Running the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

Server runs on `http://localhost:4000` by default.

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - Login and get JWT token
- `GET /api/me` - Get current user profile (requires auth)

### Deposits
- `POST /api/deposits` - Request a deposit (requires auth)
- `GET /api/admin/deposits` - List all deposits (admin only)
- `POST /api/admin/deposits/:id/approve` - Approve deposit (admin only)

### Withdrawals
- `POST /api/withdraws` - Request withdrawal (requires auth)
- `GET /api/admin/withdraws` - List all withdrawals (admin only)
- `POST /api/admin/withdraws/:id/:action` - Process/reject withdrawal (admin only)

### Betting
- `POST /api/admin/rounds/create` - Create new betting round (admin only)
- `POST /api/bets` - Place a bet (requires auth)
- `POST /api/admin/rounds/:id/settle` - Settle round with result (admin only)
- `GET /api/rounds` - List recent rounds (public)
- `GET /api/bets/user` - Get user's betting history (requires auth)

## Database Schema

- **users**: User accounts with balance and admin flag
- **deposits**: Deposit requests with approval status
- **withdraws**: Withdrawal requests with processing status
- **rounds**: Betting rounds with results
- **bets**: Individual bets placed by users

## Security Notes

⚠️ **IMPORTANT**: Change the `JWT_SECRET` in `server.js` to a strong secret key before deploying to production!

## Authentication

Include JWT token in Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Creating an Admin User

After registering a user, manually update the database to make them admin:
```sql
UPDATE users SET is_admin = 1 WHERE username = 'admin_username';
```

## Example Usage

### Register a User
```bash
curl -X POST http://localhost:4000/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'
```

### Login
```bash
curl -X POST http://localhost:4000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'
```

### Place a Bet
```bash
curl -X POST http://localhost:4000/api/bets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"round_id":"ROUND_ID","color":"red","amount":100}'
```
