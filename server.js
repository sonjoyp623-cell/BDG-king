const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

const db = new Database('./bdg.db');
const JWT_SECRET = 'change_this_to_a_strong_secret';

// Initialize tables
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE,
  password_hash TEXT,
  balance INTEGER DEFAULT 0,
  is_admin INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS deposits (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  amount INTEGER,
  status TEXT, -- pending/approved/rejected
  created_at INTEGER
);
CREATE TABLE IF NOT EXISTS withdraws (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  amount INTEGER,
  status TEXT,
  created_at INTEGER
);
CREATE TABLE IF NOT EXISTS rounds (
  id TEXT PRIMARY KEY,
  result_color TEXT,
  created_at INTEGER
);
CREATE TABLE IF NOT EXISTS bets (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  round_id TEXT,
  color TEXT,
  amount INTEGER,
  payout INTEGER,
  created_at INTEGER
);
`);

// helper
function authMiddleware(req, res, next){
  const token = req.headers.authorization?.split(' ')[1];
  if(!token) return res.status(401).json({error:'No token'});
  try {
    const data = jwt.verify(token, JWT_SECRET);
    req.user = data;
    next();
  } catch(e){
    return res.status(401).json({error:'Invalid token'});
  }
}

// register
app.post('/api/register', async (req,res)=>{
  const {username, password} = req.body;
  if(!username || !password) return res.status(400).json({error:'Missing'});
  const id = uuidv4();
  const hash = await bcrypt.hash(password, 10);
  try {
    const stmt = db.prepare('INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)');
    stmt.run(id, username, hash);
    res.json({ok:true});
  } catch(e){
    res.status(400).json({error:'User exists'});
  }
});

// login
app.post('/api/login', async (req,res)=>{
  const {username, password} = req.body;
  const row = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if(!row) return res.status(400).json({error:'Invalid'});
  const ok = await bcrypt.compare(password, row.password_hash);
  if(!ok) return res.status(400).json({error:'Invalid'});
  const token = jwt.sign({id: row.id, username: row.username, is_admin: !!row.is_admin}, JWT_SECRET, {expiresIn:'7d'});
  res.json({token});
});

// get profile
app.get('/api/me', authMiddleware, (req,res)=>{
  const row = db.prepare('SELECT id, username, balance, is_admin FROM users WHERE id = ?').get(req.user.id);
  res.json(row);
});

// fake deposit request (user creates a deposit which admin must approve)
app.post('/api/deposits', authMiddleware, (req,res)=>{
  const {amount} = req.body;
  if(!amount || amount <= 0) return res.status(400).json({error:'Invalid amount'});
  const id = uuidv4();
  db.prepare('INSERT INTO deposits (id, user_id, amount, status, created_at) VALUES (?, ?, ?, ?, ?)').run(id, req.user.id, amount, 'pending', Date.now());
  res.json({ok:true, id});
});

// admin: list deposits
app.get('/api/admin/deposits', authMiddleware, (req,res)=>{
  if(!req.user.is_admin) return res.status(403).json({error:'forbidden'});
  const rows = db.prepare('SELECT * FROM deposits ORDER BY created_at DESC').all();
  res.json(rows);
});

// admin: approve deposit
app.post('/api/admin/deposits/:id/approve', authMiddleware, (req,res)=>{
  if(!req.user.is_admin) return res.status(403).json({error:'forbidden'});
  const deposit = db.prepare('SELECT * FROM deposits WHERE id = ?').get(req.params.id);
  if(!deposit) return res.status(404).json({error:'not found'});
  if(deposit.status !== 'pending') return res.status(400).json({error:'already processed'});
  db.prepare('UPDATE deposits SET status = ? WHERE id = ?').run('approved', deposit.id);
  // credit user
  db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(deposit.amount, deposit.user_id);
  res.json({ok:true});
});

// withdraw request
app.post('/api/withdraws', authMiddleware, (req,res)=>{
  const {amount} = req.body;
  if(!amount || amount <= 0) return res.status(400).json({error:'Invalid'});
  const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);
  if(!user || user.balance < amount) return res.status(400).json({error:'Insufficient'});
  const id = uuidv4();
  db.prepare('INSERT INTO withdraws (id, user_id, amount, status, created_at) VALUES (?, ?, ?, ?, ?)').run(id, req.user.id, amount, 'pending', Date.now());
  // optionally lock funds (deduct)
  db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(amount, req.user.id);
  res.json({ok:true, id});
});

// admin: list withdraws
app.get('/api/admin/withdraws', authMiddleware, (req,res)=>{
  if(!req.user.is_admin) return res.status(403).json({error:'forbidden'});
  const rows = db.prepare('SELECT * FROM withdraws ORDER BY created_at DESC').all();
  res.json(rows);
});

// admin: mark withdraw processed/rejected
app.post('/api/admin/withdraws/:id/:action', authMiddleware, (req,res)=>{
  if(!req.user.is_admin) return res.status(403).json({error:'forbidden'});
  const {action} = req.params; // processed or rejected
  const w = db.prepare('SELECT * FROM withdraws WHERE id = ?').get(req.params.id);
  if(!w) return res.status(404).json({error:'not found'});
  if(action === 'processed'){
    db.prepare('UPDATE withdraws SET status = ? WHERE id = ?').run('processed', w.id);
    return res.json({ok:true});
  } else if(action === 'rejected'){
    db.prepare('UPDATE withdraws SET status = ? WHERE id = ?').run('rejected', w.id);
    // refund user
    db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(w.amount, w.user_id);
    return res.json({ok:true});
  }
  res.status(400).json({error:'invalid'});
});

// create a round (admin)
app.post('/api/admin/rounds/create', authMiddleware, (req,res)=>{
  if(!req.user.is_admin) return res.status(403).json({error:'forbidden'});
  const id = uuidv4();
  db.prepare('INSERT INTO rounds (id, result_color, created_at) VALUES (?, ?, ?)').run(id, null, Date.now());
  res.json({ok:true, id});
});

// user place bet
app.post('/api/bets', authMiddleware, (req,res)=>{
  const {round_id, color, amount} = req.body;
  if(!round_id || !color || !amount) return res.status(400).json({error:'Missing'});
  const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);
  if(!user || user.balance < amount) return res.status(400).json({error:'Insufficient'});
  const round = db.prepare('SELECT * FROM rounds WHERE id = ?').get(round_id);
  if(!round) return res.status(404).json({error:'Round not found'});
  // lock funds (deduct immediately)
  db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(amount, req.user.id);
  const betId = uuidv4();
  db.prepare('INSERT INTO bets (id, user_id, round_id, color, amount, payout, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(betId, req.user.id, round_id, color, amount, 0, Date.now());
  res.json({ok:true, betId});
});

// admin: settle round (pick result_color and pay winners)
app.post('/api/admin/rounds/:id/settle', authMiddleware, (req,res)=>{
  if(!req.user.is_admin) return res.status(403).json({error:'forbidden'});
  const {id} = req.params;
  const {result_color} = req.body;
  if(!result_color) return res.status(400).json({error:'missing color'});
  const round = db.prepare('SELECT * FROM rounds WHERE id = ?').get(id);
  if(!round) return res.status(404).json({error:'not found'});
  // update
  db.prepare('UPDATE rounds SET result_color = ? WHERE id = ?').run(result_color, id);
  // settle bets: simple payout: if matched color => 2x return (original + winnings)
  const bets = db.prepare('SELECT * FROM bets WHERE round_id = ?').all(id);
  const payoutStmt = db.prepare('UPDATE bets SET payout = ? WHERE id = ?');
  const creditStmt = db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?');
  for(const b of bets){
    if(b.color === result_color){
      const win = b.amount * 2; // configurable
      payoutStmt.run(win, b.id);
      creditStmt.run(win, b.user_id);
    }
  }
  res.json({ok:true});
});

// simple public routes to list rounds/bets
app.get('/api/rounds', (req,res)=>{
  const rows = db.prepare('SELECT * FROM rounds ORDER BY created_at DESC LIMIT 20').all();
  res.json(rows);
});
app.get('/api/bets/user', authMiddleware, (req,res)=>{
  const rows = db.prepare('SELECT * FROM bets WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json(rows);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, ()=> console.log('Server started on', PORT));
