import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { 
  FaHome, 
  FaCalendarAlt, 
  FaBroadcastTower, 
  FaChartBar, 
  FaTrophy,
  FaBars,
  FaTimes
} from 'react-icons/fa'
import './Navigation.css'

const Navigation = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const navItems = [
    { path: '/', label: 'Главная', icon: FaHome },
    { path: '/schedule', label: 'Расписание', icon: FaCalendarAlt },
    { path: '/live', label: 'Живые игры', icon: FaBroadcastTower },
    { path: '/statistics', label: 'Статистика', icon: FaChartBar },
    { path: '/fantasy', label: 'Фэнтези', icon: FaTrophy },
  ]

  return (
    <nav className="navigation">
      <div className="nav-container">
        <button 
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
        <div className={`nav-items ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => 
                  `nav-item ${isActive ? 'active' : ''}`
                }
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon className="nav-icon" />
                <span className="nav-label">{item.label}</span>
              </NavLink>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

export default Navigation

