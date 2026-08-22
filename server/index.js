import "dotenv/config";
import express from "express";
import cors from "cors";

import userRoutes from "./routes/users.js";
import scholarshipRoutes from "./routes/scholarships.js";
import applicationRoutes from "./routes/applications.js";
import sopRoutes from "./routes/sop.js";
import adminRoutes from "./routes/admin.js";
import { initDb } from "./initDb.js";

const app = express();

// =========================================================
// DATABASE INITIALIZATION
// =========================================================

await initDb();

// =========================================================
// CORS CONFIGURATION
// =========================================================

const clientUrl = process.env.CLIENT_URL;

if (!clientUrl) {
  console.warn(
    "⚠️ CLIENT_URL is not configured. Using localhost for development."
  );
}

app.use(
  cors({
    origin: clientUrl || "http://localhost:5173",
    credentials: true
  })
);

// =========================================================
// MIDDLEWARE
// =========================================================

app.use(express.json());

// =========================================================
// HEALTH CHECK
// =========================================================

app.get("/", (req, res) => {
  res.json({
    message: "ScholarAI API Backend is running successfully!"
  });
});

// =========================================================
// API ROUTES
// =========================================================

app.use("/api/users", userRoutes);
app.use("/api/scholarships", scholarshipRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/sop", sopRoutes);
app.use("/api/admin", adminRoutes);

// =========================================================
// START SERVER
// =========================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `🚀 ScholarAI backend running on port ${PORT}`
  );
});