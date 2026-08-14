import { useEffect, useState } from "react";
import ScholarshipCard from "../components/ScholarshipCard";
import { API_URL } from "../config";

export default function Scholarships({ user }) {
  const [scholarships, setScholarships] = useState([]);

  useEffect(() => {
    // Fetch ALL scholarships instead of recommended
    fetch(`${API_URL}/api/scholarships`)
      .then(res => res.json())
      .then(data => {
        // Handle array response or object with rows
        if (Array.isArray(data)) setScholarships(data);
        else if (data.rows) setScholarships(data.rows);
        else setScholarships([]);
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="dashboard animate-fade-in">
      <h2 className="section-title">All Scholarships</h2>
      <p className="section-subtitle">Explore a comprehensive database of global funding opportunities.</p>

      <div className="card-grid">
        {scholarships.length > 0 ? (
          scholarships.map(s => (
            <ScholarshipCard key={s.id} s={s} user={user} />
          ))
        ) : (
          <p>No scholarships found.</p>
        )}
      </div>
    </div>
  );
}
