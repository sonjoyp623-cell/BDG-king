# BDG-King API Documentation

## Base URL
```
http://localhost:4000
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Endpoints

### 1. User Authentication

#### Register User
**POST** `/api/register`

Register a new user account.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "ok": true
}
```

**Error Response:**
```json
{
  "error": "User exists"
}
```

---

#### Login
**POST** `/api/login`

Login and receive JWT token.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response:**
```json
{
  "error": "Invalid"
}
```

---

#### Get Profile
**GET** `/api/me`

Get current user's profile information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "uuid",
  "username": "string",
  "balance": 0,
  "is_admin": 0
}
```

---

### 2. Deposits

#### Request Deposit
**POST** `/api/deposits`

Create a deposit request (requires admin approval).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "amount": 1000
}
```

**Response:**
```json
{
  "ok": true,
  "id": "deposit_uuid"
}
```

---

#### List All Deposits (Admin Only)
**GET** `/api/admin/deposits`

Get all deposit requests.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "amount": 1000,
    "status": "pending",
    "created_at": 1699999999999
  }
]
```

---

#### Approve Deposit (Admin Only)
**POST** `/api/admin/deposits/:id/approve`

Approve a pending deposit and credit user's balance.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "ok": true
}
```

---

### 3. Withdrawals

#### Request Withdrawal
**POST** `/api/withdraws`

Request a withdrawal (funds are immediately deducted).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "amount": 500
}
```

**Response:**
```json
{
  "ok": true,
  "id": "withdraw_uuid"
}
```

**Error Response:**
```json
{
  "error": "Insufficient"
}
```

---

#### List All Withdrawals (Admin Only)
**GET** `/api/admin/withdraws`

Get all withdrawal requests.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "amount": 500,
    "status": "pending",
    "created_at": 1699999999999
  }
]
```

---

#### Process/Reject Withdrawal (Admin Only)
**POST** `/api/admin/withdraws/:id/:action`

Process or reject a withdrawal request.

**URL Parameters:**
- `action`: Either `processed` or `rejected`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "ok": true
}
```

**Note:** If rejected, the amount is refunded to the user's balance.

---

### 4. Betting Rounds

#### Create Round (Admin Only)
**POST** `/api/admin/rounds/create`

Create a new betting round.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "ok": true,
  "id": "round_uuid"
}
```

---

#### List Rounds (Public)
**GET** `/api/rounds`

Get the last 20 rounds.

**Response:**
```json
[
  {
    "id": "uuid",
    "result_color": "red",
    "created_at": 1699999999999
  }
]
```

---

#### Settle Round (Admin Only)
**POST** `/api/admin/rounds/:id/settle`

Settle a round with the winning color and pay winners.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "result_color": "red"
}
```

**Response:**
```json
{
  "ok": true
}
```

**Payout Logic:**
- Winning bets receive 2x their bet amount
- Losing bets receive nothing (already deducted)

---

### 5. Bets

#### Place Bet
**POST** `/api/bets`

Place a bet on a round.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "round_id": "uuid",
  "color": "red",
  "amount": 100
}
```

**Response:**
```json
{
  "ok": true,
  "betId": "bet_uuid"
}
```

**Error Responses:**
```json
{
  "error": "Insufficient"
}
```
```json
{
  "error": "Round not found"
}
```

---

#### Get User Bets
**GET** `/api/bets/user`

Get current user's betting history.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "round_id": "uuid",
    "color": "red",
    "amount": 100,
    "payout": 200,
    "created_at": 1699999999999
  }
]
```

---

## Error Codes

- `400` - Bad Request (missing parameters, invalid data)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (admin access required)
- `404` - Not Found (resource doesn't exist)

---

## Database Schema

### users
```sql
id TEXT PRIMARY KEY
username TEXT UNIQUE
password_hash TEXT
balance INTEGER DEFAULT 0
is_admin INTEGER DEFAULT 0
```

### deposits
```sql
id TEXT PRIMARY KEY
user_id TEXT
amount INTEGER
status TEXT (pending/approved/rejected)
created_at INTEGER
```

### withdraws
```sql
id TEXT PRIMARY KEY
user_id TEXT
amount INTEGER
status TEXT (pending/processed/rejected)
created_at INTEGER
```

### rounds
```sql
id TEXT PRIMARY KEY
result_color TEXT
created_at INTEGER
```

### bets
```sql
id TEXT PRIMARY KEY
user_id TEXT
round_id TEXT
color TEXT
amount INTEGER
payout INTEGER
created_at INTEGER
```

---

## Example Workflow

### 1. User Registration and Deposit
```bash
# Register
curl -X POST http://localhost:4000/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"player1","password":"pass123"}'

# Login
curl -X POST http://localhost:4000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"player1","password":"pass123"}'

# Request deposit
curl -X POST http://localhost:4000/api/deposits \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"amount":1000}'
```

### 2. Admin Approves Deposit
```bash
# Admin approves deposit
curl -X POST http://localhost:4000/api/admin/deposits/<deposit_id>/approve \
  -H "Authorization: Bearer <admin_token>"
```

### 3. User Places Bet
```bash
# Admin creates round
curl -X POST http://localhost:4000/api/admin/rounds/create \
  -H "Authorization: Bearer <admin_token>"

# User places bet
curl -X POST http://localhost:4000/api/bets \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"round_id":"<round_id>","color":"red","amount":100}'
```

### 4. Admin Settles Round
```bash
# Admin settles with winning color
curl -X POST http://localhost:4000/api/admin/rounds/<round_id>/settle \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"result_color":"red"}'
```

---

## Security Notes

⚠️ **IMPORTANT FOR PRODUCTION:**

1. Change `JWT_SECRET` to a strong, random secret
2. Use HTTPS in production
3. Implement rate limiting
4. Add input validation and sanitization
5. Use environment variables for sensitive data
6. Implement proper password policies
7. Add logging and monitoring
8. Consider using a production database (PostgreSQL, MySQL)
9. Implement CORS properly for your frontend domain
10. Add request size limits

---

## Development Tips

### Creating an Admin User
After registering a user, manually update the database:
```bash
sqlite3 bdg.db "UPDATE users SET is_admin = 1 WHERE username = 'admin';"
```

### Checking Database
```bash
sqlite3 bdg.db "SELECT * FROM users;"
sqlite3 bdg.db "SELECT * FROM deposits;"
sqlite3 bdg.db "SELECT * FROM rounds;"
```

### Resetting Database
```bash
rm bdg.db
# Restart server to recreate tables
```
