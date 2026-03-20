import { useEffect, useState } from 'react';
import api from '../api';

interface CollectionItem {
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

interface NewArrivalsProps {
  count?: number;
}

export default function NewArrivals({ count = 10 }: NewArrivalsProps) {
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CollectionItem | null>(null);

  useEffect(() => {
    api.get(`/catalog/new-arrivals?count=${count}`)
      .then(res => setItems(res.data))
      .finally(() => setLoading(false));
  }, [count]);

  if (loading) return (
    <div className="owlet-loading"><span /><span /><span /></div>
  );

  if (items.length === 0) return null;

  return (
    <section style={{ marginTop: '3rem' }}>
      <div className="owlet-section-heading">
        <h2>📚 New Arrivals</h2>
      </div>

      {/* Book shelf */}
      <div className="owlet-shelf">
        {items.map(item => (
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
              <img src={selected.coverUrl} alt={selected.coverAlt || selected.title} />
            )}
          </div>
          <div className="owlet-book-detail-info">
            <h3>{selected.title}</h3>
            {selected.author && <p className="owlet-book-detail-author">by {selected.author}</p>}
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
    </section>
  );
}
