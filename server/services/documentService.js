import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY.replace(';', '')
});

export async function getRequiredDocuments(scholarship) {
    try {
        const prompt = `
        List the required documents for the following scholarship in a standard bulleted format.
        Be specific based on the scholarship name and eligibility.

        Scholarship: ${scholarship.name}
        Income Limit: ₹${scholarship.income_limit}
        Allowed Categories: ${scholarship.category_allowed}
        Allowed Courses: ${scholarship.course_allowed}

        Response format: Just the list of documents, one per line, no introductory text.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-3.7-flash",
            contents: prompt
        });

        const text = response.text;

        return text.trim();

    } catch (err) {
        console.error("Document AI Error:", err.message);

        return "- Mark sheets of previous examinations\n- Identity Proof (Aadhaar/PAN)\n- Income Certificate\n- Category/Caste Certificate (if applicable)\n- Admission Letter/Proof";
    }
}