import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'scholarship.db');

export async function initDb() {
    console.log("Initializing database...");
    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    // Create/Update users table
    await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      income INTEGER DEFAULT 0,
      category TEXT DEFAULT 'General',
      course TEXT,
      state TEXT,
      education_level TEXT DEFAULT 'Undergraduate',
      gpa REAL DEFAULT 0
    )
  `);

    // Create notifications table if missing
    await db.exec(`
    CREATE TABLE IF NOT EXISTS user_notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      scholarship_id INTEGER,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(scholarship_id) REFERENCES scholarships(id)
    )
  `);

    console.log("Database initialized successfully.");
    return db;
}
