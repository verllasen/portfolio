import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { FaFutbol, FaSearch } from 'react-icons/fa'
import './Header.css'

const Header = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          <FaFutbol className="logo-icon" />
          <span className="logo-text">Ligasport24</span>
        </Link>
        <div className="header-right">
          {showSearch && (
            <div className="header-search">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Поиск команд, игроков..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button 
                className="search-close"
                onClick={() => {
                  setShowSearch(false)
                  setSearchQuery('')
                }}
              >
                ×
              </button>
            </div>
          )}
          {!showSearch && (
            <>
              <button 
                className="search-toggle"
                onClick={() => setShowSearch(true)}
                aria-label="Поиск"
              >
                <FaSearch />
              </button>
              <div className="header-info">
                <span className="league-name">Премьер-лига Танзании</span>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header

