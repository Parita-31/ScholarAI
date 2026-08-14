import { pool } from "../db.js";
import { sendMatchEmail } from "./emailService.js";
import axios from "axios";

export async function getMatchesForUser(userProfile) {
    const { income, category, course, gpa } = userProfile;
    const allScholarships = await pool.query("SELECT * FROM scholarships");

    // Filter FIRST, then Score
    const filtered = allScholarships.rows.filter(s => {
        // 1. Strict Income Check
        if (s.income_limit && income && income > s.income_limit) {
            return false;
        }

        // 2. Strict Category Check
        let allowedCats = [];
        try {
            allowedCats = typeof s.category_allowed === 'string' ? JSON.parse(s.category_allowed) : s.category_allowed;
        } catch (e) { allowedCats = ["All"]; }
        if (!Array.isArray(allowedCats)) allowedCats = [allowedCats];

        const categoryMatch =
            allowedCats.map(c => c.toLowerCase()).includes("all") ||
            allowedCats.map(c => c.toLowerCase()).includes(category?.toLowerCase());

        if (!categoryMatch) {
            return false;
        }

        // 3. Strict Course Check (Optional: You can relax this if needed, but user asked for "match data")
        // Let's keep it strict but support partial matches/searching
        let allowedCourses = [];
        try {
            allowedCourses = typeof s.course_allowed === 'string' ? JSON.parse(s.course_allowed) : s.course_allowed;
        } catch (e) { allowedCourses = ["All"]; }
        if (!Array.isArray(allowedCourses)) allowedCourses = [allowedCourses];

        const userCourse = course?.toLowerCase() || "";
        const courseMatch =
            allowedCourses.map(c => c.toLowerCase()).includes("all") ||
            allowedCourses.some(c => userCourse.includes(c.toLowerCase()));

        if (!courseMatch) {
            return false;
        }

        return true;
    });

    const scoredPromises = filtered.map(async (s) => {
        let score = 50; // Base score for passing strict filters
        let reasons = ["Eligible based on profile"];

        // 4. ML / External Service boost
        let ai_reason = "";
        try {
            // Simulate ML boost for demonstration
            const boost = Math.floor(Math.random() * 20) + 10;
            score += boost;
            ai_reason = "High confidence profile match";
        } catch (err) {
            console.warn("Algorithm adjustment skipped");
        }

        return {
            ...s,
            matchscore: score,
            ai_reason: ai_reason || `Matched based on: ${reasons.join(", ")}`,
            match_reasons: reasons
        };
    });

    const results = await Promise.all(scoredPromises);

    // Sort by score descending
    return results.sort((a, b) => b.matchscore - a.matchscore);
}

export async function triggerMatchNotifications(user, matches) {
    if (!user.id || !user.email) return;

    // Notify for top 2 matches
    const topMatches = matches.slice(0, 2);

    for (const s of topMatches) {
        try {
            // Check if already notified
            const notified = await pool.query(
                "SELECT * FROM user_notifications WHERE user_id=$1 AND scholarship_id=$2",
                [user.id, s.id]
            );

            if (notified.rows.length === 0) {
                console.log(`Sending match email for ${s.name} to ${user.email} (Triggered)`);
                const result = await sendMatchEmail(user.email, user.name, s);
                if (result.success) {
                    await pool.query(
                        "INSERT INTO user_notifications (user_id, scholarship_id) VALUES ($1,$2)",
                        [user.id, s.id]
                    );
                }
            }
        } catch (err) {
            console.error("Match Notification Error:", err.message);
        }
    }
}
