import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

console.log('Main.jsx loaded')
console.log('Root element:', document.getElementById('root'))

const rootElement = document.getElementById('root')

if (!rootElement) {
  console.error('Root element not found!')
  document.body.innerHTML = '<div style="padding: 20px; color: red;"><h1>Ошибка: Root element не найден!</h1></div>'
} else {
  try {
    const root = ReactDOM.createRoot(rootElement)
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    )
    console.log('App rendered successfully')
  } catch (error) {
    console.error('Error rendering app:', error)
    rootElement.innerHTML = `<div style="padding: 20px; color: red;"><h1>Ошибка рендеринга</h1><p>${error.message}</p><pre>${error.stack}</pre></div>`
  }
}

