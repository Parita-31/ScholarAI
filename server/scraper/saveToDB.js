import { pool } from "../db.js";

export async function saveScholarshipsToDB(list) {
  for (const s of list) {
    if (!s.name || s.name.trim() === "") continue; // ⛔ FINAL GUARD

    await pool.query(
      `
      INSERT INTO scholarships
      (name, income_limit, category_allowed, course_allowed, deadline)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (name) DO NOTHING
      `,
      [
        s.name,
        s.income_limit,
        JSON.stringify(s.category_allowed),
        JSON.stringify(s.course_allowed),
        s.deadline ? new Date(s.deadline) : null,
      ],
    );
  }
}
