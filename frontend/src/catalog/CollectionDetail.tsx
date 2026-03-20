import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';

interface CatalogItem {
  id: number;
  title: string;
  author?: string;
  isbn?: string;
  summary?: string;
  coverUrl?: string;
  coverAlt?: string;
  publishedDate?: string;
  subjects?: string[];
  externalUrl?: string;
  source: string;
}

interface Collection {
  id: number;
  name: string;
  slug: string;
  description?: string;
  coverUrl?: string;
  coverAlt?: string;
  coverTitle?: string;
  items: CatalogItem[];
}

export default function CollectionDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selected, setSelected] = useState<CatalogItem | null>(null);

  useEffect(() => {
    api.get(`/collections/${slug}`)
      .then(res => {
        if (!res.data) return setNotFound(true);
        setCollection(res.data);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="owlet-loading" style={{ minHeight: '50vh' }}>
      <span /><span /><span />
    </div>
  );

  if (notFound || !collection) return (
    <main className="owlet-main">
      <div className="owlet-empty">
        <div className="owlet-empty-icon">🗂️</div>
        <p>Collection not found.</p>
        <Link to="/" className="owlet-card-slug" style={{ marginTop: '1rem', display: 'inline-block' }}>
          ← Back to home
        </Link>
      </div>
    </main>
  );

  return (
    <div>
      {/* Collection hero */}
      <section className="owlet-collection-hero">
        {collection.coverUrl && (
          <div className="owlet-collection-hero-bg">
            <img
              src={collection.coverUrl}
              alt={collection.coverAlt || collection.name}
              title={collection.coverTitle || undefined}
            />
          </div>
        )}
        <div className="owlet-collection-hero-inner">
          <Link to="/" className="owlet-collection-back">← Back</Link>
          <h1>{collection.name}</h1>
          {collection.description && <p>{collection.description}</p>}
          <p className="owlet-collection-count">
            {collection.items?.length || 0} items
          </p>
        </div>
      </section>

      <main className="owlet-main">
        {!collection.items || collection.items.length === 0 ? (
          <div className="owlet-empty">
            <div className="owlet-empty-icon">📚</div>
            <p>No items in this collection yet.</p>
          </div>
        ) : (
          <>
            {/* Book shelf */}
            <div className="owlet-shelf">
              {collection.items.map(item => (
                <button
                  key={item.id}
                  className={`owlet-book ${selected?.id === item.id ? 'selected' : ''}`}
                  onClick={() => setSelected(selected?.id === item.id ? null : item)}
                >
                  <div className="owlet-book-cover">
                    {item.coverUrl ? (
                      <img
                        src={item.coverUrl}
                        alt={item.coverAlt || item.title}
                        onError={e => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.classList.add('owlet-book-cover-missing');
                        }}
                      />
                    ) : (
                      <div className="owlet-book-cover-missing" />
                    )}
                  </div>
                  <p className="owlet-book-title">{item.title}</p>
                  {item.author && <p className="owlet-book-author">{item.author}</p>}
                </button>
              ))}
            </div>

            {/* Detail panel */}
            {selected && (
              <div className="owlet-book-detail">
                <div className="owlet-book-detail-cover">
                  {selected.coverUrl && (
                    <img
                      src={selected.coverUrl}
                      alt={selected.coverAlt || selected.title}
                    />
                  )}
                </div>
                <div className="owlet-book-detail-info">
                  <h3>{selected.title}</h3>
                  {selected.author && (
                    <p className="owlet-book-detail-author">by {selected.author}</p>
                  )}
                  {selected.publishedDate && (
                    <p className="owlet-book-detail-meta">{selected.publishedDate}</p>
                  )}
                  {selected.subjects && selected.subjects.length > 0 && (
                    <div className="owlet-book-subjects">
                      {selected.subjects.slice(0, 5).map(s => (
                        <span key={s} className="owlet-book-subject">{s}</span>
                      ))}
                    </div>
                  )}
                  {selected.summary && (
                    <p className="owlet-book-detail-summary">{selected.summary}</p>
                  )}
                  {selected.externalUrl && (
                    <a
                      href={selected.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="owlet-btn owlet-btn-primary"
                      style={{ width: 'auto', display: 'inline-block', marginTop: '1rem', textDecoration: 'none', textAlign: 'center' }}
                    >
                      View in Catalog →
                    </a>
                  )}
                </div>
                <button
                  className="owlet-book-detail-close"
                  onClick={() => setSelected(null)}
                >✕</button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
