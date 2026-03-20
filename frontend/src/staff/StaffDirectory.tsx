import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

interface StaffMember {
  id: number;
  username: string;
  displayName?: string;
  jobTitle?: string;
  bio?: string;
  location?: string;
  photoUrl?: string;
}

export default function StaffDirectory() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/directory')
      .then(res => setStaff(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="owlet-loading"><span /><span /><span /></div>
  );

  return (
    <div>
      <section className="owlet-hero owlet-hero-short">
        <div className="owlet-hero-inner">
          <div className="owlet-hero-text">
            <h1>Meet our <em>team.</em></h1>
            <p>The people behind your library.</p>
          </div>
        </div>
      </section>

      <main className="owlet-main">
        <div className="owlet-section-heading">
          <h2>👥 Staff Directory</h2>
        </div>

        {staff.length === 0 ? (
          <div className="owlet-empty">
            <div className="owlet-empty-icon">👥</div>
            <p>No staff profiles yet.</p>
          </div>
        ) : (
          <div className="owlet-staff-grid">
            {staff.map(member => (
              <Link
                key={member.id}
                to={`/staff/${member.username}`}
                className="owlet-staff-card"
              >
                <div className="owlet-staff-photo">
                  {member.photoUrl ? (
                    <img 
                      src={member.photoUrl} 
                      alt={member.photoAlt || member.displayName || member.username} 
                    />
                  ) : (
                    <div className="owlet-staff-photo-placeholder">🦉</div>
                  )}
                </div>
                <div className="owlet-staff-info">
                  <h3>{member.displayName || member.username}</h3>
                  {member.jobTitle && <p className="owlet-staff-title">{member.jobTitle}</p>}
                  {member.location && <p className="owlet-staff-location">📍 {member.location}</p>}
                  {member.bio && <p className="owlet-staff-bio">{member.bio}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
