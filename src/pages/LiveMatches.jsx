import React, { useState, useEffect } from 'react'
import { teams, generateLiveMatches } from '../utils/mockData'
import { FaBroadcastTower, FaFutbol, FaExclamationCircle, FaExclamationTriangle, FaPlay, FaUsers, FaChartBar, FaHistory } from 'react-icons/fa'
import './LiveMatches.css'

const LiveMatches = () => {
  const [liveMatches, setLiveMatches] = useState(generateLiveMatches())
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [activeTab, setActiveTab] = useState('events')

  useEffect(() => {
    // Симуляция обновления живых матчей
    const interval = setInterval(() => {
      setLiveMatches(prevMatches => 
        prevMatches.map(match => {
          // Случайное обновление счета
          if (Math.random() > 0.7) {
            return {
              ...match,
              homeScore: Math.min(match.homeScore + (Math.random() > 0.5 ? 1 : 0), 10),
              awayScore: Math.min(match.awayScore + (Math.random() > 0.5 ? 1 : 0), 10),
              minute: Math.min(match.minute + 1, 90)
            }
          }
          return {
            ...match,
            minute: Math.min(match.minute + 1, 90)
          }
        })
      )
    }, 5000) // Обновление каждые 5 секунд

    return () => clearInterval(interval)
  }, [])

  const getTeamById = (id) => teams.find(t => t.id === id)

  const getEventIcon = (type) => {
    switch(type) {
      case 'goal':
        return <FaFutbol className="event-icon goal" />
      case 'yellow':
        return <FaExclamationTriangle className="event-icon yellow" />
      case 'red':
        return <FaExclamationCircle className="event-icon red" />
      default:
        return null
    }
  }

  const handleMatchClick = (match) => {
    if (selectedMatch?.id === match.id) {
      setSelectedMatch(null)
    } else {
      setSelectedMatch(match)
      setActiveTab('events')
    }
  }

  return (
    <div className="live-matches-page">
      <div className="page-header">
        <h1>
          <FaBroadcastTower className="page-icon pulse" />
          Живые игры
        </h1>
        <p className="page-subtitle">Следите за матчами в реальном времени</p>
      </div>

      {liveMatches.length > 0 ? (
        <>
          <div className="live-matches-grid">
            {liveMatches.map(match => {
              const home = getTeamById(match.homeTeam)
              const away = getTeamById(match.awayTeam)
              const isSelected = selectedMatch?.id === match.id

              return (
                <div 
                  key={match.id} 
                  className={`live-match-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleMatchClick(match)}
                >
                  <div className="live-match-header">
                    <div className="live-indicator">
                      <span className="live-dot pulse"></span>
                      <span className="live-text">LIVE</span>
                    </div>
                    <div className="match-minute-live">
                      {match.minute}'
                    </div>
                  </div>

                  <div className="live-match-content">
                    <div className="live-team home-live">
                      <span className="team-logo-live">{home.logo}</span>
                      <div className="team-details">
                        <span className="team-name-live">{home.name}</span>
                        <span className="team-city-live">{home.city}</span>
                      </div>
                    </div>

                    <div className="live-score">
                      <span className="score-live">{match.homeScore}</span>
                      <span className="separator-live">:</span>
                      <span className="score-live">{match.awayScore}</span>
                    </div>

                    <div className="live-team away-live">
                      <div className="team-details">
                        <span className="team-name-live">{away.name}</span>
                        <span className="team-city-live">{away.city}</span>
                      </div>
                      <span className="team-logo-live">{away.logo}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {selectedMatch && (
            <div className="match-details-panel">
              {(() => {
                const home = getTeamById(selectedMatch.homeTeam)
                const away = getTeamById(selectedMatch.awayTeam)
                
                return (
                  <>
                    {/* Плеер */}
                    <div className="match-player">
                      <div className="player-header">
                        <div className="player-teams">
                          <span className="player-team-name">{home.name}</span>
                          <span className="player-score">
                            {selectedMatch.homeScore} : {selectedMatch.awayScore}
                          </span>
                          <span className="player-team-name">{away.name}</span>
                        </div>
                        <div className="player-status">
                          <span className="live-badge-large pulse">LIVE</span>
                          <span className="player-minute">{selectedMatch.minute}'</span>
                        </div>
                      </div>
                      <div className="player-container">
                        <div className="player-placeholder">
                          <FaPlay className="play-icon" />
                          <p>Трансляция матча</p>
                          <span className="player-info">{home.name} vs {away.name}</span>
                        </div>
                      </div>
                    </div>

                    {/* События матча */}
                    <div className="match-events-section">
                      <h3 className="section-title">События матча</h3>
                      <div className="events-list">
                        {selectedMatch.events && selectedMatch.events.length > 0 ? (
                          selectedMatch.events.map((event, index) => (
                            <div key={index} className="event-item">
                              {getEventIcon(event.type)}
                              <div className="event-info">
                                <span className="event-minute">{event.minute}'</span>
                                <span className="event-description">
                                  {event.type === 'goal' && `Гол! ${event.player}`}
                                  {event.type === 'yellow' && `Жёлтая карточка - ${event.player}`}
                                  {event.type === 'red' && `Красная карточка - ${event.player}`}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="no-events">Событий пока нет</div>
                        )}
                      </div>
                    </div>

                    {/* Вкладки */}
                    <div className="match-tabs">
                      <button 
                        className={`match-tab ${activeTab === 'events' ? 'active' : ''}`}
                        onClick={() => setActiveTab('events')}
                      >
                        <FaFutbol /> События
                      </button>
                      <button 
                        className={`match-tab ${activeTab === 'stats' ? 'active' : ''}`}
                        onClick={() => setActiveTab('stats')}
                      >
                        <FaChartBar /> Статистика
                      </button>
                      <button 
                        className={`match-tab ${activeTab === 'lineups' ? 'active' : ''}`}
                        onClick={() => setActiveTab('lineups')}
                      >
                        <FaUsers /> Составы
                      </button>
                      <button 
                        className={`match-tab ${activeTab === 'h2h' ? 'active' : ''}`}
                        onClick={() => setActiveTab('h2h')}
                      >
                        <FaHistory /> Личные встречи
                      </button>
                      <button 
                        className={`match-tab ${activeTab === 'form' ? 'active' : ''}`}
                        onClick={() => setActiveTab('form')}
                      >
                        <FaChartBar /> Форма команд
                      </button>
                    </div>

                    {/* Контент вкладок */}
                    <div className="match-tab-content">
                      {activeTab === 'events' && (
                        <div className="tab-panel">
                          <h4>Все события матча</h4>
                          {selectedMatch.events && selectedMatch.events.length > 0 ? (
                            <div className="events-timeline">
                              {selectedMatch.events.map((event, index) => (
                                <div key={index} className="timeline-event">
                                  {getEventIcon(event.type)}
                                  <div className="timeline-info">
                                    <span className="timeline-minute">{event.minute}'</span>
                                    <span className="timeline-text">
                                      {event.type === 'goal' && `Гол! ${event.player}`}
                                      {event.type === 'yellow' && `Жёлтая карточка - ${event.player}`}
                                      {event.type === 'red' && `Красная карточка - ${event.player}`}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="empty-state">Событий пока нет</p>
                          )}
                        </div>
                      )}

                      {activeTab === 'stats' && (
                        <div className="tab-panel">
                          <h4>Статистика матча</h4>
                          <div className="stats-grid-detailed">
                            <div className="stat-row-detailed">
                              <span className="stat-label-detailed">Владение мячом</span>
                              <div className="stat-bar-detailed">
                                <div className="stat-bar-fill-detailed home-stat" style={{ width: '52%' }}>
                                  52%
                                </div>
                                <div className="stat-bar-fill-detailed away-stat" style={{ width: '48%' }}>
                                  48%
                                </div>
                              </div>
                            </div>
                            <div className="stat-row-detailed">
                              <span className="stat-label-detailed">Удары</span>
                              <div className="stat-numbers-detailed">
                                <span>12</span>
                                <span>:</span>
                                <span>8</span>
                              </div>
                            </div>
                            <div className="stat-row-detailed">
                              <span className="stat-label-detailed">Удары в створ</span>
                              <div className="stat-numbers-detailed">
                                <span>5</span>
                                <span>:</span>
                                <span>3</span>
                              </div>
                            </div>
                            <div className="stat-row-detailed">
                              <span className="stat-label-detailed">Угловые</span>
                              <div className="stat-numbers-detailed">
                                <span>6</span>
                                <span>:</span>
                                <span>4</span>
                              </div>
                            </div>
                            <div className="stat-row-detailed">
                              <span className="stat-label-detailed">Фолы</span>
                              <div className="stat-numbers-detailed">
                                <span>9</span>
                                <span>:</span>
                                <span>11</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === 'lineups' && (
                        <div className="tab-panel">
                          <h4>Составы команд</h4>
                          <div className="lineups-grid">
                            <div className="lineup-team">
                              <h5>{home.name}</h5>
                              <div className="lineup-list">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => (
                                  <div key={i} className="lineup-player">
                                    <span className="player-number">{i}</span>
                                    <span className="player-name">Игрок {i}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="lineup-team">
                              <h5>{away.name}</h5>
                              <div className="lineup-list">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => (
                                  <div key={i} className="lineup-player">
                                    <span className="player-number">{i}</span>
                                    <span className="player-name">Игрок {i}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === 'h2h' && (
                        <div className="tab-panel">
                          <h4>Личные встречи</h4>
                          <div className="h2h-stats">
                            <div className="h2h-item">
                              <span className="h2h-label">Всего матчей</span>
                              <span className="h2h-value">12</span>
                            </div>
                            <div className="h2h-item">
                              <span className="h2h-label">Побед {home.name}</span>
                              <span className="h2h-value">5</span>
                            </div>
                            <div className="h2h-item">
                              <span className="h2h-label">Ничьих</span>
                              <span className="h2h-value">3</span>
                            </div>
                            <div className="h2h-item">
                              <span className="h2h-label">Побед {away.name}</span>
                              <span className="h2h-value">4</span>
                            </div>
                          </div>
                          <div className="h2h-recent">
                            <h5>Последние встречи</h5>
                            <div className="h2h-matches">
                              {[1, 2, 3].map(i => (
                                <div key={i} className="h2h-match">
                                  <span>{home.name} 2 - 1 {away.name}</span>
                                  <span className="h2h-date">15.11.2024</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === 'form' && (
                        <div className="tab-panel">
                          <h4>Форма команд</h4>
                          <div className="form-teams">
                            <div className="form-team">
                              <h5>{home.name}</h5>
                              <div className="form-results">
                                {['W', 'W', 'D', 'L', 'W'].map((result, i) => (
                                  <span key={i} className={`form-result ${result.toLowerCase()}`}>
                                    {result}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="form-team">
                              <h5>{away.name}</h5>
                              <div className="form-results">
                                {['L', 'W', 'W', 'D', 'W'].map((result, i) => (
                                  <span key={i} className={`form-result ${result.toLowerCase()}`}>
                                    {result}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )
              })()}
            </div>
          )}
        </>
      ) : (
        <div className="no-live-matches">
          <FaBroadcastTower className="no-live-icon" />
          <h2>Нет активных матчей</h2>
          <p>В данный момент нет игр в прямом эфире</p>
        </div>
      )}
    </div>
  )
}

export default LiveMatches
