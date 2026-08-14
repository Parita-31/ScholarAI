import express from "express";
import { scrapeScholarships } from "../scraper/scholarshipsScraper.js";
import { saveScholarshipsToDB } from "../scraper/saveToDB.js";
import { pool } from "../db.js";
import { sendMatchEmail } from "../services/emailService.js";
import { getMatchesForUser, triggerMatchNotifications } from "../services/matchingService.js";

const router = express.Router();

router.get("/scrape", async (req, res) => {
  try {
    const data = await scrapeScholarships();
    await saveScholarshipsToDB(data);

    res.json({
      message: "Scholarships scraped and saved successfully",
      count: data.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Scraping failed" });
  }
});

router.post("/recommend", async (req, res) => {
  try {
    const matches = await getMatchesForUser(req.body);

    // Trigger Notification for top matches
    // Note: req.body must contain id, email, name for notifications to work
    await triggerMatchNotifications(req.body, matches);

    res.json(matches);
  } catch (err) {
    console.error("Recommendation Error:", err.message);
    res.status(500).json({ error: "Matching failed" });
  }
});

router.post("/notify", async (req, res) => {
  const { user, scholarship } = req.body;

  if (!user || !scholarship) {
    return res.status(400).json({ error: "Missing user or scholarship data" });
  }

  try {
    console.log(`Manual notification request for ${scholarship.name} to ${user.email}`);
    const result = await sendMatchEmail(user.email, user.name, scholarship);

    if (result.success) {
      // Track it
      await pool.query(
        "INSERT OR IGNORE INTO user_notifications (user_id, scholarship_id) VALUES ($1,$2)",
        [user.id, scholarship.id]
      );
      res.json({ message: "Notification sent successfully", previewUrl: result.previewUrl });
    } else {
      res.status(400).json({
        error: "Failed to send email",
        message: result.error || "Please check your server configuration."
      });
    }
  } catch (err) {
    console.error("Manual Notification Error:", err.message);
    res.status(500).json({ error: "System Error", message: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM scholarships ORDER BY deadline ASC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
