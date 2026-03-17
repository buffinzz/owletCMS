import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';

interface Page {
  id: number;
  title: string;
  slug: string;
  content: string;
}

export default function PageDetail() {
  const { slug } = useParams();
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    setLoading(true);

    api.get(`/pages/${slug}`)
      .then(res => setPage(res.data))
      .catch(() => setPage(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return <div className="owlet-loading"><span /><span /><span /></div>;
  }

  if (!page) {
    return <div className="owlet-empty">Page not found 🦉</div>;
  }

  return (
    <section>
      <div className="owlet-section-heading">
        <h2>{page.title}</h2>
      </div>

      <div className="owlet-card">
        <div dangerouslySetInnerHTML={{ __html: page.content }} />
      </div>
    </section>
  );
}