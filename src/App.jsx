import React, { useState, useEffect, Component } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import LoadingScreen from './components/LoadingScreen'
import Home from './pages/Home'
import Schedule from './pages/Schedule'
import LiveMatches from './pages/LiveMatches'
import Statistics from './pages/Statistics'
import Fantasy from './pages/Fantasy'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '50px',
          background: 'linear-gradient(135deg, #1e3a8a 0%, #000000 100%)',
          color: 'white',
          minHeight: '100vh',
          fontFamily: 'Arial, sans-serif',
          textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '20px', color: '#ef4444' }}>Ошибка загрузки</h1>
          <p style={{ fontSize: '1.2rem', marginBottom: '10px' }}>{this.state.error?.message || 'Неизвестная ошибка'}</p>
          <pre style={{ 
            background: '#1a1a1a', 
            padding: '20px', 
            borderRadius: '10px',
            textAlign: 'left',
            overflow: 'auto',
            maxWidth: '800px',
            margin: '20px auto'
          }}>
            {this.state.error?.stack}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '1rem',
              marginTop: '20px'
            }}
          >
            Перезагрузить страницу
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

function App() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Симуляция загрузки приложения
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500) // 1.5 секунды загрузки

    return () => clearTimeout(timer)
  }, [])

  return (
    <ErrorBoundary>
      <LoadingScreen isLoading={isLoading} />
      {!isLoading && (
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/live" element={<LiveMatches />} />
              <Route path="/statistics" element={<Statistics />} />
              <Route path="/fantasy" element={<Fantasy />} />
            </Routes>
          </Layout>
        </Router>
      )}
    </ErrorBoundary>
  )
}

export default App

