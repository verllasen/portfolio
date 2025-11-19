import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FaArrowRight, FaTrophy, FaChartLine, FaUsers } from 'react-icons/fa'
import { teams, generateMatches, generateLiveMatches, generateTable } from '../utils/mockData'
import { format } from 'date-fns'
import MatchDetails from '../components/MatchDetails'
import './Home.css'

const Home = () => {
  const [matches] = useState(() => {
    try {
      return generateMatches()
    } catch (error) {
      console.error('Error generating matches:', error)
      return []
    }
  })
  const [liveMatches] = useState(() => {
    try {
      return generateLiveMatches()
    } catch (error) {
      console.error('Error generating live matches:', error)
      return []
    }
  })
  const [table] = useState(() => {
    try {
      return generateTable()
    } catch (error) {
      console.error('Error generating table:', error)
      return []
    }
  })
  const [nextMatches, setNextMatches] = useState([])
  const [selectedMatch, setSelectedMatch] = useState(null)

  useEffect(() => {
    try {
      const upcoming = matches
        .filter(m => m.status === 'scheduled')
        .slice(0, 5)
      setNextMatches(upcoming)
    } catch (error) {
      console.error('Error setting next matches:', error)
    }
  }, [matches])

  const getTeamById = (id) => {
    try {
      return teams.find(t => t.id === id) || teams[0]
    } catch (error) {
      console.error('Error getting team:', error)
      return teams[0]
    }
  }

  return (
    <div className="home">
      <div className="hero-section">
        <h1 className="hero-title">Добро пожаловать в Ligasport24</h1>
        <p className="hero-subtitle">Следите за Премьер-лигой Танзании в реальном времени</p>
      </div>

      {/* Основной контент в две колонки */}
      <div className="home-main-layout">
        {/* Левая колонка - основные блоки */}
        <div className="home-main-content">
        {/* Живые игры */}
        <div className="home-card live-matches-card">
          <div className="card-header">
            <h2>
              <FaTrophy className="card-icon" />
              Живые игры
            </h2>
            <Link to="/live" className="card-link">
              Все игры <FaArrowRight />
            </Link>
          </div>
          <div className="live-matches-list">
            {liveMatches.length > 0 ? (
              liveMatches.map(match => {
                const home = getTeamById(match.homeTeam)
                const away = getTeamById(match.awayTeam)
                return (
                  <div 
                    key={match.id} 
                    className="live-match-item clickable"
                    onClick={() => setSelectedMatch(match)}
                  >
                    <div className="match-teams">
                      <div className="team">
                        <span className="team-logo">{home.logo}</span>
                        <span className="team-name">{home.name}</span>
                      </div>
                      <div className="match-score">
                        <span className="score">{match.homeScore}</span>
                        <span className="separator">:</span>
                        <span className="score">{match.awayScore}</span>
                      </div>
                      <div className="team">
                        <span className="team-logo">{away.logo}</span>
                        <span className="team-name">{away.name}</span>
                      </div>
                    </div>
                    <div className="match-status">
                      <span className="live-badge pulse">LIVE</span>
                      <span className="match-minute">{match.minute}'</span>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="no-matches">Нет активных игр</div>
            )}
          </div>
        </div>


        {/* Ближайшие матчи */}
        <div className="home-card upcoming-card">
          <div className="card-header">
            <h2>
              <FaUsers className="card-icon" />
              Ближайшие матчи
            </h2>
            <Link to="/schedule" className="card-link">
              Расписание <FaArrowRight />
            </Link>
          </div>
          <div className="upcoming-matches">
            {nextMatches.map(match => {
              const home = getTeamById(match.homeTeam)
              const away = getTeamById(match.awayTeam)
              return (
                <div 
                  key={match.id} 
                  className="upcoming-match-item clickable"
                  onClick={() => setSelectedMatch(match)}
                >
                  <div className="match-date">
                    {format(new Date(match.date), 'dd MMM, HH:mm')}
                  </div>
                  <div className="match-teams-upcoming">
                    <div className="team-upcoming">
                      <span className="team-logo">{home.logo}</span>
                      <span>{home.name}</span>
                    </div>
                    <span className="vs">VS</span>
                    <div className="team-upcoming">
                      <span className="team-logo">{away.logo}</span>
                      <span>{away.name}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        </div>

        {/* Правая колонка - боковая панель */}
        <div className="home-sidebar">
          {/* Турнирная таблица */}
          <div className="home-card table-card">
            <div className="card-header">
              <h2>
                <FaChartLine className="card-icon" />
                Турнирная таблица
              </h2>
              <Link to="/statistics" className="card-link">
                Подробнее <FaArrowRight />
              </Link>
            </div>
            <div className="table-preview">
              <div className="table-header">
                <span>Поз</span>
                <span>Команда</span>
                <span>О</span>
              </div>
              {table.slice(0, 8).map(row => {
                const team = getTeamById(row.team)
                return (
                  <div key={row.position} className="table-row">
                    <span className="position">{row.position}</span>
                    <span className="team-name-table">
                      <span className="team-logo-small">{team.logo}</span>
                      {team.name}
                    </span>
                    <span className="points">{row.points}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Быстрые ссылки */}
          <div className="home-card quick-links-card">
            <h2>Быстрые ссылки</h2>
            <div className="quick-links">
              <Link to="/schedule" className="quick-link">
                <FaUsers />
                <span>Расписание</span>
              </Link>
              <Link to="/live" className="quick-link">
                <FaTrophy />
                <span>Живые игры</span>
              </Link>
              <Link to="/statistics" className="quick-link">
                <FaChartLine />
                <span>Статистика</span>
              </Link>
              <Link to="/fantasy" className="quick-link">
                <FaTrophy />
                <span>Фэнтези</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно с деталями матча */}
      {selectedMatch && (
        <MatchDetails
          match={selectedMatch}
          homeTeam={getTeamById(selectedMatch.homeTeam)}
          awayTeam={getTeamById(selectedMatch.awayTeam)}
          onClose={() => setSelectedMatch(null)}
        />
      )}
    </div>
  )
}

export default Home

