import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';

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
    <section>
      <div className="owlet-section-heading">
        <h2>New Arrivals</h2>
      </div>

      <div className="owlet-shelf">
        {items.map(item => (
          <Link key={item.id} to={`/item/${item.id}`} className="owlet-book-card">
            <article className="owlet-book">
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
            </article>
          </Link>
        ))}
      </div>
    </section>
  );
}
