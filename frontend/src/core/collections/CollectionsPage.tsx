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
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/collections')
      .then(res => setCollections(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <section className="owlet-hero owlet-hero-short">
        <div className="owlet-hero-inner">
          <div className="owlet-hero-text">
            <h1>Our <em>Collections.</em></h1>
            <p>Curated reading lists and resources from our library team.</p>
          </div>
        </div>
      </section>

      <main className="owlet-main">
        {loading ? (
          <div className="owlet-loading"><span /><span /><span /></div>
        ) : collections.length === 0 ? (
          <div className="owlet-empty">
            <div className="owlet-empty-icon">🗂️</div>
            <p>No collections yet — check back soon.</p>
          </div>
        ) : (
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
                    />
                  ) : (
                    <div className="owlet-collection-card-placeholder">🗂️</div>
                  )}
                </div>
                <div className="owlet-collection-card-info">
                  <h3>{col.name}</h3>
                  {col.description && <p>{col.description}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
