import { useEffect, useState } from 'react';
import api from '../../api';
import { Link } from 'react-router-dom'

const pagesCache: { data: Page[] | null } = {
  data: null,
};
interface Page {
  id: number;
  title: string;
  slug: string;
  content: string;
}

export default function PageView() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use cache if available
    if (pagesCache.data) {
        setPages(pagesCache.data);
        setLoading(false);
        return;
    }

    setLoading(true);

    api.get('/pages')
        .then(res => {
        pagesCache.data = res.data; // cache it
        setPages(res.data);
        })
        .catch(() => {
        setPages([]);
        })
        .finally(() => setLoading(false));
    }, []);

  if (loading) {
    return (
      <div className="owlet-loading">
        <span /><span /><span />
      </div>
    );
  }

  return (
    <section>
      <div className="owlet-section-heading">
        <h2>📄 Pages</h2>
      </div>

      {pages.length === 0 ? (
        <div className="owlet-empty">
          <div className="owlet-empty-icon">🦉</div>
          <p>No pages yet — the nest is empty but ready.</p>
        </div>
      ) : (
        <div className="owlet-pages-grid">
          {pages.map(page => (
            <Link key={page.id} to={`/${page.slug}`} className="owlet-card">
              <h3>{page.title}</h3>
              <p>{page.content.slice(0, 144)}...</p>
              <span className="owlet-card-slug">/{page.slug}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
