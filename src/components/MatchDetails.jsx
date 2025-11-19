import React, { useState } from 'react'
import { FaFutbol, FaUsers, FaChartBar, FaHistory, FaExclamationCircle, FaExclamationTriangle, FaTimes, FaPlay } from 'react-icons/fa'
import './MatchDetails.css'

const MatchDetails = ({ match, homeTeam, awayTeam, onClose }) => {
  const [activeTab, setActiveTab] = useState('events')

  if (!match || !homeTeam || !awayTeam) return null

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

  // Генерируем события для матча, если их нет
  const matchEvents = match.events || [
    { type: 'goal', team: 'home', minute: 15, player: 'Игрок 1' },
    { type: 'yellow', team: 'away', minute: 32, player: 'Игрок 2' },
    { type: 'goal', team: 'away', minute: 45, player: 'Игрок 3' },
  ]

  return (
    <div className="match-details-overlay" onClick={onClose}>
      <div className="match-details-modal" onClick={(e) => e.stopPropagation()}>
        <button className="match-details-close" onClick={onClose}>
          <FaTimes />
        </button>

        {/* Заголовок матча */}
        <div className="match-details-header">
          <div className="match-details-teams">
            <div className="match-details-team">
              <span className="match-details-logo">{homeTeam.logo}</span>
              <span className="match-details-team-name">{homeTeam.name}</span>
            </div>
            <div className="match-details-score">
              {match.status === 'finished' || match.status === 'live' ? (
                <>
                  <span className="match-details-score-number">{match.homeScore || 0}</span>
                  <span className="match-details-score-separator">:</span>
                  <span className="match-details-score-number">{match.awayScore || 0}</span>
                </>
              ) : (
                <span className="match-details-vs">VS</span>
              )}
            </div>
            <div className="match-details-team">
              <span className="match-details-team-name">{awayTeam.name}</span>
              <span className="match-details-logo">{awayTeam.logo}</span>
            </div>
          </div>
          {match.status === 'live' && (
            <div className="match-details-status">
              <span className="live-badge-modal pulse">LIVE</span>
              <span className="match-details-minute">{match.minute || 0}'</span>
            </div>
          )}
        </div>

        {/* Плеер (если матч идет или завершен) */}
        {(match.status === 'live' || match.status === 'finished') && (
          <div className="match-details-player">
            <div className="player-container-modal">
              <div className="player-placeholder-modal">
                <FaPlay className="play-icon-modal" />
                <p>Трансляция матча</p>
                <span className="player-info-modal">{homeTeam.name} vs {awayTeam.name}</span>
              </div>
            </div>
          </div>
        )}

        {/* События матча */}
        {(match.status === 'live' || match.status === 'finished') && (
          <div className="match-details-events-section">
            <h3 className="section-title-modal">События матча</h3>
            <div className="events-list-modal">
              {matchEvents.length > 0 ? (
                matchEvents.map((event, index) => (
                  <div key={index} className="event-item-modal">
                    {getEventIcon(event.type)}
                    <div className="event-info-modal">
                      <span className="event-minute-modal">{event.minute}'</span>
                      <span className="event-description-modal">
                        {event.type === 'goal' && `Гол! ${event.player}`}
                        {event.type === 'yellow' && `Жёлтая карточка - ${event.player}`}
                        {event.type === 'red' && `Красная карточка - ${event.player}`}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-events-modal">Событий пока нет</div>
              )}
            </div>
          </div>
        )}

        {/* Вкладки */}
        <div className="match-details-tabs">
          <button 
            className={`match-details-tab ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            <FaFutbol /> События
          </button>
          <button 
            className={`match-details-tab ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            <FaChartBar /> Статистика
          </button>
          <button 
            className={`match-details-tab ${activeTab === 'lineups' ? 'active' : ''}`}
            onClick={() => setActiveTab('lineups')}
          >
            <FaUsers /> Составы
          </button>
          <button 
            className={`match-details-tab ${activeTab === 'h2h' ? 'active' : ''}`}
            onClick={() => setActiveTab('h2h')}
          >
            <FaHistory /> Личные встречи
          </button>
          <button 
            className={`match-details-tab ${activeTab === 'form' ? 'active' : ''}`}
            onClick={() => setActiveTab('form')}
          >
            <FaChartBar /> Форма команд
          </button>
        </div>

        {/* Контент вкладок */}
        <div className="match-details-tab-content">
          {activeTab === 'events' && (
            <div className="tab-panel-modal">
              <h4>Все события матча</h4>
              {matchEvents.length > 0 ? (
                <div className="events-timeline-modal">
                  {matchEvents.map((event, index) => (
                    <div key={index} className="timeline-event-modal">
                      {getEventIcon(event.type)}
                      <div className="timeline-info-modal">
                        <span className="timeline-minute-modal">{event.minute}'</span>
                        <span className="timeline-text-modal">
                          {event.type === 'goal' && `Гол! ${event.player}`}
                          {event.type === 'yellow' && `Жёлтая карточка - ${event.player}`}
                          {event.type === 'red' && `Красная карточка - ${event.player}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state-modal">Событий пока нет</p>
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="tab-panel-modal">
              <h4>Статистика матча</h4>
              <div className="stats-grid-detailed-modal">
                <div className="stat-row-detailed-modal">
                  <span className="stat-label-detailed-modal">Владение мячом</span>
                  <div className="stat-bar-detailed-modal">
                    <div className="stat-bar-fill-detailed-modal home-stat-modal" style={{ width: '52%' }}>
                      52%
                    </div>
                    <div className="stat-bar-fill-detailed-modal away-stat-modal" style={{ width: '48%' }}>
                      48%
                    </div>
                  </div>
                </div>
                <div className="stat-row-detailed-modal">
                  <span className="stat-label-detailed-modal">Удары</span>
                  <div className="stat-numbers-detailed-modal">
                    <span>12</span>
                    <span>:</span>
                    <span>8</span>
                  </div>
                </div>
                <div className="stat-row-detailed-modal">
                  <span className="stat-label-detailed-modal">Удары в створ</span>
                  <div className="stat-numbers-detailed-modal">
                    <span>5</span>
                    <span>:</span>
                    <span>3</span>
                  </div>
                </div>
                <div className="stat-row-detailed-modal">
                  <span className="stat-label-detailed-modal">Угловые</span>
                  <div className="stat-numbers-detailed-modal">
                    <span>6</span>
                    <span>:</span>
                    <span>4</span>
                  </div>
                </div>
                <div className="stat-row-detailed-modal">
                  <span className="stat-label-detailed-modal">Фолы</span>
                  <div className="stat-numbers-detailed-modal">
                    <span>9</span>
                    <span>:</span>
                    <span>11</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'lineups' && (
            <div className="tab-panel-modal">
              <h4>Составы команд</h4>
              <div className="lineups-grid-modal">
                <div className="lineup-team-modal">
                  <h5>{homeTeam.name}</h5>
                  <div className="lineup-list-modal">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => (
                      <div key={i} className="lineup-player-modal">
                        <span className="player-number-modal">{i}</span>
                        <span className="player-name-modal">Игрок {i}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="lineup-team-modal">
                  <h5>{awayTeam.name}</h5>
                  <div className="lineup-list-modal">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => (
                      <div key={i} className="lineup-player-modal">
                        <span className="player-number-modal">{i}</span>
                        <span className="player-name-modal">Игрок {i}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'h2h' && (
            <div className="tab-panel-modal">
              <h4>Личные встречи</h4>
              <div className="h2h-stats-modal">
                <div className="h2h-item-modal">
                  <span className="h2h-label-modal">Всего матчей</span>
                  <span className="h2h-value-modal">12</span>
                </div>
                <div className="h2h-item-modal">
                  <span className="h2h-label-modal">Побед {homeTeam.name}</span>
                  <span className="h2h-value-modal">5</span>
                </div>
                <div className="h2h-item-modal">
                  <span className="h2h-label-modal">Ничьих</span>
                  <span className="h2h-value-modal">3</span>
                </div>
                <div className="h2h-item-modal">
                  <span className="h2h-label-modal">Побед {awayTeam.name}</span>
                  <span className="h2h-value-modal">4</span>
                </div>
              </div>
              <div className="h2h-recent-modal">
                <h5>Последние встречи</h5>
                <div className="h2h-matches-modal">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h2h-match-modal">
                      <span>{homeTeam.name} 2 - 1 {awayTeam.name}</span>
                      <span className="h2h-date-modal">15.11.2024</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'form' && (
            <div className="tab-panel-modal">
              <h4>Форма команд</h4>
              <div className="form-teams-modal">
                <div className="form-team-modal">
                  <h5>{homeTeam.name}</h5>
                  <div className="form-results-modal">
                    {['W', 'W', 'D', 'L', 'W'].map((result, i) => (
                      <span key={i} className={`form-result-modal ${result.toLowerCase()}`}>
                        {result}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="form-team-modal">
                  <h5>{awayTeam.name}</h5>
                  <div className="form-results-modal">
                    {['L', 'W', 'W', 'D', 'W'].map((result, i) => (
                      <span key={i} className={`form-result-modal ${result.toLowerCase()}`}>
                        {result}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MatchDetails

