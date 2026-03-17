import { useEffect, useState } from 'react';
import api from '../api';

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
    api.get('/pages')
      .then(res => setPages(res.data))
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
            <div key={page.id} className="owlet-card">
              <h3>{page.title}</h3>
              <p>{page.content}</p>
              <span className="owlet-card-slug">/{page.slug}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
