import React, { useEffect, useState } from 'react'
import { FaFutbol } from 'react-icons/fa'
import './LoadingScreen.css'

const LoadingScreen = ({ isLoading }) => {
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      setFadeOut(true)
      setTimeout(() => {
        setFadeOut(false)
      }, 500)
    }
  }, [isLoading])

  if (!isLoading && !fadeOut) return null

  return (
    <div className={`loading-screen ${fadeOut ? 'fade-out' : ''}`}>
      <div className="loading-content">
        <div className="loading-logo">
          <FaFutbol className="loading-icon" />
          <span className="loading-text">Ligasport24</span>
        </div>
        <div className="loading-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
        <p className="loading-message">Загрузка...</p>
      </div>
    </div>
  )
}

export default LoadingScreen

