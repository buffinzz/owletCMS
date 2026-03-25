import { useEffect, useState, lazy, Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api';

const HoldButton = lazy(() => import('../native-catalog/HoldButton'));

interface CatalogItem {
  id: number;
  title: string;
  author?: string;
  isbn?: string;
  publisher?: string;
  publishedDate?: string;
  summary?: string;
  coverUrl?: string;
  coverAlt?: string;
  subjects?: string[];
  format?: string;
  source: string;
  externalUrl?: string;
}

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<CatalogItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get(`/catalog/item/${id}`)
      .then(res => {
        if (!res.data) setNotFound(true);
        else setItem(res.data);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="owlet-main">
      <div className="owlet-loading"><span /><span /><span /></div>
    </div>
  );

  if (notFound || !item) return (
    <div className="owlet-main" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
      <h2 style={{ fontFamily: 'Playfair Display, serif', color: 'var(--purple-deep)' }}>
        Item not found
      </h2>
      <Link to="/collections" style={{ color: 'var(--purple-mid)' }}>
        ← Browse collections
      </Link>
    </div>
  );

  return (
    <div>
      <div className="owlet-item-detail-hero">
        <div className="owlet-item-detail-inner">
          <Link to="javascript:history.back()" onClick={e => { e.preventDefault(); window.history.back(); }}
             className="owlet-collection-back">
            ← Back
          </Link>
        </div>
      </div>

      <main className="owlet-main">
        <div className="owlet-item-detail">
          {/* Cover */}
          <div className="owlet-item-detail-cover">
            {item.coverUrl ? (
              <img src={item.coverUrl} alt={item.coverAlt || item.title} />
            ) : (
              <div className="owlet-item-detail-cover-placeholder">
                <span>📖</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="owlet-item-detail-info">
            <h1>{item.title}</h1>
            {item.author && (
              <p className="owlet-item-detail-author">by {item.author}</p>
            )}

            <div className="owlet-item-detail-meta">
              {item.format && (
                <span className="owlet-catalog-source">{item.format}</span>
              )}
              {item.publisher && <span>{item.publisher}</span>}
              {item.publishedDate && <span>{item.publishedDate}</span>}
              {item.isbn && <span>ISBN: {item.isbn}</span>}
            </div>

            {/* Hold button — only for native items */}
            {item.source === 'native' && (
              <div style={{ margin: '1.25rem 0' }}>
                <Suspense fallback={null}>
                  <HoldButton itemId={item.id} size="medium" />
                </Suspense>
              </div>
            )}

            {/* External catalog link */}
            {item.externalUrl && (
              <a
                href={item.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="owlet-btn owlet-btn-primary"
                style={{ display: 'inline-block', width: 'auto', marginBottom: '1rem' }}
              >
                View in Catalog →
              </a>
            )}

            {/* Summary */}
            {item.summary && (
              <div className="owlet-item-detail-summary">
                <h3>About this item</h3>
                <p>{item.summary}</p>
              </div>
            )}

            {/* Subjects */}
            {item.subjects && item.subjects.length > 0 && (
              <div className="owlet-item-detail-subjects">
                <h3>Subjects</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {item.subjects.map(s => (
                    <span key={s} className="owlet-book-subject">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
