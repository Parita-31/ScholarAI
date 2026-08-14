import { API_URL } from "../config";

export default function Profile({ user }) {
  if (!user) return <div className="dashboard">Please log in.</div>;

  return (
    <div className="dashboard animate-fade-in">
      <h2 className="section-title">My Account</h2>
      <p className="section-subtitle">Manage your academic profile and application preferences.</p>

      <div className="glass" style={{ maxWidth: "700px", padding: "40px", margin: "0 auto" }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '40px', borderBottom: '1px solid var(--border)', paddingBottom: '30px' }}>
          <div style={{
            width: "90px", height: "90px",
            background: "linear-gradient(135deg, var(--primary), var(--accent))",
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "2.2rem", fontWeight: "bold", color: "white",
            boxShadow: '0 4px 20px var(--primary-glow)'
          }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 style={{ margin: "0", fontSize: "1.75rem", fontWeight: '700' }}>{user.name}</h3>
            <p style={{ color: "var(--text-muted)", marginTop: "4px", fontSize: '1rem' }}>{user.email}</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
          <div className="info-item">
            <label className="criteria-title">EDUCATION LEVEL</label>
            <div style={{ fontSize: "1.1rem", fontWeight: '600', marginTop: '4px' }}>{user.education_level}</div>
          </div>

          <div className="info-item">
            <label className="criteria-title">MAJOR / FIELD</label>
            <div style={{ fontSize: "1.1rem", fontWeight: '600', marginTop: '4px' }}>{user.course || "N/A"}</div>
          </div>

          <div className="info-item">
            <label className="criteria-title">GPA / GRADE</label>
            <div style={{ fontSize: "1.1rem", fontWeight: '600', marginTop: '4px' }}>{user.gpa || "N/A"}</div>
          </div>

          <div className="info-item">
            <label className="criteria-title">STUDENT CATEGORY</label>
            <div style={{ fontSize: "1.1rem", fontWeight: '600', marginTop: '4px' }}>{user.category}</div>
          </div>

          <div className="info-item" style={{ gridColumn: "span 2" }}>
            <label className="criteria-title">ANNUAL FAMILY INCOME</label>
            <div className="income-tag" style={{ fontSize: "1.25rem", marginTop: '4px' }}>₹{user.income?.toLocaleString()}</div>
          </div>
        </div>

        <div style={{ marginTop: "40px", background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ color: "white", margin: 0 }}>Sync Global Data</h4>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: '4px' }}>Fetch latest scholarship updates instantly.</p>
            </div>
            <button
              onClick={async () => {
                const btn = document.getElementById('sync-btn');
                btn.innerText = "Syncing...";
                try {
                  const res = await fetch(`${API_URL}/api/admin/sync-scholarships`);
                  const data = await res.json();
                  alert(`Successfully synced ${data.count} scholarships!`);
                  window.location.reload();
                } catch (e) {
                  alert("Sync failed. Check if server is running.");
                } finally {
                  btn.innerText = "Sync Now";
                }
              }}
              id="sync-btn"
              className="btn-secondary"
            >
              Sync Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
