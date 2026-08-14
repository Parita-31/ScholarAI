import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { API_URL } from "../config";

export default function ScholarshipDetail({ user }) {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [scholarship, setScholarship] = useState(location.state?.s || null);

    useEffect(() => {
        if (!scholarship) {
            // If no state passed, fetch from API
            fetch(`${API_URL}/api/scholarships/${id}`)
                .then(res => res.json())
                .then(data => setScholarship(data))
                .catch(err => console.error(err));
        }
    }, [id, scholarship]);

    const handleSaveInfo = async () => {
        if (!user) {
            navigate("/register");
            return;
        }

        try {
            const res = await fetch(`${API_URL}/api/scholarships/notify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user: user,
                    scholarship: scholarship
                })
            });

            const data = await res.json();
            if (res.ok) {
                if (data.previewUrl) {
                    alert("DEMO MODE: Scholarship info saved! I've generated a test email for you. Click OK to view the email content in a new tab.");
                    window.open(data.previewUrl, "_blank");
                } else {
                    alert("Scholarship info saved! An email with details and required documents has been sent to your Gmail.");
                }
            } else {
                alert(`Fail: ${data.message || "Please check your server .env configuration."}`);
            }
        } catch (err) {
            console.error("Save Info Error:", err);
            alert("An error occurred. Please check your connection.");
        }
    };

    if (!scholarship) return <div className="dashboard">Loading...</div>;

    const parseJSON = (str) => {
        try {
            return typeof str === 'string' ? JSON.parse(str) : str;
        } catch {
            return [];
        }
    };

    const categories = parseJSON(scholarship.category_allowed);
    const courses = parseJSON(scholarship.course_allowed);

    return (
        <div className="dashboard animate-fade-in">
            <button className="btn-secondary" onClick={() => navigate(-1)} style={{ marginBottom: '20px' }}>
                ← Back to Scholarships
            </button>

            <div className="glass" style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
                <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '10px' }}>{scholarship.name}</h1>

                {scholarship.matchscore && (
                    <div style={{ color: "#34d399", fontWeight: "bold", fontSize: '1.2rem', marginBottom: '30px' }}>
                        Match Score: {scholarship.matchscore}%
                    </div>
                )}

                <div className="scholarship-details" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '40px' }}>
                    <div className="criteria-section">
                        <h3 className="criteria-title" style={{ fontSize: '1rem' }}>Financial Benefit</h3>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--success)' }}>
                            Up to ₹{(scholarship.income_limit / 100000).toFixed(1)}L / year
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '8px' }}>
                            Applicable for students with family income below ₹{(scholarship.income_limit / 100000).toFixed(1)} Lakhs.
                        </p>
                    </div>

                    <div className="criteria-section">
                        <h3 className="criteria-title" style={{ fontSize: '1rem' }}>Eligibility Criteria</h3>
                        <div className="pill-container" style={{ marginTop: '10px' }}>
                            {categories.map((cat, i) => (
                                <span key={i} className="pill" style={{ padding: '6px 14px', fontSize: '0.9rem' }}>{cat}</span>
                            ))}
                            {courses.map((course, i) => (
                                <span key={i} className="pill" style={{ padding: '6px 14px', fontSize: '0.9rem', borderColor: 'rgba(244, 114, 182, 0.3)', color: 'var(--accent)' }}>
                                    {course}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ marginBottom: '40px' }}>
                    <h3 className="criteria-title" style={{ fontSize: '1rem' }}>Detailed Description</h3>
                    <p style={{ color: 'var(--text-muted)', lineHeight: '1.8' }}>
                        This scholarship is designed to support meritorious students.
                        It covers tuition fees and provides a monthly stipend for the duration of the course.
                        Selected candidates will also gain access to mentorship programs and global networking opportunities.
                    </p>
                </div>

                {scholarship.ai_reason && (
                    <div className="ai-box" style={{ padding: '24px', fontSize: '1.1rem', marginBottom: '40px' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: 'var(--primary)' }}>🤖 AI Insight</h4>
                        {scholarship.ai_reason}
                    </div>
                )}

                <button onClick={handleSaveInfo} className="btn-primary" style={{ width: '100%', padding: '20px', fontSize: '1.2rem' }}>
                    Save Info & Get Email
                </button>
            </div>
        </div>
    );
}
