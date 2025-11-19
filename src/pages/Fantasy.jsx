import React, { useState } from 'react'
import { teams, generateFantasyLeagues, generatePlayers } from '../utils/mockData'
import { FaTrophy, FaUsers, FaCoins, FaPlus, FaMinus, FaCheck } from 'react-icons/fa'
import './Fantasy.css'

const Fantasy = () => {
  const [leagues] = useState(generateFantasyLeagues())
  const [players] = useState(generatePlayers())
  const [selectedLeague, setSelectedLeague] = useState(null)
  const [myTeam, setMyTeam] = useState([])
  const [budget, setBudget] = useState(100)
  const [activeTab, setActiveTab] = useState('leagues')

  const getTeamById = (id) => teams.find(t => t.id === id)

  const addPlayerToTeam = (player) => {
    if (myTeam.length >= 11) {
      alert('Максимум 11 игроков в команде!')
      return
    }
    if (myTeam.find(p => p.id === player.id)) {
      alert('Игрок уже в команде!')
      return
    }
    const playerCost = Math.floor(Math.random() * 15) + 5
    if (budget < playerCost) {
      alert('Недостаточно средств!')
      return
    }
    setMyTeam([...myTeam, { ...player, cost: playerCost }])
    setBudget(budget - playerCost)
  }

  const removePlayerFromTeam = (playerId) => {
    const player = myTeam.find(p => p.id === playerId)
    if (player) {
      setMyTeam(myTeam.filter(p => p.id !== playerId))
      setBudget(budget + player.cost)
    }
  }

  const getTotalPoints = () => {
    return myTeam.reduce((total, player) => {
      return total + player.goals * 5 + player.assists * 3 + player.matches * 1
    }, 0)
  }

  const getFormation = () => {
    const goalkeepers = myTeam.filter(p => p.position === 'Вратарь').length
    const defenders = myTeam.filter(p => p.position === 'Защитник').length
    const midfielders = myTeam.filter(p => p.position === 'Полузащитник').length
    const forwards = myTeam.filter(p => p.position === 'Нападающий').length
    return `${goalkeepers}-${defenders}-${midfielders}-${forwards}`
  }

  return (
    <div className="fantasy-page">
      <div className="page-header">
        <h1>
          <FaTrophy className="page-icon" />
          Фэнтези-футбол
        </h1>
        <p className="page-subtitle">Создайте свою команду и соревнуйтесь с другими</p>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'leagues' ? 'active' : ''}`}
          onClick={() => setActiveTab('leagues')}
        >
          <FaTrophy /> Лиги
        </button>
        <button
          className={`tab ${activeTab === 'myteam' ? 'active' : ''}`}
          onClick={() => setActiveTab('myteam')}
        >
          <FaUsers /> Моя команда
        </button>
        <button
          className={`tab ${activeTab === 'players' ? 'active' : ''}`}
          onClick={() => setActiveTab('players')}
        >
          <FaUsers /> Игроки
        </button>
      </div>

      {activeTab === 'leagues' && (
        <div className="leagues-section">
          <div className="leagues-grid">
            {leagues.map(league => (
              <div 
                key={league.id} 
                className="league-card"
                onClick={() => setSelectedLeague(league)}
              >
                <div className="league-header">
                  <FaTrophy className="league-icon" />
                  <h2>{league.name}</h2>
                </div>
                <div className="league-info">
                  <div className="league-stat">
                    <FaUsers className="stat-icon" />
                    <div>
                      <span className="stat-value">{league.participants.toLocaleString()}</span>
                      <span className="stat-label">Участников</span>
                    </div>
                  </div>
                  <div className="league-stat">
                    <FaCoins className="stat-icon" />
                    <div>
                      <span className="stat-value">{league.prize}</span>
                      <span className="stat-label">Призовой фонд</span>
                    </div>
                  </div>
                </div>
                <button className="join-league-btn">
                  Присоединиться
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'myteam' && (
        <div className="my-team-section">
          <div className="team-summary">
            <div className="summary-card">
              <h3>Бюджет</h3>
              <div className="budget-display">
                <FaCoins className="coins-icon" />
                <span className="budget-amount">{budget}</span>
                <span className="budget-label">млн TZS</span>
              </div>
            </div>
            <div className="summary-card">
              <h3>Игроков в команде</h3>
              <div className="players-count">
                <span className="count-number">{myTeam.length}</span>
                <span className="count-label">/ 11</span>
              </div>
            </div>
            <div className="summary-card">
              <h3>Очки</h3>
              <div className="points-display">
                <span className="points-number">{getTotalPoints()}</span>
              </div>
            </div>
            <div className="summary-card">
              <h3>Расстановка</h3>
              <div className="formation-display">
                <span className="formation-text">{getFormation()}</span>
              </div>
            </div>
          </div>

          {myTeam.length > 0 ? (
            <div className="my-team-formation">
              <h2>Моя команда</h2>
              <div className="formation-field">
                {/* Вратарь */}
                <div className="position-row goalkeeper-row">
                  {myTeam.filter(p => p.position === 'Вратарь').map(player => {
                    const team = getTeamById(player.team)
                    return (
                      <div key={player.id} className="player-card-field">
                        <button 
                          className="remove-btn"
                          onClick={() => removePlayerFromTeam(player.id)}
                        >
                          <FaMinus />
                        </button>
                        <div className="player-field-info">
                          <span className="player-field-name">{player.name}</span>
                          <span className="player-field-team">{team.name}</span>
                          <span className="player-field-cost">{player.cost}M</span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Защитники */}
                <div className="position-row defenders-row">
                  {myTeam.filter(p => p.position === 'Защитник').map(player => {
                    const team = getTeamById(player.team)
                    return (
                      <div key={player.id} className="player-card-field">
                        <button 
                          className="remove-btn"
                          onClick={() => removePlayerFromTeam(player.id)}
                        >
                          <FaMinus />
                        </button>
                        <div className="player-field-info">
                          <span className="player-field-name">{player.name}</span>
                          <span className="player-field-team">{team.name}</span>
                          <span className="player-field-cost">{player.cost}M</span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Полузащитники */}
                <div className="position-row midfielders-row">
                  {myTeam.filter(p => p.position === 'Полузащитник').map(player => {
                    const team = getTeamById(player.team)
                    return (
                      <div key={player.id} className="player-card-field">
                        <button 
                          className="remove-btn"
                          onClick={() => removePlayerFromTeam(player.id)}
                        >
                          <FaMinus />
                        </button>
                        <div className="player-field-info">
                          <span className="player-field-name">{player.name}</span>
                          <span className="player-field-team">{team.name}</span>
                          <span className="player-field-cost">{player.cost}M</span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Нападающие */}
                <div className="position-row forwards-row">
                  {myTeam.filter(p => p.position === 'Нападающий').map(player => {
                    const team = getTeamById(player.team)
                    return (
                      <div key={player.id} className="player-card-field">
                        <button 
                          className="remove-btn"
                          onClick={() => removePlayerFromTeam(player.id)}
                        >
                          <FaMinus />
                        </button>
                        <div className="player-field-info">
                          <span className="player-field-name">{player.name}</span>
                          <span className="player-field-team">{team.name}</span>
                          <span className="player-field-cost">{player.cost}M</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-team">
              <FaUsers className="empty-icon" />
              <h2>Ваша команда пуста</h2>
              <p>Выберите игроков на вкладке "Игроки"</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'players' && (
        <div className="fantasy-players-section">
          <div className="players-filters-fantasy">
            <label>Позиция:</label>
            <select className="filter-select-fantasy">
              <option value="all">Все</option>
              <option value="Вратарь">Вратарь</option>
              <option value="Защитник">Защитник</option>
              <option value="Полузащитник">Полузащитник</option>
              <option value="Нападающий">Нападающий</option>
            </select>
            <label>Команда:</label>
            <select className="filter-select-fantasy">
              <option value="all">Все</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>

          <div className="fantasy-players-grid">
            {players.map(player => {
              const team = getTeamById(player.team)
              const playerCost = Math.floor(Math.random() * 15) + 5
              const isInTeam = myTeam.find(p => p.id === player.id)
              const canAfford = budget >= playerCost

              return (
                <div key={player.id} className="fantasy-player-card">
                  <div className="fantasy-player-header">
                    <span className="fantasy-team-logo">{team.logo}</span>
                    <div className="fantasy-player-info">
                      <h3>{player.name}</h3>
                      <span className="fantasy-player-position">{player.position}</span>
                      <span className="fantasy-player-team">{team.name}</span>
                    </div>
                  </div>
                  
                  <div className="fantasy-player-stats">
                    <div className="fantasy-stat">
                      <span className="fantasy-stat-label">Голы</span>
                      <span className="fantasy-stat-value">{player.goals}</span>
                    </div>
                    <div className="fantasy-stat">
                      <span className="fantasy-stat-label">Ассисты</span>
                      <span className="fantasy-stat-value">{player.assists}</span>
                    </div>
                    <div className="fantasy-stat">
                      <span className="fantasy-stat-label">Игры</span>
                      <span className="fantasy-stat-value">{player.matches}</span>
                    </div>
                    <div className="fantasy-stat">
                      <span className="fantasy-stat-label">Рейтинг</span>
                      <span className="fantasy-stat-value">{player.rating}</span>
                    </div>
                  </div>

                  <div className="fantasy-player-footer">
                    <div className="player-cost">
                      <FaCoins className="cost-icon" />
                      <span>{playerCost}M TZS</span>
                    </div>
                    <button
                      className={`add-player-btn ${isInTeam ? 'in-team' : ''} ${!canAfford ? 'disabled' : ''}`}
                      onClick={() => isInTeam ? removePlayerFromTeam(player.id) : addPlayerToTeam({ ...player, cost: playerCost })}
                      disabled={!canAfford && !isInTeam}
                    >
                      {isInTeam ? (
                        <>
                          <FaCheck /> В команде
                        </>
                      ) : (
                        <>
                          <FaPlus /> Добавить
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default Fantasy

