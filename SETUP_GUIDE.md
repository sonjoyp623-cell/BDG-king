# BDG-King Backend Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```

The server will start on `http://localhost:4000`

### 3. Create Admin User
```bash
node create-admin.js admin admin123
```

## Project Structure

```
/vercel/sandbox/
├── server.js                    # Main Express server
├── package.json                 # Dependencies and scripts
├── create-admin.js              # Admin user creation utility
├── test-api.sh                  # Basic API tests
├── full-workflow-test.sh        # Complete workflow test
├── API_DOCUMENTATION.md         # Complete API reference
├── SETUP_GUIDE.md              # This file
├── README.md                    # Project overview
├── .env.example                 # Environment variables template
├── .gitignore                   # Git ignore rules
└── bdg.db                       # SQLite database (auto-created)
```

## Features

### User Management
- ✅ User registration with password hashing (bcrypt)
- ✅ JWT-based authentication
- ✅ User profiles with balance tracking
- ✅ Admin role support

### Financial Operations
- ✅ Deposit requests with admin approval
- ✅ Withdrawal requests with admin processing
- ✅ Balance management
- ✅ Transaction history

### Betting System
- ✅ Round creation (admin)
- ✅ Bet placement with color selection
- ✅ Round settlement with automatic payouts
- ✅ 2x payout for winning bets
- ✅ Bet history tracking

## Testing

### Run Basic Tests
```bash
./test-api.sh
```

### Run Full Workflow Test
```bash
./full-workflow-test.sh
```

This test demonstrates:
1. Admin login
2. Player registration and login
3. Deposit request and approval
4. Round creation
5. Bet placement
6. Round settlement
7. Withdrawal request and processing

### Manual Testing with curl

#### Register a User
```bash
curl -X POST http://localhost:4000/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"pass123"}'
```

#### Login
```bash
curl -X POST http://localhost:4000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"pass123"}'
```

#### Get Profile (with token)
```bash
curl -X GET http://localhost:4000/api/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Database Management

### View Database Contents
```bash
# Install sqlite3 if needed
sudo dnf install sqlite

# View users
sqlite3 bdg.db "SELECT * FROM users;"

# View deposits
sqlite3 bdg.db "SELECT * FROM deposits;"

# View withdrawals
sqlite3 bdg.db "SELECT * FROM withdraws;"

# View rounds
sqlite3 bdg.db "SELECT * FROM rounds;"

# View bets
sqlite3 bdg.db "SELECT * FROM bets;"
```

### Reset Database
```bash
rm bdg.db
npm start  # Will recreate tables
```

### Make User Admin
```bash
sqlite3 bdg.db "UPDATE users SET is_admin = 1 WHERE username = 'username';"
```

Or use the helper script:
```bash
node create-admin.js username password
```

## API Endpoints Summary

### Public Endpoints
- `POST /api/register` - Register new user
- `POST /api/login` - Login and get token
- `GET /api/rounds` - List recent rounds

### User Endpoints (Requires Auth)
- `GET /api/me` - Get profile
- `POST /api/deposits` - Request deposit
- `POST /api/withdraws` - Request withdrawal
- `POST /api/bets` - Place bet
- `GET /api/bets/user` - Get bet history

### Admin Endpoints (Requires Admin Auth)
- `GET /api/admin/deposits` - List all deposits
- `POST /api/admin/deposits/:id/approve` - Approve deposit
- `GET /api/admin/withdraws` - List all withdrawals
- `POST /api/admin/withdraws/:id/:action` - Process/reject withdrawal
- `POST /api/admin/rounds/create` - Create new round
- `POST /api/admin/rounds/:id/settle` - Settle round

## Configuration

### Environment Variables
Create a `.env` file (see `.env.example`):
```env
PORT=4000
JWT_SECRET=your_strong_secret_key_here
```

### JWT Secret
⚠️ **IMPORTANT**: Change the JWT secret in production!

Edit `server.js` and update:
```javascript
const JWT_SECRET = 'your_strong_secret_key_here';
```

Or use environment variable:
```javascript
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_to_a_strong_secret';
```

## Development

### Development Mode with Auto-Reload
```bash
npm run dev
```

This uses `nodemon` to automatically restart the server when files change.

### Adding New Features

1. **Add Database Tables**: Update the `db.exec()` section in `server.js`
2. **Add Routes**: Add new Express routes
3. **Add Middleware**: Create middleware functions for validation, etc.
4. **Update Tests**: Add tests for new features

## Production Deployment

### Security Checklist
- [ ] Change JWT_SECRET to a strong random value
- [ ] Use HTTPS
- [ ] Implement rate limiting
- [ ] Add input validation and sanitization
- [ ] Use environment variables for all secrets
- [ ] Implement proper CORS configuration
- [ ] Add request logging
- [ ] Set up monitoring and alerts
- [ ] Use a production database (PostgreSQL/MySQL)
- [ ] Implement backup strategy
- [ ] Add request size limits
- [ ] Implement password policies
- [ ] Add 2FA for admin accounts
- [ ] Set up proper error handling
- [ ] Add API versioning

### Recommended Production Setup
```bash
# Use PM2 for process management
npm install -g pm2
pm2 start server.js --name bdg-king

# Set up nginx as reverse proxy
# Configure SSL/TLS certificates
# Set up database backups
# Configure monitoring (e.g., New Relic, DataDog)
```

## Troubleshooting

### Server Won't Start
```bash
# Check if port 4000 is already in use
lsof -i :4000

# Kill process using the port
kill -9 <PID>
```

### Database Locked Error
```bash
# Close all connections to the database
# Restart the server
npm start
```

### Build Errors (better-sqlite3)
```bash
# Install build tools
sudo dnf install -y make gcc gcc-c++ python3-devel

# Rebuild native modules
npm rebuild
```

### Token Expired
Tokens expire after 7 days. Login again to get a new token.

## Support

For issues or questions:
1. Check the API documentation: `API_DOCUMENTATION.md`
2. Review the test scripts for examples
3. Check server logs for errors

## License

ISC
