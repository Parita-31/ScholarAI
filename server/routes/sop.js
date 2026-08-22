import express from "express";
import { GoogleGenAI } from "@google/genai";
import "dotenv/config";
import { pool } from "../db.js";

const router = express.Router();

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

router.post("/generate", async (req, res) => {
  const {
    userId,
    scholarshipId,
    reason,
    achievements,
    goals,
    challenges
  } = req.body;

  let user = { name: "Applicant" };
  let scholarship = { name: "Scholarship" };

  try {
    // 1. Fetch user and scholarship data
    const userRes = await pool.query(
      "SELECT * FROM users WHERE id = $1",
      [userId]
    );

    const scholarshipRes = await pool.query(
      "SELECT * FROM scholarships WHERE id = $1",
      [scholarshipId]
    );

    if (userRes.rows.length > 0) {
      user = userRes.rows[0];
    }

    if (scholarshipRes.rows.length > 0) {
      scholarship = scholarshipRes.rows[0];
    }

    // 2. Construct prompt
    const prompt = `
Write a compelling, high-quality Statement of Purpose (SOP) for a scholarship application.

STUDENT PROFILE:
- Name: ${user.name}
- Education: Pursuing ${user.education_level} in ${user.course}
- GPA: ${user.gpa || "N/A"}
- Financial/Social Context: Annual Income ₹${user.income} (${user.category})

TARGET SCHOLARSHIP:
- Name: ${scholarship.name}

PERSONAL INPUTS:
- Motivation/Need: ${reason || "Not specified"}
- Key Achievements: ${achievements || "Not specified"}
- Future Career Goals: ${goals || "Not specified"}
- Challenges Overcome: ${challenges || "Not specified"}

ESSAY REQUIREMENTS:
1. Tone: Academic yet deeply personal and resilient.
2. Structure:
   - A hook introduction.
   - Academic journey and passion for ${user.course}.
   - Discussion of financial need/challenges and how it fuels determination.
   - Connection between the student's goals and ${scholarship.name}'s mission.
   - Impactful conclusion.
3. Language: Avoid generic clichés. Be specific.
4. Length: Approximately 450-600 words.
5. Output: Just the essay text, no greetings or meta-commentary.
6. Use ${user.name} where necessary.
`;

    // 3. Generate content using the new Gemini SDK
    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt
    });

    const text = response.text;

    // 4. Return generated SOP
    res.json({
      sop: text
    });

  } catch (err) {
    console.error("AI Generation Error:", err.message);

    // 5. Fallback SOP if Gemini is unavailable
    const fallbackSOP = `
STATEMENT OF PURPOSE

To the Scholarship Committee,

My name is ${user.name}, and I am writing to express my sincere interest in the ${scholarship.name}. As a dedicated student pursuing my ${user.education_level} in ${user.course}, I have always strived for academic excellence despite the financial challenges my family faces.

With a GPA of ${user.gpa || "N/A"} and an annual family income of ₹${user.income}, this scholarship would be a life-changing opportunity. It would allow me to focus entirely on my studies without the constant burden of tuition fees.

${reason ? `My Motivation:\n${reason}` : ""}

${achievements ? `Key Achievements:\n${achievements}` : ""}

${goals ? `Future Career Goals:\n${goals}` : ""}

${challenges ? `Challenges Overcome:\n${challenges}` : ""}

My goal is to successfully complete my degree and contribute meaningfully to the field of ${user.course}. I am committed to working hard and making the most of this opportunity.

Thank you for considering my application.

Sincerely,
${user.name}
`;

    // Return fallback instead of crashing
    res.json({
      sop: fallbackSOP,
      note: "Generated with offline template (AI unavailable)"
    });
  }
});

export default router;