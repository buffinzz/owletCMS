import { useState } from 'react'
import PageView from './pages/PageView';
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
      <PageView />
    </div>
    </>
  )
}

export default App
