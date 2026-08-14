import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'scholarship.db');

export async function initDb() {
    console.log("Initializing database schema...");

    if (process.env.DATABASE_URL) {
        console.log("Initializing PostgreSQL tables...");
        const client = new pg.Client({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });
        await client.connect();

        try {
            // Create Users Table
            await client.query(`
                CREATE TABLE IF NOT EXISTS users (
                  id SERIAL PRIMARY KEY,
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

            // Create Scholarships Table
            await client.query(`
                CREATE TABLE IF NOT EXISTS scholarships (
                  id SERIAL PRIMARY KEY,
                  name TEXT UNIQUE,
                  income_limit INTEGER,
                  category_allowed TEXT,
                  course_allowed TEXT,
                  deadline TEXT,
                  link TEXT
                )
            `);

            // Create Applications Table
            await client.query(`
                CREATE TABLE IF NOT EXISTS applications (
                  id SERIAL PRIMARY KEY,
                  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                  scholarship_id INTEGER REFERENCES scholarships(id) ON DELETE CASCADE,
                  status TEXT,
                  sop_content TEXT
                )
            `);

            // Create User Notifications Table
            await client.query(`
                CREATE TABLE IF NOT EXISTS user_notifications (
                  id SERIAL PRIMARY KEY,
                  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                  scholarship_id INTEGER REFERENCES scholarships(id) ON DELETE CASCADE
                )
            `);

            console.log("PostgreSQL tables checked/created successfully.");
        } finally {
            await client.end();
        }
    } else {
        console.log("Initializing SQLite tables...");
        const sqlite3 = await import('sqlite3');
        const { open } = await import('sqlite');
        const db = await open({
            filename: dbPath,
            driver: sqlite3.default.Database
        });

        // Enable foreign keys
        await db.get("PRAGMA foreign_keys = ON");

        // Create Users Table
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

        // Create Scholarships Table (with UNIQUE constraint on name)
        await db.exec(`
            CREATE TABLE IF NOT EXISTS scholarships (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT UNIQUE,
              income_limit INTEGER,
              category_allowed TEXT,
              course_allowed TEXT,
              deadline TEXT,
              link TEXT
            )
        `);

        // Create Applications Table
        await db.exec(`
            CREATE TABLE IF NOT EXISTS applications (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
              scholarship_id INTEGER REFERENCES scholarships(id) ON DELETE CASCADE,
              status TEXT,
              sop_content TEXT
            )
        `);

        // Create User Notifications Table
        await db.exec(`
            CREATE TABLE IF NOT EXISTS user_notifications (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
              scholarship_id INTEGER REFERENCES scholarships(id) ON DELETE CASCADE
            )
        `);

        console.log("SQLite tables checked/created successfully.");
        return db;
    }
}
