import { useEffect, useState } from 'react';
import api from '../api';

interface DigitalResource {
  id: number;
  title: string;
  slug: string;
  description?: string;
  url?: string;
  mediaId?: number;
  category: string;
  icon?: string;
  accessInstructions?: string;
  coverUrl?: string;
  coverAlt?: string;
  tags?: string[];
  requiresCardNumber: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  ebook: '📚 eBooks',
  database: '🗃️ Databases',
  streaming: '🎬 Streaming',
  tool: '🔧 Tools',
  local: '📍 Local Resources',
  government: '🏛️ Government',
  other: '📎 Other',
};

export default function DigitalResources() {
  const [resources, setResources] = useState<DigitalResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  useEffect(() => {
    api.get('/digital-resources')
      .then(res => setResources(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="owlet-loading"><span /><span /><span /></div>
  );

  if (resources.length === 0) return null;

  // Get unique categories in use
  const categories = ['all', ...Array.from(new Set(resources.map(r => r.category)))];

  const filtered = activeCategory === 'all'
    ? resources
    : resources.filter(r => r.category === activeCategory);

  const getResourceUrl = (resource: DigitalResource) => {
    if (resource.url) return resource.url;
    if (resource.mediaId) return `http://localhost:3000/media/file/${resource.mediaId}`;
    return null;
  };

  return (
    <section style={{ marginTop: '3rem' }}>
      <div className="owlet-section-heading">
        <h2>💻 Digital Resources</h2>
      </div>

      {/* Category filter tabs */}
      {categories.length > 2 && (
        <div className="owlet-dr-filters">
          {categories.map(cat => (
            <button
              key={cat}
              className={`owlet-media-filter ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat === 'all' ? 'All' : CATEGORY_LABELS[cat] || cat}
            </button>
          ))}
        </div>
      )}

      <div className="owlet-dr-grid">
        {filtered.map(resource => {
          const href = getResourceUrl(resource);
          return (
            <a
              key={resource.id}
              href={href || '#'}
              target={resource.url ? '_blank' : undefined}
              rel={resource.url ? 'noopener noreferrer' : undefined}
              className={`owlet-dr-card ${!href ? 'owlet-dr-card-no-link' : ''}`}
            >
              <div className="owlet-dr-card-icon">
                {resource.coverUrl ? (
                  <img
                    src={resource.coverUrl}
                    alt={resource.coverAlt || resource.title}
                    className="owlet-dr-cover"
                  />
                ) : (
                  <span>{resource.icon || CATEGORY_LABELS[resource.category]?.split(' ')[0] || '📎'}</span>
                )}
              </div>
              <div className="owlet-dr-card-info">
                <h3>{resource.title}</h3>
                {resource.description && <p>{resource.description}</p>}
                {resource.requiresCardNumber && (
                  <span className="owlet-dr-card-badge">🪪 Library card required</span>
                )}
                {resource.accessInstructions && (
                  <p className="owlet-dr-instructions">{resource.accessInstructions}</p>
                )}
              </div>
              {href && (
                <div className="owlet-dr-card-arrow">→</div>
              )}
            </a>
          );
        })}
      </div>
    </section>
  );
}
