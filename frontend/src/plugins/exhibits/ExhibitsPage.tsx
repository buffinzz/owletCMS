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
  startDate?: string;
  endDate?: string;
}

const TYPE_LABELS: Record<string, string> = {
  digital: '💻 Digital',
  physical: '🏛️ Physical',
  both: '🌐 Digital & Physical',
};

export default function ExhibitsPage() {
  const [exhibits, setExhibits] = useState<Exhibit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    api.get('/exhibits')
      .then(res => setExhibits(res.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter ? exhibits.filter(e => e.type === filter) : exhibits;

  return (
    <div>
      <section className="owlet-hero owlet-hero-short">
        <div className="owlet-hero-inner">
          <div className="owlet-hero-text">
            <h1>Exhibits & <em>Collections.</em></h1>
            <p>Explore our digital and physical exhibits.</p>
          </div>
        </div>
      </section>

      <main className="owlet-main">
        {/* Filter tabs */}
        {exhibits.some(e => e.type !== exhibits[0]?.type) && (
          <div className="owlet-events-filters" style={{ marginBottom: '1.5rem' }}>
            <button className={`owlet-media-filter ${filter === '' ? 'active' : ''}`}
              onClick={() => setFilter('')}>All</button>
            <button className={`owlet-media-filter ${filter === 'digital' ? 'active' : ''}`}
              onClick={() => setFilter('digital')}>💻 Digital</button>
            <button className={`owlet-media-filter ${filter === 'physical' ? 'active' : ''}`}
              onClick={() => setFilter('physical')}>🏛️ Physical</button>
            <button className={`owlet-media-filter ${filter === 'both' ? 'active' : ''}`}
              onClick={() => setFilter('both')}>🌐 Both</button>
          </div>
        )}

        {loading ? (
          <div className="owlet-loading"><span /><span /><span /></div>
        ) : filtered.length === 0 ? (
          <div className="owlet-empty">
            <div className="owlet-empty-icon">🖼️</div>
            <p>No exhibits yet — check back soon.</p>
          </div>
        ) : (
          <div className="owlet-exhibits-grid">
            {filtered.map(exhibit => (
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
                  <span className="owlet-exhibit-card-type">
                    {TYPE_LABELS[exhibit.type] || exhibit.type}
                  </span>
                </div>
                <div className="owlet-exhibit-card-info">
                  <h3>{exhibit.title}</h3>
                  {exhibit.description && <p>{exhibit.description}</p>}
                  <div className="owlet-exhibit-card-meta">
                    {exhibit.location && <span>📍 {exhibit.location}</span>}
                    {exhibit.startDate && (
                      <span>📅 {new Date(exhibit.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
