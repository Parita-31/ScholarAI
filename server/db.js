import pg from 'pg';

let pgPool = null;
let dbPromise = null;

if (process.env.DATABASE_URL) {
  console.log("Connecting to PostgreSQL database...");
  pgPool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
} else {
  console.log("Connecting to local SQLite database...");
  dbPromise = (async () => {
    const sqlite3 = await import('sqlite3');
    const { open } = await import('sqlite');
    return open({
      filename: './scholarship.db',
      driver: sqlite3.default.Database
    });
  })();
}

export const pool = {
  // Mimic the 'pg' pool.query interface
  query: async (text, params) => {
    if (pgPool) {
      try {
        console.log(`[PG Query] ${text.substring(0, 100)}${text.length > 100 ? '...' : ''} | Params:`, params);
        const result = await pgPool.query(text, params);
        return result;
      } catch (e) {
        console.error("Postgres DB Error:", e.message);
        throw e;
      }
    } else {
      const db = await dbPromise;
      // Convert Postgres-style $1, $2 to SQLite ?, ?
      let convertedText = text;
      let convertedParams = params || [];

      if (text.includes('$')) {
        convertedText = text.replace(/\$\d+/g, '?');
      }

      try {
        console.log(`[SQLite Query] ${convertedText.substring(0, 100)}${convertedText.length > 100 ? '...' : ''} | Params:`, convertedParams);

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
        console.error("SQLite DB Error:", e.message);
        throw e;
      }
    }
  }
};
