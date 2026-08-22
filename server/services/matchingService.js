import { pool } from "../db.js";
import { sendMatchEmail } from "./emailService.js";
import fetch from "node-fetch";

// =============================================================
// ML SERVICE CONFIGURATION
// =============================================================

const ML_SERVICE_URL =
  process.env.ML_SERVICE_URL || "http://localhost:8001";

// =============================================================
// GET ML MATCH SCORE
// =============================================================

async function getMLMatchScore({
  income,
  category,
  course,
  gpa
}) {
  try {
    const response = await fetch(
      `${ML_SERVICE_URL}/predict`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          cgpa: Number(gpa) || 7.0,
          income: Number(income) || 500000,
          category: String(
            category || "general"
          ).toLowerCase().trim(),
          course: String(
            course || "engineering"
          ).toLowerCase().trim()
        })
      }
    );

    if (!response.ok) {
      throw new Error(
        `ML service returned HTTP ${response.status}`
      );
    }

    const data = await response.json();

    const mlScore = Number(
      data.match_percentage
    );

    if (
      Number.isNaN(mlScore) ||
      mlScore < 0 ||
      mlScore > 100
    ) {
      throw new Error(
        "Invalid ML score received"
      );
    }

    console.log(
      `ML Match Score: ${mlScore}%`
    );

    return mlScore;

  } catch (error) {

    console.error(
      "ML Service Error:",
      error.message
    );

    // Return null so existing scoring
    // continues to work if ML is unavailable.
    return null;
  }
}


// =============================================================
// GET MATCHES FOR USER
// =============================================================

export async function getMatchesForUser(
  userProfile
) {

  const {
    income,
    category,
    course,
    gpa
  } = userProfile;


  // ===========================================================
  // STEP 1: GET ALL SCHOLARSHIPS
  // ===========================================================

  const allScholarships = await pool.query(
    "SELECT * FROM scholarships"
  );


  // ===========================================================
  // STEP 2: FILTER SCHOLARSHIPS
  // Only eligible scholarships are considered.
  // ===========================================================

  const filtered =
    allScholarships.rows.filter((s) => {

      // -------------------------------------------------------
      // 1. Income Eligibility
      // -------------------------------------------------------

      if (
        s.income_limit &&
        income !== undefined &&
        income !== null &&
        Number(income) >
          Number(s.income_limit)
      ) {
        return false;
      }


      // -------------------------------------------------------
      // 2. Category Eligibility
      // -------------------------------------------------------

      let allowedCats = [];

      try {

        allowedCats =
          typeof s.category_allowed === "string"
            ? JSON.parse(
                s.category_allowed
              )
            : s.category_allowed;

      } catch (e) {

        allowedCats = ["All"];

      }

      if (!Array.isArray(allowedCats)) {
        allowedCats = [allowedCats];
      }

      const normalizedCategories =
        allowedCats.map(
          (c) =>
            String(c)
              .toLowerCase()
              .trim()
        );

      const userCategory =
        String(category || "")
          .toLowerCase()
          .trim();

      const categoryMatch =
        normalizedCategories.includes("all") ||
        normalizedCategories.includes(
          userCategory
        );

      if (!categoryMatch) {
        return false;
      }


      // -------------------------------------------------------
      // 3. Course Eligibility
      // -------------------------------------------------------

      let allowedCourses = [];

      try {

        allowedCourses =
          typeof s.course_allowed === "string"
            ? JSON.parse(
                s.course_allowed
              )
            : s.course_allowed;

      } catch (e) {

        allowedCourses = ["All"];

      }

      if (!Array.isArray(allowedCourses)) {
        allowedCourses = [allowedCourses];
      }

      const normalizedCourses =
        allowedCourses.map(
          (c) =>
            String(c)
              .toLowerCase()
              .trim()
        );

      const userCourse =
        String(course || "")
          .toLowerCase()
          .trim();

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


  // ===========================================================
  // STEP 3: GET ML SCORE
  //
  // The ML model uses:
  // CGPA
  // Income
  // Category
  // Course
  //
  // It is calculated once because these values
  // belong to the student, not the scholarship.
  // ===========================================================

  const mlScore =
    await getMLMatchScore({
      income,
      category,
      course,
      gpa
    });


  // ===========================================================
  // STEP 4: DETERMINISTIC + ML SCORING
  //
  // Existing score = 60%
  // ML score       = 40%
  // ===========================================================

  const results =
    filtered.map((s) => {

      let score = 0;

      const reasons = [];


      // -------------------------------------------------------
      // 1. Income Eligibility - 40 points
      // -------------------------------------------------------

      const scholarshipIncomeLimit =
        Number(s.income_limit);

      const userIncome =
        Number(income);

      if (
        !Number.isNaN(userIncome) &&
        !Number.isNaN(
          scholarshipIncomeLimit
        ) &&
        userIncome <=
          scholarshipIncomeLimit
      ) {

        score += 40;

        reasons.push(
          "Income eligible"
        );
      }


      // -------------------------------------------------------
      // 2. Category Match - 20 points
      // -------------------------------------------------------

      let allowedCats = [];

      try {

        allowedCats =
          typeof s.category_allowed === "string"
            ? JSON.parse(
                s.category_allowed
              )
            : s.category_allowed;

      } catch (e) {

        allowedCats = ["All"];

      }

      if (!Array.isArray(allowedCats)) {
        allowedCats = [allowedCats];
      }

      const normalizedCategories =
        allowedCats.map(
          (c) =>
            String(c)
              .toLowerCase()
              .trim()
        );

      const normalizedUserCategory =
        String(category || "")
          .toLowerCase()
          .trim();

      const categoryMatch =
        normalizedCategories.includes("all") ||
        normalizedCategories.includes(
          normalizedUserCategory
        );

      if (categoryMatch) {

        score += 20;

        reasons.push(
          "Category matches"
        );
      }


      // -------------------------------------------------------
      // 3. Course Match - 20 points
      // -------------------------------------------------------

      let allowedCourses = [];

      try {

        allowedCourses =
          typeof s.course_allowed === "string"
            ? JSON.parse(
                s.course_allowed
              )
            : s.course_allowed;

      } catch (e) {

        allowedCourses = ["All"];

      }

      if (!Array.isArray(allowedCourses)) {
        allowedCourses = [allowedCourses];
      }

      const normalizedCourses =
        allowedCourses.map(
          (c) =>
            String(c)
              .toLowerCase()
              .trim()
        );

      const normalizedUserCourse =
        String(course || "")
          .toLowerCase()
          .trim();

      const courseMatch =
        normalizedCourses.includes("all") ||
        normalizedCourses.some(
          (c) =>
            normalizedUserCourse.includes(c) ||
            c.includes(
              normalizedUserCourse
            )
        );

      if (courseMatch) {

        score += 20;

        reasons.push(
          "Course matches"
        );
      }


      // -------------------------------------------------------
      // 4. GPA - 10 points
      // -------------------------------------------------------

      const userGpa =
        Number(gpa);

      if (
        !Number.isNaN(userGpa)
      ) {

        if (userGpa >= 8.0) {

          score += 10;

          reasons.push(
            "Excellent GPA"
          );

        } else if (
          userGpa >= 7.0
        ) {

          score += 8;

          reasons.push(
            "Good GPA"
          );

        } else if (
          userGpa >= 6.0
        ) {

          score += 6;

          reasons.push(
            "Satisfactory GPA"
          );

        } else if (
          userGpa >= 5.0
        ) {

          score += 4;

          reasons.push(
            "Meets basic GPA level"
          );

        } else {

          score += 2;

          reasons.push(
            "GPA considered"
          );
        }
      }


      // -------------------------------------------------------
      // 5. Profile Completeness - 10 points
      // -------------------------------------------------------

      let profilePoints = 0;

      if (
        income !== undefined &&
        income !== null
      ) {
        profilePoints += 2;
      }

      if (category) {
        profilePoints += 2;
      }

      if (course) {
        profilePoints += 2;
      }

      if (
        gpa !== undefined &&
        gpa !== null
      ) {
        profilePoints += 2;
      }

      if (s.deadline) {
        profilePoints += 2;
      }

      score += profilePoints;

      if (
        profilePoints === 10
      ) {

        reasons.push(
          "Complete profile information"
        );
      }


      // -------------------------------------------------------
      // Existing deterministic score
      // -------------------------------------------------------

      score = Math.min(
        score,
        100
      );


      // =======================================================
      // COMBINE EXISTING SCORE + ML SCORE
      // =======================================================

      let finalScore = score;

      if (
        mlScore !== null &&
        !Number.isNaN(mlScore)
      ) {

        finalScore = Math.round(
          score * 0.6 +
          mlScore * 0.4
        );

        finalScore = Math.min(
          Math.max(
            finalScore,
            0
          ),
          100
        );

        reasons.push(
          "ML-based prediction considered"
        );
      }


      // -------------------------------------------------------
      // Generate explanation
      // -------------------------------------------------------

      const ai_reason =
        `Strong match based on ${reasons.join(
          ", "
        )}.`;


      return {

        ...s,

        // Final combined score
        matchscore: finalScore,

        // Explanation
        ai_reason,

        // Individual reasons
        match_reasons: reasons

      };

    });


  // ===========================================================
  // STEP 5: SORT BY FINAL SCORE
  // Highest match first
  // ===========================================================

  return results.sort(
    (a, b) =>
      b.matchscore -
      a.matchscore
  );
}


// =============================================================
// MATCH NOTIFICATIONS
// =============================================================

export async function triggerMatchNotifications(
  user,
  matches
) {

  if (
    !user.id ||
    !user.email
  ) {
    return;
  }


  // Notify only the top 2 matches
  const topMatches =
    matches.slice(0, 2);


  for (
    const s of topMatches
  ) {

    try {

      // -------------------------------------------------------
      // Check whether notification was already sent
      // -------------------------------------------------------

      const notified =
        await pool.query(
          `
          SELECT *
          FROM user_notifications
          WHERE user_id = $1
          AND scholarship_id = $2
          `,
          [
            user.id,
            s.id
          ]
        );


      if (
        notified.rows.length === 0
      ) {

        console.log(
          `Sending match email for ${s.name} to ${user.email} (Triggered)`
        );


        const result =
          await sendMatchEmail(
            user.email,
            user.name,
            s
          );


        if (
          result.success
        ) {

          await pool.query(
            `
            INSERT INTO user_notifications
            (user_id, scholarship_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
            `,
            [
              user.id,
              s.id
            ]
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