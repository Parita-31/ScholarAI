import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API_URL } from "../config";

export default function Login({ setUser }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  const login = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Invalid email or password");
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div className="auth-box glass animate-fade-in" style={{ width: '100%', border: '1px solid var(--primary-glow)' }}>
        <h2 className="text-gradient">Welcome Back</h2>
        <p className="section-subtitle" style={{ marginBottom: '30px' }}>Sign in to continue to ScholarAI</p>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#f87171',
            padding: '12px',
            borderRadius: '10px',
            marginBottom: '20px',
            fontSize: '0.9rem'
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={login} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ textAlign: 'left' }}>
            <label className="criteria-title">EMAIL ADDRESS</label>
            <input
              name="email"
              type="email"
              placeholder="e.g. james@example.com"
              value={form.email}
              onChange={handleChange}
              required
              style={{ marginTop: '8px' }}
            />
          </div>

          <div style={{ textAlign: 'left' }}>
            <label className="criteria-title">PASSWORD</label>
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
              style={{ marginTop: '8px' }}
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '14px', marginTop: '10px' }}>
            {loading ? "Verifying..." : "Sign In"}
          </button>
        </form>

        <p style={{ marginTop: "30px", fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          New to ScholarAI? <Link to="/register" className="text-gradient" style={{ fontWeight: '700', textDecoration: 'none' }}>Create Account</Link>
        </p>
      </div>
    </div>
  );
}
