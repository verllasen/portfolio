// Простая версия для тестирования
import React from 'react'
import ReactDOM from 'react-dom/client'

const rootElement = document.getElementById('root')

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <div style={{
      padding: '50px',
      background: 'linear-gradient(135deg, #1e3a8a 0%, #000000 100%)',
      color: 'white',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '20px' }}>⚽ Ligasport24</h1>
      <p style={{ fontSize: '1.5rem', color: '#60a5fa' }}>React работает!</p>
      <p style={{ marginTop: '20px' }}>Если вы видите это сообщение, значит React загружается правильно.</p>
      <p style={{ marginTop: '10px', fontSize: '0.9rem', color: '#a0a0a0' }}>Проверьте консоль браузера (F12) на наличие ошибок.</p>
    </div>
  )
  console.log('Simple test rendered successfully')
} else {
  console.error('Root element not found!')
  document.body.innerHTML = '<div style="padding: 20px; color: red;"><h1>Ошибка: Root element не найден!</h1></div>'
}

