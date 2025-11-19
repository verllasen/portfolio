import React, { useState } from 'react'
import { teams, generateTable, generatePlayers } from '../utils/mockData'
import { FaChartBar, FaTrophy, FaUsers, FaFutbol, FaArrowUp, FaArrowDown } from 'react-icons/fa'
import './Statistics.css'

const Statistics = () => {
  const [table] = useState(generateTable())
  const [players] = useState(generatePlayers())
  const [activeTab, setActiveTab] = useState('table')
  const [sortBy, setSortBy] = useState('points')
  const [playerSortBy, setPlayerSortBy] = useState('goals')

  const getTeamById = (id) => teams.find(t => t.id === id)

  const sortedPlayers = [...players].sort((a, b) => {
    if (playerSortBy === 'goals') return b.goals - a.goals
    if (playerSortBy === 'assists') return b.assists - a.assists
    if (playerSortBy === 'rating') return parseFloat(b.rating) - parseFloat(a.rating)
    return 0
  })

  const topScorers = sortedPlayers.slice(0, 10)
  const topAssists = [...players].sort((a, b) => b.assists - a.assists).slice(0, 10)

  return (
    <div className="statistics-page">
      <div className="page-header">
        <h1>
          <FaChartBar className="page-icon" />
          Статистика
        </h1>
        <p className="page-subtitle">Детальная статистика сезона</p>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'table' ? 'active' : ''}`}
          onClick={() => setActiveTab('table')}
        >
          <FaTrophy /> Турнирная таблица
        </button>
        <button
          className={`tab ${activeTab === 'teams' ? 'active' : ''}`}
          onClick={() => setActiveTab('teams')}
        >
          <FaUsers /> Статистика клубов
        </button>
        <button
          className={`tab ${activeTab === 'players' ? 'active' : ''}`}
          onClick={() => setActiveTab('players')}
        >
          <FaFutbol /> Статистика игроков
        </button>
      </div>

      {activeTab === 'table' && (
        <div className="table-section">
          <div className="table-container">
            <div className="table-header-full">
              <div className="table-col pos">Поз</div>
              <div className="table-col team-col">Команда</div>
              <div className="table-col">И</div>
              <div className="table-col">В</div>
              <div className="table-col">Н</div>
              <div className="table-col">П</div>
              <div className="table-col">ЗМ</div>
              <div className="table-col">ПМ</div>
              <div className="table-col">РМ</div>
              <div className="table-col points-col">О</div>
            </div>
            {table.map((row, index) => {
              const team = getTeamById(row.team)
              const positionChange = index === 0 ? 0 : (row.position < table[index - 1].position ? 1 : -1)
              
              return (
                <div key={row.position} className={`table-row-full ${index < 3 ? 'top-three' : ''}`}>
                  <div className="table-col pos">
                    <span className="position-number">{row.position}</span>
                    {positionChange !== 0 && (
                      positionChange > 0 ? 
                        <FaArrowUp className="position-change up" /> : 
                        <FaArrowDown className="position-change down" />
                    )}
                  </div>
                  <div className="table-col team-col">
                    <span className="team-logo-table">{team.logo}</span>
                    <span className="team-name-table-full">{team.name}</span>
                  </div>
                  <div className="table-col">{row.played}</div>
                  <div className="table-col">{row.won}</div>
                  <div className="table-col">{row.drawn}</div>
                  <div className="table-col">{row.lost}</div>
                  <div className="table-col">{row.goalsFor}</div>
                  <div className="table-col">{row.goalsAgainst}</div>
                  <div className={`table-col ${row.goalDifference >= 0 ? 'positive' : 'negative'}`}>
                    {row.goalDifference > 0 ? '+' : ''}{row.goalDifference}
                  </div>
                  <div className="table-col points-col">
                    <span className="points-badge">{row.points}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {activeTab === 'teams' && (
        <div className="teams-stats-section">
          <div className="stats-grid">
            {table.slice(0, 12).map((row, index) => {
              const team = getTeamById(row.team)
              const winRate = ((row.won / row.played) * 100).toFixed(1)
              const avgGoalsFor = (row.goalsFor / row.played).toFixed(2)
              const avgGoalsAgainst = (row.goalsAgainst / row.played).toFixed(2)
              
              return (
                <div key={row.team} className="team-stat-card">
                  <div className="team-stat-header">
                    <span className="team-logo-stat">{team.logo}</span>
                    <div className="team-stat-info">
                      <h3>{team.name}</h3>
                      <span className="team-position">#{row.position} место</span>
                    </div>
                  </div>
                  
                  <div className="team-stat-body">
                    <div className="stat-row">
                      <span className="stat-label">Очки</span>
                      <span className="stat-value">{row.points}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Игр сыграно</span>
                      <span className="stat-value">{row.played}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Побед</span>
                      <span className="stat-value success">{row.won}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Ничьих</span>
                      <span className="stat-value">{row.drawn}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Поражений</span>
                      <span className="stat-value danger">{row.lost}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">% побед</span>
                      <span className="stat-value">{winRate}%</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Забито</span>
                      <span className="stat-value">{row.goalsFor}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Пропущено</span>
                      <span className="stat-value">{row.goalsAgainst}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Сред. забито</span>
                      <span className="stat-value">{avgGoalsFor}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Сред. пропущено</span>
                      <span className="stat-value">{avgGoalsAgainst}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Разница мячей</span>
                      <span className={`stat-value ${row.goalDifference >= 0 ? 'positive' : 'negative'}`}>
                        {row.goalDifference > 0 ? '+' : ''}{row.goalDifference}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {activeTab === 'players' && (
        <div className="players-stats-section">
          <div className="players-filters">
            <label>Сортировать по:</label>
            <select 
              value={playerSortBy} 
              onChange={(e) => setPlayerSortBy(e.target.value)}
              className="player-sort-select"
            >
              <option value="goals">Голы</option>
              <option value="assists">Голевые передачи</option>
              <option value="rating">Рейтинг</option>
            </select>
          </div>

          <div className="players-stats-grid">
            <div className="top-scorers">
              <h2 className="section-title">
                <FaTrophy className="title-icon" />
                Лучшие бомбардиры
              </h2>
              <div className="scorers-list">
                {topScorers.map((player, index) => {
                  const team = getTeamById(player.team)
                  return (
                    <div key={player.id} className="player-stat-item">
                      <div className="player-rank">
                        <span className="rank-number">{index + 1}</span>
                        {index < 3 && <FaTrophy className={`trophy-icon rank-${index + 1}`} />}
                      </div>
                      <div className="player-info">
                        <span className="player-name">{player.name}</span>
                        <span className="player-team">
                          <span className="team-logo-small">{team.logo}</span>
                          {team.name}
                        </span>
                      </div>
                      <div className="player-stats">
                        <div className="stat-badge goals-badge">
                          <FaFutbol /> {player.goals}
                        </div>
                        <div className="stat-badge">
                          Ассисты: {player.assists}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="top-assists">
              <h2 className="section-title">
                <FaUsers className="title-icon" />
                Лучшие ассистенты
              </h2>
              <div className="assists-list">
                {topAssists.map((player, index) => {
                  const team = getTeamById(player.team)
                  return (
                    <div key={player.id} className="player-stat-item">
                      <div className="player-rank">
                        <span className="rank-number">{index + 1}</span>
                      </div>
                      <div className="player-info">
                        <span className="player-name">{player.name}</span>
                        <span className="player-team">
                          <span className="team-logo-small">{team.logo}</span>
                          {team.name}
                        </span>
                      </div>
                      <div className="player-stats">
                        <div className="stat-badge assists-badge">
                          {player.assists} передач
                        </div>
                        <div className="stat-badge">
                          Голы: {player.goals}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="all-players-table">
            <h2 className="section-title">Все игроки</h2>
            <div className="players-table">
              <div className="players-table-header">
                <div className="player-col">Игрок</div>
                <div className="player-col">Команда</div>
                <div className="player-col">Позиция</div>
                <div className="player-col">Игры</div>
                <div className="player-col">Голы</div>
                <div className="player-col">Ассисты</div>
                <div className="player-col">Рейтинг</div>
              </div>
              {sortedPlayers.slice(0, 50).map(player => {
                const team = getTeamById(player.team)
                return (
                  <div key={player.id} className="players-table-row">
                    <div className="player-col">
                      <span className="player-name-table">{player.name}</span>
                    </div>
                    <div className="player-col">
                      <span className="team-logo-small">{team.logo}</span>
                      <span>{team.name}</span>
                    </div>
                    <div className="player-col">{player.position}</div>
                    <div className="player-col">{player.matches}</div>
                    <div className="player-col goals-col">{player.goals}</div>
                    <div className="player-col">{player.assists}</div>
                    <div className="player-col rating-col">
                      <span className="rating-badge">{player.rating}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Statistics

