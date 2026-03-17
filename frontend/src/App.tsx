import { Routes, Route } from 'react-router-dom'
import PageView from './pages/PageView'

function App() {
  return (
    <Routes>
      <Route path="/:slug" element={<PageView />} />
      <Route path="/" element={<div>Welcome to Owlet 🦉</div>} />
    </Routes>
  )
}

export default App