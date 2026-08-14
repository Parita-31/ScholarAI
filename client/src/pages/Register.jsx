import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API_URL } from "../config";

export default function Register({ setUser }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    income: "",
    category: "General",
    course: "", // Major
    education_level: "Undergraduate",
    gpa: "",
    state: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const register = async () => {
    setLoading(true);
    setError(null);

    // Convert numeric fields
    const payload = {
      ...form,
      income: Number(form.income),
      gpa: Number(form.gpa)
    };

    try {
      const res = await fetch(`${API_URL}/api/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || "Registration failed");
      }

      setUser(data);
      localStorage.setItem("user", JSON.stringify(data));
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '90vh', padding: '40px 0' }}>
      <div className="auth-box glass animate-fade-in" style={{ maxWidth: '600px', width: '100%', border: '1px solid var(--primary-glow)', padding: '40px' }}>
        <h2 className="text-gradient">Create Account</h2>
        <p className="section-subtitle">
          Step {step} of 2: {step === 1 ? "Basic Information" : "Academic Profile"}
        </p>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '12px', borderRadius: '10px', marginBottom: '20px', fontSize: '0.9rem' }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {step === 1 ? (
            <>
              <div style={{ textAlign: 'left' }}>
                <label className="criteria-title">FULL NAME</label>
                <input name="name" placeholder="e.g. James Wilson" onChange={handleChange} value={form.name} style={{ marginTop: '8px' }} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <label className="criteria-title">EMAIL ADDRESS</label>
                <input name="email" type="email" placeholder="e.g. james@example.com" onChange={handleChange} value={form.email} style={{ marginTop: '8px' }} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <label className="criteria-title">PASSWORD</label>
                <input name="password" type="password" placeholder="••••••••" onChange={handleChange} value={form.password} style={{ marginTop: '8px' }} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <label className="criteria-title">STATE / REGION</label>
                <input name="state" placeholder="e.g. California" onChange={handleChange} value={form.state} style={{ marginTop: '8px' }} />
              </div>

              <button className="btn-primary" onClick={() => setStep(2)} style={{ marginTop: '10px', padding: '14px' }}>
                Next: Academic Info →
              </button>
            </>
          ) : (
            <>
              <div style={{ textAlign: 'left' }}>
                <label className="criteria-title">EDUCATION LEVEL</label>
                <select
                  name="education_level"
                  value={form.education_level}
                  onChange={handleChange}
                  style={{
                    width: '100%', padding: '14px', marginTop: '8px',
                    background: 'rgba(15, 23, 42, 0.6)', color: 'white', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '1rem'
                  }}
                >
                  <option value="High School">High School</option>
                  <option value="Undergraduate">Undergraduate</option>
                  <option value="Postgraduate">Postgraduate</option>
                </select>
              </div>

              <div style={{ textAlign: 'left' }}>
                <label className="criteria-title">MAJOR / FIELD OF STUDY</label>
                <input name="course" placeholder="e.g. Computer Science" onChange={handleChange} value={form.course} style={{ marginTop: '8px' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ textAlign: 'left' }}>
                  <label className="criteria-title">GPA / SCORE</label>
                  <input name="gpa" placeholder="e.g. 3.8" type="number" onChange={handleChange} value={form.gpa} style={{ marginTop: '8px' }} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <label className="criteria-title">CATEGORY</label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    style={{
                      width: '100%', padding: '14px', marginTop: '8px',
                      background: 'rgba(15, 23, 42, 0.6)', color: 'white', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '1rem'
                    }}
                  >
                    <option value="General">General</option>
                    <option value="OBC">OBC</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                  </select>
                </div>
              </div>

              <div style={{ textAlign: 'left' }}>
                <label className="criteria-title">ANNUAL FAMILY INCOME (₹)</label>
                <input name="income" placeholder="e.g. 500000" type="number" onChange={handleChange} value={form.income} style={{ marginTop: '8px' }} />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button className="btn-secondary" onClick={() => setStep(1)} style={{ flex: 1, padding: '14px' }}>
                  ← Back
                </button>
                <button className="btn-primary" onClick={register} disabled={loading} style={{ flex: 2, padding: '14px' }}>
                  {loading ? "Creating Profile..." : "Complete & Login"}
                </button>
              </div>
            </>
          )}
        </div>

        <p style={{ marginTop: "30px", fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Already have an account? <Link to="/login" className="text-gradient" style={{ fontWeight: '700', textDecoration: 'none' }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}
