import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../config";

export default function SOP({ user }) {
  const [scholarships, setScholarships] = useState([]);
  const [selectedScholarship, setSelectedScholarship] = useState("");
  const [reason, setReason] = useState("");
  const [achievements, setAchievements] = useState("");
  const [goals, setGoals] = useState("");
  const [challenges, setChallenges] = useState("");
  const [sop, setSop] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/api/scholarships`)
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : (data.rows || []);
        setScholarships(list);
      });
  }, []);

  const generate = async () => {
    if (!selectedScholarship) {
      setError("Please select a target scholarship first.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/sop/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          scholarshipId: selectedScholarship,
          reason,
          achievements,
          goals,
          challenges
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Generation failed");

      setSop(data.sop);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard animate-fade-in">
      <header style={{ marginBottom: '40px' }}>
        <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '8px' }}>✨ AI SOP Generator</h1>
        <p style={{ color: 'var(--text-muted)' }}>Craft a powerful Statement of Purpose in seconds using advanced AI.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: sop ? '1fr 1fr' : '1fr', gap: '30px', alignItems: 'start' }}>
        {/* INPUT BOX */}
        <div className="glass" style={{ padding: '30px' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '1.1rem', color: 'var(--primary)' }}>Academic & Personal Details</h3>

          <div style={{ marginBottom: "20px" }}>
            <label className="criteria-title">Target Scholarship</label>
            <select
              className="auth-box-input"
              style={{ width: '100%', padding: '12px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border)', borderRadius: '10px', color: 'white', marginTop: '8px' }}
              value={selectedScholarship}
              onChange={e => setSelectedScholarship(e.target.value)}
            >
              <option value="">Select a scholarship...</option>
              {scholarships.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label className="criteria-title">Course / Major</label>
              <input readOnly value={user?.course} style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-muted)', marginTop: '8px' }} />
            </div>
            <div>
              <label className="criteria-title">Education Level</label>
              <input readOnly value={user?.education_level} style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-muted)', marginTop: '8px' }} />
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label className="criteria-title">Why do you deserve this?</label>
            <textarea
              placeholder="Tell AI about your financial need or motivation..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              style={{ width: "100%", padding: "12px", background: "rgba(15,23,42,0.6)", border: "1px solid var(--border)", color: "white", borderRadius: "10px", marginTop: '8px', resize: 'vertical' }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label className="criteria-title">Life Achievements</label>
            <textarea
              placeholder="List awards, volunteer work, or strengths..."
              value={achievements}
              onChange={e => setAchievements(e.target.value)}
              rows={3}
              style={{ width: "100%", padding: "12px", background: "rgba(15,23,42,0.6)", border: "1px solid var(--border)", color: "white", borderRadius: "10px", marginTop: '8px', resize: 'vertical' }}
            />
          </div>

          <div style={{ marginBottom: "30px" }}>
            <label className="criteria-title">Career Goals</label>
            <textarea
              placeholder="Where do you see yourself in 5 years?"
              value={goals}
              onChange={e => setGoals(e.target.value)}
              rows={2}
              style={{ width: "100%", padding: "12px", background: "rgba(15,23,42,0.6)", border: "1px solid var(--border)", color: "white", borderRadius: "10px", marginTop: '8px', resize: 'vertical' }}
            />
          </div>

          {error && <div style={{ color: "var(--accent)", marginBottom: "15px", fontSize: '0.9rem' }}>⚠️ {error}</div>}

          <button
            onClick={generate}
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '16px' }}
          >
            {loading ? "🪄 AI is drafting your SOP..." : "Generate SOP Draft"}
          </button>
        </div>

        {/* RESULT BOX */}
        {sop && (
          <div className="glass animate-fade-in" style={{ padding: '30px', border: '1px solid var(--primary-glow)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--success)' }}>Generated Statement</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(sop);
                    alert("Copied to clipboard!");
                  }}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'white', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  📄 Copy
                </button>
                <button
                  onClick={() => window.print()}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'white', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  🖨️ Print
                </button>
              </div>
            </div>

            <div
              className="sop-viewer"
              style={{
                background: '#020617',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                maxHeight: '600px',
                overflowY: 'auto',
                lineHeight: '1.8',
                color: '#d1d5db',
                fontSize: '1rem',
                whiteSpace: 'pre-wrap'
              }}>
              {sop}
            </div>

            <p style={{ marginTop: '20px', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              💡 This is an AI-generated draft. Please review and personalize it before submitting.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
