/**
 * SQLite Database Service for Production
 * Real database with SQL queries, transactions, and concurrent access
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class SQLiteDatabase {
  constructor() {
    this.dbPath = path.join(process.cwd(), 'data', 'sovereign_lattice.db');
    this.db = null;
  }

  async initialize() {
    return new Promise((resolve, reject) => {
      // Ensure data directory exists
      const dataDir = path.dirname(this.dbPath);
      if (!require('fs').existsSync(dataDir)) {
        require('fs').mkdirSync(dataDir, { recursive: true });
      }

      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('❌ SQLite connection failed:', err.message);
          reject(err);
        } else {
          console.log('✅ SQLite database connected:', this.dbPath);
          this.createTables().then(resolve).catch(reject);
        }
      });
    });
  }

  async createTables() {
    return new Promise((resolve, reject) => {
      const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          address TEXT UNIQUE NOT NULL,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          security_code TEXT NOT NULL,
          balance REAL DEFAULT 0,
          usd_balance REAL DEFAULT 0,
          role TEXT DEFAULT 'user',
          is_founder BOOLEAN DEFAULT 0,
          profile_data TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;

      const createTransactionsTable = `
        CREATE TABLE IF NOT EXISTS transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_address TEXT NOT NULL,
          transaction_id TEXT UNIQUE NOT NULL,
          type TEXT NOT NULL,
          amount REAL NOT NULL,
          unit TEXT NOT NULL,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_address) REFERENCES users (address)
        )
      `;

      this.db.serialize(() => {
        this.db.run(createUsersTable);
        this.db.run(createTransactionsTable, (err) => {
          if (err) {
            reject(err);
          } else {
            console.log('✅ Database tables created');
            this.insertFounder().then(resolve).catch(reject);
          }
        });
      });
    });
  }

  async insertFounder() {
    return new Promise((resolve, reject) => {
      const founderData = {
        address: '0xd3d9dbc928c765d19fef1da0bb4df83736975730',
        username: 'Freedom24/7365',
        password_hash: 'founder_hash_7777',
        security_code: '77777',
        balance: 1000,
        usd_balance: 1000000,
        role: 'admin',
        is_founder: 1,
        profile_data: JSON.stringify({
          profileId: 'founder_freedom247365',
          publicKey: 'qbs1qpxr9y7g9dw0sn54kce6mua7lqpzry9x8gf2tvdw0s3jn54khce6mua7lqpzry9x8gf2tvdw0s3jn54khce6mua7lqpzry9x8gf2tvdw0s3jn54khce6mua7lw2p',
          tagline: 'Sovereign Lattice Founder',
          bio: 'Genesis Node',
          level: 1,
          xp: 0,
          verified: true
        })
      };

      const insertSQL = `
        INSERT OR REPLACE INTO users 
        (address, username, password_hash, security_code, balance, usd_balance, role, is_founder, profile_data)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(insertSQL, [
        founderData.address,
        founderData.username,
        founderData.password_hash,
        founderData.security_code,
        founderData.balance,
        founderData.usd_balance,
        founderData.role,
        founderData.is_founder,
        founderData.profile_data
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          console.log('✅ Founder profile inserted with ID:', this.lastID);
          resolve();
        }
      });
    });
  }

  async getUser(identifier) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM users 
        WHERE username = ? OR address = ?
      `;
      
      this.db.get(sql, [identifier, identifier], (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          const user = {
            ...JSON.parse(row.profile_data || '{}'),
            address: row.address,
            username: row.username,
            passwordHash: row.password_hash,
            securityCode: row.security_code,
            balance: row.balance,
            usdBalance: row.usd_balance,
            role: row.role,
            isFounder: Boolean(row.is_founder),
            created: row.created_at,
            lastModified: row.updated_at
          };
          resolve(user);
        } else {
          resolve(null);
        }
      });
    });
  }

  async saveUser(userData) {
    return new Promise((resolve, reject) => {
      const profileData = { ...userData };
      delete profileData.address;
      delete profileData.username;
      delete profileData.passwordHash;
      delete profileData.securityCode;
      delete profileData.balance;
      delete profileData.usdBalance;
      delete profileData.role;
      delete profileData.isFounder;

      const sql = `
        INSERT OR REPLACE INTO users 
        (address, username, password_hash, security_code, balance, usd_balance, role, is_founder, profile_data, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;

      this.db.run(sql, [
        userData.address,
        userData.username,
        userData.passwordHash || userData.password,
        userData.securityCode,
        userData.balance,
        userData.usdBalance,
        userData.role,
        userData.isFounder ? 1 : 0,
        JSON.stringify(profileData)
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          console.log('✅ User saved:', userData.username);
          resolve();
        }
      });
    });
  }

  async addTransaction(userAddress, transactionData) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO transactions 
        (user_address, transaction_id, type, amount, unit, description)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      this.db.run(sql, [
        userAddress,
        transactionData.id,
        transactionData.type,
        parseFloat(transactionData.amount),
        transactionData.unit,
        transactionData.description
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  async getUserTransactions(userAddress) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM transactions 
        WHERE user_address = ? 
        ORDER BY created_at DESC
      `;
      
      this.db.all(sql, [userAddress], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => ({
            id: row.transaction_id,
            type: row.type,
            amount: row.amount.toString(),
            unit: row.unit,
            description: row.description,
            timestamp: row.created_at
          })));
        }
      });
    });
  }

  async close() {
    if (this.db) {
      this.db.close();
    }
  }
}

module.exports = SQLiteDatabase;
