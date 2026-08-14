import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Initialize SQLite Database
const dbPromise = open({
  filename: './scholarship.db',
  driver: sqlite3.Database
});

export const pool = {
  // Mimic the 'pg' pool.query interface
  query: async (text, params) => {
    const db = await dbPromise;
    // Convert Postgres-style $1, $2 to SQLite ?, ?
    // simple regex replace might work for simple queries, 
    // but cleaner to just use SQLite syntax in the long run.
    // For now, let's try to adapt the query on the fly or just rewrite queries in the routes.
    // Since I can rewrite the routes, I will assume routes will use "match the db driver" syntax.
    // BUT, to keep changes minimal, I can try to shim it.

    // Actually, it's safer to rewrite the routes to use this 'pool' wrapper correctly.
    // Let's make this wrapper accept queries.

    // SQLite doesn't support $1 syntax natively with this driver usually, it uses ? or $name.
    // Let's standardize on ? for SQLite.

    // Standardize on ? for SQLite
    let convertedText = text;
    let convertedParams = params || [];

    if (text.includes('$')) {
      convertedText = text.replace(/\$\d+/g, '?');
    }

    try {
      console.log(`[DB Query] ${convertedText.substring(0, 100)}${convertedText.length > 100 ? '...' : ''} | Params:`, convertedParams);

      if (text.trim().toUpperCase().startsWith('SELECT')) {
        const rows = await db.all(convertedText, convertedParams);
        return { rows };
      } else if (text.trim().toUpperCase().startsWith('INSERT')) {
        // For INSERT with RETURNING, use all()
        // For plain INSERT, use run()
        if (text.toUpperCase().includes('RETURNING')) {
          const result = await db.all(convertedText, convertedParams);
          console.log(`[DB Insert Result] Rows returned: ${result?.length || 0}`);
          return { rows: result };
        } else {
          const result = await db.run(convertedText, convertedParams);
          return { rows: [], rowCount: result.changes, lastID: result.lastID };
        }
      } else {
        const result = await db.run(convertedText, convertedParams);
        return { rows: [], rowCount: result.changes };
      }
    } catch (e) {
      console.error("DB Error:", e.message);
      throw e;
    }
  }
};
