import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import api from '../api';

interface PublicProfile {
  id: number;
  username: string;
  displayName?: string;
  jobTitle?: string;
  bio?: string;
  location?: string;
  photoUrl?: string;
  customFields?: Record<string, string>;
}

interface PrivateProfile extends PublicProfile {
  email?: string;
  phone?: string;
  emergencyContact?: string;
  notes?: string;
  lastLoginAt?: string;
  createdAt?: string;
  role?: string;
}

export default function StaffProfile() {
  const { username } = useParams<{ username: string }>();
  const { user, isAuthenticated } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [profile, setProfile] = useState<PrivateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (isAdmin) {
          const [publicRes, allUsers] = await Promise.all([
            api.get(`/users/profile/${username}`),
            api.get('/users', { headers: { Authorization: `Bearer ${user?.token}` } }),
          ]);
          const privateData = allUsers.data.find((u: PrivateProfile) => u.username === username);
          if (!publicRes.data) return setNotFound(true);
          setProfile({ ...publicRes.data, ...privateData });
        } else {
          const res = await api.get(`/users/profile/${username}`);
          if (!res.data) return setNotFound(true);
          setProfile(res.data);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [username, isAdmin, isAuthenticated]);

  if (loading) return (
    <div className="owlet-loading"><span /><span /><span /></div>
  );

  if (notFound) return (
    <main className="owlet-main">
      <div className="owlet-empty">
        <div className="owlet-empty-icon">🦉</div>
        <p>Staff member not found.</p>
        <Link to="/staff" className="owlet-card-slug" style={{ marginTop: '1rem', display: 'inline-block' }}>
          ← Back to directory
        </Link>
      </div>
    </main>
  );

  return (
    <main className="owlet-main">
      <Link to="/staff" className="owlet-card-slug" style={{ display: 'inline-block', marginBottom: '2rem' }}>
        ← Back to directory
      </Link>

      <div className="owlet-profile-card">
        <div className="owlet-profile-header">
          <div className="owlet-profile-photo">
            {profile?.photoUrl ? (
              <img 
                src={profile.photoUrl} 
                alt={profile.photoAlt || profile.displayName || profile?.username} 
              />
            ) : (
              <div className="owlet-profile-photo-placeholder">🦉</div>
            )}
          </div>
          <div className="owlet-profile-header-info">
            <h1>{profile?.displayName || profile?.username}</h1>
            {profile?.jobTitle && <p className="owlet-profile-title">{profile.jobTitle}</p>}
            {profile?.location && <p className="owlet-profile-location">📍 {profile.location}</p>}
          </div>
        </div>

        {profile?.bio && (
          <div className="owlet-profile-section">
            <p className="owlet-profile-bio">{profile.bio}</p>
          </div>
        )}

        {profile?.customFields && Object.keys(profile.customFields).length > 0 && (
          <div className="owlet-profile-section">
            {Object.entries(profile.customFields).map(([key, value]) => (
              <div key={key} className="owlet-profile-field">
                <span className="owlet-profile-field-label">{key}</span>
                <span>{value}</span>
              </div>
            ))}
          </div>
        )}

        {isAdmin && (
          <div className="owlet-profile-section owlet-profile-private">
            <h3>🔒 Private Info <span>(admin only)</span></h3>
            <div className="owlet-profile-private-grid">
              {profile?.role && (
                <div className="owlet-profile-field">
                  <span className="owlet-profile-field-label">Role</span>
                  <span>{profile.role}</span>
                </div>
              )}
              {profile?.email && (
                <div className="owlet-profile-field">
                  <span className="owlet-profile-field-label">Email</span>
                  <a href={`mailto:${profile.email}`}>{profile.email}</a>
                </div>
              )}
              {profile?.phone && (
                <div className="owlet-profile-field">
                  <span className="owlet-profile-field-label">Phone</span>
                  <span>{profile.phone}</span>
                </div>
              )}
              {profile?.emergencyContact && (
                <div className="owlet-profile-field">
                  <span className="owlet-profile-field-label">Emergency Contact</span>
                  <span>{profile.emergencyContact}</span>
                </div>
              )}
              {profile?.notes && (
                <div className="owlet-profile-field owlet-profile-field-full">
                  <span className="owlet-profile-field-label">Notes</span>
                  <p>{profile.notes}</p>
                </div>
              )}
              {profile?.lastLoginAt && (
                <div className="owlet-profile-field">
                  <span className="owlet-profile-field-label">Last Login</span>
                  <span>{new Date(profile.lastLoginAt).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
