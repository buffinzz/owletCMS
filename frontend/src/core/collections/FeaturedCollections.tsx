import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';

interface Collection {
  id: number;
  name: string;
  slug: string;
  description?: string;
  coverUrl?: string;
  coverAlt?: string;
  coverTitle?: string;
}

export default function FeaturedCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/collections')
      .then(res => setCollections(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="owlet-loading"><span /><span /><span /></div>
  );

  if (collections.length === 0) return null;

  return (
    <section>
      <div className="owlet-section-heading">
        <h2>🗂️ Featured Collections</h2>
      </div>
      <div className="owlet-collections-grid">
        {collections.map(col => (
          <Link
            key={col.id}
            to={`/collections/${col.slug}`}
            className="owlet-collection-card"
          >
            <div className="owlet-collection-card-cover">
              {col.coverUrl ? (
                <img
                  src={col.coverUrl}
                  alt={col.coverAlt || col.name}
                  title={col.coverTitle || undefined}
                />
              ) : (
                <div className="owlet-collection-card-placeholder">
                  🗂️
                </div>
              )}
            </div>
            <div className="owlet-collection-card-info">
              <h3>{col.name}</h3>
              {col.description && <p>{col.description}</p>}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
