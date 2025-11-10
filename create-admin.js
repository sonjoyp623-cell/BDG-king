const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const db = new Database('./bdg.db');

async function createAdmin() {
  const username = process.argv[2] || 'admin';
  const password = process.argv[3] || 'admin123';

  console.log(`Creating admin user: ${username}`);

  const id = uuidv4();
  const hash = await bcrypt.hash(password, 10);

  try {
    const stmt = db.prepare('INSERT INTO users (id, username, password_hash, is_admin) VALUES (?, ?, ?, ?)');
    stmt.run(id, username, hash, 1);
    console.log('✓ Admin user created successfully!');
    console.log(`  Username: ${username}`);
    console.log(`  Password: ${password}`);
  } catch (e) {
    if (e.message.includes('UNIQUE')) {
      console.log('User already exists. Updating to admin...');
      db.prepare('UPDATE users SET is_admin = 1 WHERE username = ?').run(username);
      console.log('✓ User updated to admin successfully!');
    } else {
      console.error('Error:', e.message);
    }
  }

  db.close();
}

createAdmin();
