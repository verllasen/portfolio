import React from 'react'
import { Link } from 'react-router-dom'
import { FaFutbol } from 'react-icons/fa'
import './Footer.css'

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <div className="footer-logo">
            <FaFutbol className="footer-logo-icon" />
            <span className="footer-logo-text">Ligasport24</span>
          </div>
          <p className="footer-description">
            Официальный сайт для отслеживания Премьер-лиги Танзании. 
            Расписание, результаты, статистика и многое другое.
          </p>
        </div>

        <div className="footer-section">
          <h3 className="footer-title">Навигация</h3>
          <ul className="footer-links">
            <li><Link to="/">Главная</Link></li>
            <li><Link to="/schedule">Расписание</Link></li>
            <li><Link to="/live">Живые игры</Link></li>
            <li><Link to="/statistics">Статистика</Link></li>
            <li><Link to="/fantasy">Фэнтези-футбол</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h3 className="footer-title">Информация</h3>
          <ul className="footer-links">
            <li><a href="#about">О нас</a></li>
            <li><a href="#contact">Контакты</a></li>
            <li><a href="#privacy">Политика конфиденциальности</a></li>
            <li><a href="#terms">Условия использования</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <p className="footer-copyright">
            © 2025 Ligasport24. Все права защищены.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

