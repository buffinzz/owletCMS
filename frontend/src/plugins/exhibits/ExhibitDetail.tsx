import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api';
import ExhibitPanelRenderer from './ExhibitPanelRenderer';

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
  panels: any[];
}

export default function ExhibitDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [exhibit, setExhibit] = useState<Exhibit | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    api.get(`/exhibits/${slug}/panels`)
      .then(res => {
        if (!res.data) setNotFound(true);
        else setExhibit(res.data);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="owlet-loading" style={{ minHeight: '50vh' }}>
      <span /><span /><span />
    </div>
  );

  if (notFound || !exhibit) return (
    <main className="owlet-main">
      <div className="owlet-empty">
        <div className="owlet-empty-icon">🖼️</div>
        <p>Exhibit not found.</p>
        <Link to="/exhibits" style={{ color: 'var(--purple-mid)' }}>← All Exhibits</Link>
      </div>
    </main>
  );

  const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null;
  const startFmt = formatDate(exhibit.startDate);
  const endFmt = formatDate(exhibit.endDate);

  return (
    <div className="owlet-exhibit-detail">
      {/* Hero */}
      <section className="owlet-exhibit-hero">
        {exhibit.coverUrl && (
          <div className="owlet-exhibit-hero-bg">
            <img src={exhibit.coverUrl} alt={exhibit.coverAlt || exhibit.title} />
          </div>
        )}
        <div className="owlet-exhibit-hero-inner">
          <Link to="/exhibits" className="owlet-collection-back">← All Exhibits</Link>
          <div className="owlet-exhibit-type-badge">
            {exhibit.type === 'digital' ? '💻 Digital Exhibit' :
             exhibit.type === 'physical' ? '🏛️ Physical Exhibit' :
             '🌐 Digital & Physical Exhibit'}
          </div>
          <h1>{exhibit.title}</h1>
          {exhibit.description && <p className="owlet-exhibit-hero-desc">{exhibit.description}</p>}
          <div className="owlet-exhibit-hero-meta">
            {exhibit.location && <span>📍 {exhibit.location}</span>}
            {startFmt && endFmt && <span>📅 {startFmt} – {endFmt}</span>}
            {startFmt && !endFmt && <span>📅 From {startFmt}</span>}
          </div>
        </div>
      </section>

      {/* Panels */}
      <main className="owlet-exhibit-body">
        {exhibit.panels.length === 0 ? (
          <div className="owlet-empty">
            <p>No content in this exhibit yet.</p>
          </div>
        ) : (
          <div className="owlet-exhibit-panels">
            {exhibit.panels.map(panel => (
              <ExhibitPanelRenderer key={panel.id} panel={panel} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
