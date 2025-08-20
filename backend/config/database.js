const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs').promises;

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '..', 'database.sqlite');

let db = null;

// Initialize database connection
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('❌ Error opening database:', err.message);
        reject(err);
      } else {
        console.log('✅ Connected to SQLite database');
        createTables()
          .then(() => resolve())
          .catch(reject);
      }
    });
  });
}

// Create all necessary tables
function createTables() {
  return new Promise((resolve, reject) => {
    const tables = [
      // Visa applications table
      `CREATE TABLE IF NOT EXISTS visa_applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        application_id TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        nationality TEXT NOT NULL,
        passport_number TEXT NOT NULL,
        visa_type TEXT NOT NULL,
        purpose_of_visit TEXT NOT NULL,
        duration_of_stay INTEGER NOT NULL,
        arrival_date TEXT NOT NULL,
        departure_date TEXT NOT NULL,
        accommodation_details TEXT,
        sponsor_information TEXT,
        previous_uae_visit TEXT,
        criminal_record TEXT,
        medical_conditions TEXT,
        emergency_contact_name TEXT,
        emergency_contact_phone TEXT,
        emergency_contact_relationship TEXT,
        passport_copy_path TEXT,
        photo_path TEXT,
        cv_path TEXT,
        additional_documents_path TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Contact messages table
      `CREATE TABLE IF NOT EXISTS contact_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message_id TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        inquiry_type TEXT NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        preferred_contact TEXT DEFAULT 'email',
        urgency_level TEXT DEFAULT 'medium',
        newsletter_subscription BOOLEAN DEFAULT false,
        status TEXT DEFAULT 'new',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Feedback table
      `CREATE TABLE IF NOT EXISTS feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        feedback_id TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        visa_type TEXT,
        service_rating INTEGER NOT NULL CHECK (service_rating >= 1 AND service_rating <= 5),
        would_recommend TEXT NOT NULL,
        feedback_title TEXT NOT NULL,
        feedback_message TEXT NOT NULL,
        aspects_impressed TEXT,
        allow_public_display BOOLEAN DEFAULT false,
        allow_contact BOOLEAN DEFAULT false,
        status TEXT DEFAULT 'pending',
        is_featured BOOLEAN DEFAULT false,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Newsletter subscriptions table
      `CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT,
        subscription_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        unsubscribe_token TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Application status tracking
      `CREATE TABLE IF NOT EXISTS application_status_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        application_id TEXT NOT NULL,
        old_status TEXT,
        new_status TEXT NOT NULL,
        notes TEXT,
        changed_by TEXT DEFAULT 'system',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (application_id) REFERENCES visa_applications (application_id)
      )`
    ];

    let completed = 0;
    const total = tables.length;

    tables.forEach((tableSQL, index) => {
      db.run(tableSQL, (err) => {
        if (err) {
          console.error(`❌ Error creating table ${index + 1}:`, err.message);
          reject(err);
        } else {
          completed++;
          console.log(`✅ Table ${index + 1}/${total} created successfully`);
          
          if (completed === total) {
            console.log('✅ All database tables created successfully');
            resolve();
          }
        }
      });
    });
  });
}

// Get database instance
function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

// Execute a query with parameters
function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    database.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
}

// Get single row
function getRow(sql, params = []) {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    database.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

// Get multiple rows
function getRows(sql, params = []) {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    database.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Close database connection
function closeDatabase() {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          reject(err);
        } else {
          console.log('✅ Database connection closed');
          db = null;
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
}

// Database health check
function healthCheck() {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }
    
    db.get('SELECT 1 as test', (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve({ status: 'healthy', test: row.test });
      }
    });
  });
}

module.exports = {
  initializeDatabase,
  getDatabase,
  runQuery,
  getRow,
  getRows,
  closeDatabase,
  healthCheck
};