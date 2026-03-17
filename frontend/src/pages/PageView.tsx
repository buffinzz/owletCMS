import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api';

interface Page {
  id: number;
  title: string;
  slug: string;
  content: string;
}

export default function PageView() {
  const { slug } = useParams()
  const [page, setPage] = useState<Page | null>(null)
  const [loading, setLoading] = useState(true)

  // EFFECT (right after state)
  useEffect(() => {
    setLoading(true)

    fetch(`${api}}/${slug}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found')
        return res.json()
      })
      .then(data => {
        setPage(data)
        setLoading(false)
      })
      .catch(() => {
        setPage(null)
        setLoading(false)
      })
  }, [slug]) // runs whenever slug changes

  // UI LOGIC (bottom)
  if (loading) return <div>Loading… 📖</div>
  if (!page) return <div>Page not found</div>

  return (
    <main style={{ padding: '2rem' }}>
      <h1>{page.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: page.content }} />
    </main>
  )
}