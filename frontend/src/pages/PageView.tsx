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

  useEffect(() => {
    api.get('/pages').then(res => setPages(res.data));
  }, []);

  return (
    <div>
      {pages.map(page => (
        <div key={page.id}>
          <h1>{page.title}</h1>
          <p>{page.content}</p>
        </div>
      ))}
    </div>
  );
}