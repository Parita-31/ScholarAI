import { useEffect, useState } from "react";
import ScholarshipCard from "../components/ScholarshipCard";
import { API_URL } from "../config";

export default function Matches({ user }) {
    const [scholarships, setScholarships] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        fetch(`${API_URL}/api/scholarships/recommend`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: user.id,
                email: user.email,
                name: user.name,
                income: user.income,
                category: user.category,
                course: user.course,
                education_level: user.education_level,
                gpa: user.gpa
            })
        })
            .then(res => res.json())
            .then(data => {
                setScholarships(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [user]);

    return (
        <div className="dashboard">
            <h2 className="section-title">Personalized Matches</h2>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", borderBottom: '1px solid var(--border)', paddingBottom: '20px' }}>
                <div>
                    <p className="section-subtitle" style={{ margin: 0 }}>
                        Hand-picked funding for <strong>{user.course}</strong> Students
                    </p>
                    <p style={{ color: "var(--text-muted)", fontSize: '0.85rem', marginTop: '4px' }}>
                        Criteria: {user.category} • Income ₹{user.income?.toLocaleString()}
                    </p>
                </div>
                <button
                    onClick={() => window.print()}
                    className="btn-secondary"
                    style={{ gap: '8px' }}
                >
                    <span>🖨️</span> Print List
                </button>
            </div>

            {loading ? (
                <div style={{ color: 'white' }}>Finding matches...</div>
            ) : (
                <div className="card-grid animate-fade-in">
                    {scholarships.length > 0 ? (
                        scholarships.map(s => (
                            <ScholarshipCard key={s.id} s={s} user={user} />
                        ))
                    ) : (
                        <div style={{ color: "white", padding: "20px" }}>
                            <h3>No direct matches found yet.</h3>
                            <p>Try updating your profile details or check back later!</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
