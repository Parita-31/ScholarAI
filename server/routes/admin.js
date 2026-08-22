import express from "express";
import { scrapeScholarships } from "../scraper/scholarshipsScraper.js";
import { saveScholarshipsToDB } from "../scraper/saveToDB.js";
import { pool } from "../db.js";

const router = express.Router();

router.get("/sync-scholarships", async (req, res) => {
  try {
    const data = await scrapeScholarships();

    // Clear old data for a fresh sync
    await pool.query("DELETE FROM scholarships");
    await saveScholarshipsToDB(data);

    res.json({
      message: "Scholarships synced successfully. Database has been refreshed.",
      count: data.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Sync failed" });
  }
});

export default router;
