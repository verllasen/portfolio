import React from 'react'

// Простейший тест для проверки работы React
function TestApp() {
  return (
    <div style={{ 
      padding: '50px', 
      background: 'linear-gradient(135deg, #1e3a8a 0%, #000000 100%)',
      color: 'white',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '20px' }}>Ligasport24</h1>
      <p style={{ fontSize: '1.5rem' }}>React работает! Если вы видите это сообщение, значит проблема в компонентах.</p>
      <p style={{ marginTop: '20px', color: '#60a5fa' }}>Проверьте консоль браузера (F12) на наличие ошибок.</p>
    </div>
  )
}

export default TestApp

