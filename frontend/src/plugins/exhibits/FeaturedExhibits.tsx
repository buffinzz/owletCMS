import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';

interface Exhibit {
  id: number;
  title: string;
  slug: string;
  description?: string;
  coverUrl?: string;
  coverAlt?: string;
  type: string;
  location?: string;
}

export default function FeaturedExhibits() {
  const [exhibits, setExhibits] = useState<Exhibit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/exhibits/featured')
      .then(res => setExhibits(res.data))
      .catch(() => setExhibits([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading || exhibits.length === 0) return null;

  return (
    <section style={{ marginTop: '3rem' }}>
      <div className="owlet-section-heading">
        <h2>🖼️ Featured Exhibits</h2>
        <Link to="/exhibits" className="owlet-section-link">All exhibits →</Link>
      </div>

      <div className="owlet-exhibits-grid owlet-exhibits-grid-sm">
        {exhibits.map(exhibit => (
          <Link
            key={exhibit.id}
            to={`/exhibits/${exhibit.slug}`}
            className="owlet-exhibit-card"
          >
            <div className="owlet-exhibit-card-cover">
              {exhibit.coverUrl ? (
                <img src={exhibit.coverUrl} alt={exhibit.coverAlt || exhibit.title} />
              ) : (
                <div className="owlet-exhibit-card-placeholder">🖼️</div>
              )}
            </div>
            <div className="owlet-exhibit-card-info">
              <h3>{exhibit.title}</h3>
              {exhibit.description && <p>{exhibit.description}</p>}
              {exhibit.location && (
                <span style={{ fontSize: '0.78rem', color: 'var(--ink-light)' }}>
                  📍 {exhibit.location}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
