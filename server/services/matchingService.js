import { pool } from "../db.js";
import { sendMatchEmail } from "./emailService.js";

export async function getMatchesForUser(userProfile) {
  const {
    income,
    category,
    course,
    gpa
  } = userProfile;

  const allScholarships = await pool.query(
    "SELECT * FROM scholarships"
  );

  // =========================================================
  // STEP 1: FILTER SCHOLARSHIPS
  // Only scholarships for which the student is eligible
  // are considered for scoring.
  // =========================================================

  const filtered = allScholarships.rows.filter((s) => {

    // ---------------------------------------------------------
    // 1. Income Eligibility
    // ---------------------------------------------------------

    if (
      s.income_limit &&
      income !== undefined &&
      income !== null &&
      Number(income) > Number(s.income_limit)
    ) {
      return false;
    }

    // ---------------------------------------------------------
    // 2. Category Eligibility
    // ---------------------------------------------------------

    let allowedCats = [];

    try {
      allowedCats =
        typeof s.category_allowed === "string"
          ? JSON.parse(s.category_allowed)
          : s.category_allowed;
    } catch (e) {
      allowedCats = ["All"];
    }

    if (!Array.isArray(allowedCats)) {
      allowedCats = [allowedCats];
    }

    const normalizedCategories = allowedCats.map(
      (c) => String(c).toLowerCase().trim()
    );

    const userCategory =
      String(category || "").toLowerCase().trim();

    const categoryMatch =
      normalizedCategories.includes("all") ||
      normalizedCategories.includes(userCategory);

    if (!categoryMatch) {
      return false;
    }

    // ---------------------------------------------------------
    // 3. Course Eligibility
    // ---------------------------------------------------------

    let allowedCourses = [];

    try {
      allowedCourses =
        typeof s.course_allowed === "string"
          ? JSON.parse(s.course_allowed)
          : s.course_allowed;
    } catch (e) {
      allowedCourses = ["All"];
    }

    if (!Array.isArray(allowedCourses)) {
      allowedCourses = [allowedCourses];
    }

    const normalizedCourses = allowedCourses.map(
      (c) => String(c).toLowerCase().trim()
    );

    const userCourse =
      String(course || "").toLowerCase().trim();

    const courseMatch =
      normalizedCourses.includes("all") ||
      normalizedCourses.some(
        (c) =>
          userCourse.includes(c) ||
          c.includes(userCourse)
      );

    if (!courseMatch) {
      return false;
    }

    return true;
  });

  // =========================================================
  // STEP 2: DETERMINISTIC SCORING
  //
  // Income Eligibility  = 40 points
  // Category Match      = 20 points
  // Course Match        = 20 points
  // GPA                 = 10 points
  // Profile Completeness = 10 points
  //
  // TOTAL = 100 points
  // =========================================================

  const results = filtered.map((s) => {

    let score = 0;
    const reasons = [];

    // ---------------------------------------------------------
    // 1. Income Eligibility - 40 points
    // ---------------------------------------------------------

    const scholarshipIncomeLimit =
      Number(s.income_limit);

    const userIncome = Number(income);

    if (
      !Number.isNaN(userIncome) &&
      !Number.isNaN(scholarshipIncomeLimit) &&
      userIncome <= scholarshipIncomeLimit
    ) {
      score += 40;
      reasons.push("Income eligible");
    }

    // ---------------------------------------------------------
    // 2. Category Match - 20 points
    // ---------------------------------------------------------

    let allowedCats = [];

    try {
      allowedCats =
        typeof s.category_allowed === "string"
          ? JSON.parse(s.category_allowed)
          : s.category_allowed;
    } catch (e) {
      allowedCats = ["All"];
    }

    if (!Array.isArray(allowedCats)) {
      allowedCats = [allowedCats];
    }

    const normalizedCategories = allowedCats.map(
      (c) => String(c).toLowerCase().trim()
    );

    const normalizedUserCategory =
      String(category || "").toLowerCase().trim();

    const categoryMatch =
      normalizedCategories.includes("all") ||
      normalizedCategories.includes(
        normalizedUserCategory
      );

    if (categoryMatch) {
      score += 20;
      reasons.push("Category matches");
    }

    // ---------------------------------------------------------
    // 3. Course Match - 20 points
    // ---------------------------------------------------------

    let allowedCourses = [];

    try {
      allowedCourses =
        typeof s.course_allowed === "string"
          ? JSON.parse(s.course_allowed)
          : s.course_allowed;
    } catch (e) {
      allowedCourses = ["All"];
    }

    if (!Array.isArray(allowedCourses)) {
      allowedCourses = [allowedCourses];
    }

    const normalizedCourses = allowedCourses.map(
      (c) => String(c).toLowerCase().trim()
    );

    const normalizedUserCourse =
      String(course || "").toLowerCase().trim();

    const courseMatch =
      normalizedCourses.includes("all") ||
      normalizedCourses.some(
        (c) =>
          normalizedUserCourse.includes(c) ||
          c.includes(normalizedUserCourse)
      );

    if (courseMatch) {
      score += 20;
      reasons.push("Course matches");
    }

    // ---------------------------------------------------------
    // 4. GPA - 10 points
    // ---------------------------------------------------------

    const userGpa = Number(gpa);

    if (!Number.isNaN(userGpa)) {

      if (userGpa >= 8.0) {
        score += 10;
        reasons.push("Excellent GPA");
      } else if (userGpa >= 7.0) {
        score += 8;
        reasons.push("Good GPA");
      } else if (userGpa >= 6.0) {
        score += 6;
        reasons.push("Satisfactory GPA");
      } else if (userGpa >= 5.0) {
        score += 4;
        reasons.push("Meets basic GPA level");
      } else {
        score += 2;
        reasons.push("GPA considered");
      }
    }

    // ---------------------------------------------------------
    // 5. Profile Completeness - 10 points
    // ---------------------------------------------------------

    let profilePoints = 0;

    if (income !== undefined && income !== null) {
      profilePoints += 2;
    }

    if (category) {
      profilePoints += 2;
    }

    if (course) {
      profilePoints += 2;
    }

    if (gpa !== undefined && gpa !== null) {
      profilePoints += 2;
    }

    if (s.deadline) {
      profilePoints += 2;
    }

    score += profilePoints;

    if (profilePoints === 10) {
      reasons.push("Complete profile information");
    }

    // Never allow score above 100
    score = Math.min(score, 100);

    // ---------------------------------------------------------
    // Generate explanation
    // ---------------------------------------------------------

    const ai_reason =
      `Strong match based on ${reasons.join(", ")}.`;

    return {
      ...s,

      // Deterministic score
      matchscore: score,

      // Explanation
      ai_reason,

      // Individual reasons
      match_reasons: reasons
    };
  });

  // =========================================================
  // STEP 3: SORT BY SCORE
  // Highest match first
  // =========================================================

  return results.sort(
    (a, b) => b.matchscore - a.matchscore
  );
}


// =============================================================
// MATCH NOTIFICATIONS
// =============================================================

export async function triggerMatchNotifications(
  user,
  matches
) {
  if (!user.id || !user.email) {
    return;
  }

  // Notify only the top 2 matches
  const topMatches = matches.slice(0, 2);

  for (const s of topMatches) {
    try {

      // Check whether notification was already sent
      const notified = await pool.query(
        `
        SELECT *
        FROM user_notifications
        WHERE user_id = $1
        AND scholarship_id = $2
        `,
        [user.id, s.id]
      );

      if (notified.rows.length === 0) {

        console.log(
          `Sending match email for ${s.name} to ${user.email} (Triggered)`
        );

        const result = await sendMatchEmail(
          user.email,
          user.name,
          s
        );

        if (result.success) {

          await pool.query(
            `
            INSERT INTO user_notifications
            (user_id, scholarship_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
            `,
            [user.id, s.id]
          );

        } else {
          console.error(
            `Failed to send notification for ${s.name}:`,
            result.error
          );
        }
      }

    } catch (err) {

      console.error(
        "Match Notification Error:",
        err.message
      );

    }
  }
}