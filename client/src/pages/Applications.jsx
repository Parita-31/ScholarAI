import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../config";

export default function Applications({ user }) {
  const [apps, setApps] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/api/applications/${user.id}`)
      .then(res => res.json())
      .then(setApps);
  }, [user]);

  return (
    <div className="dashboard animate-fade-in">
      <h2 className="section-title">My Applications</h2>
      <p className="section-subtitle">Track the status and progress of your active scholarship applications.</p>

      {apps.length === 0 ? (
        <div className="glass" style={{ padding: '60px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📁</div>
          <h3 style={{ color: 'white' }}>No applications yet</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '25px' }}>Start exploring scholarships and launch your first application.</p>
          <Link to="/scholarships" className="btn-primary">Browse Scholarships</Link>
        </div>
      ) : (
        <div className="card-grid">
          {apps.map((a, i) => (
            <div key={i} className="card glass" style={{ borderLeft: '4px solid var(--primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ fontSize: '1.2rem', margin: 0 }}>{a.name}</h3>
                <span className={`pill ${a.status.toLowerCase() === 'pending' ? 'yellow' : 'green'}`} style={{
                  background: a.status.toLowerCase() === 'pending' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(52, 211, 153, 0.1)',
                  color: a.status.toLowerCase() === 'pending' ? '#fbbf24' : '#34d399',
                  border: `1px solid ${a.status.toLowerCase() === 'pending' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(52, 211, 153, 0.2)'}`
                }}>
                  {a.status}
                </span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '12px' }}>
                Applied on: {new Date().toLocaleDateString()}
              </p>
              <div style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
                <button className="btn-secondary" style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }}>View Details</button>
                <button className="btn-secondary" style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }}>Withdraw</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
