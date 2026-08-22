import nodemailer from "nodemailer";
import { getRequiredDocuments } from "./documentService.js";
import "dotenv/config";

let transporter;
let isDemoMode = false;
let initializationPromise = null;

async function initTransporter() {
    if (initializationPromise) return initializationPromise;

    initializationPromise = (async () => {
        const demoMode = process.env.EMAIL_DEMO_MODE === "true";

        try {
            // Check Gmail configuration
            if (
                process.env.EMAIL_USER &&
                process.env.EMAIL_PASS &&
                process.env.EMAIL_USER !== "your-gmail@gmail.com" &&
                !process.env.EMAIL_PASS.includes("your-app-password")
            ) {
                console.log("Checking primary Gmail config...");

                const primary = nodemailer.createTransport({
                    service: "gmail",
                    auth: {
                        user: process.env.EMAIL_USER.trim(),
                        pass: process.env.EMAIL_PASS.trim()
                    }
                });

                // Verify Gmail credentials
                await primary.verify();

                transporter = primary;
                isDemoMode = false;

                console.log("✅ REAL GMAIL SYSTEM IS ACTIVE.");
                return;
            }

            throw new Error("Gmail credentials are missing or incomplete.");

        } catch (err) {
            console.error("❌ Gmail initialization failed:", err.message);

            // Allow Ethereal ONLY when explicitly enabled
            if (!demoMode) {
                console.error(
                    "❌ Demo email mode is disabled. Real Gmail configuration is required."
                );

                throw new Error(
                    "Email service unavailable. Please configure Gmail correctly."
                );
            }

            // Development/demo mode
            try {
                console.warn("⚠️ EMAIL_DEMO_MODE=true");
                console.warn("⚠️ Falling back to Ethereal Demo Mode.");

                const testAccount = await nodemailer.createTestAccount();

                transporter = nodemailer.createTransport({
                    host: "smtp.ethereal.email",
                    port: 587,
                    secure: false,
                    auth: {
                        user: testAccount.user,
                        pass: testAccount.pass
                    }
                });

                isDemoMode = true;

                console.log(
                    "🚀 DEMO MODE ACTIVE. Test Mail:",
                    testAccount.user
                );

            } catch (demoError) {
                console.error(
                    "❌ Failed to initialize Ethereal:",
                    demoError.message
                );

                throw new Error("Email service initialization failed.");
            }
        }
    })();

    return initializationPromise;
}

// Start initialization early
initTransporter().catch(err => {
    console.error("Email Service Initialization Error:", err.message);
});

export async function sendMatchEmail(
    userEmail,
    userName,
    scholarship
) {
    try {
        await initTransporter();

        if (!transporter) {
            throw new Error("Email transporter is not available.");
        }

        const documents = await getRequiredDocuments(scholarship);

        const senderMail =
            !isDemoMode && process.env.EMAIL_USER
                ? process.env.EMAIL_USER
                : "demo@scholarai.com";

        const clientUrl = process.env.CLIENT_URL;

        if (!clientUrl) {
            throw new Error("CLIENT_URL is not configured.");
        }

        const mailOptions = {
            from: `"ScholarAI Support" <${senderMail}>`,
            to: userEmail,
            subject: `🎉 Congratulations! You match with ${scholarship.name}`,

            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">

                    <h2>Hi ${userName},</h2>

                    <p>
                        We found a new scholarship match for you on
                        <strong>ScholarAI</strong>!
                    </p>

                    <div style="
                        background: #f8fafc;
                        padding: 20px;
                        border-radius: 10px;
                        border: 1px solid #e2e8f0;
                        margin: 20px 0;
                    ">
                        <h3 style="color: #4f46e5; margin-top: 0;">
                            ${scholarship.name}
                        </h3>

                        <p>
                            <strong>Benefits:</strong>
                            Up to ₹${(
                                scholarship.income_limit / 100000
                            ).toFixed(1)}L per year funding.
                        </p>

                        <p>
                            <strong>Deadline:</strong>
                            ${new Date(
                                scholarship.deadline
                            ).toLocaleDateString()}
                        </p>
                    </div>

                    <h3>📜 Required Documents for Application:</h3>

                    <ul>
                        ${documents
                            .split("\n")
                            .map(
                                doc =>
                                    `<li>${doc.replace(/^-\s*/, "")}</li>`
                            )
                            .join("")}
                    </ul>

                    <p>
                        Log in to your dashboard to generate your SOP
                        and start your application.
                    </p>

                    <div style="margin-top: 30px;">
                        <a
                            href="${clientUrl}/scholarships/${scholarship.id}"
                            style="
                                background: #4f46e5;
                                color: white;
                                padding: 12px 24px;
                                text-decoration: none;
                                border-radius: 5px;
                                font-weight: bold;
                            "
                        >
                            View Scholarship Details
                        </a>
                    </div>

                    <p style="
                        margin-top: 40px;
                        font-size: 0.8rem;
                        color: #64748b;
                    ">
                        You received this because you match the criteria
                        for ${scholarship.name}.
                    </p>

                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);

        console.log(
            `Email successfully sent to ${userEmail}`
        );

        const previewUrl = nodemailer.getTestMessageUrl(info);

        return {
            success: true,
            previewUrl: isDemoMode ? previewUrl : null,
            demoMode: isDemoMode
        };

    } catch (err) {
        let errorMsg = err.message;

        if (errorMsg.includes("535-5.7.8")) {
            errorMsg =
                "Gmail rejected the credentials. Use a Gmail App Password instead of your regular Gmail password.";
        }

        console.error(
            "❌ Email Delivery Error:",
            errorMsg
        );

        return {
            success: false,
            error: errorMsg,
            demoMode: isDemoMode
        };
    }
}