import { useNavigate } from "react-router-dom";

export default function ScholarshipCard({ s, user }) {
  const navigate = useNavigate();

  const deadlineDate = new Date(s.deadline);
  const isValidDate = !isNaN(deadlineDate.getTime());

  const daysLeft = isValidDate
    ? Math.ceil((deadlineDate - new Date()) / (1000 * 60 * 60 * 24))
    : 0;

  const handleApplyClick = () => {
    if (!user) {
      navigate("/register");
    } else {
      navigate(`/scholarships/${s.id}`, { state: { s } });
    }
  };

  // Helper to parse JSON if needed
  const parseJSON = (str) => {
    try {
      return typeof str === 'string' ? JSON.parse(str) : str;
    } catch {
      return [];
    }
  };

  const categories = parseJSON(s.category_allowed);
  const courses = parseJSON(s.course_allowed);

  return (
    <div className="card glass">
      <h3>{s.name}</h3>

      {s.matchscore && (
        <p style={{ color: "#34d399", fontWeight: "bold", marginBottom: '12px' }}>
          Match Score: {s.matchscore}%
        </p>
      )}

      <div className="scholarship-details">
        {/* Deadline section */}
        <div className="detail-item">
          <span className="detail-icon">📅</span>
          <div>
            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Last date to apply</div>
            <div className={`deadline ${daysLeft <= 7 ? "red" : "green"}`} style={{ margin: '4px 0 0 0', display: 'inline-block' }}>
              {daysLeft > 0 ? `${daysLeft} days remaining` : "Application Closed"}
            </div>
          </div>
        </div>

        {/* Income section */}
        <div className="detail-item">
          <span className="detail-icon">💰</span>
          <div>
            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Income Limit</div>
            <div className="income-tag">Up to ₹{(s.income_limit / 100000).toFixed(1)}L / year</div>
          </div>
        </div>

        {/* Eligibility Criteria */}
        <div className="criteria-section">
          <div className="criteria-title">Eligibility</div>
          <div className="pill-container">
            {categories.map((cat, i) => (
              <span key={i} className="pill">{cat}</span>
            ))}
            {courses.map((course, i) => (
              <span key={i} className="pill" style={{ borderColor: 'rgba(244, 114, 182, 0.3)', color: 'var(--accent)' }}>
                {course}
              </span>
            ))}
          </div>
        </div>
      </div>

      {
        s.ai_reason && (
          <div className="ai-box" style={{ marginBottom: '16px' }}>
            🤖 {s.ai_reason}
          </div>
        )
      }

      <button onClick={handleApplyClick} className="btn-primary" style={{ width: '100%', marginTop: 'auto' }}>
        Apply Now
      </button>
    </div >
  );
}

